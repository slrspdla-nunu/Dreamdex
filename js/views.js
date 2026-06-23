/* =========================================================================
 * Dreamdex — 화면 렌더링 (Views) + 공용 UI 유틸
 * ========================================================================= */
(function (global) {
  'use strict';

  var Store = global.Store;
  var Classify = global.Classify;
  var DICT = global.DREAM_DICTIONARY;

  /* ============================ 공용 UI ============================ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  // 검색어 하이라이트 — 이스케이프 후 일치 부분을 <mark>로 감쌈(대소문자 무시)
  function hl(text, q) {
    var s = esc(text);
    q = (q || '').trim();
    if (!q) return s;
    var pat = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try { return s.replace(new RegExp('(' + pat + ')', 'gi'), '<mark class="hl">$1</mark>'); }
    catch (e) { return s; }
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length < 3) return iso;
    return p[0] + '년 ' + Number(p[1]) + '월 ' + Number(p[2]) + '일';
  }
  function fmtShort(iso) {
    var p = (iso || '').split('-');
    if (p.length < 3) return iso || '';
    return Number(p[1]) + '.' + Number(p[2]);
  }

  function go(path) { global.location.hash = path; }

  function emotionBadge(id) {
    var e = Store.emotionById(id);
    if (!e) return '';
    return '<span class="em-badge" style="color:' + e.color + ';border-color:' + e.color +
      '44;background:' + e.color + '1a">' + global.Icons.emotion(id, 14) + e.label + '</span>';
  }

  // 토스트
  function toast(msg, opts) {
    opts = opts || {};
    var host = document.getElementById('toastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toastHost'; host.className = 'toast-host';
      document.body.appendChild(host);
    }
    var t = document.createElement('div');
    t.className = 'toast' + (opts.glow ? ' glow' : '');
    t.innerHTML = msg;
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .4s, transform .4s';
      t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 420);
    }, opts.duration || 2600);
  }

  // 확인 모달
  function confirmModal(o) {
    return new Promise(function (resolve) {
      var host = document.createElement('div');
      host.className = 'modal-host';
      host.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true">' +
        '<h3>' + esc(o.title) + '</h3>' +
        '<p>' + esc(o.message) + '</p>' +
        '<div class="modal-actions">' +
        '<button class="btn ghost" data-act="cancel">' + esc(o.cancel || '취소') + '</button>' +
        '<button class="btn ' + (o.danger ? 'danger' : 'primary') + '" data-act="ok">' +
        esc(o.confirm || '확인') + '</button>' +
        '</div></div>';
      document.body.appendChild(host);
      function close(v) {
        document.removeEventListener('keydown', onKey);
        if (host.parentNode) host.parentNode.removeChild(host);
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') close(false); }
      document.addEventListener('keydown', onKey);
      host.addEventListener('click', function (e) {
        if (e.target === host) close(false);
        var act = e.target.getAttribute('data-act');
        if (act === 'ok') close(true);
        if (act === 'cancel') close(false);
      });
    });
  }

  // 임시보관 안내 모달 (3선택): 'save' | 'discard' | 'stay'
  function draftPrompt() {
    return new Promise(function (resolve) {
      var host = document.createElement('div');
      host.className = 'modal-host';
      host.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true">' +
        '<h3>작성 중인 꿈을 임시 보관할까요?</h3>' +
        '<p>임시보관함에 저장하면 나중에 이어서 작성할 수 있어요.</p>' +
        '<div class="modal-actions modal-actions-3">' +
        '<button class="btn ghost" data-act="stay">계속 작성</button>' +
        '<button class="btn ghost" data-act="discard">보관 안 함</button>' +
        '<button class="btn primary" data-act="save">임시 보관</button>' +
        '</div></div>';
      document.body.appendChild(host);
      function close(v) {
        document.removeEventListener('keydown', onKey);
        if (host.parentNode) host.parentNode.removeChild(host);
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') close('stay'); }
      document.addEventListener('keydown', onKey);
      host.addEventListener('click', function (e) {
        if (e.target === host) { close('stay'); return; }
        var act = e.target.getAttribute('data-act');
        if (act) close(act);
      });
    });
  }

  /* ===================== 꿈 내보내기/공유 시트 ===================== */
  function openShareSheet(dream) {
    var host = document.createElement('div');
    host.className = 'modal-host';
    host.innerHTML =
      '<div class="modal share-sheet" role="dialog" aria-modal="true">' +
      '<h3>이 꿈 내보내기</h3>' +
      '<div class="share-opts">' +
        (global.navigator && global.navigator.share
          ? '<button class="btn" data-act="share">' + global.Icons.ui('arrow', { size: 16 }) + '<span>공유</span></button>' : '') +
        '<button class="btn" data-act="text">' + global.Icons.ui('archive', { size: 16 }) + '<span>텍스트 복사</span></button>' +
        '<button class="btn" data-act="image">' + global.Icons.ui('star', { size: 16 }) + '<span>이미지로 저장</span></button>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn ghost" data-act="close">닫기</button></div>' +
      '</div>';
    document.body.appendChild(host);
    function close() {
      document.removeEventListener('keydown', onKey);
      if (host.parentNode) host.parentNode.removeChild(host);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    host.addEventListener('click', function (e) {
      if (e.target === host) { close(); return; }
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'close') { close(); }
      else if (act === 'share') { nativeShareDream(dream); close(); }
      else if (act === 'text') { copyDreamText(dream); close(); }
      else if (act === 'image') { saveDreamImage(dream); close(); }
    });
  }

  // 네이티브 공유 (모바일) — 텍스트 공유. 사용자 제스처 안에서 동기 호출(이미지 비동기 생성은 제스처가 끊겨 실패할 수 있어 제외).
  function nativeShareDream(dream) {
    var nav = global.navigator;
    if (!nav || !nav.share) return;
    nav.share({ title: dream.title || '꿈', text: global.Share.toText(dream) })
      .catch(function (err) { if (err && err.name !== 'AbortError') toast(tmsg('warn', '공유하지 못했어요.')); });
  }

  function copyDreamText(dream) {
    var txt = global.Share.toText(dream);
    function done() { toast(tmsg('check', '텍스트를 복사했어요.')); }
    if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
    } else { fallbackCopy(txt); done(); }
  }
  function fallbackCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }
  function saveDreamImage(dream) {
    global.Share.toImage(dream).then(function (blob) {
      if (!blob) { toast(tmsg('warn', '이미지를 만들지 못했어요.')); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var safe = (dream.title || '꿈').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || '꿈';
      a.href = url; a.download = '꿈-' + safe + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast(tmsg('check', '이미지를 저장했어요.'));
    });
  }

  /* ===================== 키워드 표시 도우미 ===================== */
  // 꿈에 저장된 keyword id 중 현재 해금 상태에서 "보여도 되는" 것만 이름으로 변환
  function visibleKeywords(keywords, unlock) {
    var out = [];
    DICT.categories.forEach(function (cat) {
      var ids = (keywords && keywords[cat]) || [];
      ids.forEach(function (id) {
        var item = Classify.findItem(cat, id);
        if (!item) return;
        if (item.tier === 'rare' && !unlock.rareUnlocked) return;
        if (item.tier === 'hidden' && !unlock.hiddenUnlocked) return;
        out.push({ cat: cat, id: id, name: item.name });
      });
    });
    return out;
  }

  function kwChipsHtml(keywords, unlock, clickable, limit, withIcon) {
    var list = visibleKeywords(keywords, unlock);
    if (!list.length) return '';
    var extra = 0;
    if (limit && list.length > limit) { extra = list.length - limit; list = list.slice(0, limit); }
    var chips = list.map(function (k) {
      var attr = clickable ? ' data-kw="' + k.cat + ':' + k.id + '"' : '';
      var ic = withIcon ? global.Icons.keyword(k.cat, k.id, 14) : '';
      return '<span class="kw-chip cat-' + k.cat + '"' + attr + '>' + ic + esc(k.name) + '</span>';
    }).join('');
    if (extra) chips += '<span class="kw-more" aria-label="키워드 ' + extra + '개 더">' + global.Icons.ui('plus', { size: 13, sw: 2.4 }) + '</span>';
    return '<div class="kw-chips">' + chips + '</div>';
  }

  /* ============================ 온보딩 ============================ */
  function onboard(c) {
    document.getElementById('appShell').style.display = 'none';
    var host = document.getElementById('onboardHost');
    host.style.display = 'block';
    var cloud = global.Cloud;
    var canLogin = !!(cloud && cloud.isReady && cloud.isReady());
    var gIcon = '<svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C39.9 35.6 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>';
    host.innerHTML =
      '<div class="onboard"><div class="card onboard-card view-enter">' +
      '<div class="big-logo">' + global.Icons.logo(40) + '</div>' +
      '<h1>Dreamdex</h1>' +
      '<div class="quote">"꿈은 사라지는 기록이 아니라, 수집 가능한 데이터이다."</div>' +
      '<p>당신의 무의식을 기록하면 꿈 속 장소·인물·상황이 자동으로 분류되어 나만의 도감으로 채워집니다.</p>' +
      (canLogin
        ? '<button class="btn primary onboard-btn" id="googleBtn"><span class="ob-g">' + gIcon + 'Google로 시작하기</span></button>' +
          '<p class="onboard-hint">로그인하면 모든 기기에서 같은 꿈을 볼 수 있어요.</p>' +
          '<div class="onboard-or"><span>또는</span></div>'
        : '') +
      '<div class="field" style="text-align:left">' +
      '<label for="nick">어떻게 불러드릴까요? <span style="color:var(--text-faint)">(선택)</span></label>' +
      '<input id="nick" class="input" placeholder="닉네임" maxlength="20">' +
      '</div>' +
      '<button class="btn ' + (canLogin ? 'ghost' : 'primary') + ' onboard-btn" id="startBtn">' + (canLogin ? '로그인 없이 시작' : '꿈 기록 시작하기') + '</button>' +
      '</div></div>';

    var gb = document.getElementById('googleBtn');
    if (gb) gb.onclick = function () {
      gb.disabled = true;
      // 성공 시 Cloud.onUser → onboarded=true → render()가 앱으로 전환(여기서 처리 불필요)
      cloud.signIn().catch(function (err) {
        gb.disabled = false;
        toast(tmsg('warn', esc((err && err.message) || '로그인에 실패했어요.')));
      });
    };
    document.getElementById('startBtn').onclick = function () {
      var nick = document.getElementById('nick').value.trim();
      Store.saveSettings({ onboarded: true, nickname: nick });
      host.style.display = 'none'; host.innerHTML = '';
      document.getElementById('appShell').style.display = '';
      go('/');
    };
  }

  /* ============================ 대시보드 ============================ */
  function dashboard(c) {
    var dreams = Store.getDreams();
    var dex = Classify.buildDex(dreams);
    var stats = Classify.buildStats(dreams);
    var settings = Store.getSettings();
    var next = Classify.nextMilestone(dreams.length);
    var hello = settings.nickname ? esc(settings.nickname) + '님의 ' : '';
    var todayIso = new Date().toISOString().slice(0, 10);
    var hero =
      '<section class="dd-hero view-enter">' +
        '<div class="dd-hero-art" aria-hidden="true">' + global.Icons.skyBand() + '</div>' +
        '<div class="dd-hero-copy">' +
          '<div class="dd-hero-date">' + fmtDate(todayIso) + '</div>' +
          '<h1>' + hello + '보관소</h1>' +
          '<p>오늘도 꿈의 세계를 탐험해볼까요?</p>' +
        '</div>' +
      '</section>';

    if (dreams.length === 0) {
      c.innerHTML =
        '<div class="dream-dashboard">' + hero +
        '<button class="dd-record-cta view-enter" data-go="/new">' +
          '<span class="dd-cta-icon">' + global.Icons.ui('pen', { size: 19 }) + '</span>' +
          '<span class="dd-cta-copy"><b>오늘은 어떤 꿈을 꾸셨나요?</b><small>잊기 전에 오늘의 꿈을 기록해보세요</small></span>' +
          '<span class="dd-cta-arrow">' + global.Icons.ui('arrow', { size: 20 }) + '</span>' +
        '</button>' +
        '<div class="dd-empty card view-enter"><div class="empty-art">' + global.Icons.empty('home') + '</div>' +
          '<h3>첫 번째 꿈을 기록해보세요</h3>' +
          '<p>꿈을 기록하면 그 속의 장소·인물·상황이<br class="br-m">자동으로 도감에 수집됩니다.<br>' +
          '둘러보고 싶다면 예시 데이터를 불러와<br class="br-m">모든 기능을 확인할 수 있습니다.</p>' +
          '<div class="empty-actions">' +
            '<button class="btn primary" data-go="/new">＋ 첫 꿈 기록하기</button>' +
            '<button class="btn ghost" id="sampleBtnDash">예시 데이터 보기</button>' +
          '</div></div></div>';
      var sb = document.getElementById('sampleBtnDash');
      if (sb) sb.onclick = function () {
        var n = loadSampleData();
        toast(tmsg('check', '예시 꿈 ' + n + '개를 불러왔습니다.'));
        setTimeout(function () { go('/'); global.location.reload(); }, 600);
      };
      return;
    }

    var sorted = dreams.slice().sort(byNewest);
    var feat = sorted[0];
    var rest = sorted.slice(1, 5);
    // 슬라이드 1장 빌더 (가장 최근의 꿈 / 추억) — 기존 dd-feature 레이아웃 재사용
    function featSlide(d, label) {
      var emo = Store.emotionById(d.emotion) || {};
      var hidden = isHidden(d);
      var ex = hidden ? 'PIN을 입력하면 볼 수 있어요' : (d.content || '').slice(0, 200);
      return '<div class="dd-slide dd-feature" data-dream-id="' + d.id + '">' +
        '<div class="dd-feature-copy">' +
          '<div class="dd-panel-title">' + global.Icons.ui(hidden ? 'lock' : 'spark', { size: 15 }) + '<span>' + esc(label) + '</span></div>' +
          '<h2>' + (hidden ? '잠긴 꿈' : esc(d.title)) + '</h2>' +
          '<p>' + esc(ex) + (!hidden && d.content.length > 200 ? '…' : '') + '</p>' +
          (hidden ? '' : (kwChipsHtml(d.keywords, dex.unlock, false) || '')) +
          '<div class="dd-feature-meta">' + fmtDate(d.date) + (hidden ? '' : ' · ' + esc(emo.label || '')) + '</div>' +
        '</div>' +
        '<div class="dd-feature-art" aria-hidden="true">' + global.Icons.dreamScene() + '</div>' +
      '</div>';
    }
    var slides = [featSlide(feat, '가장 최근의 꿈')];
    var mem = memoryDream(dreams);
    if (mem && mem.dream.id !== feat.id) slides.push(featSlide(mem.dream, mem.label));
    var dots = slides.length > 1
      ? '<div class="dd-slide-dots" id="ddDots">' + slides.map(function (_, i) {
          return '<button class="dd-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '" aria-label="슬라이드 ' + (i + 1) + '"></button>';
        }).join('') + '</div>'
      : '';
    var featHtml =
      '<article class="dd-panel dd-feature-slider">' +
        '<div class="dd-slides" id="ddSlides">' + slides.join('') + '</div>' + dots +
      '</article>';

    var restHtml = rest.length
      ? '<div class="dd-recent-list">' + rest.map(compactRow).join('') + '</div>'
      : '<div class="dd-panel-empty">최근 기록이 없습니다.</div>';

    var catRows = DICT.categories.map(function (cat) {
      var info = dex[cat];
      return '<div class="dd-analysis-row">' +
        '<div class="dd-analysis-label"><span>' + info.label + '</span><b>' + info.discovered + ' / ' + info.total + '</b></div>' +
        '<div class="dd-analysis-track"><span class="cat-' + cat + '" style="width:' + info.percent + '%"></span></div>' +
      '</div>';
    }).join('');
    var nextLine = next
      ? '<span class="rail-next-n">' + next.remaining + '개</span> 더 기록하면 · ' + esc(next.milestone.title)
      : '모든 마일스톤을 해금했습니다';
    var collectionCard =
      '<section class="dd-panel dd-analysis">' +
        '<div class="dd-panel-head"><div class="dd-panel-title">' + global.Icons.ui('stats', { size: 16 }) + '<span>수집 현황</span></div>' +
        '<span class="dd-period">전체 기간</span></div>' +
        '<div class="dd-analysis-body">' +
          '<div class="dd-donut" style="--pct:' + dex.overall.percent + '"><div><b>' + dex.overall.percent + '%</b><span>수집률</span></div></div>' +
          '<div class="dd-analysis-rows">' + catRows + '</div>' +
        '</div>' +
        '<div class="dd-analysis-next">' + nextLine + '</div>' +
      '</section>';

    var trendCard =
      '<section class="dd-panel dd-emotion">' +
        '<div class="dd-panel-head"><div class="dd-panel-title">' + global.Icons.ui('moon', { size: 16 }) + '<span>감정 흐름</span></div>' +
        '<span class="dd-period">최근 ' + Math.min(dreams.length, 18) + '개</span></div>' +
        dashboardEmotionBars(stats) +
      '</section>';

    var wroteToday = dreams.some(function (d) { return d.date === todayIso; });
    var todayCta =
      '<button class="dd-record-cta view-enter' + (wroteToday ? ' done' : '') + '" data-go="/new">' +
        '<span class="dd-cta-icon">' + global.Icons.ui(wroteToday ? 'check' : 'pen', { size: 19 }) + '</span>' +
        '<span class="dd-cta-copy">' +
          '<b>' + (wroteToday ? '오늘의 꿈을 기록했어요' : '오늘은 어떤 꿈을 꾸셨나요?') + '</b>' +
          '<small>' + (wroteToday ? '기억나는 꿈이 더 있다면 마저 남겨보세요' : '잊기 전에 오늘의 꿈을 기록해보세요') + '</small>' +
        '</span>' +
        '<span class="dd-cta-arrow">' + global.Icons.ui('arrow', { size: 20 }) + '</span>' +
      '</button>';

    c.innerHTML =
      '<div class="dream-dashboard">' +
      hero +
      todayCta +
      '<div class="dd-grid view-enter">' +
        featHtml +
        collectionCard +
        '<section class="dd-panel dd-recent">' +
          '<div class="dd-panel-head"><div class="dd-panel-title"><span>최근 기록</span></div>' +
          '<button class="dd-text-btn" id="moreBtn">전체 보기 ' + global.Icons.ui('arrow', { size: 14 }) + '</button></div>' +
          restHtml +
        '</section>' +
        trendCard +
      '</div>' +
      '<section class="dd-message view-enter">' +
        '<div class="dd-message-art" aria-hidden="true">' + global.Icons.dreamScene() + '</div>' +
        '<span class="dd-message-icon">' + global.Icons.ui('spark', { size: 17 }) + '</span>' +
        '<span><b>꿈은 사라지는 기록이 아니라, 수집 가능한 데이터입니다.</b>' +
        '<small>당신의 무의식을 기록하면 나만의 도감으로 채워집니다.</small></span>' +
      '</section>' +
      '</div>';

    var mb = document.getElementById('moreBtn');
    if (mb) mb.onclick = function () { go('/dreams'); };
    setupFeatureSlider();
  }

  // 가장 최근의 꿈 ↔ 추억 자동 슬라이드 (몇 초마다 전환)
  var _ddSlideTimer = null;
  function setupFeatureSlider() {
    if (_ddSlideTimer) { clearInterval(_ddSlideTimer); _ddSlideTimer = null; }
    var track = document.getElementById('ddSlides');
    if (!track) return;
    var n = track.children.length;
    if (n < 2) return;
    var dotsWrap = document.getElementById('ddDots');
    var i = 0;
    function showAt(k) {
      i = (k + n) % n;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      if (dotsWrap) Array.prototype.forEach.call(dotsWrap.children, function (d, j) { d.classList.toggle('active', j === i); });
    }
    function restart() {
      if (_ddSlideTimer) clearInterval(_ddSlideTimer);
      _ddSlideTimer = setInterval(function () {
        if (!document.body.contains(track)) { clearInterval(_ddSlideTimer); _ddSlideTimer = null; return; }
        showAt(i + 1);
      }, 5000);
    }
    if (dotsWrap) dotsWrap.addEventListener('click', function (e) {
      var dot = e.target.closest('[data-slide]');
      if (dot) { e.stopPropagation(); showAt(+dot.getAttribute('data-slide')); restart(); }
    });
    restart();
  }

  // 대시보드 압축 행
  function compactRow(d) {
    var e = Store.emotionById(d.emotion) || {};
    var hidden = isHidden(d);
    return '<button class="recent-row" data-dream-id="' + d.id + '">' +
      '<span class="rr-thumb" style="--thumb-color:' + (e.color || '#9180e8') + '">' +
        (hidden ? global.Icons.ui('lock', { size: 15 }) : global.Icons.emotion(d.emotion, 16)) + '</span>' +
      '<span class="rr-main"><span class="rr-title">' + (hidden ? '잠긴 꿈' : esc(d.title)) + '</span>' +
      '<span class="rr-emotion" style="color:' + (e.color || '#9180e8') + '">' + (hidden ? '' : esc(e.label || '')) + '</span></span>' +
      '<span class="rr-date">' + fmtShort(d.date) + '</span>' +
      '<span class="rr-arrow">' + global.Icons.ui('arrow', { size: 14 }) + '</span>' +
      '</button>';
  }

  // 추억 다시보기 — 과거 꿈 하나를 결정적으로 골라 재등장
  function memoryDream(dreams) {
    if (dreams.length < 4) return null;
    var today = new Date();
    var y = today.getFullYear();
    var mmdd = pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());
    // 후보1: 같은 월·일의 과거 연도 꿈("N년 전 오늘")
    var anniv = dreams.filter(function (d) {
      return (d.date || '').slice(5, 10) === mmdd && (d.date || '').slice(0, 4) < String(y);
    }).sort(byNewest);
    if (anniv.length) {
      return { dream: anniv[0], label: (y - +anniv[0].date.slice(0, 4)) + '년 전 오늘' };
    }
    // 후보2: 21일 이상 지난 꿈 중 오늘 날짜 기반 결정적 선택
    var cutoff = new Date(today); cutoff.setDate(today.getDate() - 21);
    var cutIso = cutoff.toISOString().slice(0, 10);
    var old = dreams.filter(function (d) { return (d.date || '') <= cutIso; }).sort(byNewest);
    if (!old.length) return null;
    var doy = Math.floor((today - new Date(y, 0, 0)) / 86400000);
    return { dream: old[doy % old.length], label: '이런 꿈도 꿨어요' };
  }
  function dashboardEmotionBars(stats) {
    var max = 1;
    Store.EMOTIONS.forEach(function (e) {
      max = Math.max(max, stats.emotionCount[e.id] || 0);
    });
    return '<div class="dd-bars">' + Store.EMOTIONS.map(function (e) {
      var value = stats.emotionCount[e.id] || 0;
      var height = Math.max(14, Math.round((value / max) * 100));
      return '<div class="dd-bar-item"><div class="dd-bar-track"><span style="height:' + height +
        '%;background:' + e.color + '"></span></div><b>' + esc(e.label) + '</b><small>' + value + '</small></div>';
    }).join('') + '</div>';
  }

  // 감정 흐름 미니차트 (감정 밝기(valence)를 높이로 인코딩)
  var EMO_VALENCE = { happy: 1, wonder: 0.82, longing: 0.6, sadness: 0.45, anxiety: 0.4, fear: 0.28 };
  function emotionTrendHtml(dreams) {
    var rec = dreams.slice().sort(byNewest).slice(0, 18).reverse(); // 오래된→최근
    var bars = rec.map(function (d) {
      var e = Store.emotionById(d.emotion) || {};
      var v = EMO_VALENCE[d.emotion] != null ? EMO_VALENCE[d.emotion] : 0.5;
      var h = Math.round(v * 66 + 34);
      return '<span class="trend-bar" title="' + esc(fmtShort(d.date)) + ' · ' + esc(e.label || '') +
        '" style="height:' + h + '%;--bar:' + (e.color || 'var(--accent)') + '"></span>';
    }).join('');
    return '<div class="trend-bars">' + bars + '</div>';
  }

  /* ============================ 작성/수정 ============================ */
  function form(c, params) {
    var editing = params && params.id ? Store.getDream(params.id) : null;
    var draftId = (params && params.draftId) || null;
    var loadedDraft = draftId ? Store.getDraft(draftId) : null;
    var today = new Date().toISOString().slice(0, 10);
    var d = editing || loadedDraft || { title: '', date: today, content: '', emotion: '' };
    var currentDraftId = loadedDraft ? loadedDraft.id : null;
    var routePath = (global.location.hash || '').replace(/^#/, '') || '/';
    var draftCount = Store.getDrafts().length;
    var locked = !!d.locked;

    var chips = Store.EMOTIONS.map(function (e) {
      var sel = d.emotion === e.id ? ' selected' : '';
      return '<button type="button" class="emotion-chip' + sel + '" data-emo="' + e.id +
        '" style="--em-color:' + e.color + ';' + (sel ? 'color:' + e.color : '') + '">' +
        global.Icons.emotion(e.id, 16) + e.label + '</button>';
    }).join('');

    c.innerHTML =
      '<div class="form-head-row">' +
        head(editing ? '꿈 수정' : '꿈 기록', '기억이 흐려지기 전에 남겨두세요.') +
        (editing ? '' :
          '<button type="button" class="btn ghost drafts-link" id="draftsBtn" aria-label="임시보관함">' +
            global.Icons.ui('archive', { size: 15 }) + '<span class="drafts-label">임시보관함</span>' +
            (draftCount ? '<span class="draft-count">' + draftCount + '</span>' : '') + '</button>') +
      '</div>' +
      '<div class="card view-enter" style="padding:28px;max-width:760px">' +
      '<form id="dreamForm">' +
        '<div class="field"><label for="f-title">제목</label>' +
          '<input id="f-title" class="input" maxlength="60" placeholder="꿈에 제목을 붙인다면?" value="' + esc(d.title) + '"></div>' +
        '<div class="field" style="max-width:240px"><label>날짜</label>' +
          '<div class="cal-toggle-wrap date-field" id="dateWrap">' +
            '<button type="button" class="input date-input" id="dateBtn">' +
              '<span id="dateLabel"></span>' + global.Icons.ui('calendar', { size: 16 }) +
            '</button>' +
            '<div class="cal cal-pop date-pop" id="dateCal" hidden></div>' +
          '</div>' +
          '<input type="hidden" id="f-date" value="' + esc(d.date) + '"></div>' +
        '<div class="field"><label>감정 <span style="color:var(--text-faint)">(하나 선택)</span></label>' +
          '<div class="emotion-row" id="emoRow">' + chips + '</div></div>' +
        '<div class="field"><label for="f-content">꿈 내용</label>' +
          '<div class="textarea-wrap">' +
            '<textarea id="f-content" class="textarea" maxlength="4000" placeholder="꿈에서 본 장소, 만난 사람, 일어난 일을 자유롭게 적어보세요. 자세할수록 더 많은 키워드가 수집됩니다.">' + esc(d.content) + '</textarea>' +
            '<span class="char-count" id="charCount">0자</span>' +
          '</div>' +
          '<div class="form-hint">' + global.Icons.ui('spark', { size: 13 }) + '<span>저장하면 내용 속 장소·인물·상황이 자동으로 도감에 등록됩니다.</span></div></div>' +
        '<div class="form-actions">' +
          '<button type="submit" class="btn primary" id="submitBtn">' + (editing ? '수정 저장' : '기록하고 수집하기') + '</button>' +
          '<button type="button" class="btn ghost" id="cancelBtn">취소</button>' +
          '<button type="button" class="btn ghost lock-toggle' + (locked ? ' on' : '') + '" id="lockBtn" style="margin-left:auto" aria-pressed="' + locked + '">' +
            '<span class="lb-ic">' + global.Icons.ui(locked ? 'lock' : 'lockOpen', { size: 15 }) + '</span>' +
            '<span class="lb-tx">' + (locked ? '잠금됨' : '잠금') + '</span></button>' +
        '</div>' +
      '</form></div>';

    var selectedEmo = d.emotion || '';
    var emoRow = document.getElementById('emoRow');
    var titleEl = document.getElementById('f-title');
    var contentEl = document.getElementById('f-content');
    var dateEl = document.getElementById('f-date');
    var submitBtn = document.getElementById('submitBtn');
    var charCount = document.getElementById('charCount');
    var formEl = document.getElementById('dreamForm');

    // 글자 수 + 제출 가능 여부 갱신
    function refresh() {
      var n = contentEl.value.length;
      charCount.textContent = n.toLocaleString() + '자';
      charCount.classList.toggle('warn', n > 3600);
      submitBtn.disabled = !(contentEl.value.trim() && selectedEmo);
    }
    contentEl.addEventListener('input', refresh);

    function selectEmo(btn) {
      selectedEmo = btn.getAttribute('data-emo');
      emoRow.querySelectorAll('.emotion-chip').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('selected', on);
        b.style.color = on ? Store.emotionById(b.getAttribute('data-emo')).color : '';
      });
      refresh();
    }
    emoRow.addEventListener('click', function (e) {
      var btn = e.target.closest('.emotion-chip');
      if (btn) selectEmo(btn);
    });
    // 감정 칩 좌우 방향키 이동 + 선택
    emoRow.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var chips = Array.prototype.slice.call(emoRow.querySelectorAll('.emotion-chip'));
      var cur = chips.indexOf(document.activeElement);
      if (cur === -1) cur = chips.findIndex(function (b) { return b.classList.contains('selected'); });
      var next = (cur + (e.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length;
      e.preventDefault();
      chips[next].focus();
      selectEmo(chips[next]);
    });

    // 날짜 — 아카이브와 동일한 월간 달력 팝업 (네이티브 date 입력 대체)
    var dateCal = document.getElementById('dateCal');
    var dateBtn = document.getElementById('dateBtn');
    var dateLabel = document.getElementById('dateLabel');
    var dateCalMonth = (dateEl.value || today).slice(0, 7);
    function fmtDateLabel(iso) {
      var p = (iso || '').split('-');
      return p.length === 3 ? (+p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일') : '날짜 선택';
    }
    function setDateLabel() { dateLabel.textContent = fmtDateLabel(dateEl.value); }
    function renderDateCal() {
      var ym = dateCalMonth, year = +ym.slice(0, 4), mon = +ym.slice(5, 7);
      var startDow = new Date(year, mon - 1, 1).getDay();
      var dim = new Date(year, mon, 0).getDate();
      var WD = ['일', '월', '화', '수', '목', '금', '토'];
      var hdr = '<div class="cal-head">' +
        '<button type="button" class="cal-nav" data-cal-nav="prev" aria-label="이전 달">‹</button>' +
        '<span class="cal-title cal-title-static">' + esc(monthLabel(ym)) + '</span>' +
        '<button type="button" class="cal-nav" data-cal-nav="next" aria-label="다음 달">›</button>' +
        '</div>';
      var wd = '<div class="cal-grid cal-wd">' + WD.map(function (w) { return '<span class="cal-wcell">' + w + '</span>'; }).join('') + '</div>';
      var cells = '';
      for (var i = 0; i < startDow; i++) cells += '<span class="cal-cell blank"></span>';
      for (var dd = 1; dd <= dim; dd++) {
        var iso = ym + '-' + pad2(dd);
        var cls = 'cal-cell has' + (dateEl.value === iso ? ' selected' : '') + (iso === today ? ' today' : '');
        cells += '<button type="button" class="' + cls + '" data-pick="' + iso + '">' + dd + '</button>';
      }
      for (var t = startDow + dim; t < 42; t++) cells += '<span class="cal-cell blank"></span>';
      dateCal.innerHTML = hdr + wd + '<div class="cal-grid cal-days">' + cells + '</div>';
    }
    function openDateCal(open) {
      dateCal.hidden = !open;
      dateBtn.classList.toggle('open', open);
      if (open) { dateCalMonth = (dateEl.value || today).slice(0, 7); renderDateCal(); }
    }
    dateBtn.addEventListener('click', function (e) { e.stopPropagation(); openDateCal(dateCal.hidden); });
    dateCal.addEventListener('click', function (e) {
      e.stopPropagation();
      var nav = e.target.closest('[data-cal-nav]');
      if (nav) {
        var y = +dateCalMonth.slice(0, 4), mo = +dateCalMonth.slice(5, 7);
        mo += (nav.getAttribute('data-cal-nav') === 'next' ? 1 : -1);
        if (mo < 1) { mo = 12; y--; } else if (mo > 12) { mo = 1; y++; }
        dateCalMonth = y + '-' + pad2(mo); renderDateCal(); return;
      }
      var pick = e.target.closest('[data-pick]');
      if (pick) {
        dateEl.value = pick.getAttribute('data-pick');
        setDateLabel(); renderDateCal(); openDateCal(false); refresh();
      }
    });
    if (_calOutside) document.removeEventListener('click', _calOutside);
    _calOutside = function (e) {
      if (!dateCal.hidden && !e.target.closest('#dateWrap')) openDateCal(false);
    };
    document.addEventListener('click', _calOutside);
    setDateLabel();

    // 작성 중 이탈 가드 — 초기 스냅샷과 비교
    var snap = JSON.stringify({ t: d.title, c: d.content, dt: d.date, e: d.emotion });
    function isDirty() {
      return JSON.stringify({ t: titleEl.value, c: contentEl.value, dt: dateEl.value, e: selectedEmo }) !== snap;
    }
    function saveCurrentDraft() {
      var saved = Store.saveDraft({
        title: titleEl.value, content: contentEl.value, date: dateEl.value || today, emotion: selectedEmo
      }, currentDraftId);
      currentDraftId = saved.id;
      return saved;
    }
    // 폼을 벗어나려 할 때(취소/다른 페이지 이동) 호출 → 나가도 되면 resolve(true)
    function leaveCheck() {
      return new Promise(function (resolve) {
        if (editing) {
          // 기존 꿈 수정 중 — 임시보관 대상 아님(변경 있을 때만 단순 경고)
          if (!isDirty()) { resolve(true); return; }
          confirmModal({ title: '수정을 그만둘까요?', message: '변경한 내용은 저장되지 않습니다.', confirm: '나가기', danger: true })
            .then(function (ok) { resolve(!!ok); });
          return;
        }
        // 임시보관본을 열어본 경우엔 변경이 없어도 매번 묻는다(보관 유지/삭제 결정).
        // 새 작성은 입력이 있을 때(dirty)만 묻는다.
        if (!loadedDraft && !isDirty()) { resolve(true); return; }
        draftPrompt().then(function (act) {
          if (act === 'save') { saveCurrentDraft(); toast(tmsg('check', '임시보관함에 저장했어요.')); resolve(true); }
          else if (act === 'discard') {
            if (currentDraftId) { Store.deleteDraft(currentDraftId); toast(tmsg('trash', '임시보관함에서 제거했어요.')); }
            resolve(true);
          }
          else resolve(false);
        });
      });
    }
    global.setLeaveGuard(routePath, function () { return leaveCheck(); });

    document.getElementById('cancelBtn').onclick = function () {
      go(editing ? '/dreams/' + editing.id : '/'); // 가드가 임시보관 안내 처리
    };
    var draftsBtn = document.getElementById('draftsBtn');
    if (draftsBtn) draftsBtn.onclick = function () { go('/drafts'); };

    // 이 꿈 잠금 토글 (잠긴 꿈은 PIN으로만 열람)
    var lockBtn = document.getElementById('lockBtn');
    function paintLock() {
      lockBtn.classList.toggle('on', locked);
      lockBtn.setAttribute('aria-pressed', locked);
      lockBtn.querySelector('.lb-ic').innerHTML = global.Icons.ui(locked ? 'lock' : 'lockOpen', { size: 15 });
      lockBtn.querySelector('.lb-tx').textContent = locked ? '잠금됨' : '잠금';
    }
    lockBtn.onclick = function () {
      if (locked) { locked = false; paintLock(); return; }
      if (!global.Lock.hasPin()) {
        // 앱 PIN이 없으면 먼저 설정해야 잠금이 의미가 있음
        global.Lock.setPin(function (saved) { if (saved) { locked = true; paintLock(); toast(tmsg('check', '이 꿈을 잠갔어요.')); } });
      } else { locked = true; paintLock(); }
    };

    // Ctrl/⌘+Enter 저장
    formEl.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); formEl.requestSubmit(); }
    });

    refresh();

    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var title = titleEl.value.trim();
      var content = contentEl.value.trim();
      var date = dateEl.value || today;
      if (!content) { toast(tmsg('warn', '꿈 내용을 입력해주세요.')); return; }
      if (!selectedEmo) { toast(tmsg('warn', '감정을 하나 선택해주세요.')); return; }

      var payload = { title: title, content: content, date: date, emotion: selectedEmo, locked: locked };
      payload.keywords = Classify.classifyDream(payload);

      global.clearLeaveGuard();                               // 정상 저장 → 가드 해제
      if (currentDraftId) Store.deleteDraft(currentDraftId);  // 임시보관본은 기록되면 제거

      if (editing) {
        Store.updateDream(editing.id, payload);
        toast(tmsg('check', '꿈을 수정했습니다.'));
        go('/dreams/' + editing.id);
      } else {
        var prevCount = Store.getDreams().length;
        var created = Store.createDream(payload);
        announceDiscoveries(payload.keywords, prevCount);
        go('/dreams/' + created.id);
      }
    });
  }

  // 저장 후 발견 키워드 + 마일스톤 토스트
  function announceDiscoveries(keywords, prevCount) {
    var unlock = Classify.unlockState(prevCount + 1);
    var names = visibleKeywords(keywords, unlock).map(function (k) { return k.name; });
    if (names.length) {
      toast(tmsg('spark', '새로운 흔적 수집: <b>' + esc(names.slice(0, 5).join(', ')) +
        (names.length > 5 ? ' 외 ' + (names.length - 5) + '개' : '') + '</b>'), { glow: true, duration: 3200 });
    } else {
      toast(tmsg('moon', '꿈을 기록했습니다.'));
    }
    var ms = Classify.milestoneReachedBy(prevCount, prevCount + 1);
    if (ms) {
      setTimeout(function () {
        toast(tmsg('star', '<b>' + esc(ms.title) + '</b> — ' + esc(ms.desc)), { glow: true, duration: 5200 });
      }, 700);
    }
  }

  /* ============================ 임시보관함 ============================ */
  function drafts(c) {
    var list = Store.getDrafts().slice().sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
    var body;
    if (!list.length) {
      body = emptyCard('archive', '임시보관함이 비어 있어요',
        '꿈을 기록하다 멈추면 여기에 임시 저장해 두고 나중에 이어서 쓸 수 있어요.', '꿈 기록하기', '/new');
    } else {
      body = '<div style="margin:0 0 16px"><button class="btn primary sm" data-go="/new">' +
          global.Icons.ui('plus', { size: 14 }) + '새 꿈 기록</button></div>' +
        '<div class="draft-list">' + list.map(function (df) {
        var excerpt = (df.content || '').replace(/\s+/g, ' ').trim();
        return '<div class="draft-item">' +
          '<button type="button" class="draft-open" data-open="' + df.id + '">' +
            '<div class="draft-head">' +
              '<span class="draft-title">' + esc(df.title || '제목 없는 꿈') + '</span>' +
              (df.emotion ? emotionBadge(df.emotion) : '') +
            '</div>' +
            '<p class="draft-excerpt' + (excerpt ? '' : ' is-empty') + '">' +
              (excerpt ? esc(excerpt.slice(0, 140)) : '아직 내용이 없어요') + '</p>' +
            '<div class="draft-meta">' + global.Icons.ui('calendar', { size: 12 }) + esc(fmtDate(df.date)) +
              ' · 임시 저장됨</div>' +
          '</button>' +
          '<button type="button" class="draft-del" data-del="' + df.id + '" aria-label="삭제">' +
            global.Icons.ui('trash', { size: 16 }) + '</button>' +
        '</div>';
      }).join('') + '</div>';
    }
    c.innerHTML = head('임시보관함', '작성하다 멈춘 꿈을 이어서 기록하세요.') +
      '<div class="view-enter">' + body + '</div>';

    var listEl = c.querySelector('.draft-list');
    if (listEl) listEl.addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        var id = del.getAttribute('data-del');
        confirmModal({ title: '임시보관본을 삭제할까요?', message: '이 임시 저장본은 영구히 사라집니다.', confirm: '삭제', danger: true })
          .then(function (ok) { if (ok) { Store.deleteDraft(id); toast(tmsg('trash', '임시보관본을 삭제했어요.')); drafts(c); } });
        return;
      }
      var open = e.target.closest('[data-open]');
      if (open) go('/draft/' + open.getAttribute('data-open'));
    });
  }

  /* ============================ 목록 ============================ */
  var LIST_PAGE = 15;
  var listState = { q: '', emotion: 'all', fav: false, day: null, month: null, kw: null, calMonth: null, shown: LIST_PAGE, sort: 'new' };
  var _calOutside = null; // 달력 팝업 바깥클릭 닫기 핸들러(중복 방지용)

  function monthLabel(iso) {
    var p = (iso || '').split('-');
    return p.length >= 2 ? Number(p[0]) + '년 ' + Number(p[1]) + '월' : (iso || '');
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function list(c) {
    var unlock = Classify.unlockState(Store.getDreams().length);
    listState.shown = LIST_PAGE; // 아카이브를 다시 열면 처음부터
    listState.day = null;        // 날짜 선택 해제
    listState.month = null;      // 월 선택 해제
    listState.kw = null;         // 키워드 필터 해제
    // 달력 시작 월 = 가장 최근 꿈의 월 (없으면 이번 달)
    var latestDream = Store.getDreams().slice().sort(byNewest)[0];
    listState.calMonth = latestDream ? (latestDream.date || '').slice(0, 7) : new Date().toISOString().slice(0, 7);

    var emoFilters = '<button class="fchip' + (listState.emotion === 'all' ? ' active' : '') +
      '" data-emo="all">전체</button>' +
      Store.EMOTIONS.map(function (e) {
        return '<button class="fchip' + (listState.emotion === e.id ? ' active' : '') +
          '" data-emo="' + e.id + '" style="--em-color:' + e.color + '">' +
          global.Icons.emotion(e.id, 16) + e.label + '</button>';
      }).join('');

    c.innerHTML = head('아카이브', '수집한 꿈을 검색하고 되짚어보세요.') +
      '<div class="toolbar">' +
        '<div class="search"><span class="ic">' + global.Icons.ui('search', { size: 16 }) + '</span>' +
        '<input id="searchInput" class="input" placeholder="제목·내용 검색" value="' + esc(listState.q) + '"></div>' +
        '<div class="tool-actions">' +
          '<button class="fchip sort-toggle" id="sortToggle" aria-label="정렬 순서 바꾸기" title="정렬 순서">' +
            global.Icons.ui('sort', { size: 16 }) + '<span class="sort-label">' + (listState.sort === 'old' ? '오래된순' : '최신순') + '</span></button>' +
          '<div class="cal-toggle-wrap">' +
            '<button class="fchip cal-toggle" id="calToggle" aria-label="날짜로 보기">' +
              global.Icons.ui('calendar', { size: 16 }) + '</button>' +
            '<div class="cal cal-pop" id="calBox" hidden></div>' +
          '</div>' +
          '<button class="fchip' + (listState.fav ? ' active' : '') + '" id="favFilter" aria-label="즐겨찾기만 보기" title="즐겨찾기">' +
            global.Icons.ui('star', { size: 16 }) + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="filter-chips" id="emoFilters" style="margin-bottom:12px">' + emoFilters + '</div>' +
      '<div id="listResult"></div>';

    function renderResult() {
      var dreams = Store.getDreams().slice().sort(byNewest);
      var q = listState.q.trim().toLowerCase();
      var kwc = null, kwid = null;
      if (listState.kw) { var kp = listState.kw.split(':'); kwc = kp[0]; kwid = kp[1]; }
      var filtered = dreams.filter(function (d) {
        if (listState.fav && !d.favorite) return false;
        if (listState.emotion !== 'all' && d.emotion !== listState.emotion) return false;
        if (listState.day && d.date !== listState.day) return false;
        if (listState.month && (d.date || '').slice(0, 7) !== listState.month) return false;
        if (listState.kw && ((d.keywords && d.keywords[kwc]) || []).indexOf(kwid) === -1) return false;
        if (q && (d.title + ' ' + d.content).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      if (listState.sort === 'old') filtered.reverse(); // 기본 최신순 → 오래된순
      var host = document.getElementById('listResult');
      // 활성 키워드 필터 칩 (✕로 해제)
      var activeFilter = '';
      if (listState.kw) {
        var it = Classify.findItem(kwc, kwid);
        activeFilter = '<div class="active-filter"><span class="af-chip cat-' + kwc + '" role="button" tabindex="0">' +
          DICT[kwc].label + ' · ' + esc(it ? it.name : kwid) + ' <span class="af-x">✕</span></span></div>';
      }
      if (!dreams.length) {
        host.innerHTML = emptyCard('archive', '아직 기록한 꿈이 없습니다', '첫 꿈을 기록하면 이곳에 카드로 쌓입니다.', '＋ 꿈 기록하기', '/new');
        return;
      }
      if (!filtered.length) {
        host.innerHTML = activeFilter + emptyCard('search', '검색 결과가 없습니다', '다른 검색어나 필터를 시도해보세요.');
        return;
      }
      // 점진 로드: 앞에서 shown개만
      var visible = filtered.slice(0, listState.shown);
      // 월(YYYY-MM)별 그룹 — 최신순이라 등장 순서대로 그룹 배열 구성
      var groups = [], gmap = {};
      visible.forEach(function (d) {
        var key = (d.date || '').slice(0, 7);
        if (!gmap[key]) { gmap[key] = { label: monthLabel(d.date), items: [] }; groups.push(gmap[key]); }
        gmap[key].items.push(d);
      });
      var html = groups.map(function (g) {
        return '<div class="month-head"><span class="mh-label">' + esc(g.label) + '</span>' +
          '<span class="mh-count">' + g.items.length + '</span></div>' +
          '<div class="dream-grid">' + g.items.map(function (d) { return dreamCard(d, unlock, true, listState.q); }).join('') + '</div>';
      }).join('');
      var remaining = filtered.length - visible.length;
      if (remaining > 0) {
        html += '<div class="load-more-wrap"><button class="btn ghost" id="loadMoreBtn">더 보기 ' +
          '<span class="lm-n">' + remaining + '개</span></button></div>';
      }
      host.innerHTML = activeFilter + '<div class="list-count">' + filtered.length + '개의 꿈</div>' + html;
      var lm = document.getElementById('loadMoreBtn');
      if (lm) lm.onclick = function () { listState.shown += LIST_PAGE; renderResult(); };
    }
    // 위임 바인딩은 한 번만 (host 엘리먼트는 재사용, innerHTML 만 교체됨)
    bindDreamCards(document.getElementById('listResult'));

    // 아카이브 전용: 카드 키워드 칩 클릭 → 해당 키워드로 필터(전역 '도감 이동' 위임 가로채기)
    document.getElementById('listResult').addEventListener('click', function (e) {
      var clear = e.target.closest('.af-chip');
      if (clear && this.contains(clear)) { e.stopPropagation(); listState.kw = null; listState.shown = LIST_PAGE; renderResult(); return; }
      var chip = e.target.closest('[data-kw]');
      if (chip && this.contains(chip)) { e.stopPropagation(); listState.kw = chip.getAttribute('data-kw'); listState.shown = LIST_PAGE; renderResult(); }
    });

    var si = document.getElementById('searchInput');
    si.addEventListener('input', function () { listState.q = si.value; listState.shown = LIST_PAGE; renderResult(); });
    function shiftCalMonth(dir) {
      var y = +listState.calMonth.slice(0, 4), mo = +listState.calMonth.slice(5, 7);
      mo += (dir === 'next' ? 1 : -1);
      if (mo < 1) { mo = 12; y--; } else if (mo > 12) { mo = 1; y++; }
      listState.calMonth = y + '-' + pad2(mo);
    }
    function renderCalendar() {
      var box = document.getElementById('calBox'); if (!box) return;
      var ym = listState.calMonth, year = +ym.slice(0, 4), mon = +ym.slice(5, 7);
      var startDow = new Date(year, mon - 1, 1).getDay();
      var dim = new Date(year, mon, 0).getDate();
      var counts = {};
      Store.getDreams().forEach(function (d) { if ((d.date || '').slice(0, 7) === ym) counts[d.date] = (counts[d.date] || 0) + 1; });
      var todayIso = new Date().toISOString().slice(0, 10);
      var WD = ['일', '월', '화', '수', '목', '금', '토'];
      var hdr = '<div class="cal-head">' +
        '<button class="cal-nav" data-cal-nav="prev" aria-label="이전 달">‹</button>' +
        '<button class="cal-title' + (listState.month === ym ? ' selected' : '') + '" data-cal-month ' +
          'title="이 달 전체 보기">' + esc(monthLabel(ym)) + '</button>' +
        '<button class="cal-nav" data-cal-nav="next" aria-label="다음 달">›</button>' +
        ((listState.day || listState.month) ? '<button class="cal-reset" data-cal-reset>전체 보기</button>' : '') +
        '</div>';
      var wd = '<div class="cal-grid cal-wd">' + WD.map(function (w) { return '<span class="cal-wcell">' + w + '</span>'; }).join('') + '</div>';
      var cells = '';
      for (var i = 0; i < startDow; i++) cells += '<span class="cal-cell blank"></span>';
      for (var dd = 1; dd <= dim; dd++) {
        var iso = ym + '-' + pad2(dd);
        var cls = 'cal-cell' + (counts[iso] ? ' has' : ' none') +
          (listState.day === iso ? ' selected' : '') + (iso === todayIso ? ' today' : '');
        if (counts[iso]) cells += '<button class="' + cls + '" data-day="' + iso + '">' + dd + '<i class="cal-dot"></i></button>';
        else cells += '<span class="' + cls + '">' + dd + '</span>';
      }
      // 항상 6줄(42칸)로 채워 달마다 높이가 변하지 않게
      for (var t = startDow + dim; t < 42; t++) cells += '<span class="cal-cell blank"></span>';
      box.innerHTML = hdr + wd + '<div class="cal-grid cal-days">' + cells + '</div>';
    }
    function updateCalToggle() {
      var t = document.getElementById('calToggle');
      if (t) t.classList.toggle('active', !!(listState.day || listState.month));
    }
    function openCal(open) {
      var box = document.getElementById('calBox'), t = document.getElementById('calToggle');
      box.hidden = !open;
      if (t) t.classList.toggle('open', open);
      if (open) renderCalendar();
    }
    document.getElementById('calToggle').addEventListener('click', function (e) {
      e.stopPropagation();
      openCal(document.getElementById('calBox').hidden);
    });
    if (_calOutside) document.removeEventListener('click', _calOutside);
    _calOutside = function (e) {
      var box = document.getElementById('calBox');
      if (box && !box.hidden && !e.target.closest('.cal-toggle-wrap')) openCal(false);
    };
    document.addEventListener('click', _calOutside);

    document.getElementById('calBox').addEventListener('click', function (e) {
      e.stopPropagation(); // 달력 내부 클릭이 '바깥 클릭'으로 오인돼 닫히지 않도록
      var nav = e.target.closest('[data-cal-nav]');
      if (nav) { shiftCalMonth(nav.getAttribute('data-cal-nav')); renderCalendar(); return; }
      if (e.target.closest('[data-cal-reset]')) {
        listState.day = null; listState.month = null; listState.shown = LIST_PAGE;
        renderCalendar(); renderResult(); updateCalToggle();
        return;
      }
      if (e.target.closest('[data-cal-month]')) {
        // 월 제목 클릭 → 그 달 전체 (다시 누르면 해제)
        listState.month = (listState.month === listState.calMonth ? null : listState.calMonth);
        listState.day = null; listState.shown = LIST_PAGE;
        renderResult(); updateCalToggle();
        openCal(false);
        return;
      }
      var dayBtn = e.target.closest('[data-day]');
      if (dayBtn) {
        var iso = dayBtn.getAttribute('data-day');
        listState.day = (listState.day === iso ? null : iso);
        listState.month = null;
        listState.shown = LIST_PAGE;
        renderResult(); updateCalToggle();
        openCal(false); // 날짜 고르면 팝업 닫기
      }
    });
    document.getElementById('favFilter').onclick = function () {
      listState.fav = !listState.fav;
      this.classList.toggle('active', listState.fav);
      listState.shown = LIST_PAGE;
      renderResult();
    };
    document.getElementById('sortToggle').onclick = function () {
      listState.sort = listState.sort === 'old' ? 'new' : 'old';
      var lbl = this.querySelector('.sort-label');
      if (lbl) lbl.textContent = listState.sort === 'old' ? '오래된순' : '최신순';
      listState.shown = LIST_PAGE;
      renderResult();
    };
    document.getElementById('emoFilters').addEventListener('click', function (e) {
      var b = e.target.closest('.fchip'); if (!b) return;
      listState.emotion = b.getAttribute('data-emo');
      this.querySelectorAll('.fchip').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      listState.shown = LIST_PAGE;
      renderResult();
    });
    renderCalendar();
    updateCalToggle();
    renderResult();
  }

  /* ============================ 상세 ============================ */
  function detail(c, params) {
    var d = Store.getDream(params.id);
    if (!d) { c.innerHTML = emptyCard('error', '꿈을 찾을 수 없습니다', '삭제되었거나 잘못된 주소입니다.', '아카이브로', '/dreams'); return; }
    // 잠긴 꿈 — PIN 해제 전에는 내용 비공개
    if (isHidden(d)) {
      c.innerHTML =
        '<button class="btn sm ghost" id="backBtn" style="margin-bottom:18px">← 아카이브</button>' +
        '<div class="card view-enter locked-detail">' +
          '<div class="ld-icon">' + global.Icons.ui('lock', { size: 30 }) + '</div>' +
          '<h2>잠긴 꿈입니다</h2>' +
          '<p>이 꿈은 잠겨 있어요. PIN을 입력하면 볼 수 있습니다.</p>' +
          '<button class="btn primary" id="unlockBtn">PIN 입력하고 열기</button>' +
        '</div>';
      document.getElementById('backBtn').onclick = function () { go('/dreams'); };
      document.getElementById('unlockBtn').onclick = function () {
        global.Lock.requirePin(function () { detail(c, params); }, d.id);
      };
      return;
    }
    var dreams = Store.getDreams();
    var unlock = Classify.unlockState(dreams.length);
    var kw = kwChipsHtml(d.keywords, unlock, true, null, true);

    // 읽기 메타 — 요일 · 글자수 · 기록 번호
    var WD = ['일', '월', '화', '수', '목', '금', '토'];
    var wd = WD[new Date(d.date + 'T00:00:00').getDay()];
    var chars = (d.content || '').length;
    var sortedNew = dreams.slice().sort(byNewest);
    var idx = -1;
    for (var si = 0; si < sortedNew.length; si++) { if (sortedNew[si].id === d.id) { idx = si; break; } }
    var entryNo = idx >= 0 ? dreams.length - idx : dreams.length;
    var newer = idx > 0 ? sortedNew[idx - 1] : null;                          // 더 최근
    var older = (idx >= 0 && idx < sortedNew.length - 1) ? sortedNew[idx + 1] : null; // 더 예전

    // 함께 떠오른 꿈 — 키워드를 공유하는 다른 기록 (공유 수 → 최신순)
    // 꿈의 keywords는 {place:[id],person:[id],situation:[id]} 구조
    function keyList(dream) {
      var arr = [];
      DICT.categories.forEach(function (cat) {
        ((dream.keywords && dream.keywords[cat]) || []).forEach(function (id) { arr.push(cat + ':' + id); });
      });
      return arr;
    }
    var myKeys = keyList(d);
    var related = dreams.filter(function (x) { return x.id !== d.id; }).map(function (x) {
      var xk = keyList(x);
      var shared = 0;
      for (var j = 0; j < xk.length; j++) { if (myKeys.indexOf(xk[j]) !== -1) shared++; }
      return { d: x, shared: shared };
    }).filter(function (o) { return o.shared > 0; })
      .sort(function (a, b) { return b.shared !== a.shared ? b.shared - a.shared : byNewest(a.d, b.d); })
      .slice(0, 3).map(function (o) { return o.d; });

    function pnCell(dream, dir, cls) {
      if (!dream) return '<span class="pn pn-empty"></span>';
      return '<button class="pn ' + cls + '" data-go="/dreams/' + dream.id + '">' +
        '<span class="pn-dir">' + dir + '</span>' +
        '<span class="pn-title">' + esc(dream.title) + '</span></button>';
    }

    c.innerHTML =
      '<button class="btn sm ghost" id="backBtn" style="margin-bottom:18px">← 아카이브</button>' +
      '<div class="detail-head view-enter">' +
        '<div class="detail-main">' +
          '<h1 class="detail-title">' + global.Icons.emotionSticker(d.emotion, 34) +
            '<span>' + esc(d.title) + '</span></h1>' +
          '<div class="detail-meta">' + emotionBadge(d.emotion) +
            '<span class="eyebrow">' + fmtDate(d.date) + '</span></div>' +
          '<div class="detail-submeta">기록 No.' + entryNo + ' · ' + wd + '요일 · ' + chars + '자</div>' +
        '</div>' +
        '<div class="detail-actions">' +
          '<button class="fav-btn ' + (d.favorite ? 'on' : '') + '" id="favBtn" title="즐겨찾기" aria-label="즐겨찾기">' +
          (d.favorite ? '★' : '☆') + '</button>' +
          '<button class="btn sm" id="shareBtn">내보내기</button>' +
          '<button class="btn sm" id="editBtn">수정</button>' +
          '<button class="btn sm danger" id="delBtn">삭제</button>' +
        '</div>' +
      '</div>' +
      '<div class="card detail-body view-enter">' + esc(d.content).replace(/\n/g, '<br>') + '</div>' +
      '<div class="interp-card view-enter">' +
        '<div class="interp-head">' + global.Icons.ui('insight', { size: 18 }) +
          '<span>무의식이 비추는 것</span></div>' +
        '<p class="interp-body">' + esc(global.Interpret.analyze(d)) + '</p>' +
        '<p class="interp-warm">' + global.Icons.ui('moon', { size: 15 }) +
          '<span>' + esc(global.Interpret.warmth(d)) + '</span></p>' +
        '<div class="interp-note">수집된 상징을 바탕으로 한 해석이에요</div>' +
      '</div>' +
      (kw ? '<div class="section-label">이 꿈에서 수집한 흔적</div>' + kw : '') +
      (related.length ? '<div class="section-label" style="margin-top:44px">함께 떠오른 꿈</div>' +
        '<div class="dream-grid">' + related.map(function (x) { return dreamCard(x, unlock); }).join('') + '</div>' : '') +
      ((newer || older) ? '<nav class="post-nav">' + pnCell(older, '← 이전 꿈', 'pn-prev') + pnCell(newer, '다음 꿈 →', 'pn-next') + '</nav>' : '');

    document.getElementById('backBtn').onclick = function () { go('/dreams'); };
    document.getElementById('shareBtn').onclick = function () { openShareSheet(d); };
    document.getElementById('editBtn').onclick = function () { go('/edit/' + d.id); };
    document.getElementById('favBtn').onclick = function () {
      var nd = Store.toggleFavorite(d.id);
      this.classList.toggle('on', nd.favorite);
      this.textContent = nd.favorite ? '★' : '☆';
    };
    document.getElementById('delBtn').onclick = function () {
      confirmModal({
        title: '이 꿈을 삭제할까요?',
        message: '삭제하면 되돌릴 수 없으며, 도감에서도 이 기록의 흔적이 사라집니다.',
        confirm: '삭제', danger: true
      }).then(function (ok) {
        if (ok) { Store.deleteDream(d.id); toast(tmsg('trash', '꿈을 삭제했습니다.')); go('/dreams'); }
      });
    };
  }

  /* ============================ 도감 ============================ */
  function dex(c, params) {
    var dreams = Store.getDreams();
    var dx = Classify.buildDex(dreams);
    var cat = (params && params.cat) || 'place';
    if (DICT.categories.indexOf(cat) === -1) cat = 'place';

    var tabs = DICT.categories.map(function (cc) {
      return '<button class="fchip' + (cc === cat ? ' active' : '') + '" data-cat="' + cc + '">' +
        DICT[cc].label + ' <i>' + dx[cc].discovered + '/' + dx[cc].total + '</i></button>';
    }).join('');

    c.innerHTML = head('Dreamdex 도감', '꿈에서 발견한 흔적을 수집하는 무의식 도감입니다.') +
      '<div class="dex-header view-enter">' +
        '<div class="dh-overall"><span class="dh-pct">' + dx.overall.percent + '%</span>' +
          '<span class="dh-sub">' + dx.overall.discovered + ' / ' + dx.overall.total + ' 수집</span></div>' +
        '<div class="progress dh-allbar"><span style="width:' + dx.overall.percent + '%"></span></div>' +
      '</div>' +
      '<div class="dex-tabs" id="dexTabs">' + tabs + '</div>' +
      '<div id="dexGrid"></div>';

    function renderGrid() {
      var info = dx[cat];
      var html = '<div class="dex-grid view-enter">' + info.slots.map(function (s) {
        var tierTag = s.tier === 'rare' ? '<span class="tier-tag tier-rare">희귀</span>'
          : s.tier === 'hidden' ? '<span class="tier-tag tier-hidden">숨김</span>' : '';
        if (s.count > 0) {
          return '<div class="dex-slot found" data-id="' + s.id + '" style="--c:var(--node-' + cat + ')">' + tierTag +
            '<span class="ds-icon">' + global.Icons.keyword(cat, s.id, 24) + '</span>' +
            '<div class="ds-body"><div class="ds-name">' + esc(s.name) + '</div>' +
            '<div class="ds-count">' + s.count + '회 발견</div></div></div>';
        }
        // 미발견: 발견 가능하면 ??? / 아직 잠긴 tier 면 자물쇠
        var locked = !s.discoverable;
        var icon = locked ? global.Icons.ui('lock', { size: 20 }) : '?';
        return '<div class="dex-slot locked">' + tierTag +
          '<span class="ds-icon">' + icon + '</span>' +
          '<div class="ds-body"><div class="ds-name">???</div>' +
          '<div class="ds-count">' + (locked ? tierHint(s.tier) : '미발견') + '</div></div></div>';
      }).join('') + '</div>';
      var host = document.getElementById('dexGrid');
      host.innerHTML = html;
      // 탭 전환마다 진입 애니메이션 재생 (innerHTML 교체만으론 같은 애니메이션이 재시작되지 않음)
      var g = host.firstElementChild;
      if (g) { g.style.animation = 'none'; void g.offsetWidth; g.style.animation = ''; }
    }

    document.getElementById('dexTabs').addEventListener('click', function (e) {
      var b = e.target.closest('.fchip'); if (!b) return;
      cat = b.getAttribute('data-cat');
      this.querySelectorAll('.fchip').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      renderGrid();
    });
    document.getElementById('dexGrid').addEventListener('click', function (e) {
      var slot = e.target.closest('.dex-slot.found'); if (!slot) return;
      go('/dex/' + cat + '/' + slot.getAttribute('data-id'));
    });
    renderGrid();
  }

  function tierHint(tier) {
    if (tier === 'rare') return '꿈 30개에 해금';
    if (tier === 'hidden') return '꿈 50개에 해금';
    return '미발견';
  }

  // 키워드 상세 (해당 키워드가 등장한 꿈 목록)
  function dexKeyword(c, params) {
    var cat = params.cat, id = params.kw;
    var item = Classify.findItem(cat, id);
    if (!item) { c.innerHTML = emptyCard('error', '키워드를 찾을 수 없습니다', '', '도감으로', '/dex/' + cat); return; }
    var dreams = Store.getDreams();
    var dx = Classify.buildDex(dreams);
    var slot = Classify.getSlot(dx, cat, id);
    var unlock = dx.unlock;

    var related = (slot && slot.dreamIds || []).map(function (did) { return Store.getDream(did); })
      .filter(Boolean).sort(byNewest);

    c.innerHTML =
      '<button class="btn sm ghost" id="backBtn" style="margin-bottom:18px">← ' + DICT[cat].label + ' 도감</button>' +
      '<div class="card view-enter dexkw-hero" style="--c:var(--node-' + cat + ')">' +
        '<span class="dexkw-icon">' + global.Icons.keyword(cat, id, 32) + '</span>' +
        '<div class="dexkw-info">' +
          '<div class="dexkw-cat">' + DICT[cat].label.toUpperCase() + '</div>' +
          '<h1 class="dexkw-name">' + esc(item.name) +
          (item.tier === 'rare' ? ' <span class="tier-tag tier-rare">희귀</span>' :
           item.tier === 'hidden' ? ' <span class="tier-tag tier-hidden">숨김</span>' : '') + '</h1>' +
          '<div class="dexkw-meta">' +
            (slot && slot.count
              ? '<span style="white-space:nowrap">' + slot.count + '개의 꿈에서 발견</span> · ' +
                '<span style="white-space:nowrap">첫 발견 ' + fmtDate(slot.firstSeen) + '</span>'
              : '아직 발견하지 못한 흔적입니다.') +
          '</div>' +
        '</div></div>' +
      (related.length
        ? '<div class="section-label">이 흔적이 등장한 꿈</div><div class="dream-grid">' +
          related.map(function (d) { return dreamCard(d, unlock); }).join('') + '</div>'
        : emptyCard('archive', '아직 이 흔적을 수집하지 못했습니다', '관련된 꿈을 기록하면 이곳에 나타납니다.'));

    document.getElementById('backBtn').onclick = function () { go('/dex/' + cat); };
    bindDreamCards(c);
  }

  /* ============================ 통계 ============================ */
  // 꿈 결산 — 올해(없으면 전체) 기준 요약 집계
  function dreamRecap(dreams) {
    if (!dreams.length) return null;
    var y = new Date().getFullYear();
    var ofYear = dreams.filter(function (d) { return (d.date || '').slice(0, 4) === String(y); });
    var pool = ofYear.length ? ofYear : dreams;
    var emoCount = {}; pool.forEach(function (d) { emoCount[d.emotion] = (emoCount[d.emotion] || 0) + 1; });
    var topEmo = null, topEmoN = 0;
    Object.keys(emoCount).forEach(function (k) { if (emoCount[k] > topEmoN) { topEmoN = emoCount[k]; topEmo = k; } });
    var placeCount = {}; pool.forEach(function (d) { ((d.keywords && d.keywords.place) || []).forEach(function (id) { placeCount[id] = (placeCount[id] || 0) + 1; }); });
    var topPlace = null, topPlaceN = 0;
    Object.keys(placeCount).forEach(function (k) { if (placeCount[k] > topPlaceN) { topPlaceN = placeCount[k]; topPlace = k; } });
    var topPlaceItem = topPlace ? Classify.findItem('place', topPlace) : null;
    var monthCount = {}; pool.forEach(function (d) { var m = (d.date || '').slice(0, 7); if (m) monthCount[m] = (monthCount[m] || 0) + 1; });
    var topMonth = null, topMonthN = 0;
    Object.keys(monthCount).forEach(function (k) { if (monthCount[k] > topMonthN) { topMonthN = monthCount[k]; topMonth = k; } });
    // 최장 연속 기록(전체 날짜 기준)
    var days = {}; dreams.forEach(function (d) { var day = (d.date || '').slice(0, 10); if (day) days[day] = true; });
    var sorted = Object.keys(days).sort();
    var longest = 0, run = 0, prev = null;
    sorted.forEach(function (day) {
      run = (prev && Math.round((new Date(day) - new Date(prev)) / 86400000) === 1) ? run + 1 : 1;
      if (run > longest) longest = run; prev = day;
    });
    return {
      title: ofYear.length ? (y + ' 나의 꿈') : '나의 꿈 결산',
      count: pool.length, topEmo: topEmo,
      topPlaceName: topPlaceItem ? topPlaceItem.name : null,
      topMonth: topMonth, longest: longest
    };
  }
  // 결산 내용(헤드 + 그리드) — 팝업에서 사용
  function recapInnerHtml(r) {
    var emo = r.topEmo ? Store.emotionById(r.topEmo) : null;
    function item(label, value, color) {
      return '<div class="recap-item"><div class="recap-val"' + (color ? ' style="color:' + color + '"' : '') + '>' + value + '</div>' +
        '<div class="recap-label">' + esc(label) + '</div></div>';
    }
    return '<div class="recap-head">' + global.Icons.ui('spark', { size: 18 }) + '<span>' + esc(r.title) + '</span></div>' +
      '<div class="recap-grid">' +
        item('기록한 꿈', r.count + '<small>개</small>', 'var(--accent)') +
        item('가장 많은 감정', emo ? esc(emo.label) : '-', emo ? emo.color : '') +
        item('가장 자주 간 곳', r.topPlaceName ? esc(r.topPlaceName) : '-', 'var(--cat-place)') +
        item('가장 많이 꾼 달', r.topMonth ? (Number(r.topMonth.slice(5, 7)) + '월') : '-', 'var(--accent-2)') +
        item('최장 연속 기록', r.longest + '<small>일</small>', r.longest > 1 ? 'var(--accent)' : '') +
      '</div>';
  }
  // 결산 팝업
  function openRecapModal(dreams) {
    var r = dreamRecap(dreams);
    if (!r) return;
    var host = document.createElement('div');
    host.className = 'modal-host';
    host.innerHTML = '<div class="modal recap-modal" role="dialog" aria-modal="true">' +
      recapInnerHtml(r) +
      '<div class="modal-actions"><button class="btn ghost" data-act="close">닫기</button></div>' +
      '</div>';
    document.body.appendChild(host);
    function close() { document.removeEventListener('keydown', onKey); if (host.parentNode) host.parentNode.removeChild(host); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    host.addEventListener('click', function (e) {
      if (e.target === host || e.target.getAttribute('data-act') === 'close') close();
    });
  }

  function stats(c) {
    var dreams = Store.getDreams();
    var st = Classify.buildStats(dreams);

    if (!dreams.length) {
      c.innerHTML = head('통계', '꿈 데이터가 쌓이면 패턴이 보입니다.') +
        emptyCard('stats', '아직 분석할 데이터가 없습니다', '꿈을 기록하면 감정 분포와 패턴을 시각화합니다.', '＋ 꿈 기록하기', '/new');
      return;
    }

    // '가장 많은 감정' 값 — 다른 카드처럼 큰 텍스트(감정 이름, 감정색)로 통일
    var topEmo = st.topEmotion ? Store.emotionById(st.topEmotion) : null;
    var topEmoVal = topEmo ? '<span style="color:' + topEmo.color + '">' + esc(topEmo.label) + '</span>' : '-';

    var recap = dreamRecap(dreams);
    c.innerHTML = head('통계', '당신의 무의식이 그리는 패턴을 들여다보세요.') +
      (recap && recap.count >= 3
        ? '<button class="btn recap-open view-enter" id="recapBtn">' + global.Icons.ui('spark', { size: 15 }) +
            '<span>' + esc(recap.title) + ' 결산</span>' + global.Icons.ui('arrow', { size: 14 }) + '</button>'
        : '') +
      '<div class="stat-strip view-enter">' +
        ssItem(global.Icons.ui('moon', { size: 18 }), 'var(--accent)', '총 꿈 개수',
          st.total + '<small>개</small>', 'var(--accent)') +
        ssItem(global.Icons.ui('calendar', { size: 18 }), 'var(--accent-2)', '최근 30일',
          st.recent30 + '<small>개</small>', '') +
        ssItem(topEmo ? global.Icons.emotion(st.topEmotion, 18) : global.Icons.ui('info', { size: 18 }),
          topEmo ? topEmo.color : 'var(--text-dim)', '가장 많은 감정',
          topEmo ? esc(topEmo.label) : '-', topEmo ? 'var(--accent)' : '') +
        ssItem(global.Icons.ui('pin', { size: 18 }), 'var(--cat-place)', '가장 많은 장소',
          st.topPlaceName ? esc(st.topPlaceName) : '-', '') +
        ssItem(global.Icons.ui('spark', { size: 18 }), 'var(--accent-2)', '연속 기록',
          st.streak + '<small>일</small>', st.streak ? 'var(--accent)' : '') +
      '</div>' +
      '<div class="stats-grid view-enter">' +
        '<div class="card chart-wrap">' +
          '<div class="section-label" style="margin:0 0 14px">감정 분포</div>' +
          '<div class="chart-box"><canvas id="emoChart"></canvas></div>' +
        '</div>' +
        '<div class="card chart-wrap">' +
          '<div class="rail-head"><span class="section-label" style="margin:0">감정 흐름</span>' +
          '<span class="rail-sub">최근 ' + Math.min(dreams.length, 18) + '개</span></div>' +
          emotionTrendHtml(dreams) +
          '<div class="trend-cap">위로 갈수록 밝은 감정 · 왼쪽이 오래된 기록</div>' +
        '</div>' +
      '</div>';

    global.Viz.renderEmotionChart(document.getElementById('emoChart'), st);
    var rb = document.getElementById('recapBtn');
    if (rb) rb.onclick = function () { openRecapModal(dreams); };
  }

  /* ============================ 꿈 지도 ============================ */
  function map(c) {
    var dreams = Store.getDreams();
    var unlock = Classify.unlockState(dreams.length);

    if (!unlock.mapOpen) {
      c.innerHTML = head('꿈 지도', '꿈 속 요소들의 연결을 탐험합니다.') +
        emptyCard('map', '꿈 지도는 10개의 꿈에서 열립니다',
          '현재 ' + dreams.length + '개 · ' + (10 - dreams.length) + '개를 더 기록하면|| 무의식의 연결망이 그려집니다.',
          '＋ 꿈 기록하기', '/new');
      return;
    }

    // 노드는 빈도 상위만, 엣지는 노드당 강한 연결 3개로 제한해 과밀(헤어볼) 방지
    var maxNodes = (window.innerWidth <= 600) ? 10 : 16;
    var graph = Classify.buildGraph(dreams, maxNodes, 3);
    if (!graph.nodes.length) {
      c.innerHTML = head('꿈 지도', '꿈 속 요소들의 연결을 탐험합니다.') +
        emptyCard('map', '아직 그릴 연결이 없습니다', '키워드가 등장하는 꿈을 더 기록해보세요.');
      return;
    }

    c.innerHTML = '<div class="page-head"><h1>꿈 지도</h1><p>같은 꿈에 함께 나타난 요소들이 서로 연결됩니다.<br class="br-m">노드를 눌러보세요.</p></div>' +
      '<div class="card view-enter" style="padding:14px"><canvas id="mapCanvas"></canvas></div>' +
      '<div class="map-legend">' +
        '<span class="lg"><span class="sw" style="background:var(--cat-place)"></span>장소</span>' +
        '<span class="lg"><span class="sw" style="background:var(--cat-person)"></span>인물</span>' +
        '<span class="lg"><span class="sw" style="background:var(--cat-situation)"></span>상황</span>' +
        '<span style="color:var(--text-faint)">· 원이 클수록 자주 등장 · 선이 굵을수록 자주 함께 등장</span>' +
      '</div>';

    var canvas = document.getElementById('mapCanvas');
    // 레이아웃 강제 확정 후 동기 렌더 (rAF는 백그라운드 탭에서 안 그려질 수 있음)
    void canvas.offsetWidth;
    global.Viz.renderMap(canvas, graph, function (node) {
      go('/dex/' + node.cat + '/' + node.id);
    });
  }

  /* ============================ 설정 ============================ */
  function settings(c) {
    var s = Store.getSettings();
    var count = Store.getDreams().length;

    var themeCards = Store.THEMES.map(function (t) {
      var on = s.theme === t.id;
      var sw = t.swatch.map(function (col) {
        return '<span class="sw-dot" style="background:' + col + '"></span>';
      }).join('');
      return '<button type="button" class="theme-card' + (on ? ' active' : '') + '" data-theme-id="' + t.id + '">' +
        '<span class="theme-sw">' + sw + '</span>' +
        '<span class="theme-name">' + esc(t.label) + '</span>' +
        '<span class="theme-desc">' + esc(t.desc) + '</span></button>';
    }).join('');

    // 패턴 미니 미리보기 (var(--text-faint) 기반 — 현재 테마 색에 맞춰 보임)
    function patPrevStyle(id) {
      var ink = 'var(--text-faint)';
      switch (id) {
        case 'dots':       return 'background-image:radial-gradient(' + ink + ' 1.1px,transparent 1.3px);background-size:9px 9px';
        case 'grid':       return 'background-image:linear-gradient(' + ink + ' 1px,transparent 1px),linear-gradient(90deg,' + ink + ' 1px,transparent 1px);background-size:9px 9px;opacity:.7';
        case 'diagonal':   return 'background-image:repeating-linear-gradient(45deg,' + ink + ' 0 1px,transparent 1px 7px);opacity:.7';
        case 'crosshatch': return 'background-image:repeating-linear-gradient(45deg,' + ink + ' 0 1px,transparent 1px 8px),repeating-linear-gradient(-45deg,' + ink + ' 0 1px,transparent 1px 8px);opacity:.6';
        case 'waves':      return 'background-image:radial-gradient(circle at 50% 100%,transparent 56%,' + ink + ' 60%,transparent 66%);background-size:16px 8px;opacity:.8';
        default:           return '';
      }
    }
    var patCards = Store.PATTERNS.map(function (p) {
      var on = s.pattern === p.id;
      return '<button type="button" class="theme-card' + (on ? ' active' : '') + '" data-pattern-id="' + p.id + '">' +
        '<span class="pat-prev" style="' + patPrevStyle(p.id) + '"></span>' +
        '<span class="theme-name">' + esc(p.label) + '</span>' +
        '<span class="theme-desc">' + esc(p.desc) + '</span></button>';
    }).join('');

    // 배경 효과 미니 미리보기 (정지 이미지로 분위기만 — 실제는 움직임)
    function fxPrevStyle(id) {
      var a = 'var(--accent-2)';
      switch (id) {
        case 'stars':    return 'background-image:radial-gradient(' + a + ' 1.2px,transparent 1.5px);background-size:11px 11px;opacity:.85';
        case 'shooting': return 'background-image:radial-gradient(circle at 76% 72%,color-mix(in srgb,' + a + ' 85%,#fff) 0 1.6px,transparent 2.2px),linear-gradient(135deg,transparent 54%,' + a + ' 72%,transparent 77%);opacity:.85';
        case 'aurora':   return 'background-image:linear-gradient(to bottom,color-mix(in srgb,var(--cat-place) 80%,transparent),transparent 80%),linear-gradient(to bottom,color-mix(in srgb,var(--cat-situation) 80%,transparent),transparent 80%);background-size:42% 100%,40% 100%;background-position:16% 0,74% 0;background-repeat:no-repeat;filter:blur(2px)';
        case 'petals':   return 'background-image:radial-gradient(circle at 30% 34%,#ffc6d4 0 3px,transparent 4px),radial-gradient(circle at 64% 58%,#ffd7c0 0 2.6px,transparent 3.6px),radial-gradient(circle at 46% 80%,#f7d3ea 0 2.6px,transparent 3.6px);opacity:.95';
        case 'bubbles':  return 'background-image:radial-gradient(circle at 32% 60%,transparent 2.5px,color-mix(in srgb,var(--accent-2) 45%,transparent) 3px,transparent 4px),radial-gradient(circle at 62% 42%,transparent 3.5px,color-mix(in srgb,var(--accent-2) 45%,transparent) 4px,transparent 5px);opacity:.9';
        case 'softdots': return 'background-image:radial-gradient(var(--text) 1.8px,transparent 2.4px);background-size:10px 10px;opacity:.4';
        case 'glow':     return 'background-image:radial-gradient(circle at 34% 40%,color-mix(in srgb,' + a + ' 60%,transparent),transparent 56%),radial-gradient(circle at 70% 64%,color-mix(in srgb,var(--accent) 55%,transparent),transparent 58%);filter:blur(3px);opacity:.85';
        case 'gradient': return 'background-image:linear-gradient(120deg,color-mix(in srgb,var(--accent) 40%,transparent),transparent 46%,color-mix(in srgb,' + a + ' 46%,transparent));opacity:.9';
        case 'particles':return 'background-image:radial-gradient(circle at 26% 70%,var(--text) 0 1.6px,transparent 2.2px),radial-gradient(circle at 54% 44%,var(--text) 0 1.4px,transparent 2px),radial-gradient(circle at 78% 78%,var(--text) 0 1.4px,transparent 2px);opacity:.55';
        default:         return '';
      }
    }
    var fxCards = Store.effectsFor(s.theme).map(function (f) {
      var on = s.effect === f.id;
      return '<button type="button" class="theme-card' + (on ? ' active' : '') + '" data-effect-id="' + f.id + '">' +
        '<span class="pat-prev" style="' + fxPrevStyle(f.id) + '"></span>' +
        '<span class="theme-name">' + esc(f.label) + '</span>' +
        '<span class="theme-desc">' + esc(f.desc) + '</span></button>';
    }).join('');

    c.innerHTML = head('설정', '보관소를 관리합니다.') +
      '<div class="card view-enter" style="padding:24px 26px;max-width:680px;margin-bottom:18px">' +
        '<div class="eyebrow" style="margin-bottom:14px">프로필</div>' +
        row('닉네임', '<input id="nickInput" class="input" style="max-width:220px" value="' + esc(s.nickname) + '" placeholder="닉네임">') +
        '<p style="color:var(--text-faint);margin:10px 0 0;font-size:.8rem">홈 화면 인사말에 쓰여요. 로그인하면 기기 간에 함께 동기화돼요.</p>' +
      '</div>' +
      '<div class="card view-enter" style="padding:24px 26px;max-width:680px;margin-bottom:18px">' +
        '<div class="eyebrow" style="margin-bottom:14px">테마</div>' +
        '<div class="theme-grid" id="themeGrid">' + themeCards + '</div>' +
        '<div style="border-top:1px solid var(--border);margin:20px 0 16px"></div>' +
        '<div class="eyebrow" style="margin-bottom:14px">배경 패턴</div>' +
        '<div class="theme-grid" id="patternGrid">' + patCards + '</div>' +
        '<div style="border-top:1px solid var(--border);margin:20px 0 16px"></div>' +
        '<div class="eyebrow" style="margin-bottom:14px">배경 효과</div>' +
        '<div class="theme-grid" id="effectGrid">' + fxCards + '</div>' +
        ((s.lock && s.lock.pin)
          ? '<div style="border-top:1px solid var(--border);margin:8px 0 0"></div>' +
            row('일기 잠금 PIN', '<span style="display:inline-flex;gap:8px">' +
              '<button class="btn sm" id="pinChange">PIN 변경</button>' +
              '<button class="btn sm danger" id="pinClear">PIN 삭제</button></span>')
          : '') +
      '</div>' +
      '<div class="card" style="padding:24px 26px;max-width:680px;margin-bottom:18px">' +
        '<div class="eyebrow" style="margin-bottom:14px">데이터 · ' + count + '개 기록</div>' +
        row('백업', '<button class="btn sm" id="exportBtn">JSON 내보내기</button>') +
        row('복원', '<label class="btn sm" style="cursor:pointer">파일 가져오기<input type="file" id="importFile" accept="application/json,.json" hidden></label>') +
        row('예시', '<button class="btn sm" id="sampleBtn">예시 데이터 불러오기</button>') +
      '</div>' +
      (function () {
        var cloud = global.Cloud;
        var u = cloud && cloud.currentUser ? cloud.currentUser() : null;
        var offline = !(cloud && cloud.isReady && cloud.isReady());
        return '<div class="card" style="padding:24px 26px;max-width:680px;margin-bottom:18px">' +
          '<div class="eyebrow" style="margin-bottom:6px">기기 간 동기화</div>' +
          (u
            ? // ── 로그인됨: 실시간 동기화 ──
              '<p style="color:var(--text-dim);margin:0 0 16px;font-size:.86rem"><b style="color:var(--accent)">✓ 실시간 동기화 켜짐</b> — 꿈을 저장하면 자동으로 올라가고, 다른 기기에도 새로고침 없이 바로 반영돼요.</p>' +
              row('로그인 계정',
                '<span style="display:inline-flex;gap:10px;align-items:center;flex-wrap:wrap">' +
                (u.photoURL ? '<img src="' + esc(u.photoURL) + '" alt="" style="width:28px;height:28px;border-radius:50%">' : '') +
                '<span style="font-size:.9rem">' + esc(u.displayName || '') + (u.email ? ' <span style="color:var(--text-faint)">· ' + esc(u.email) + '</span>' : '') + '</span></span>') +
              row('', '<button class="btn sm danger" id="cloudLogout">로그아웃</button>')
            : // ── 미로그인 ──
              '<p style="color:var(--text-dim);margin:0 0 16px;font-size:.86rem">구글로 로그인하면, 그 계정의 꿈이 <b>모든 기기에서 실시간으로 같아져요.</b> 코드 입력도 새로고침도 필요 없어요.</p>' +
              (offline
                ? '<p style="color:var(--text-faint);margin:0;font-size:.85rem">⚠️ 지금은 오프라인이거나 로그인 모듈을 불러오지 못했어요. 인터넷 연결 후 다시 열어 주세요.</p>'
                : row('', '<button class="btn sm primary" id="cloudLogin"><span style="display:inline-flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C39.9 35.6 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>Google로 로그인</span></button>'))
          ) +
        '</div>';
      })() +
      '<div class="card" style="padding:24px 26px;max-width:680px">' +
        '<div class="eyebrow" style="margin-bottom:8px;color:var(--danger)">위험 구역</div>' +
        '<p style="color:var(--text-dim);margin:0 0 16px">모든 꿈과 도감 기록이 영구히 삭제됩니다.</p>' +
        '<button class="btn sm danger" id="clearBtn">전체 초기화</button>' +
      '</div>';

    document.getElementById('themeGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-card'); if (!btn) return;
      var id = btn.getAttribute('data-theme-id');
      Store.saveSettings({ theme: id });
      global.applyTheme(id);
      // 새 테마에 안 맞는 효과는 끄고(정합), 효과 피커를 새 목록으로 갱신
      var cur = Store.getSettings().effect;
      var compat = Store.effectsFor(id).some(function (f) { return f.id === cur; });
      if (!compat) { Store.saveSettings({ effect: 'none' }); }
      global.applyEffect(Store.getSettings().effect);
      settings(c);
    });
    document.getElementById('patternGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-card'); if (!btn) return;
      var id = btn.getAttribute('data-pattern-id');
      Store.saveSettings({ pattern: id });
      global.applyPattern(id);
      this.querySelectorAll('.theme-card').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
    });
    document.getElementById('effectGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-card'); if (!btn) return;
      var id = btn.getAttribute('data-effect-id');
      Store.saveSettings({ effect: id });
      global.applyEffect(id);
      this.querySelectorAll('.theme-card').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
    });
    document.getElementById('nickInput').addEventListener('change', function () {
      Store.setNickname(this.value);
      toast(tmsg('check', '닉네임을 저장했습니다.'));
    });
    document.getElementById('exportBtn').onclick = function () {
      var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'dreamdex-backup.json';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    };
    document.getElementById('importFile').addEventListener('change', function () {
      var file = this.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var n = Store.importJSON(reader.result);
          toast(tmsg('check', n + '개의 꿈을 불러왔습니다.'));
          setTimeout(function () { go('/'); global.location.reload(); }, 600);
        } catch (err) { toast(tmsg('warn', esc(err.message))); }
      };
      reader.readAsText(file);
    });
    document.getElementById('sampleBtn').onclick = function () {
      var run = function () {
        var n = loadSampleData();
        toast(tmsg('check', '예시 꿈 ' + n + '개를 불러왔습니다.'));
        setTimeout(function () { go('/'); global.location.reload(); }, 600);
      };
      if (Store.getDreams().length > 0) {
        confirmModal({
          title: '예시 데이터를 불러올까요?',
          message: '예시 꿈 ' + (global.SampleData || []).length + '개로 새로 채웁니다. 이미 불러온 예시는 갱신되고(중복 누적 없음), 직접 쓴 기록은 그대로 유지됩니다.',
          confirm: '불러오기'
        }).then(function (ok) { if (ok) run(); });
      } else { run(); }
    };
    document.getElementById('clearBtn').onclick = function () {
      var loggedIn = !!(global.Cloud && global.Cloud.isReady() && global.Cloud.currentUser());
      confirmModal({
        title: '정말 전체 초기화할까요?', danger: true, confirm: '모두 삭제',
        message: '모든 꿈 기록과 도감 진행이 사라지며 되돌릴 수 없습니다.' +
          (loggedIn ? ' 로그인 중이라 클라우드와 연결된 다른 기기의 데이터도 함께 삭제됩니다.' : '') +
          ' 먼저 백업을 권장합니다.'
      }).then(function (ok) {
        if (!ok) return;
        Store.clearAll();
        function done() { toast(tmsg('trash', '초기화되었습니다.')); setTimeout(function () { global.location.reload(); }, 500); }
        // 로그인 중이면 클라우드도 비워야 다시 안 내려받음 (clearAll 후라 페이로드가 비어있음)
        if (loggedIn) {
          var empty = Store.exportSyncData();
          global.Cloud.push(empty).then(function () { Store.setSyncStamp(empty.updatedAt); }).then(done, done);
        } else {
          done();
        }
      });
    };
    // 일기 잠금 PIN 관리 (PIN이 있을 때만 노출)
    var pinChange = document.getElementById('pinChange');
    if (pinChange) pinChange.onclick = function () {
      global.Lock.setPin(function (saved) { if (saved) toast(tmsg('check', 'PIN을 변경했어요.')); });
    };
    var pinClear = document.getElementById('pinClear');
    if (pinClear) pinClear.onclick = function () {
      confirmModal({ title: 'PIN을 삭제할까요?', message: '잠가둔 일기들이 모두 잠금 해제됩니다.', confirm: '삭제', danger: true })
        .then(function (ok) {
          if (!ok) return;
          Store.getDreams().forEach(function (dr) { if (dr.locked) Store.updateDream(dr.id, { locked: false }); });
          Store.clearLock();
          toast(tmsg('check', 'PIN을 삭제하고 잠금을 모두 풀었어요.'));
          settings(c);
        });
    };

    // 기기 간 동기화 (구글 로그인 + 실시간)
    var cloudLogin = document.getElementById('cloudLogin');
    if (cloudLogin) cloudLogin.onclick = function () {
      if (!global.Cloud) { toast(tmsg('warn', '로그인 모듈을 불러오지 못했어요.')); return; }
      cloudLogin.disabled = true;
      global.Cloud.signIn().then(function (res) {
        // 팝업 성공 → onUser 콜백이 화면을 갱신함. 리디렉트면 페이지가 이동함.
        if (res && res.user) toast(tmsg('check', '로그인됐어요.'));
      }).catch(function (err) {
        cloudLogin.disabled = false;
        toast(tmsg('warn', esc((err && err.message) || '로그인에 실패했어요.')));
      });
    };
    var cloudLogout = document.getElementById('cloudLogout');
    if (cloudLogout) cloudLogout.onclick = function () {
      confirmModal({ title: '로그아웃할까요?', message: '이 기기에서 로그아웃하고 처음 화면으로 돌아가요. 꿈 기록은 클라우드에 안전하게 남아, 다시 로그인하면 그대로 돌아옵니다.', confirm: '로그아웃', danger: true })
        .then(function (ok) {
          if (!ok || !global.Cloud) return;
          global.Cloud.signOut().then(function () {
            Store.logoutReset();         // 로컬 비우고 온보딩으로
            setTimeout(function () { global.location.reload(); }, 300);
          });
        });
    };
  }

  /* ============================ 조각 헬퍼 ============================ */
  function head(title, sub) {
    return '<div class="page-head"><h1>' + esc(title) + '</h1><p>' + esc(sub) + '</p></div>';
  }
  function metric(label, value, cls) {
    return '<div class="metric card' + (cls ? ' ' + cls : '') + '"><div class="label">' + esc(label) + '</div><div class="value">' + value + '</div></div>';
  }
  // 통계 지표 — 박스 없는 아이콘+숫자 스트립 항목
  function ssItem(icon, iconColor, label, value, valueColor) {
    return '<div class="ss-item">' +
      '<span class="ss-ic" style="color:' + iconColor + '">' + icon + '</span>' +
      '<div class="ss-label">' + esc(label) + '</div>' +
      '<div class="ss-value"' + (valueColor ? ' style="color:' + valueColor + '"' : '') + '>' + value + '</div>' +
      '</div>';
  }
  function row(label, control) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;gap:14px">' +
      '<span style="color:var(--text-dim);font-size:.92rem">' + esc(label) + '</span>' + control + '</div>';
  }
  function emptyCard(illustKey, title, desc, btnLabel, btnPath) {
    var btn = btnLabel ? '<div style="margin-top:18px"><button class="btn primary" data-go="' + btnPath + '">' + esc(btnLabel) + '</button></div>' : '';
    var el = '<div class="card empty view-enter"><div class="empty-art">' + global.Icons.empty(illustKey) + '</div>' +
      '<h3>' + esc(title) + '</h3>' + (desc ? '<p>' + esc(desc).replace(/\|\|/g, '<br class="br-m">') + '</p>' : '') + btn + '</div>';
    return el;
  }
  // 토스트 본문(글리프 + 텍스트)
  function tmsg(glyph, html) {
    return global.Icons.ui(glyph, { size: 16 }) + '<span>' + html + '</span>';
  }

  // 예시(데모) 데이터 적재 — 분류 후 저장. 적재 개수 반환.
  // 멱등: 여러 번 눌러도 중복이 쌓이지 않도록, 예시와 동일한(제목+내용) 기존 꿈·임시본을
  //       먼저 제거한 뒤 한 세트만 적재한다. (사용자가 직접 쓴 꿈은 보존)
  function loadSampleData() {
    var list = global.SampleData || [];
    var drafts = global.SampleDrafts || [];
    function sig(o) { return (o.title || '') + ' ' + (o.content || ''); }
    // 예시 세트에서 제거됐던 옛 항목들(누적분 정리용) — 제목만으로 매칭
    var LEGACY_TITLES = {
      '다시 그 학교': 1, '바다로의 도피': 1, '시간을 거슬러': 1, '거울의 방': 1,
      '물속 궁전': 1, '시험 또 시험': 1, '날아오른 바다': 1, '귀신 들린 병원': 1
    };
    var dreamSig = {}; list.forEach(function (s) { dreamSig[sig(s)] = true; });
    var draftSig = {}; drafts.forEach(function (s) { draftSig[sig(s)] = true; });
    Store.getDreams().forEach(function (d) {
      if (dreamSig[sig(d)] || LEGACY_TITLES[d.title]) Store.deleteDream(d.id);
    });
    Store.getDrafts().forEach(function (d) { if (draftSig[sig(d)]) Store.deleteDraft(d.id); });
    // 날짜를 '오늘' 기준 상대값으로 — 최근 7일은 연속(연속 기록 streak 채움), 이후 점점 띄움
    var today = new Date();
    function dayStr(offset) {
      var d = new Date(today); d.setDate(today.getDate() - offset);
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }
    list.forEach(function (s, i) {
      var offset = i < 7 ? i : 8 + (i - 7) * 2; // 0~6일전 연속, 8·10·12…일전 분산
      var payload = { title: s.title, date: dayStr(offset), content: s.content, emotion: s.emotion, locked: !!s.locked };
      payload.keywords = Classify.classifyDream(payload);
      Store.createDream(payload);
    });
    // 임시보관함에도 작성 중인 예시 글 적재
    (global.SampleDrafts || []).forEach(function (s, i) {
      Store.saveDraft({ title: s.title, content: s.content, date: dayStr(i), emotion: s.emotion });
    });
    return list.length;
  }
  // 잠긴 꿈이 아직 해제 안 됐으면 내용을 가린다
  function isHidden(d) { return !!(d && d.locked && global.Lock && !global.Lock.isUnlocked(d.id)); }

  function dreamCard(d, unlock, kwClickable, q) {
    if (isHidden(d)) {
      return '<div class="card dream-card dc-locked" data-id="' + d.id + '" data-locked="1">' +
        '<div class="dc-head"><div><div class="dc-title">잠긴 꿈</div>' +
        '<div class="dc-date">' + fmtDate(d.date) + '</div></div>' +
        '<span class="dc-lock">' + global.Icons.ui('lock', { size: 18 }) + '</span></div>' +
        '<div class="dc-excerpt dc-lock-msg">PIN을 입력하면 볼 수 있어요</div>' +
        '<div class="dc-foot"><span></span></div>' +
      '</div>';
    }
    var excerpt = (d.content || '').slice(0, 120);
    return '<div class="card dream-card" data-id="' + d.id + '">' +
      '<div class="dc-head"><div><div class="dc-title">' + hl(d.title, q) + '</div>' +
      '<div class="dc-date">' + fmtDate(d.date) + '</div></div>' +
      global.Icons.emotionSticker(d.emotion, 30) + '</div>' +
      '<div class="dc-excerpt">' + hl(excerpt, q) + (d.content.length > 120 ? '…' : '') + '</div>' +
      '<div class="dc-foot">' + (kwChipsHtml(d.keywords, unlock, !!kwClickable, 3) || '<span></span>') +
      '<button class="fav-btn ' + (d.favorite ? 'on' : '') + '" data-fav="' + d.id + '" aria-label="즐겨찾기">' +
      (d.favorite ? '★' : '☆') + '</button></div>' +
      '</div>';
  }
  // 위임은 문서 레벨에서 한 번만 처리되므로(아래 전역 리스너) per-view 바인딩은 불필요.
  function bindDreamCards(_scope) { /* no-op: 전역 위임 사용 */ }

  function byNewest(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  }

  // 전역 클릭 위임 (한 번만 등록 → 리스너 누적 없음)
  document.addEventListener('click', function (e) {
    // 1) 즐겨찾기 토글 (카드 클릭보다 먼저 처리)
    var fav = e.target.closest('[data-fav]');
    if (fav) {
      e.stopPropagation();
      var nd = Store.toggleFavorite(fav.getAttribute('data-fav'));
      fav.classList.toggle('on', nd.favorite);
      fav.textContent = nd.favorite ? '★' : '☆';
      return;
    }
    // 2) 키워드 칩 → 도감 키워드 상세
    var chip = e.target.closest('[data-kw]');
    if (chip) {
      var parts = chip.getAttribute('data-kw').split(':');
      go('/dex/' + parts[0] + '/' + parts[1]);
      return;
    }
    // 3) data-go 버튼 (빈 상태/없음 화면)
    var b = e.target.closest('[data-go]');
    if (b) { go(b.getAttribute('data-go')); return; }
    // 4·5) 꿈 카드 / 피처드·압축 행 → 상세 (잠긴 꿈은 PIN 확인 후)
    var card = e.target.closest('.dream-card');
    var drow = e.target.closest('[data-dream-id]');
    var did = card ? card.getAttribute('data-id') : (drow ? drow.getAttribute('data-dream-id') : null);
    if (did) {
      var dr = Store.getDream(did);
      if (dr && dr.locked && global.Lock && !global.Lock.isUnlocked(did)) {
        global.Lock.requirePin(function () { go('/dreams/' + did); }, did);
      } else { go('/dreams/' + did); }
    }
  });

  global.UI = { toast: toast, confirmModal: confirmModal, go: go };
  global.Views = {
    onboard: onboard, dashboard: dashboard, form: form, list: list,
    detail: detail, dex: dex, dexKeyword: dexKeyword, stats: stats,
    map: map, settings: settings, drafts: drafts
  };
})(window);
