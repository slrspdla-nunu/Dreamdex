/* =========================================================================
 * Dreamdex — 라우터 & 부팅 (App)
 * 해시 기반 SPA 라우팅 (#/dreams/:id 등). 정적 호스팅/더블클릭 실행 가능.
 * ========================================================================= */
(function (global) {
  'use strict';

  /* ----------------------------- 테마 ----------------------------- */
  // PC(마우스)에서만 커스텀 커서/트레일 적용
  var IS_POINTER = global.matchMedia && global.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // 테마 강조색으로 칠한 화살표 커서 생성 (외곽선으로 라이트/다크 모두 가독)
  function buildArrowCursor(accent) {
    var d = 'M3 2 L3 18.4 L7.3 14.3 L10 20.6 L12.3 19.5 L9.6 13.6 L15.2 13.3 Z';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
      '<path d="' + d + '" fill="rgba(18,16,38,0.30)" transform="translate(1,1.4)"/>' +    // 부드러운 그림자
      '<path d="' + d + '" fill="' + accent + '" stroke="rgba(255,255,255,0.9)" stroke-width="0.8" stroke-linejoin="round"/>' +
      '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 3 2, auto';
  }
  function updateCursor() {
    if (!IS_POINTER) return;
    var accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#7b55ea').trim();
    document.documentElement.style.cursor = buildArrowCursor(accent);
  }

  global.applyTheme = function (theme) {
    var valid = global.Store.VALID_THEMES;
    var t = valid.indexOf(theme) !== -1 ? theme : 'observatory';
    document.documentElement.setAttribute('data-theme', t);
    updateCursor(); // 화살표 커서를 새 테마 강조색으로
    // 모바일 브라우저 상단바 색을 테마 배경색에 맞춤
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      if (bg) meta.setAttribute('content', bg);
    }
  };

  // 마우스를 따라 흩날리는 별 반짝이 트레일
  function initCursorTrail() {
    if (!IS_POINTER) return;
    var host = document.getElementById('cursorFx');
    if (!host) { host = document.createElement('div'); host.id = 'cursorFx'; host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host); }
    var last = 0, seed = 0;
    global.addEventListener('mousemove', function (e) {
      var now = Date.now();
      if (now - last < 26) return; // 스폰 빈도 제한
      last = now;
      seed++;
      var s = document.createElement('span');
      s.className = 'cursor-spark';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      var sz = 7 + (seed % 5);                        // 7~11px (부드러운 글로우)
      s.style.width = sz + 'px'; s.style.height = sz + 'px';
      s.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px'; // 커서 중심 정렬
      var dx = ((seed * 53) % 30) - 15;              // -15~15 좌우 흩어짐
      var dy = 14 + ((seed * 31) % 28);              // 14~42 아래로 흘러내림
      s.style.setProperty('--dx', dx + 'px');
      s.style.setProperty('--dy', dy + 'px');
      host.appendChild(s);
      s.addEventListener('animationend', function () { s.remove(); });
    }, { passive: true });
  }

  /* PWA '홈 화면에 추가' 설치 배너 (Chromium 계열에서 beforeinstallprompt 발생 시) */
  function initInstallPrompt() {
    var deferred = null, banner = null;
    var standalone = global.matchMedia && global.matchMedia('(display-mode: standalone)').matches;
    if (standalone || global.localStorage.getItem('dreamdex.installDismissed')) return;
    function dismiss(remember) {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      banner = null;
      if (remember) { try { global.localStorage.setItem('dreamdex.installDismissed', '1'); } catch (e) {} }
    }
    function show() {
      if (banner || !deferred) return;
      banner = document.createElement('div');
      banner.id = 'installBanner';
      banner.innerHTML =
        '<span class="ib-text">홈 화면에 추가하면 앱처럼 쓸 수 있어요</span>' +
        '<button class="ib-install" type="button">설치</button>' +
        '<button class="ib-close" type="button" aria-label="닫기">✕</button>';
      document.body.appendChild(banner);
      banner.querySelector('.ib-install').onclick = function () {
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.then(function () { deferred = null; dismiss(true); });
      };
      banner.querySelector('.ib-close').onclick = function () { dismiss(true); };
    }
    global.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; show(); });
    global.addEventListener('appinstalled', function () { dismiss(true); });
  }

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
    if (e === 'softdots') {
      // 화면 곳곳에서 부드럽게 명멸하는 점
      for (i = 0; i < 46; i++) {
        var sx = (i * 43 + 11) % 100, sy = (i * 71 + 5) % 100;
        var ssz = ((i % 4) * 1.6 + 3).toFixed(1);
        var sdur = (3 + (i % 5) * 0.8).toFixed(1), sdel = ((i % 8) * 0.5).toFixed(2);
        html += '<span class="fx-softdot" style="left:' + sx + '%;top:' + sy + '%;width:' + ssz + 'px;height:' + ssz +
          'px;--dur:' + sdur + 's;animation-delay:' + sdel + 's"></span>';
      }
    }
    if (e === 'glow') {
      // 천천히 떠다니는 흐릿한 빛무리
      var gcols = ['var(--accent)', 'var(--accent-2)', 'var(--cat-place)', 'var(--cat-situation)', 'var(--accent-2)'];
      for (i = 0; i < 6; i++) {
        var gx = (i * 31 + 8) % 92, gy = (i * 47 + 6) % 86;
        var gsz = 130 + (i % 4) * 60;
        var gdur = (12 + (i % 5) * 2.4).toFixed(1), gdel = (i * -1.6).toFixed(1);
        var gdx = ((i % 2 ? 1 : -1) * (4 + (i % 3) * 2)) + 'vw';
        var gdy = ((i % 2 ? -1 : 1) * (3 + (i % 3) * 2)) + 'vh';
        html += '<span class="fx-glow" style="left:' + gx + '%;top:' + gy + '%;width:' + gsz + 'px;height:' + gsz +
          'px;--gc:' + gcols[i % gcols.length] + ';--dx:' + gdx + ';--dy:' + gdy + ';--dur:' + gdur +
          's;animation-delay:' + gdel + 's"></span>';
      }
    }
    if (e === 'gradient') {
      // 전체 화면을 천천히 일렁이는 색의 막 (한 겹)
      html += '<span class="fx-gradient"></span>';
    }
    if (e === 'particles') {
      // 아래에서 위로 천천히 떠오르는 작은 입자
      for (i = 0; i < 26; i++) {
        var ptx = (i * 39 + 7) % 100;
        var ptsz = ((i % 3) * 1.5 + 2.5).toFixed(1);
        var ptdur = (10 + (i % 6) * 1.8).toFixed(1), ptdel = (i * 0.7).toFixed(1);
        var ptdrift = (((i % 2 ? 1 : -1) * (8 + (i % 4) * 6))) + 'px';
        html += '<span class="fx-particle" style="left:' + ptx + '%;width:' + ptsz + 'px;height:' + ptsz +
          'px;--drift:' + ptdrift + ';--dur:' + ptdur + 's;animation-delay:' + ptdel + 's"></span>';
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
    [/^\/draft\/([^/]+)$/,           'form',       ['draftId']],
    [/^\/drafts$/,                   'drafts',     []],
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
    if (path.indexOf('/new') === 0 || path.indexOf('/edit') === 0 || path.indexOf('/draft') === 0) return 'new';
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

  /* ----------------------------- 잠금(PIN) ----------------------------- */
  var _unlockedIds = {}; // 이번 세션에서 개별 해제된 꿈 id들 (새로고침하면 다시 잠김)

  // 4자리 PIN 패드를 host에 렌더. opts:{ title, sub, onComplete(pin, api) }
  function buildPinPad(host, opts) {
    if (host._pinKey) document.removeEventListener('keydown', host._pinKey);
    var pin = '';
    var keys = '';
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) { keys += '<button class="pin-key" data-k="' + n + '">' + n + '</button>'; });
    keys += '<span class="pin-key-spacer"></span><button class="pin-key" data-k="0">0</button>' +
      '<button class="pin-key pin-del" data-k="del" aria-label="지우기">⌫</button>';
    host.innerHTML =
      '<div class="pin-box">' +
        '<div class="pin-mark">✦</div>' +
        '<h2 class="pin-title">' + opts.title + '</h2>' +
        '<p class="pin-sub" id="pinSub">' + (opts.sub || '') + '</p>' +
        '<div class="pin-dots" id="pinDots"><i></i><i></i><i></i><i></i></div>' +
        '<div class="pin-keys">' + keys + '</div>' +
      '</div>';
    var dots = host.querySelectorAll('#pinDots i');
    var box = host.querySelector('.pin-box');
    var sub = host.querySelector('#pinSub');
    function paint() { for (var i = 0; i < 4; i++) dots[i].classList.toggle('on', i < pin.length); }
    var api = {
      reset: function (s) { pin = ''; paint(); if (s != null) sub.textContent = s; },
      shake: function (s) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); if (s != null) sub.textContent = s; }
    };
    function push(k) {
      if (k === 'del') { pin = pin.slice(0, -1); paint(); return; }
      if (pin.length >= 4) return;
      pin += k; paint();
      if (pin.length === 4) setTimeout(function () { opts.onComplete(pin, api); }, 130);
    }
    host.querySelector('.pin-keys').addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (b) push(b.getAttribute('data-k'));
    });
    host._pinKey = function (e) {
      if (/^[0-9]$/.test(e.key)) push(e.key);
      else if (e.key === 'Backspace') push('del');
    };
    document.addEventListener('keydown', host._pinKey);
  }
  function destroyPinPad(host) { if (host && host._pinKey) { document.removeEventListener('keydown', host._pinKey); host._pinKey = null; } }

  // 잠긴 일기 열람용 PIN 확인 모달 — onOk()는 통과 시 호출. id는 해당 꿈만 개별 해제.
  function requirePin(onOk, id) {
    if (id && _unlockedIds[id]) { onOk(); return; }            // 이미 이 꿈을 해제했음
    if (!global.Store.hasPin()) { if (id) _unlockedIds[id] = true; onOk(); return; } // PIN 미설정 → 바로 열기
    var host = document.createElement('div'); host.className = 'modal-host';
    var inner = document.createElement('div'); inner.className = 'modal pin-modal';
    host.appendChild(inner); document.body.appendChild(host);
    function close() { destroyPinPad(inner); if (host.parentNode) host.parentNode.removeChild(host); }
    buildPinPad(inner, { title: '잠금 해제', sub: 'PIN을 입력하세요', onComplete: function (pin, api) {
      if (global.Store.verifyPin(pin)) { if (id) _unlockedIds[id] = true; close(); onOk(); }
      else { api.shake('PIN이 일치하지 않아요'); setTimeout(function () { api.reset(); }, 400); }
    }});
    var cl = document.createElement('button'); cl.className = 'pin-close'; cl.type = 'button';
    cl.textContent = '✕'; cl.setAttribute('aria-label', '닫기');
    cl.onclick = close;
    inner.querySelector('.pin-box').appendChild(cl);
    host.addEventListener('click', function (e) { if (e.target === host) close(); });
  }

  // 일기 잠금용 PIN 설정/확인
  global.Lock = {
    hasPin: function () { return global.Store.hasPin(); },
    isUnlocked: function (id) { return !!_unlockedIds[id]; },
    requirePin: requirePin,
    // onDone(saved) — PIN을 새로 설정(두 번 입력 확인). 앱 전체는 잠그지 않음.
    setPin: function (onDone) {
      var host = document.createElement('div'); host.className = 'modal-host';
      var inner = document.createElement('div'); inner.className = 'modal pin-modal';
      host.appendChild(inner); document.body.appendChild(host);
      var first = null;
      function close(saved) { destroyPinPad(inner); if (host.parentNode) host.parentNode.removeChild(host); if (onDone) onDone(!!saved); }
      function step(title, sub) {
        buildPinPad(inner, { title: title, sub: sub, onComplete: function (pin, api) {
          if (first === null) { first = pin; step('PIN 확인', '한 번 더 입력하세요'); }
          else if (pin === first) { global.Store.setPin(pin); close(true); }
          else { first = null; api.shake('일치하지 않아요'); setTimeout(function () { step('PIN 설정', '4자리 숫자를 입력하세요'); }, 450); }
        }});
        var cl = document.createElement('button'); cl.className = 'pin-close'; cl.type = 'button';
        cl.textContent = '✕'; cl.setAttribute('aria-label', '닫기');
        cl.onclick = function () { close(false); };
        inner.querySelector('.pin-box').appendChild(cl);
      }
      host.addEventListener('click', function (e) { if (e.target === host) close(false); });
      step('PIN 설정', '4자리 숫자를 입력하세요');
    }
  };

  /* 폼 이탈 가드 — 작성 중 다른 화면으로 나가려 하면 임시보관 안내 후 진행 여부 결정 */
  var _leaveGuard = null;      // { path, check(target) -> Promise<bool: 나가도 됨> }
  var _suppressRender = false; // 가드가 해시를 되돌릴 때 생기는 hashchange 1회 무시
  global.setLeaveGuard = function (path, check) { _leaveGuard = { path: path, check: check }; };
  global.clearLeaveGuard = function () { _leaveGuard = null; };

  function render() {
    var path = currentPath();

    // 가드가 해시를 되돌리며 발생시킨 hashchange는 무시
    if (_suppressRender) { _suppressRender = false; return; }
    // 가드 대상 화면에서 다른 경로로 이동 시도 → 되돌리고 안내
    if (_leaveGuard && path !== _leaveGuard.path) {
      var g = _leaveGuard, target = path;
      _suppressRender = true;
      global.location.hash = g.path; // 폼 화면 유지 (재렌더 없음)
      g.check(target).then(function (allow) {
        if (allow) { _leaveGuard = null; global.location.hash = target; }
      });
      return;
    }

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
    var appEl = document.querySelector('.app');
    // 홈: 대시보드 전용 레이아웃 (한 화면에 맞춤, 스크롤 없음)
    var isDashboard = path === '/' || path === '';
    // 아카이브·도감·설정: 일반 .main 패딩 유지 + 한 화면 고정 셸에서 메인만 내부 스크롤
    var isScrollShell = path.indexOf('/dreams') === 0 || path === '/settings' || path.indexOf('/dex') === 0;
    main.classList.toggle('main-dashboard', isDashboard);
    appEl.classList.toggle('app-dashboard', isDashboard);
    main.classList.toggle('main-scroll', isScrollShell);
    appEl.classList.toggle('app-scroll', isScrollShell);
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
  /* ----------------------------- 클라우드 동기화 ----------------------------- */
  // 구글 로그인 시: 내 계정 칸을 실시간 구독(원격 최신이면 반영) + 로컬 변경 시 디바운스 업로드.
  // 최신 판별은 payload.updatedAt vs 로컬 syncStamp (마지막 저장 우선).
  var _cloudUnwatch = null, _cloudTimer = null;
  function cloudPushNow() {
    if (!global.Cloud || !global.Cloud.isReady() || !global.Cloud.currentUser()) return;
    var data = global.Store.exportSyncData();
    global.Cloud.push(data).then(function () {
      global.Store.setSyncStamp(data.updatedAt);
    }).catch(function () { /* 일시 오류 → 다음 변경 때 재시도 */ });
  }
  function cloudSchedulePush() {
    if (_cloudTimer) clearTimeout(_cloudTimer);
    _cloudTimer = setTimeout(cloudPushNow, 1200);
  }
  // 실시간 구독 콜백: 원격 값으로 로컬을 맞추거나(원격이 최신), 로컬을 올림(로컬이 최신).
  function cloudApply(remote) {
    if (!remote || typeof remote !== 'object' || !Array.isArray(remote.dreams)) {
      cloudPushNow(); // 클라우드 비어있음(첫 로그인) → 로컬을 올림
      return;
    }
    var rStamp = remote.updatedAt || 0;
    var lStamp = global.Store.getSyncStamp();
    if (rStamp > lStamp) {
      global.Store.importSyncData(remote);
      global.Store.setSyncStamp(rStamp);
      render(); // 새 데이터 즉시 반영
    } else if (rStamp < lStamp) {
      cloudPushNow(); // 로컬이 더 최신 → 원격 갱신
    }
  }
  function initCloud() {
    if (!global.Cloud || !global.Store.onChange) return;
    global.Store.onChange(cloudSchedulePush);
    global.Cloud.onUser(function (u) {
      if (_cloudUnwatch) { _cloudUnwatch(); _cloudUnwatch = null; }
      if (u) { _cloudUnwatch = global.Cloud.watch(cloudApply); }
      render(); // 로그인/로그아웃 시 화면(설정 등) 갱신
    });
  }

  function boot() {
    var st = global.Store.getSettings();
    global.applyTheme(st.theme);
    global.applyPattern(st.pattern);
    global.applyEffect(st.effect);
    global.addEventListener('hashchange', render);
    initCursorTrail();
    initInstallPrompt();
    render();
    initCloud();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
