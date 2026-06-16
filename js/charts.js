/* =========================================================================
 * Dreamdex — 시각화 (통계 차트 + 꿈 지도)
 *   - 통계: Chart.js (CDN, 없으면 대체 막대그래프)
 *   - 지도: 순수 Canvas 로 동시출현 그래프를 가벼운 force 배치로 그림
 * ========================================================================= */
(function (global) {
  'use strict';

  var _chart = null; // 현재 감정 차트 인스턴스

  function emotionColor(id) {
    var e = global.Store.emotionById(id);
    return e ? e.color : '#8b7cf6';
  }

  /* ----------------------- 감정 분포 도넛 차트 ----------------------- */
  function renderEmotionChart(canvas, stats) {
    var emotions = global.Store.EMOTIONS;
    var labels = [], data = [], colors = [];
    emotions.forEach(function (e) {
      labels.push(e.label);
      data.push(stats.emotionCount[e.id] || 0);
      colors.push(e.color);
    });

    if (_chart) { _chart.destroy(); _chart = null; }

    if (!global.Chart) {
      // 폴백: 간단한 가로 막대
      renderFallbackBars(canvas.parentNode, emotions, stats);
      canvas.style.display = 'none';
      return;
    }

    var textColor = getComputedStyle(document.body).getPropertyValue('--text-dim') || '#9698bd';
    _chart = new global.Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: 'rgba(0,0,0,0.25)',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
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
    // 라벨 색은 테마에 맞춰 동적으로
    var labelColor = cssv('--text', '#e9eafb');

    // 초기 배치: 카테고리별로 원형 분산 (결정적 시드)
    var cx = W / 2, cy = H / 2;
    nodes.forEach(function (n, i) {
      var ang = (i / nodes.length) * Math.PI * 2;
      var r = Math.min(W, H) * 0.32;
      // 카테고리별로 약간 다른 반경
      var rr = r * (n.cat === 'person' ? 0.7 : n.cat === 'situation' ? 1.0 : 0.85);
      n.x = cx + Math.cos(ang) * rr;
      n.y = cy + Math.sin(ang) * rr;
      n.vx = 0; n.vy = 0;
    });

    var idx = {};
    nodes.forEach(function (n) { idx[n.key] = n; });

    // force 시뮬레이션
    var ITER = 220;
    for (var step = 0; step < ITER; step++) {
      // 반발력
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var rep = 2600 / (dist * dist);
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
        var att = (dist - 90) * 0.012 * Math.min(e.weight, 4);
        var fx = (dx / dist) * att, fy = (dy / dist) * att;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      });
      // 중심 인력 + 감쇠 + 적용
      nodes.forEach(function (n) {
        n.vx += (cx - n.x) * 0.002;
        n.vy += (cy - n.y) * 0.002;
        n.vx *= 0.85; n.vy *= 0.85;
        n.x += Math.max(-12, Math.min(12, n.vx));
        n.y += Math.max(-12, Math.min(12, n.vy));
        n.x = Math.max(40, Math.min(W - 40, n.x));
        n.y = Math.max(36, Math.min(H - 36, n.y));
      });
    }

    function radius(n) { return 7 + Math.min(n.weight, 8) * 3; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 엣지
      edges.forEach(function (e) {
        var a = idx[e.source], b = idx[e.target];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(150,150,220,' + Math.min(0.08 + e.weight * 0.06, 0.4) + ')';
        ctx.lineWidth = Math.min(1 + e.weight * 0.6, 4);
        ctx.stroke();
      });
      // 노드
      nodes.forEach(function (n) {
        var r = radius(n);
        var col = catColor[n.cat] || '#8b7cf6';
        // 글로우
        var g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.4);
        g.addColorStop(0, col + '88');
        g.addColorStop(1, col + '00');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.4, 0, Math.PI * 2); ctx.fill();
        // 코어
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        // 라벨 (테마 대응)
        ctx.fillStyle = labelColor;
        ctx.font = '600 12px Paperozi, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, n.x, n.y + r + 14);
      });
    }
    draw();

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
    canvas.onmousemove = function (ev) {
      var r2 = canvas.getBoundingClientRect();
      var mx = ev.clientX - r2.left, my = ev.clientY - r2.top;
      var hit = false;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var d = Math.sqrt((mx - n.x) * (mx - n.x) + (my - n.y) * (my - n.y));
        if (d <= radius(n) + 6) { hit = true; break; }
      }
      canvas.style.cursor = hit ? 'pointer' : 'default';
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
