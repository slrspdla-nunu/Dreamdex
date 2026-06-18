/* =========================================================================
 * Dreamdex — 라우터 & 부팅 (App)
 * 해시 기반 SPA 라우팅 (#/dreams/:id 등). 정적 호스팅/더블클릭 실행 가능.
 * ========================================================================= */
(function (global) {
  'use strict';

  /* ----------------------------- 테마 ----------------------------- */
  global.applyTheme = function (theme) {
    var valid = global.Store.VALID_THEMES;
    var t = valid.indexOf(theme) !== -1 ? theme : 'observatory';
    document.documentElement.setAttribute('data-theme', t);
  };

  global.applyPattern = function (pattern) {
    var valid = global.Store.VALID_PATTERNS;
    var p = valid.indexOf(pattern) !== -1 ? pattern : 'none';
    document.documentElement.setAttribute('data-pattern', p);
  };

  // 배경 효과 — data-effect 설정 + #bgEffect 레이어에 입자/유성/빛무리/꽃잎/방울 생성
  global.applyEffect = function (effect) {
    var valid = global.Store.VALID_EFFECTS;
    var e = valid.indexOf(effect) !== -1 ? effect : 'none';
    // 현재 테마 밝기에 안 맞는 효과(밤 효과↔밝은 테마 등)는 띄우지 않음
    var theme = document.documentElement.getAttribute('data-theme') || global.Store.getSettings().theme;
    var ok = global.Store.effectsFor(theme).some(function (f) { return f.id === e; });
    if (!ok) e = 'none';
    document.documentElement.setAttribute('data-effect', e);
    var host = document.getElementById('bgEffect');
    if (!host) return;
    if (e === 'none') { host.innerHTML = ''; return; }
    var html = '', i;
    if (e === 'stars' || e === 'shooting') {
      var n = e === 'stars' ? 64 : 30;
      for (i = 0; i < n; i++) {
        var x = (i * 37 + 13) % 100, y = (i * 61 + 7) % 100;
        var sz = ((i % 4) * 0.7 + 1.2).toFixed(1);
        var dur = (2.2 + (i % 5) * 0.7).toFixed(1), del = ((i % 7) * 0.45).toFixed(2);
        html += '<span class="fx-star" style="left:' + x + '%;top:' + y + '%;width:' + sz + 'px;height:' + sz +
          'px;--dur:' + dur + 's;animation-delay:' + del + 's"></span>';
      }
    }
    if (e === 'shooting') {
      // 왼쪽 위에서 출발 → 오른쪽 아래로 화면을 가로질러 낙하. 한 번 쓱 지나가고 한참 쉼(가끔).
      var mn = 5;
      for (i = 0; i < mn; i++) {
        var mx = (i * 27) % 60;       // 0~60% (왼쪽~가운데 위쪽에서 출발)
        var my = (i * 12) % 24;       // 0~24% (상단)
        var mdur = (8 + (i % 5) * 1.4).toFixed(1);   // 8.0~13.6s (긴 주기 → 가끔)
        var mdel = (i * 1.9).toFixed(1);
        html += '<span class="fx-meteor" style="left:' + mx + '%;top:' + my +
          '%;--dur:' + mdur + 's;animation-delay:' + mdel + 's"></span>';
      }
    }
    if (e === 'aurora') {
      // 위에서 드리운 빛의 커튼 4겹 (초록·청록·보라 = 오로라 색)
      var bands = [
        ['0%',  '30%', 'var(--cat-place)',     '9s',  '0s',  '22px'],
        ['25%', '34%', 'var(--accent-2)',      '11s', '-3s', '-18px'],
        ['53%', '30%', 'var(--cat-situation)', '10s', '-6s', '20px'],
        ['75%', '27%', 'var(--cat-place)',     '12s', '-2s', '-15px']
      ];
      for (i = 0; i < bands.length; i++) {
        var b = bands[i];
        html += '<span class="fx-aband" style="left:' + b[0] + ';width:' + b[1] +
          ';background:linear-gradient(to bottom,' + b[2] + ', transparent 78%);--dur:' + b[3] +
          ';animation-delay:' + b[4] + ';--sway:' + b[5] + '"></span>';
      }
    }
    if (e === 'petals') {
      // 위에서 흩날리며 떨어지는 꽃잎 (밝은 테마용) — 벚꽃 같은 보들보들 파스텔
      var pcols = ['#ffc6d4', '#ffd7c0', '#f7d3ea', '#ffe6b8', '#ffdbe6'];
      for (i = 0; i < 14; i++) {
        var px = (i * 53 + 5) % 100;
        var psz = (10 + (i % 4) * 3);
        var pdur = (8 + (i % 5) * 1.6).toFixed(1);
        var pdel = (i * 0.9).toFixed(1);
        html += '<span class="fx-petal" style="left:' + px + '%;width:' + psz + 'px;height:' + psz +
          'px;--pc:' + pcols[i % 5] + ';--dur:' + pdur + 's;animation-delay:' + pdel + 's"></span>';
      }
    }
    if (e === 'bubbles') {
      // 아래에서 떠오르는 비눗방울 (밝은 테마용)
      for (i = 0; i < 12; i++) {
        var bx = (i * 41 + 9) % 100;
        var bsz = (14 + (i % 5) * 8);
        var bdur = (9 + (i % 4) * 2).toFixed(1);
        var bdel = (i * 1.1).toFixed(1);
        html += '<span class="fx-bubble" style="left:' + bx + '%;width:' + bsz + 'px;height:' + bsz +
          'px;--dur:' + bdur + 's;animation-delay:' + bdel + 's"></span>';
      }
    }
    host.innerHTML = html;
  };

  /* ----------------------------- 라우트 ----------------------------- */
  // [정규식, 핸들러, 파라미터 키]
  var routes = [
    [/^\/?$/,                        'dashboard',  []],
    [/^\/new$/,                      'form',       []],
    [/^\/edit\/([^/]+)$/,            'form',       ['id']],
    [/^\/dreams$/,                   'list',       []],
    [/^\/dreams\/([^/]+)$/,          'detail',     ['id']],
    [/^\/dex$/,                      'dex',        []],
    [/^\/dex\/([^/]+)$/,             'dex',        ['cat']],
    [/^\/dex\/([^/]+)\/([^/]+)$/,    'dexKeyword', ['cat', 'kw']],
    [/^\/stats$/,                    'stats',      []],
    [/^\/map$/,                      'map',        []],
    [/^\/settings$/,                 'settings',   []]
  ];

  // nav 활성화를 위한 섹션 매핑(첫 세그먼트 기준)
  function sectionOf(path) {
    if (path === '/' || path === '') return 'home';
    if (path.indexOf('/dreams') === 0) return 'dreams';
    if (path.indexOf('/new') === 0 || path.indexOf('/edit') === 0) return 'new';
    if (path.indexOf('/dex') === 0) return 'dex';
    if (path.indexOf('/stats') === 0) return 'stats';
    if (path.indexOf('/map') === 0) return 'map';
    if (path.indexOf('/settings') === 0) return 'settings';
    return 'home';
  }

  function currentPath() {
    var h = global.location.hash.replace(/^#/, '');
    return h || '/';
  }

  function setActiveNav(path) {
    var seg = sectionOf(path);
    document.querySelectorAll('[data-route]').forEach(function (el) {
      var route = el.getAttribute('data-route');
      // 모바일 '탐험' 탭은 통계/지도 양쪽에서 활성화
      var active = route === seg || (route === 'explore' && (seg === 'stats' || seg === 'map'));
      el.classList.toggle('active', active);
    });
  }

  var Viz = global.Viz;

  function render() {
    var path = currentPath();

    // 온보딩 확인
    if (!global.Store.getSettings().onboarded) {
      global.Views.onboard();
      return;
    }
    // 온보딩이 떠 있었다면 닫기
    var oh = document.getElementById('onboardHost');
    if (oh && oh.style.display !== 'none') { oh.style.display = 'none'; oh.innerHTML = ''; }
    document.getElementById('appShell').style.display = '';

    if (Viz && Viz.destroyChart) Viz.destroyChart();

    var main = document.getElementById('main');
    var isDashboard = path === '/' || path === '';
    main.classList.toggle('main-dashboard', isDashboard);
    document.querySelector('.app').classList.toggle('app-dashboard', isDashboard);
    var matched = false;
    for (var i = 0; i < routes.length; i++) {
      var m = path.match(routes[i][0]);
      if (m) {
        var params = {};
        routes[i][2].forEach(function (key, idx) {
          params[key] = decodeURIComponent(m[idx + 1]);
        });
        global.Views[routes[i][1]](main, params);
        matched = true;
        break;
      }
    }
    if (!matched) {
      main.innerHTML = '<div class="card empty"><div class="empty-art">' + global.Icons.empty('error') + '</div>' +
        '<h3>페이지를 찾을 수 없습니다</h3>' +
        '<p>존재하지 않는 주소입니다.</p>' +
        '<div style="margin-top:18px"><button class="btn primary" data-go="/">보관소로</button></div></div>';
    }

    setActiveNav(path);
    main.scrollTo ? main.scrollTo(0, 0) : (global.scrollTo(0, 0));
    global.scrollTo(0, 0);
  }

  /* ----------------------------- 부팅 ----------------------------- */
  function boot() {
    var st = global.Store.getSettings();
    global.applyTheme(st.theme);
    global.applyPattern(st.pattern);
    global.applyEffect(st.effect);
    global.addEventListener('hashchange', render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
