/* =========================================================================
 * Dreamdex — 시각화 (통계 차트 + 꿈 지도)
 *   - 통계: Chart.js (CDN, 없으면 대체 막대그래프)
 *   - 지도: 순수 Canvas 로 동시출현 그래프를 가벼운 force 배치로 그림
 * ========================================================================= */
(function (global) {
  'use strict';

  var _chart = null; // 현재 감정 차트 인스턴스

  // CSS 값(var()/color-mix 등)을 실제 rgb 로 해석 — 캔버스(Chart.js)는 var를 못 읽음
  function resolveColor(val, fb) {
    if (!val) return fb;
    if (val.indexOf('var(') === -1 && val.indexOf('color-mix') === -1) return val;
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;width:0;height:0;color:' + val;
    document.body.appendChild(probe);
    var c = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return c || fb;
  }

  function emotionColor(id) {
    var e = global.Store.emotionById(id);
    return resolveColor(e ? e.color : '', '#8b7cf6');
  }

  /* ----------------------- 감정 분포 도넛 차트 ----------------------- */
  function renderEmotionChart(canvas, stats) {
    var emotions = global.Store.EMOTIONS;
    var labels = [], data = [], colors = [];
    emotions.forEach(function (e) {
      labels.push(e.label);
      data.push(stats.emotionCount[e.id] || 0);
      colors.push(resolveColor(e.color, '#8b7cf6'));
    });

    if (_chart) { _chart.destroy(); _chart = null; }

    if (!global.Chart) {
      // 폴백: 간단한 가로 막대
      renderFallbackBars(canvas.parentNode, emotions, stats);
      canvas.style.display = 'none';
      return;
    }

    var textColor = getComputedStyle(document.body).getPropertyValue('--text-dim') || '#9698bd';
    // 좁은 화면에선 범례를 아래로 — 오른쪽 배치 시 모바일에서 범례가 잘림
    var legendPos = (global.innerWidth && global.innerWidth <= 600) ? 'bottom' : 'right';
    // 하단 범례일 때 도넛을 약간 줄여(중앙 정렬) 도넛↔범례 사이 여백 확보
    var donutRadius = (legendPos === 'bottom') ? '78%' : '100%';
    _chart = new global.Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        radius: donutRadius,
        cutout: '62%',
        plugins: {
          legend: {
            position: legendPos,
            labels: { color: textColor.trim(), padding: 16, font: { size: 13 }, usePointStyle: true }
          }
        }
      }
    });
  }

  function renderFallbackBars(host, emotions, stats) {
    var max = 1;
    emotions.forEach(function (e) { max = Math.max(max, stats.emotionCount[e.id] || 0); });
    var html = '<div style="display:flex;flex-direction:column;gap:12px;padding:8px 4px">';
    emotions.forEach(function (e) {
      var v = stats.emotionCount[e.id] || 0;
      var w = Math.round((v / max) * 100);
      html += '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="width:54px;font-size:0.84rem;color:var(--text-dim)">' + e.label + '</span>' +
        '<div style="flex:1;height:12px;border-radius:999px;background:var(--surface-2);overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + w + '%;background:' + e.color + '"></span></div>' +
        '<span style="width:24px;text-align:right;font-size:0.84rem">' + v + '</span></div>';
    });
    html += '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    host.appendChild(div);
  }

  /* --------------------------- 꿈 지도 ---------------------------- */
  // 간단한 force-directed 배치를 정해진 횟수만큼 반복(결정적, Math.random 미사용)
  function renderMap(canvas, graph, onNodeClick) {
    var ctx = canvas.getContext('2d');
    var DPR = global.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    // 폭 0 방어 (레이아웃 미확정/숨김 상태 대비)
    var W = rect.width || canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || 600;
    var H = rect.height || 560;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.scale(DPR, DPR);

    var nodes = graph.nodes;
    var edges = graph.edges;
    if (!nodes.length) return;

    var cs = getComputedStyle(document.body);
    function cssv(name, fb) { return (cs.getPropertyValue(name) || fb).trim() || fb; }
    var catColor = {
      place: cssv('--cat-place', '#56cdbe'),
      person: cssv('--cat-person', '#e08bb5'),
      situation: cssv('--cat-situation', '#9a8bf0')
    };
    // 라벨 색·연결선 색·라벨 배경(그림자)은 테마에 맞춰 동적으로
    var labelColor = cssv('--text', '#e9eafb');
    var edgeColor = cssv('--text-faint', '#646a8e');
    var bgColor = cssv('--bg', '#080b16');
    // #rrggbb → "r,g,b" (rgba 합성용)
    function rgbOf(hex) {
      var h = (hex || '').replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      if (isNaN(n) || h.length < 6) return '150,150,220';
      return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    }
    var edgeRGB = rgbOf(edgeColor);

    // 밝은 테마에선 카테고리 색 대신 '밝고 화사한 고정 3색'(노랑·코랄·하늘) 사용
    var theme = document.documentElement.getAttribute('data-theme') || (global.Store.getSettings().theme);
    var lightTheme = global.Store.isLightTheme ? global.Store.isLightTheme(theme) : false;
    var LIGHT_NODE = {
      place:     { h: 42,  s: 90, l: 53 },  // 밝은 호박/노랑
      person:    { h: 340, s: 85, l: 64 },  // 밝은 코랄/핑크
      situation: { h: 198, s: 80, l: 56 }   // 밝은 하늘
    };
    function darkTone(hex) {
      var rgb = rgbOf(hex);
      return { fill: hex, glow: function (a) { return 'rgba(' + rgb + ',' + a + ')'; } };
    }
    function lightTone(c) {
      return {
        fill: 'hsl(' + c.h + ',' + c.s + '%,' + c.l + '%)',
        glow: function (a) { return 'hsla(' + c.h + ',' + c.s + '%,' + (c.l + 8) + '%,' + a + ')'; }
      };
    }
    var nodeTones = {};
    ['place', 'person', 'situation'].forEach(function (k) {
      nodeTones[k] = lightTheme ? lightTone(LIGHT_NODE[k]) : darkTone(catColor[k]);
    });

    // 초기 배치: 카테고리별로 원형 분산 (결정적 시드)
    var cx = W / 2, cy = H / 2;
    nodes.forEach(function (n, i) {
      var ang = (i / nodes.length) * Math.PI * 2;
      var r = Math.min(W, H) * 0.40;
      // 카테고리별로 약간 다른 반경
      var rr = r * (n.cat === 'person' ? 0.7 : n.cat === 'situation' ? 1.0 : 0.85);
      n.x = cx + Math.cos(ang) * rr;
      n.y = cy + Math.sin(ang) * rr;
      n.vx = 0; n.vy = 0;
    });

    var idx = {};
    nodes.forEach(function (n) { idx[n.key] = n; });

    // 노드 반지름 (빈도 기반) — 충돌 패스에서도 쓰므로 시뮬레이션 앞에 정의
    function radius(n) { return 5 + Math.min(n.weight, 8) * 1.7; }
    var COLLIDE_PAD = 30; // 코어 사이 최소 간격 (덜 다닥다닥 붙게)

    // force 시뮬레이션
    var ITER = 220;
    for (var step = 0; step < ITER; step++) {
      // 반발력
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var rep = 4400 / (dist * dist);
          var fx = (dx / dist) * rep, fy = (dy / dist) * rep;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      // 인력 (엣지)
      edges.forEach(function (e) {
        var a = idx[e.source], b = idx[e.target];
        if (!a || !b) return;
        var dx = b.x - a.x, dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var att = (dist - 130) * 0.011 * Math.min(e.weight, 4);
        var fx = (dx / dist) * att, fy = (dy / dist) * att;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      });
      // 충돌(겹침) 분리 — 코어+여백보다 가까우면 서로 밀어냄 (덩어리 방지)
      for (var ci = 0; ci < nodes.length; ci++) {
        for (var cj = ci + 1; cj < nodes.length; cj++) {
          var na = nodes[ci], nb = nodes[cj];
          var cdx = na.x - nb.x, cdy = na.y - nb.y;
          var cd = Math.sqrt(cdx * cdx + cdy * cdy) || 0.01;
          var minD = radius(na) + radius(nb) + COLLIDE_PAD;
          if (cd < minD) {
            var push = (minD - cd) / 2;
            var ux = cdx / cd, uy = cdy / cd;
            na.x += ux * push; na.y += uy * push;
            nb.x -= ux * push; nb.y -= uy * push;
          }
        }
      }
      // 중심 인력 + 감쇠 + 적용
      nodes.forEach(function (n) {
        n.vx += (cx - n.x) * 0.0014;
        n.vy += (cy - n.y) * 0.0014;
        n.vx *= 0.85; n.vy *= 0.85;
        n.x += Math.max(-12, Math.min(12, n.vx));
        n.y += Math.max(-12, Math.min(12, n.vy));
        n.x = Math.max(40, Math.min(W - 40, n.x));
        n.y = Math.max(36, Math.min(H - 36, n.y));
      });
    }

    // 레이아웃 결과를 캔버스 정중앙으로 정렬 (위/아래 쏠림 방지)
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });
    var offX = cx - (minX + maxX) / 2, offY = cy - (minY + maxY) / 2;
    nodes.forEach(function (n) { n.x += offX; n.y += offY; });

    // 연결 인접 맵 (호버 하이라이트용)
    var adj = {};
    nodes.forEach(function (n) { adj[n.key] = {}; });
    edges.forEach(function (e) {
      if (adj[e.source] && adj[e.target]) { adj[e.source][e.target] = 1; adj[e.target][e.source] = 1; }
    });

    // hoverIdx: 강조할 노드 인덱스(없으면 -1). 그에 연결된 별·선만 밝게.
    function draw(hoverIdx) {
      if (hoverIdx == null) hoverIdx = -1;
      var hoverKey = hoverIdx >= 0 ? nodes[hoverIdx].key : null;
      function lit(key) { return hoverIdx < 0 || key === hoverKey || (hoverKey && adj[hoverKey][key]); }

      ctx.clearRect(0, 0, W, H);
      // 별자리 연결선 (얇고 은은하게, 테마색)
      edges.forEach(function (e) {
        var a = idx[e.source], b = idx[e.target];
        if (!a || !b) return;
        var on = hoverIdx < 0 || e.source === hoverKey || e.target === hoverKey;
        var base = Math.min(0.10 + e.weight * 0.05, 0.34);
        var alpha = hoverIdx < 0 ? base : (on ? Math.min(base + 0.35, 0.7) : base * 0.25);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(' + edgeRGB + ',' + alpha + ')';
        ctx.lineWidth = Math.min(0.6 + e.weight * 0.35, 1.4);
        ctx.stroke();
      });
      // 별(노드)
      nodes.forEach(function (n) {
        var r = radius(n);
        var tone = nodeTones[n.cat] || darkTone('#8b7cf6');
        var on = lit(n.key);
        ctx.globalAlpha = on ? 1 : 0.3;
        // 부드러운 성운빛 글로우 (넉넉하게, 겹침 방지가 있어 뭉치지 않음)
        var g = ctx.createRadialGradient(n.x, n.y, r * 0.25, n.x, n.y, r * 2.3);
        g.addColorStop(0, tone.glow(0.42));
        g.addColorStop(1, tone.glow(0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.3, 0, Math.PI * 2); ctx.fill();
        // 코어
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = tone.fill; ctx.fill();
        // 라벨 (테마 대응 + 배경색 그림자 1겹으로 가독)
        ctx.font = '600 12px Paperozi, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = bgColor;
        ctx.fillText(n.name, n.x + 0.6, n.y + r + 14.6);
        ctx.fillStyle = labelColor;
        ctx.fillText(n.name, n.x, n.y + r + 14);
        ctx.globalAlpha = 1;
      });
    }
    draw(-1);

    // 클릭 → 노드 히트 테스트
    canvas.onclick = function (ev) {
      var r2 = canvas.getBoundingClientRect();
      var mx = ev.clientX - r2.left, my = ev.clientY - r2.top;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var d = Math.sqrt((mx - n.x) * (mx - n.x) + (my - n.y) * (my - n.y));
        if (d <= radius(n) + 6) { if (onNodeClick) onNodeClick(n); return; }
      }
    };
    var hovered = -1;
    canvas.onmousemove = function (ev) {
      var r2 = canvas.getBoundingClientRect();
      var mx = ev.clientX - r2.left, my = ev.clientY - r2.top;
      var hit = -1;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var d = Math.sqrt((mx - n.x) * (mx - n.x) + (my - n.y) * (my - n.y));
        if (d <= radius(n) + 6) { hit = i; break; }
      }
      canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
      if (hit !== hovered) { hovered = hit; draw(hovered); }
    };
    canvas.onmouseleave = function () {
      if (hovered !== -1) { hovered = -1; draw(-1); }
    };
  }

  function destroyChart() {
    if (_chart) { _chart.destroy(); _chart = null; }
  }

  global.Viz = {
    renderEmotionChart: renderEmotionChart,
    renderMap: renderMap,
    destroyChart: destroyChart
  };
})(window);
