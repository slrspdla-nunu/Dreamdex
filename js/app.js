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
    global.applyTheme(global.Store.getSettings().theme);
    global.addEventListener('hashchange', render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
