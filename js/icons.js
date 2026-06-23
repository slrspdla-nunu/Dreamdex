/* =========================================================================
 * Dreamdex — 아이콘/글리프 라이브러리 (Icons)
 * -------------------------------------------------------------------------
 * 이모지를 대신하는 커스텀 SVG 글리프 모음. views.js 보다 먼저 로드된다.
 *   - Icons.emotion(id, size)  : 감정 6종 상징 선화 (감정 색 사용)
 *   - Icons.logo(size)         : 브랜드 마크 (초승달 + 별)
 *   - Icons.ui(name, opts)     : 토스트/상태용 작은 글리프
 *   - Icons.empty(name)        : 빈 상태 성좌 일러스트
 * ========================================================================= */
(function (global) {
  'use strict';

  // 공통 svg 래퍼
  function svg(inner, o) {
    o = o || {};
    var size = o.size || 24;
    var sw = o.sw != null ? o.sw : 1.7;
    var stroke = o.stroke || 'currentColor';
    var fill = o.fill || 'none';
    var cls = o.cls ? ' class="' + o.cls + '"' : '';
    var style = o.style ? ' style="' + o.style + '"' : '';
    return '<svg' + cls + style + ' width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="' + fill + '" stroke="' + stroke +
      '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      inner + '</svg>';
  }

  /* ----------------------------- 감정 글리프 ----------------------------- */
  // 각 감정을 추상 선화로: 행복=빛, 신기함=반짝임, 불안=물결, 공포=번개,
  // 슬픔=물방울, 그리움=고리행성
  var EMO_PATH = {
    happy: '<circle cx="12" cy="12" r="3.4"/>' +
      '<path d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
    wonder: '<path d="M12 2.6l1.85 6.55L20.4 11l-6.55 1.85L12 19.4l-1.85-6.55L3.6 11l6.55-1.85z"/>' +
      '<path d="M18.6 16.4l.5 1.7 1.7.5-1.7.5-.5 1.7-.5-1.7-1.7-.5 1.7-.5z"/>',
    anxiety: '<path d="M5.25 10.5q2.25-3.4 4.5 0t4.5 0 4.5 0"/>' +
      '<path d="M5.25 15q2.25-3.4 4.5 0t4.5 0 4.5 0"/>',
    fear: '<path d="M13 2.5 5.6 13.4H11l-1 8 8.4-11.4H12.5z"/>',
    sadness: '<path d="M12 3.4c-3.2 4-5.4 6.8-5.4 9.7a5.4 5.4 0 0 0 10.8 0c0-2.9-2.2-5.7-5.4-9.7z"/>',
    longing: '<circle cx="12" cy="11" r="2.9"/>' +
      '<ellipse cx="12" cy="12.4" rx="8.6" ry="3" transform="rotate(-18 12 12.4)"/>'
  };

  function emotion(id, size) {
    var inner = EMO_PATH[id] || EMO_PATH.wonder;
    var color = global.Store ? (global.Store.emotionById(id) || {}).color : null;
    return svg(inner, { size: size || 18, sw: 1.6, stroke: color || 'currentColor', cls: 'emo-glyph' });
  }

  /* ------------------------------ 로고 마크 ------------------------------ */
  function logo(size) {
    var inner =
      '<path d="M20.5 15.3A8.5 8.5 0 1 1 11.4 3.6a6.7 6.7 0 0 0 9.1 11.7z" fill="currentColor" stroke="none"/>' +
      '<path d="M16.8 4.6l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" fill="currentColor" stroke="none"/>';
    return svg(inner, { size: size || 22, cls: 'logo-glyph' });
  }

  /* --------------------------- UI / 상태 글리프 --------------------------- */
  var UI_PATH = {
    check:   '<path d="M4 12.5l5 5 11-12"/>',
    warn:    '<path d="M12 3.2 22 20H2z"/><path d="M12 9.5v4.2"/><circle cx="12" cy="16.8" r=".3" stroke-width="2"/>',
    spark:   '<path d="M12 3l1.7 6L20 11l-6.3 2L12 19l-1.7-6L4 11l6.3-2z"/>',
    star:    '<path d="M12 3.5l2.3 5.6 6 .5-4.6 3.9 1.4 5.9L12 16.8 6.5 19.3l1.4-5.9L3.3 9.6l6-.5z"/>',
    trash:   '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    edit:    '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    pen:     '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
    info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".4" stroke-width="2"/>',
    arrow:   '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back:    '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    search:  '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    moon:    '<path d="M20.5 15.3A8.5 8.5 0 1 1 11.4 3.6a6.7 6.7 0 0 0 9.1 11.7z"/>',
    lock:    '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    lockOpen:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-1.5"/>',
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/>',
    sort:    '<path d="M7 4v16M7 20l-3-3M7 4l3 3"/><path d="M14 7h7M14 12h5M14 17h3"/>',
    pin:     '<path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    insight: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.7"/>'
  };

  function ui(name, opts) {
    opts = opts || {};
    var inner = UI_PATH[name] || UI_PATH.info;
    return svg(inner, { size: opts.size || 17, sw: opts.sw || 1.7, stroke: opts.stroke || 'currentColor', cls: 'ui-glyph' });
  }

  /* ---------------------------- 빈 상태 일러스트 ---------------------------- */
  // 성좌(별자리) — 페이지마다 의미를 담은 별 그림.
  //   p: 별 좌표 [[x,y]…] (viewBox 100×72)
  //   e: 잇는 선 [[i,j]…]  (생략하면 순차 연결)
  //   hub: 4갈래로 강조할 별 인덱스(생략 시 0번)
  var CONSTELLATIONS = {
    // 홈 / 보관소 — 집
    home: {
      p: [[50,11],[29,29],[71,29],[31,58],[69,58]],
      e: [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4]], hub: 0
    },
    // 아카이브 / 수집 — 초승달
    archive: {
      p: [[64,10],[48,9],[34,18],[27,33],[30,49],[42,61],[59,63]],
      e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], hub: 0
    },
    // 검색 — 돋보기 (원 + 손잡이)
    search: {
      p: [[40,11],[55,20],[55,38],[40,47],[25,38],[25,20],[52,43],[68,60]],
      e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6],[6,7]], hub: 7
    },
    // 통계 — 우상향 성장선
    stats: {
      p: [[11,57],[27,46],[41,53],[57,31],[72,40],[89,16]],
      e: [[0,1],[1,2],[2,3],[3,4],[4,5]], hub: 5
    },
    // 꿈 지도 — 연결망 (허브 + 가지 + 둘레)
    map: {
      p: [[50,36],[22,15],[81,17],[87,52],[46,65],[13,49]],
      e: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[2,3],[3,4],[4,5],[5,1]], hub: 0
    },
    // 오류 / 없음 — 흩어져 떠도는 작은 무리
    error: {
      p: [[22,25],[41,37],[37,17],[63,45],[80,27]],
      e: [[0,2],[2,1],[1,3],[3,4]], hub: 1
    }
  };

  function empty(name) {
    var c = CONSTELLATIONS[name] || CONSTELLATIONS.archive;
    var pts = c.p, edges = c.e, hub = c.hub || 0;
    var W = 100, H = 72;

    // 연결선 (개별 선분 — 의도한 모양 그대로)
    var lines;
    if (edges) {
      lines = edges.map(function (e) {
        var a = pts[e[0]], b = pts[e[1]];
        return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
      }).join('');
    } else {
      lines = '<path d="M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + '"/>';
    }

    // 연결 수(차수) — 허브일수록 별을 크게
    var deg = {};
    if (edges) edges.forEach(function (e) { deg[e[0]] = (deg[e[0]] || 0) + 1; deg[e[1]] = (deg[e[1]] || 0) + 1; });
    var dots = pts.map(function (p, i) {
      if (i === hub) return ''; // 허브는 아래에서 4갈래 별로
      var r = (deg[i] || 0) >= 3 ? 2.6 : 2.0;
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '" fill="currentColor" stroke="none"/>';
    }).join('');
    // 강조 별 — 4갈래 반짝임
    var hp = pts[hub];
    var hubStar = star4(hp[0], hp[1], 4.2, 'currentColor', 0.95);

    // 흩뿌린 작은 별 (은은하게 반짝임)
    function tw(cx, cy, r, op, dur, begin) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="currentColor" stroke="none" opacity="' + op + '">' +
        '<animate attributeName="opacity" values="' + op + ';' + (op + 0.45) + ';' + op +
        '" dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite"/></circle>';
    }
    var sprinkle =
      tw(9, 13, 0.9, 0.35, 3.4, 0) +
      tw(92, 60, 0.9, 0.4, 4.1, 0.8) +
      tw(63, 64, 0.8, 0.3, 3.0, 1.6) +
      tw(20, 64, 0.8, 0.3, 4.6, 2.2) +
      tw(86, 14, 0.7, 0.3, 3.7, 1.1);

    return '<svg class="empty-illust" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
      '" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<g opacity="0.45">' + lines + '</g>' + dots + hubStar + sprinkle + '</svg>';
  }

  /* ============================ 아늑 일러스트 (art) ============================ */
  // 모두 currentColor / 전달색을 사용 → 테마 자동 대응.
  // 별 4갈래
  function star4(cx, cy, r, fill, op) {
    var a = r, b = r * 0.34;
    return '<path d="M' + cx + ' ' + (cy - a) + 'Q' + cx + ' ' + cy + ' ' + (cx + b) + ' ' + cy +
      'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + a) + 'Q' + cx + ' ' + cy + ' ' + (cx - b) + ' ' + cy +
      'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - a) + 'Z" fill="' + (fill || 'currentColor') +
      '" stroke="none"' + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }

  // 졸린 표정의 달 마스코트 내부 (viewBox 0 0 64 64 기준, <svg> 래퍼 없음)
  function moonInner(opts) {
    opts = opts || {};
    var face = opts.face !== false;
    var body = opts.color || 'var(--moon, #f6dd95)';
    var ink = opts.ink || 'rgba(120,90,40,0.65)';
    var cheek = opts.cheek || 'rgba(243,150,150,0.55)';
    var inner =
      '<circle cx="32" cy="32" r="22" fill="' + body + '"/>' +
      '<circle cx="22" cy="24" r="4" fill="rgba(255,255,255,0.18)"/>' +
      '<circle cx="40" cy="20" r="2.6" fill="rgba(255,255,255,0.14)"/>';
    if (face) {
      inner +=
        '<path d="M24 31q3 4 6 0" fill="none" stroke="' + ink + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M34 31q3 4 6 0" fill="none" stroke="' + ink + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M28 39q4 3.5 8 0" fill="none" stroke="' + ink + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<circle cx="23" cy="37" r="3.2" fill="' + cheek + '"/>' +
        '<circle cx="41" cy="37" r="3.2" fill="' + cheek + '"/>';
    }
    return inner;
  }

  // 졸린 표정의 달 마스코트 (꽉 찬 달 + 감은 눈 + 미소 + 볼터치)
  function moon(opts) {
    opts = opts || {};
    var size = opts.size || 64;
    return '<svg class="art-moon" width="' + size + '" height="' + size +
      '" viewBox="0 0 64 64" aria-hidden="true">' + moonInner(opts) + '</svg>';
  }

  // 작은 구름 (둥근 원 겹침)
  function cloud(opts) {
    opts = opts || {};
    var size = opts.size || 48;
    var fill = opts.color || 'rgba(255,255,255,0.9)';
    return '<svg class="art-cloud" width="' + size + '" height="' + (size * 0.62) +
      '" viewBox="0 0 64 40" aria-hidden="true" fill="' + fill + '" stroke="none">' +
      '<ellipse cx="24" cy="26" rx="20" ry="12"/><ellipse cx="42" cy="22" rx="15" ry="11"/>' +
      '<ellipse cx="14" cy="24" rx="12" ry="9"/></svg>';
  }

  // 작은 반짝임 (4갈래 별 1개 + 글린트)
  function sparkle(opts) {
    opts = opts || {};
    var size = opts.size || 18;
    var fill = opts.color || 'currentColor';
    return '<svg class="art-sparkle" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" aria-hidden="true">' + star4(12, 12, 9, fill) +
      '<circle cx="19" cy="5" r="1.4" fill="' + fill + '" opacity="0.8"/></svg>';
  }

  // 홈 헤더 '하늘 띠' — 달 + 반짝이는 별 + 흐르는 구름. 폭 가변(viewBox 고정, preserveAspectRatio로 채움)
  function skyBand(opts) {
    opts = opts || {};
    var moonColor = opts.moon || 'var(--moon, #f6dd95)';
    var moonShade = opts.moonShade || 'rgba(255,255,255,0.16)';
    var starColor = opts.star || 'rgba(255,255,255,0.95)';
    var cloudColor = opts.cloud || 'rgba(255,255,255,0.82)';
    var ink = opts.ink || 'rgba(120,90,40,0.65)';
    var cheek = 'rgba(243,150,150,0.55)';

    // --- 반짝이는 별 (각각 다른 주기/지연으로 진짜 반짝이게) ---
    function tw(inner, delay, dur) {
      return '<g class="sky-star" style="animation-delay:' + delay + 's;animation-duration:' + dur + 's">' + inner + '</g>';
    }
    function dot(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + starColor + '"/>'; }
    // 별 뒤에 깔리는 블러 빛무리 — 진짜 발광하는 느낌
    function glow(cx, cy, r) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + starColor + '" opacity="0.6" filter="url(#starGlow)"/>';
    }
    // 4갈래 별은 같은 별 모양으로 발광 (원형 글로우와 실루엣이 안 맞던 문제 해소)
    function glowStar(cx, cy, r) {
      return '<g filter="url(#starGlow)" opacity="0.6">' + star4(cx, cy, r, starColor) + '</g>';
    }
    function spark(cx, cy, r, delay, dur) { return tw(glowStar(cx, cy, r * 1.15) + star4(cx, cy, r, starColor), delay, dur); }
    function tiny(cx, cy, r, delay, dur) { return tw(glow(cx, cy, r * 1.1) + dot(cx, cy, r), delay, dur); }
    var stars =
      spark(150, 30, 4.2, 0, 3.2) +
      spark(206, 20, 3.2, 1.1, 2.6) +
      spark(96, 60, 3.6, 0.5, 3.6) +
      spark(252, 48, 2.6, 1.8, 2.9) +
      tiny(122, 90, 1.4, 0.8, 2.4) +
      tiny(272, 76, 1.5, 0.3, 3.0) +
      tiny(178, 56, 1.2, 1.5, 2.2) +
      tiny(58, 38, 1.3, 2.1, 3.4) +
      tiny(238, 96, 1.1, 1.2, 2.7);

    // --- 부드러운 구름 (불투명 fill로 겹침선 제거 → 투명도는 그룹에 한 번만) ---
    var cloudFill = opts.cloud || '#ece7f8';
    function cloudShape(cx, baseY, s) {
      return '<g fill="' + cloudFill + '" stroke="none" filter="url(#cloudSoft)" transform="translate(' + cx + ' ' + baseY + ') scale(' + s + ')">' +
        '<circle cx="-32" cy="6" r="15"/>' +
        '<circle cx="-13" cy="-7" r="20"/>' +
        '<circle cx="11" cy="-11" r="23"/>' +
        '<circle cx="33" cy="-3" r="18"/>' +
        '<circle cx="24" cy="9" r="14"/>' +
        '<ellipse cx="0" cy="13" rx="50" ry="14"/>' +
        '</g>';
    }
    var cloudG =
      '<g class="sky-cloud" style="--d:26px;animation-duration:34s;opacity:0.92">' + cloudShape(300, 118, 1) + '</g>' +
      '<g class="sky-cloud" style="--d:18px;animation-duration:46s;animation-direction:alternate-reverse;opacity:0.55">' +
        cloudShape(218, 130, 0.78) + '</g>' +
      '<g class="sky-cloud" style="--d:13px;animation-duration:56s;opacity:0.4">' +
        cloudShape(362, 126, 0.6) + '</g>' +
      '<g class="sky-cloud" style="--d:21px;animation-duration:50s;animation-direction:alternate-reverse;opacity:0.5">' +
        cloudShape(150, 122, 0.72) + '</g>';

    // --- 자는 달 (대칭 얼굴) ---
    var moonG =
      '<g class="sky-moon">' +
      '<circle cx="332" cy="56" r="33" fill="' + moonColor + '" opacity="0.5" filter="url(#moonGlow)"/>' +
      '<circle cx="332" cy="56" r="30" fill="' + moonColor + '"/>' +
      '<circle cx="320" cy="44" r="4.5" fill="' + moonShade + '"/>' +
      '<circle cx="345" cy="49" r="2.6" fill="' + moonShade + '"/>' +
      // 감은 눈 (332 중심 대칭) — 부드러운 ‿ 호
      '<path d="M319 53q5 6 10 0" fill="none" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M335 53q5 6 10 0" fill="none" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>' +
      // 입 (332 중심) — 작은 미소
      '<path d="M326 64q6 6 12 0" fill="none" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>' +
      // 양 볼 (대칭)
      '<circle cx="318" cy="62" r="4" fill="' + cheek + '"/><circle cx="346" cy="62" r="4" fill="' + cheek + '"/>' +
      '</g>';

    var defs = '<defs>' +
      '<filter id="moonGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>' +
      '<filter id="starGlow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="1.5"/></filter>' +
      '<filter id="cloudSoft" x="-30%" y="-40%" width="160%" height="190%"><feGaussianBlur stdDeviation="1.6"/></filter>' +
      '</defs>';
    // xMax 정렬: 가로가 잘리는 좁은 화면(모바일)에서 우상단 달이 잘리지 않게 오른쪽 기준으로 맞춤
    // (데스크톱은 가로가 넓어 가로 잘림이 없어 영향 없음)
    return '<svg class="sky-band" viewBox="0 0 400 138" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">' +
      defs + stars + cloudG + moonG + '</svg>';
  }

  // 빈 상태 아늑 일러스트 — 자는 달 + 별 + zzz
  function scene(name) {
    var starColor = 'var(--accent-2, #8aa0d8)';
    return '<svg class="art-scene" width="132" height="104" viewBox="0 0 132 104" aria-hidden="true">' +
      star4(20, 26, 6, starColor, 0.7) + star4(112, 34, 7, starColor, 0.8) +
      star4(100, 74, 5, starColor, 0.6) +
      '<circle cx="32" cy="64" r="2.2" fill="' + starColor + '" opacity="0.55"/>' +
      '<circle cx="116" cy="60" r="2" fill="' + starColor + '" opacity="0.5"/>' +
      '<g transform="translate(36,30) scale(0.86)">' + moonInner({}) + '</g>' +
      '<text x="92" y="34" font-size="13" fill="' + starColor + '" opacity="0.8" font-weight="700">z</text>' +
      '<text x="100" y="24" font-size="10" fill="' + starColor + '" opacity="0.6" font-weight="700">z</text>' +
      '</svg>';
  }

  /* ===================== 메인 일러스트 (PNG 대체용 벡터 장면) ===================== */
  // 밤하늘 히어로 — 그라데이션 + 빛나는 달 + 별·유성 + 구름 + 산 실루엣
  function heroScene() {
    var d =
      '<defs>' +
      '<linearGradient id="hSky" x1="0" y1="0" x2="0.35" y2="1">' +
        '<stop offset="0" stop-color="#2b2f74"/><stop offset="0.5" stop-color="#4a4392"/>' +
        '<stop offset="1" stop-color="#7d6cb0"/></linearGradient>' +
      '<radialGradient id="hMoon" cx="0.4" cy="0.38" r="0.7">' +
        '<stop offset="0" stop-color="#fdf6e3"/><stop offset="0.7" stop-color="#f2e6bf"/>' +
        '<stop offset="1" stop-color="#e6d49f"/></radialGradient>' +
      '<radialGradient id="hGlow" cx="0.5" cy="0.5" r="0.5">' +
        '<stop offset="0" stop-color="#fdf3c8" stop-opacity="0.85"/>' +
        '<stop offset="0.5" stop-color="#cfd0ef" stop-opacity="0.28"/>' +
        '<stop offset="1" stop-color="#cfd0ef" stop-opacity="0"/></radialGradient>' +
      '<filter id="hBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '</defs>';
    var bg = '<rect width="760" height="200" fill="url(#hSky)"/>';
    function st(x, y, r, o) { return star4(x, y, r, '#fff', o); }
    function dt(x, y, r, o) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" opacity="' + o + '"/>'; }
    // 너비 전체에 크고 작은 별을 흩뿌림 (달 영역 590~720·10~130은 비움)
    var stars =
      st(70, 52, 4.2, 0.9) + st(180, 96, 3.4, 0.8) + st(250, 38, 5, 0.95) +
      st(340, 112, 3, 0.75) + st(400, 62, 4.4, 0.9) + st(468, 124, 3.2, 0.8) +
      st(540, 44, 3.8, 0.85) + st(150, 150, 2.8, 0.7) + st(300, 150, 2.6, 0.65) +
      dt(44, 112, 1.5, 0.6) + dt(120, 36, 1.4, 0.6) + dt(132, 138, 1.6, 0.7) +
      dt(210, 70, 1.3, 0.55) + dt(232, 128, 1.4, 0.6) + dt(290, 92, 1.5, 0.6) +
      dt(360, 34, 1.7, 0.7) + dt(372, 150, 1.3, 0.55) + dt(430, 92, 1.5, 0.6) +
      dt(500, 78, 1.6, 0.65) + dt(520, 150, 1.4, 0.6) + dt(575, 28, 1.5, 0.6) +
      dt(700, 150, 1.6, 0.6) + dt(735, 110, 1.4, 0.55);
    var moon =
      '<circle cx="650" cy="104" r="62" fill="url(#hGlow)"/>' +
      '<circle cx="650" cy="104" r="40" fill="url(#hMoon)"/>' +
      '<circle cx="636" cy="92" r="7" fill="#e3d09a" opacity="0.55"/>' +
      '<circle cx="664" cy="114" r="5" fill="#e3d09a" opacity="0.45"/>' +
      '<circle cx="660" cy="90" r="3.5" fill="#e3d09a" opacity="0.4"/>';
    // 산 실루엣 (하단 우측)
    var mountains = '<path d="M520 200 L600 156 L660 200 Z" fill="#3b3768" opacity="0.9"/>' +
      '<path d="M620 200 L700 150 L760 200 Z" fill="#322e5c" opacity="0.95"/>';
    // 폭신한 구름 — 천천히 떠다님 (좌우 드리프트, 서로 다른 속도/방향)
    function cloud(cx, baseY, s, fill, op, dur, dist, rev) {
      return '<g class="dd-cloud" opacity="' + op + '" style="--d:' + dist + 'px;animation-duration:' + dur + 's' + (rev ? ';animation-direction:alternate-reverse' : '') + '">' +
        '<g filter="url(#hBlur)" fill="' + fill + '" transform="translate(' + cx + ' ' + baseY + ') scale(' + s + ')">' +
        '<ellipse cx="-46" cy="8" rx="34" ry="22"/><ellipse cx="0" cy="-12" rx="48" ry="33"/>' +
        '<ellipse cx="46" cy="2" rx="36" ry="24"/><rect x="-82" y="2" width="164" height="44" rx="22"/>' +
        '</g></g>';
    }
    var clouds =
      cloud(470, 188, 0.95, '#e3ddf3', 0.9, 38, 26, false) +
      cloud(560, 196, 1.1, '#d9d3ef', 0.95, 30, 22, false) +
      cloud(672, 190, 0.85, '#c8c0e6', 0.9, 44, 18, true);
    return '<svg class="dd-scene" viewBox="0 0 760 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      d + bg + stars + moon + mountains + clouds + '</svg>';
  }

  // 범용 추상 장식 — 부드러운 구름 + 은은한 빛 + 반짝이 (사물 없이 깔끔)
  function dreamScene() {
    // 색은 CSS(.dd-scene ...)에서 테마 토큰으로 지정 — 테마별 자동 대응
    var d =
      '<defs>' +
      '<radialGradient id="dGlow" cx="0.5" cy="0.5" r="0.5">' +
        '<stop class="ds-glow-a" offset="0" stop-opacity="0.5"/>' +
        '<stop class="ds-glow-b" offset="1" stop-opacity="0"/></radialGradient>' +
      '<filter id="dBlur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '</defs>';
    // 배경 없음 — 패널 면이 그대로 이어지게(경계 제거). 장식만 얹는다.
    var bg = '';
    var glow = '<ellipse cx="470" cy="250" rx="250" ry="200" fill="url(#dGlow)"/>';
    function dot(x, y, r, o) { return '<circle class="ds-dot" cx="' + x + '" cy="' + y + '" r="' + r + '" opacity="' + o + '"/>'; }
    var stars = '<g class="ds-stars">' +
      star4(210, 130, 9, 'currentColor', 0.85) + star4(560, 110, 7, 'currentColor', 0.7) +
      star4(630, 360, 7, 'currentColor', 0.7) + star4(330, 350, 5, 'currentColor', 0.6) + '</g>' +
      dot(420, 90, 3, 0.5) + dot(130, 260, 2.6, 0.5) + dot(690, 230, 2.6, 0.5) + dot(470, 430, 2.8, 0.45);
    // 부드러운 구름 — 불투명 fill + 그룹 투명도(겹침선 방지), 천천히 떠다님
    function cloud(cx, cy, s, op, dist, dur, rev) {
      return '<g class="dd-cloud" opacity="' + op + '" style="--d:' + dist + 'px;animation-duration:' + dur + 's' + (rev ? ';animation-direction:alternate-reverse' : '') + '">' +
        '<g class="ds-cloud-body" filter="url(#dBlur)" transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')">' +
        '<circle cx="-44" cy="8" r="28"/><circle cx="-12" cy="-10" r="38"/><circle cx="22" cy="-2" r="32"/>' +
        '<circle cx="50" cy="10" r="24"/><ellipse cx="0" cy="20" rx="78" ry="26"/></g></g>';
    }
    var clouds =
      cloud(370, 230, 0.9, 0.8, 24, 42, false) +
      cloud(560, 330, 1.05, 0.9, 28, 36, false) +
      cloud(450, 450, 0.82, 0.7, 18, 50, true) +
      cloud(685, 185, 0.55, 0.5, 14, 56, false);
    return '<svg class="dd-scene" viewBox="0 0 760 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      d + bg + glow + clouds + stars + '</svg>';
  }

  // 감정 스티커 — 파스텔 채움 원판 위 감정 글리프 (귀여운 배지)
  function emotionSticker(id, size) {
    size = size || 34;
    var e = global.Store ? (global.Store.emotionById(id) || {}) : {};
    var col = e.color || 'var(--accent)';
    var disc = 'background:color-mix(in srgb,' + col + ' 18%, transparent);';
    return '<span class="emo-sticker" style="width:' + size + 'px;height:' + size + 'px;' + disc +
      'color:' + col + '">' + emotion(id, Math.round(size * 0.56)) + '</span>';
  }

  /* ===================== 키워드 글리프 (도감용) ===================== */
  // 카테고리 기본(개별 글리프 없을 때)
  var CAT_FALLBACK = {
    place:     '<path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    person:    '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    situation: '<path d="M12 3l1.7 6L20 11l-6.3 2L12 19l-1.7-6L4 11l6.3-2z"/>'
  };

  // 장소(place) 50종 — 라인 글리프
  var KW_PATH = {
    school:     '<path d="M4 21V10l8-4 8 4v11"/><path d="M9 21v-5h6v5"/><path d="M12 6V3l4 1.4"/>',
    home:       '<path d="M4 11l8-6 8 6"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
    sea:        '<path d="M3 9q3-3 6 0t6 0 6 0"/><path d="M3 14q3-3 6 0t6 0 6 0"/><path d="M3 19q3-3 6 0t6 0 6 0"/>',
    forest:     '<path d="M12 3l4 6h-2.5l3 5H7.5l3-5H8z"/><path d="M12 14v6"/>',
    hospital:   '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/>',
    mountain:   '<path d="M3 19l6-11 4 6 2-3 6 8z"/>',
    river:      '<path d="M7 3c3 4-3 6 0 10s-3 5 0 8"/><path d="M16 3c3 4-3 6 0 10s-3 5 0 8"/>',
    city:       '<path d="M3 21V9l5-2v14M8 21V5l6 2v14M14 21V10l6 2v9M3 21h18"/>',
    academy:    '<path d="M9 4h5l3 7h-8z"/><path d="M12.5 11v6M9 20h7"/>',
    office:     '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    subway:     '<rect x="5" y="4" width="14" height="13" rx="3"/><path d="M5 12h14M8 9h8"/><path d="M8 21l1.5-2M16 21l-1.5-2"/>',
    bus:        '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M4 11h16"/><circle cx="8" cy="18.5" r="1.3"/><circle cx="16" cy="18.5" r="1.3"/>',
    airport:    '<path d="M2 14l20-6-9 9-2-4z"/><path d="M11 17l2 4"/>',
    hotel:      '<path d="M3 8v10M3 13h12a3 3 0 0 1 3 3v2H3"/><path d="M21 18v-4"/>',
    amusement:  '<circle cx="12" cy="11" r="7"/><circle cx="12" cy="11" r="1.4"/><path d="M12 4v14M5 11h14M7 6l10 10M17 6L7 16"/><path d="M9 20h6"/>',
    market:     '<path d="M4 9l1.2-4h13.6L20 9"/><path d="M5 9v11h14V9"/><path d="M4 9q2 2 4 0t4 0 4 0 4 0"/>',
    cafe:       '<path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2M11 3v2"/>',
    restaurant: '<path d="M7 3v9M5 3v4a2 2 0 0 0 4 0V3M7 12v9"/><path d="M16 3c-2 0-3 3-3 6s1 3 2 3v9"/>',
    library:    '<path d="M5 4h3v16H5zM9 4h3v16H9z"/><path d="M14 5l3 .8-3 14-3-.8z"/>',
    church:     '<path d="M12 2v4M10 4h4"/><path d="M6 21V10l6-3 6 3v11"/><path d="M10 21v-5h4v5"/>',
    temple:     '<path d="M4 8h16l-2-3H6z"/><path d="M6 8v10M18 8v10M5 18h14"/><path d="M10 18v-4h4v4"/>',
    cave:       '<path d="M3 21v-6a9 9 0 0 1 18 0v6"/><path d="M8 21v-4a4 4 0 0 1 8 0v4"/>',
    desert:     '<circle cx="17" cy="7" r="3"/><path d="M2 18q4-4 8 0t8 0 4 0"/><path d="M2 21q4-3 8 0t8 0 4 0"/>',
    field:      '<path d="M3 18h18"/><path d="M6 18v-4q-2-1 0-3M10 18v-5q2-1 0-3M14 18v-4M18 18v-5q-2-1 0-3"/>',
    bridge:     '<path d="M3 16h18"/><path d="M3 16c4-8 14-8 18 0"/><path d="M7 16V9M12 16V7M17 16V9"/>',
    alley:      '<path d="M4 21V5M20 21V5"/><path d="M10 21l1.2-12M14 21l-1.2-12"/>',
    rooftop:    '<path d="M5 21V8h14v13M5 21h14"/><path d="M12 8V4l4 1.5L12 7"/>',
    basement:   '<path d="M3 5h18"/><path d="M5 5v3h3v3h3v3h3v3h3"/>',
    stairs:     '<path d="M4 20h4v-4h4v-4h4v-4h4"/>',
    elevator:   '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M12 7l-2 3h4zM12 17l-2-3h4z"/>',
    toilet:     '<path d="M5 10h9V8a3 3 0 0 1 6 0"/><path d="M5 10v2a5 5 0 0 0 5 5l-1 4M14 17l1 4"/>',
    kitchen:    '<path d="M5 9h14l-1 9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M3 9h2M19 9h2"/><path d="M9 9V6M12 9V5M15 9V6"/>',
    park:       '<circle cx="9" cy="8" r="4"/><path d="M9 12v4"/><path d="M14 16h6M14 16v4M20 16v4"/>',
    lake:       '<ellipse cx="12" cy="12" rx="9" ry="5"/><path d="M7 11h2M13 11h4"/>',
    waterfall:  '<path d="M5 3v10M9 3v12M13 3v10M17 3v13"/><path d="M3 18q3 2 6 0t6 0 6 0"/>',
    island:     '<path d="M3 19q4 2 9 0t9 0"/><path d="M12 16v-6"/><path d="M12 10c-3-2-5 0-5 0M12 10c3-2 5 0 5 0M12 10V7"/>',
    space:      '<circle cx="11" cy="11" r="6"/><ellipse cx="11" cy="11" rx="9.5" ry="3" transform="rotate(-22 11 11)"/>',
    sky:        '<path d="M6 17h10a3.2 3.2 0 0 0 .3-6.4A4.2 4.2 0 0 0 8.6 8.6 3.2 3.2 0 0 0 6 17z"/>',
    tunnel:     '<path d="M4 20v-7a8 8 0 0 1 16 0v7"/><path d="M12 20v-6"/><path d="M9 20h6"/>',
    train:      '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 6h6"/><path d="M8 17l-2 4M16 17l2 4M10 21h4"/>',
    ruins:      '<path d="M3 21h18"/><path d="M5 21V8l0-2M5 7h5M10 21V8"/><path d="M15 21V11M19 21V9"/>',
    maze:       '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h12M9 9v9M15 21V9M15 12H8M8 12v3"/>',
    mirror:     '<ellipse cx="12" cy="10" rx="6" ry="8"/><path d="M9 6l1.6 1.6"/><path d="M9 20h6"/>',
    underwater: '<path d="M3 12c3-4 9-4 13 0-4 4-10 4-13 0z"/><path d="M16 12l5-3v6z"/><circle cx="20" cy="6" r="1"/>',
    heaven:     '<path d="M6 18h10a3.2 3.2 0 0 0 .3-6.4A4.2 4.2 0 0 0 8.6 9.6 3.2 3.2 0 0 0 6 18z"/><path d="M12 3v3M8 5l1 2M16 5l-1 2"/>',
    hell:       '<path d="M12 3c1.5 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3.5 2.2-4.5 0 2 1.8 2 1.8 0 0-1.5 0-2.5 0-3.5z"/>',
    alienworld: '<ellipse cx="12" cy="14" rx="8" ry="3"/><path d="M8 13a4 3 0 0 1 8 0"/><path d="M7 16l-1 2M12 17v2.5M17 16l1 2"/>',
    shrine:     '<path d="M4 6h16M5 4h14"/><path d="M7 6v14M17 6v14"/><path d="M5 10h14"/>',
    rift:       '<path d="M13 3l-6 9h4l-3 9 9-12h-5z"/>',
    dreamindream:'<path d="M12 3a9 9 0 1 0 9 9 6 6 0 1 1-6-6 3 3 0 1 0 3 3"/>',

    /* 인물(person) 30종 */
    friend:     '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0"/>',
    family:     '<circle cx="7.5" cy="7" r="2.3"/><circle cx="16.5" cy="7" r="2.3"/><circle cx="12" cy="11" r="1.7"/><path d="M4 19v-1.5a3.5 3.5 0 0 1 7 0M13 19v-1.5a3.5 3.5 0 0 1 7 0M9.5 20v-1a2.5 2.5 0 0 1 5 0v1"/>',
    mother:     '<circle cx="12" cy="6.5" r="3"/><path d="M9.2 4.6q2.8-2.2 5.6 0"/><path d="M7 21v-4a5 5 0 0 1 10 0v4"/>',
    father:     '<circle cx="12" cy="6.5" r="3"/><path d="M7 21v-4a5 5 0 0 1 10 0v4"/><path d="M12 9.5v2l-1 1.4 1 1.6 1-1.6-1-1.4"/>',
    sibling:    '<circle cx="8" cy="8" r="2.6"/><circle cx="16" cy="9" r="2.2"/><path d="M3.5 19a4.5 4.5 0 0 1 9 0M12 19a4 4 0 0 1 8 0"/>',
    grandma:    '<circle cx="12" cy="7" r="3"/><circle cx="12" cy="3.7" r="1.3"/><path d="M9.6 7h4.8"/><path d="M7 21v-4a5 5 0 0 1 10 0v4"/>',
    grandpa:    '<circle cx="11" cy="7" r="3"/><path d="M9 9.2q2 1.2 4 0"/><path d="M6 21v-3.5a5 5 0 0 1 9-2.7"/><path d="M17 11.5V21"/>',
    teacher:    '<rect x="3" y="4" width="11" height="8" rx="1"/><path d="M5.5 7h6M5.5 9.3h4"/><circle cx="18" cy="7" r="2.4"/><path d="M15 20a3 3 0 0 1 6 0"/>',
    stranger:   '<circle cx="11" cy="8" r="3.6"/><path d="M5 21a6 6 0 0 1 12 0"/><path d="M18.3 4a1.5 1.5 0 1 1 2.1 1.4c-.7.5-.7.8-.7 1.3"/><circle cx="19.7" cy="9" r=".5" fill="currentColor" stroke="none"/>',
    lover:      '<circle cx="7.5" cy="8" r="2.5"/><circle cx="16.5" cy="8" r="2.5"/><path d="M12 14.8l-1.3-1.3a1.3 1.3 0 0 1 1.3-2 1.3 1.3 0 0 1 1.3 2z"/><path d="M3 20a4.5 4.5 0 0 1 9 0M12 20a4.5 4.5 0 0 1 9 0"/>',
    oldfriend:  '<rect x="4" y="4" width="16" height="13" rx="1"/><circle cx="9.5" cy="9.5" r="1.7"/><circle cx="15" cy="9.5" r="1.7"/><path d="M6.5 15a3 3 0 0 1 11 0"/><path d="M4 20h16"/>',
    coworker:   '<circle cx="9" cy="7" r="2.6"/><path d="M4 18v-3a5 5 0 0 1 10 0"/><rect x="14" y="12" width="7" height="6" rx="1"/><path d="M16.5 12v-1.2h2V12"/>',
    child:      '<circle cx="9" cy="9" r="3"/><path d="M5 20a4 4 0 0 1 8 0"/><circle cx="17.5" cy="7" r="2.6"/><path d="M17.5 9.6v6"/>',
    crowd:      '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="17" cy="9" r="2"/><path d="M4 18a3 3 0 0 1 6 0M9 18a3 3 0 0 1 6 0M14 18a3 3 0 0 1 6 0"/>',
    doctor:     '<circle cx="12" cy="7" r="3"/><path d="M6 21v-4a6 6 0 0 1 12 0v4"/><path d="M9 14v2a3 3 0 0 0 6 0v-1"/><circle cx="16" cy="14" r="1.4"/>',
    police:     '<path d="M12 3l7 2.2v5.8c0 4.8-3 7.8-7 9.6-4-1.8-7-4.8-7-9.6V5.2z"/><path d="M12 8l.9 1.8 2 .2-1.4 1.3.4 2L12 12.4l-1.9 .9.4-2L9.6 10l2-.2z"/>',
    soldier:    '<path d="M5 13a7 7 0 0 1 14 0"/><path d="M3 13h18v2.5H3z"/><path d="M12 6V4"/>',
    celebrity:  '<path d="M12 3l2.5 5.2 5.6.5-4.2 3.7 1.3 5.5L12 20.6l-5.2 2.3 1.3-5.5L3.9 8.7l5.6-.5z"/>',
    animal:     '<circle cx="6.5" cy="11" r="1.7"/><circle cx="11" cy="8.5" r="1.7"/><circle cx="15.5" cy="9" r="1.7"/><circle cx="19" cy="12" r="1.5"/><path d="M8 17.5a4 4 0 0 1 8 0c0 2.2-2 2.3-4 2.3s-4-.1-4-2.3z"/>',
    deceased:   '<path d="M6 21V11a6 6 0 0 1 12 0v10"/><path d="M12 6.5v6M9 9.5h6"/><path d="M4 21h16"/>',
    self:       '<circle cx="7" cy="8" r="2.6"/><path d="M3 19a4 4 0 0 1 8 0"/><circle cx="17" cy="8" r="2.6"/><path d="M13 19a4 4 0 0 1 8 0"/><path d="M12 4v16" stroke-dasharray="1 2.5"/>',
    acquaintance:'<circle cx="9" cy="8" r="3"/><path d="M4 21a5 5 0 0 1 10 0"/><circle cx="17.5" cy="9" r="2.3" stroke-dasharray="2.5 2"/><path d="M14.5 21a3.2 3.2 0 0 1 6.4 0" stroke-dasharray="2.5 2"/>',
    ghost:      '<path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-1.6L14 20l-2-1.6L10 20l-2.7-1.6z"/><circle cx="9.5" cy="10.5" r=".5" fill="currentColor" stroke="none"/><circle cx="14.5" cy="10.5" r=".5" fill="currentColor" stroke="none"/>',
    monster:    '<path d="M5 18a7 7 0 0 1 14 0l-1 3-2-1-2 1-2-1-2 1-2-1z"/><circle cx="12" cy="11" r="2.6"/><circle cx="12" cy="11" r=".6" fill="currentColor" stroke="none"/>',
    alien:      '<path d="M12 3c3.6 0 6 2.8 6 6.5 0 5-4 11.5-6 11.5s-6-6.5-6-11.5C6 5.8 8.4 3 12 3z"/><path d="M9.2 10q1.6 2.2 0 3.4M14.8 10q-1.6 2.2 0 3.4"/>',
    angel:      '<circle cx="12" cy="8.5" r="2.8"/><ellipse cx="12" cy="4" rx="3" ry="1"/><path d="M9.3 12c-4-2-6.3.2-6.3.2 2 1.6 4 1.2 4 1.2M14.7 12c4-2 6.3.2 6.3.2-2 1.6-4 1.2-4 1.2"/><path d="M9 21a3 3 0 0 1 6 0"/>',
    demon:      '<circle cx="12" cy="10" r="4"/><path d="M8.5 7L6 3.5 9.2 5.2M15.5 7L18 3.5 14.8 5.2"/><circle cx="10.5" cy="10" r=".5" fill="currentColor" stroke="none"/><circle cx="13.5" cy="10" r=".5" fill="currentColor" stroke="none"/><path d="M6.5 21a5.5 5.5 0 0 1 11 0"/>',
    god:        '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.4 5.4l2 2M16.6 16.6l2 2M18.6 5.4l-2 2M7.4 16.6l-2 2"/>',
    shadowman:  '<circle cx="12" cy="7" r="3.2" fill="currentColor" stroke="none"/><path d="M6 21v-5a6 6 0 0 1 12 0v5z" fill="currentColor" stroke="none"/>',
    futureself: '<circle cx="10" cy="7" r="3"/><path d="M4 21v-4a6 6 0 0 1 11.4-2.4"/><circle cx="17.5" cy="14.5" r="4"/><path d="M17.5 12.6v2l1.3 1"/>',

    /* 상황(situation) 40종 */
    fall:       '<path d="M12 4v11M8 11l4 4 4-4"/><path d="M6 19h12"/>',
    fly:        '<path d="M12 21V9"/><path d="M12 9c-3-4-7-4-7-4 1 3 3 4 3 4M12 9c3-4 7-4 7-4-1 3-3 4-3 4"/>',
    chase:      '<path d="M4 12h11M11 8l4 4-4 4"/><path d="M3 7l1.5 1.5L3 10M3 14l1.5 1.5L3 17"/>',
    exam:       '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    travel:     '<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M12 8v11"/>',
    late:       '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/>',
    lost:       '<path d="M12 21V7"/><path d="M12 7h6l2 2-2 2h-6z"/><path d="M12 13H6l-2 2 2 2h6z"/>',
    fight:      '<path d="M12 3l1.6 4.4 4.6-1-2.3 4 3.4 2.8-4.6.4 1.1 4.5-3.8-2.4-3.8 2.4 1.1-4.5-4.6-.4 3.4-2.8-2.3-4 4.6 1z"/>',
    death:      '<path d="M5 11a7 7 0 0 1 14 0v3a2 2 0 0 1-2 2v3h-2v-2h-2v2H9v-2H8v2H7v-3a2 2 0 0 1-2-2z"/><circle cx="9.5" cy="11" r="1.3"/><circle cx="14.5" cy="11" r="1.3"/>',
    wedding:    '<circle cx="9.5" cy="13" r="5"/><circle cx="14.5" cy="13" r="5"/>',
    breakup:    '<path d="M12 20S5 15.5 5 10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/><path d="M12 7.4l-1.6 3 2.2 2-1.6 3"/>',
    reunion:    '<circle cx="10" cy="9" r="3"/><circle cx="14" cy="9" r="3"/><path d="M5 20a5 5 0 0 1 8-1 5 5 0 0 1 6 1"/>',
    present:    '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M7 13l3-3 2 2 4-5"/><path d="M12 16v4M8 20h8"/>',
    hide:       '<path d="M4 21V8h7v13"/><circle cx="15.5" cy="9" r="2"/><path d="M13 21v-4a2.5 2.5 0 0 1 5 0v4"/>',
    swim:       '<circle cx="16" cy="7" r="2"/><path d="M3 14q2-2 4 0t4 0 4 0 4 0"/><path d="M5 11l4 1.2 3-2 4 1"/>',
    drive:      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 4v6M4.6 14.5l5.4-2M19.4 14.5l-5.4-2"/>',
    war:        '<circle cx="11" cy="15" r="5"/><path d="M14.5 11.5l2.5-2.5M17 9l1-2 2 1-1 2zM17 9l2.2.2"/>',
    fire:       '<path d="M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3.2 2.2-4.2 0 2 1.8 2 1.8 0 0-2-1-3-1-4.8z"/>',
    flood:      '<path d="M7 11l5-4 5 4v3"/><path d="M3 15q2.5-2.5 5 0t5 0 5 0"/><path d="M3 19q2.5-2.5 5 0t5 0 5 0"/>',
    quake:      '<path d="M3 12h4l2-3.5 3 7 2.5-5 2 3.5h3.5"/><path d="M8 16l1.5 4M15 16l-1.5 4"/>',
    eat:        '<path d="M3.5 11h17a8.5 5 0 0 1-17 0z"/><path d="M14 4l-1 6M17 4.5l-2 5.5"/>',
    shopping:   '<path d="M6 7h15l-2 8H8z"/><path d="M6 7L5 4H2.5"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    study:      '<path d="M12 6c-2-1.4-5-1.4-7.5 0v12c2.5-1.4 5.5-1.4 7.5 0 2-1.4 5-1.4 7.5 0V6c-2.5-1.4-5.5-1.4-7.5 0z"/><path d="M12 6v12"/>',
    work:       '<rect x="4" y="5" width="16" height="10" rx="1"/><path d="M3 18h18l-1.2-3H4.2z"/>',
    meet:       '<path d="M3 12h6M7 10l2 2-2 2"/><path d="M21 12h-6M17 10l-2 2 2 2"/><circle cx="12" cy="12" r="1.2"/>',
    talk:       '<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><circle cx="9" cy="10.5" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="10.5" r=".7" fill="currentColor" stroke="none"/><circle cx="15" cy="10.5" r=".7" fill="currentColor" stroke="none"/>',
    cry:        '<path d="M12 3c-3.5 4.5-6 7-6 9.5a6 6 0 0 0 12 0C18 10 15.5 7.5 12 3z"/>',
    laugh:      '<circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01"/><path d="M8 13.5a4.5 3.5 0 0 0 8 0z"/>',
    surgery:    '<path d="M4 20l7-7"/><path d="M11 13l4-4a1.8 1.8 0 0 1 2.6 2.6l-4 4z"/><path d="M6 4h3M7.5 2.5v3"/>',
    birth:      '<circle cx="12" cy="12" r="7"/><path d="M12 5c1.8 1.5 0 3 0 3"/><circle cx="9.5" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12" r=".6" fill="currentColor" stroke="none"/><path d="M10 15q2 1.5 4 0"/>',
    transform:  '<path d="M5 9a7 7 0 0 1 12-2.5M17 4v3h-3"/><path d="M19 15a7 7 0 0 1-12 2.5M7 20v-3h3"/>',
    timetravel: '<circle cx="13" cy="12" r="7"/><path d="M13 8v4l3 2"/><path d="M6 5v4h4"/><path d="M6 9a7 7 0 0 1 7-4"/>',
    invisible:  '<circle cx="12" cy="8" r="3.5" stroke-dasharray="3 2.4"/><path d="M5 21a7 7 0 0 1 14 0" stroke-dasharray="3 2.4"/>',
    superpower: '<circle cx="12" cy="12" r="9"/><path d="M13 6l-4.5 7.5H12l-1 4.5 4.5-7.5H12z"/>',
    drown:      '<path d="M3 9q3-2.5 6 0t6 0 6 0"/><circle cx="12" cy="15" r="2.4"/><path d="M9.5 16.5l-1 2M14.5 16.5l1 2M12 18v2.2"/><circle cx="17" cy="7" r=".9"/>',
    paralysis:  '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/><path d="M5 5l14 14"/>',
    giant:      '<circle cx="9" cy="6" r="3"/><path d="M3 21v-7a6 6 0 0 1 12 0v7"/><circle cx="19" cy="14" r="1.5"/><path d="M17 21v-3.5a2 2 0 0 1 4 0V21"/>',
    lucid:      '<path d="M21 13a8 8 0 1 1-9-9 6.5 6.5 0 0 0 9 9z"/><circle cx="11" cy="11" r="1.6"/>',
    apocalypse: '<circle cx="11" cy="14" r="7"/><path d="M8 11l2.5 4-3 3"/><path d="M17 3l-2.5 4M20 5l-3.5 3.5"/>',
    rebirth:    '<path d="M12 21v-9"/><path d="M12 12c-1.5-4-5.5-4-5.5-4 0 4 4 4.2 5.5 4M12 12c1.5-4 5.5-4 5.5-4 0 4-4 4.2-5.5 4"/>'
  };

  function keyword(cat, id, size) {
    var inner = KW_PATH[id] || CAT_FALLBACK[cat] || CAT_FALLBACK.place;
    return svg(inner, { size: size || 24, sw: 1.6, cls: 'kw-glyph' });
  }

  global.Icons = {
    emotion: emotion,
    emotionSticker: emotionSticker,
    keyword: keyword,
    logo: logo,
    ui: ui,
    empty: empty,
    moon: moon,
    cloud: cloud,
    sparkle: sparkle,
    star4: star4,
    skyBand: skyBand,
    scene: scene,
    heroScene: heroScene,
    dreamScene: dreamScene,
    svg: svg
  };
})(window);
