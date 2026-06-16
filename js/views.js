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
      function close(v) { if (host.parentNode) host.parentNode.removeChild(host); resolve(v); }
      host.addEventListener('click', function (e) {
        if (e.target === host) close(false);
        var act = e.target.getAttribute('data-act');
        if (act === 'ok') close(true);
        if (act === 'cancel') close(false);
      });
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

  function kwChipsHtml(keywords, unlock, clickable) {
    var list = visibleKeywords(keywords, unlock);
    if (!list.length) return '';
    return '<div class="kw-chips">' + list.map(function (k) {
      var attr = clickable ? ' data-kw="' + k.cat + ':' + k.id + '"' : '';
      return '<span class="kw-chip cat-' + k.cat + '"' + attr + '>' + esc(k.name) + '</span>';
    }).join('') + '</div>';
  }

  /* ============================ 온보딩 ============================ */
  function onboard(c) {
    document.getElementById('appShell').style.display = 'none';
    var host = document.getElementById('onboardHost');
    host.style.display = 'block';
    host.innerHTML =
      '<div class="onboard"><div class="card onboard-card view-enter">' +
      '<div class="big-logo">' + global.Icons.logo(40) + '</div>' +
      '<h1>Dreamdex</h1>' +
      '<div class="quote">"꿈은 사라지는 기록이 아니라, 수집 가능한 데이터이다."</div>' +
      '<p>당신의 무의식을 기록하면 꿈 속 장소·인물·상황이 자동으로 분류되어<br>나만의 도감으로 채워집니다.</p>' +
      '<div class="field" style="text-align:left">' +
      '<label for="nick">어떻게 불러드릴까요? <span style="color:var(--text-faint)">(선택)</span></label>' +
      '<input id="nick" class="input" placeholder="닉네임" maxlength="20">' +
      '</div>' +
      '<button class="btn primary" id="startBtn" style="width:100%;justify-content:center">꿈 기록 시작하기</button>' +
      '</div></div>';

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

    if (dreams.length === 0) {
      c.innerHTML =
        '<div class="dash-hero view-enter">' +
          '<div class="eyebrow">' + fmtDate(todayIso) + '</div>' +
          '<h1>' + hello + '보관소</h1>' +
          '<p class="dash-sub">아직 비어 있는 당신의 무의식 보관소입니다.</p>' +
        '</div>' +
        '<div class="card empty view-enter"><div class="empty-art">' + global.Icons.empty('archive') + '</div>' +
          '<h3>첫 번째 꿈을 기록해보세요</h3>' +
          '<p>꿈을 기록하면 그 속의 장소·인물·상황이 자동으로 도감에 수집됩니다.<br>' +
          '둘러보고 싶다면 예시 데이터를 불러와 모든 기능을 확인할 수 있습니다.</p>' +
          '<div class="empty-actions">' +
            '<button class="btn primary" data-go="/new">＋ 첫 꿈 기록하기</button>' +
            '<button class="btn ghost" id="sampleBtnDash">예시 데이터로 둘러보기</button>' +
          '</div></div>';
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

    // 피처드(가장 최근) 꿈
    var featExcerpt = (feat.content || '').slice(0, 200);
    var featHtml =
      '<article class="card feature-card" data-dream-id="' + feat.id + '">' +
        '<div class="feature-top"><span class="eyebrow">' + fmtDate(feat.date) + ' · 가장 최근의 꿈</span>' +
        emotionBadge(feat.emotion) + '</div>' +
        '<h2 class="feature-title">' + esc(feat.title) + '</h2>' +
        '<p class="feature-excerpt">' + esc(featExcerpt) + (feat.content.length > 200 ? '…' : '') + '</p>' +
        (kwChipsHtml(feat.keywords, dex.unlock, false) || '') +
      '</article>';

    // 압축 최근 목록
    var restHtml = rest.length
      ? '<div class="recent-list">' + rest.map(compactRow).join('') + '</div>'
      : '';

    // 수집 진행 레일 카드
    var catRows = DICT.categories.map(function (cat) {
      var info = dex[cat];
      return '<div class="rail-cat">' +
        '<div class="rail-cat-top"><span>' + info.label + '</span>' +
        '<span class="rail-frac">' + info.discovered + '<i>/' + info.total + '</i></span></div>' +
        '<div class="progress"><span style="width:' + info.percent + '%"></span></div></div>';
    }).join('');
    var nextLine = next
      ? '<span class="rail-next-n">' + next.remaining + '개</span> 더 기록하면 · ' + esc(next.milestone.title)
      : '모든 마일스톤을 해금했습니다';
    var collectionCard =
      '<div class="card rail-card">' +
        '<div class="rail-head"><span class="eyebrow">수집 진행</span>' +
        '<b>' + dex.overall.percent + '%</b></div>' +
        catRows +
        '<div class="rail-next">' + nextLine + '</div>' +
      '</div>';

    // 감정 흐름 카드
    var trendCard =
      '<div class="card rail-card">' +
        '<div class="rail-head"><span class="eyebrow">감정 흐름</span>' +
        '<span class="rail-sub">최근 ' + Math.min(dreams.length, 18) + '개</span></div>' +
        emotionTrendHtml(dreams) +
        '<div class="trend-cap">위로 갈수록 밝은 감정</div>' +
      '</div>';

    c.innerHTML =
      '<div class="dash-hero view-enter">' +
        '<div class="eyebrow">' + fmtDate(todayIso) + '</div>' +
        '<h1>' + hello + '보관소</h1>' +
        '<p class="dash-stats">' +
          '<b>' + dreams.length + '</b> 개의 꿈 <span class="sep">·</span> ' +
          '도감 <b>' + dex.overall.percent + '%</b> <span class="sep">·</span> ' +
          '최근 30일 <b>' + stats.recent30 + '</b>개' +
        '</p>' +
      '</div>' +
      '<div class="dash-grid view-enter">' +
        '<div class="dash-main">' +
          featHtml +
          (restHtml ? '<div class="recent-head"><span class="eyebrow">최근 기록</span>' +
            '<button class="btn sm ghost" id="moreBtn">전체 보기 →</button></div>' + restHtml : '') +
        '</div>' +
        '<aside class="dash-rail">' + collectionCard + trendCard + '</aside>' +
      '</div>';

    var mb = document.getElementById('moreBtn');
    if (mb) mb.onclick = function () { go('/dreams'); };
  }

  // 대시보드 압축 행
  function compactRow(d) {
    var e = Store.emotionById(d.emotion) || {};
    return '<button class="recent-row" data-dream-id="' + d.id + '">' +
      '<span class="rr-emo" style="color:' + (e.color || 'var(--accent)') + '">' + global.Icons.emotion(d.emotion, 15) + '</span>' +
      '<span class="rr-title">' + esc(d.title) + '</span>' +
      '<span class="rr-date">' + fmtShort(d.date) + '</span>' +
      '</button>';
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
        '" style="height:' + h + '%;background:' + (e.color || 'var(--accent)') + '"></span>';
    }).join('');
    return '<div class="trend-bars">' + bars + '</div>';
  }

  /* ============================ 작성/수정 ============================ */
  function form(c, params) {
    var editing = params && params.id ? Store.getDream(params.id) : null;
    var today = new Date().toISOString().slice(0, 10);
    var d = editing || { title: '', date: today, content: '', emotion: '' };

    var chips = Store.EMOTIONS.map(function (e) {
      var sel = d.emotion === e.id ? ' selected' : '';
      return '<button type="button" class="emotion-chip' + sel + '" data-emo="' + e.id +
        '" style="--em-color:' + e.color + ';' + (sel ? 'color:' + e.color : '') + '">' +
        global.Icons.emotion(e.id, 16) + e.label + '</button>';
    }).join('');

    c.innerHTML = head(editing ? '꿈 수정' : '꿈 기록', '기억이 흐려지기 전에 남겨두세요.') +
      '<div class="card view-enter" style="padding:28px;max-width:760px">' +
      '<form id="dreamForm">' +
        '<div class="field"><label for="f-title">제목</label>' +
          '<input id="f-title" class="input" maxlength="60" placeholder="꿈에 제목을 붙인다면?" value="' + esc(d.title) + '"></div>' +
        '<div class="field" style="max-width:240px"><label for="f-date">날짜</label>' +
          '<input id="f-date" type="date" class="input" value="' + esc(d.date) + '"></div>' +
        '<div class="field"><label>감정 <span style="color:var(--text-faint)">(하나 선택)</span></label>' +
          '<div class="emotion-row" id="emoRow">' + chips + '</div></div>' +
        '<div class="field"><label for="f-content">꿈 내용</label>' +
          '<textarea id="f-content" class="textarea" placeholder="꿈에서 본 장소, 만난 사람, 일어난 일을 자유롭게 적어보세요. 자세할수록 더 많은 키워드가 수집됩니다.">' + esc(d.content) + '</textarea>' +
          '<div style="font-size:.78rem;color:var(--text-faint);margin-top:8px;display:flex;align-items:center;gap:6px">' + global.Icons.ui('spark', { size: 13 }) + '<span>저장하면 내용 속 장소·인물·상황이 자동으로 도감에 등록됩니다.</span></div></div>' +
        '<div style="display:flex;gap:10px;margin-top:8px">' +
          '<button type="submit" class="btn primary">' + (editing ? '수정 저장' : '기록하고 수집하기') + '</button>' +
          '<button type="button" class="btn ghost" id="cancelBtn">취소</button>' +
        '</div>' +
      '</form></div>';

    var selectedEmo = d.emotion || '';
    var emoRow = document.getElementById('emoRow');
    emoRow.addEventListener('click', function (e) {
      var btn = e.target.closest('.emotion-chip');
      if (!btn) return;
      selectedEmo = btn.getAttribute('data-emo');
      emoRow.querySelectorAll('.emotion-chip').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('selected', on);
        var col = Store.emotionById(b.getAttribute('data-emo')).color;
        b.style.color = on ? col : '';
      });
    });

    document.getElementById('cancelBtn').onclick = function () {
      go(editing ? '/dreams/' + editing.id : '/');
    };

    document.getElementById('dreamForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = document.getElementById('f-title').value.trim();
      var content = document.getElementById('f-content').value.trim();
      var date = document.getElementById('f-date').value || today;
      if (!content) { toast(tmsg('warn', '꿈 내용을 입력해주세요.')); return; }
      if (!selectedEmo) { toast(tmsg('warn', '감정을 하나 선택해주세요.')); return; }

      var payload = { title: title, content: content, date: date, emotion: selectedEmo };
      payload.keywords = Classify.classifyDream(payload);

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

  /* ============================ 목록 ============================ */
  var listState = { q: '', emotion: 'all', fav: false };

  function list(c) {
    var unlock = Classify.unlockState(Store.getDreams().length);

    var emoFilters = '<button class="fchip' + (listState.emotion === 'all' ? ' active' : '') +
      '" data-emo="all">전체</button>' +
      Store.EMOTIONS.map(function (e) {
        return '<button class="fchip' + (listState.emotion === e.id ? ' active' : '') +
          '" data-emo="' + e.id + '">' + global.Icons.emotion(e.id, 14) + e.label + '</button>';
      }).join('');

    c.innerHTML = head('아카이브', '수집한 꿈을 검색하고 되짚어보세요.') +
      '<div class="toolbar">' +
        '<div class="search"><span class="ic">' + global.Icons.ui('search', { size: 16 }) + '</span>' +
        '<input id="searchInput" class="input" placeholder="제목·내용 검색" value="' + esc(listState.q) + '"></div>' +
        '<button class="fchip' + (listState.fav ? ' active' : '') + '" id="favFilter">★ 즐겨찾기</button>' +
      '</div>' +
      '<div class="filter-chips" id="emoFilters" style="margin-bottom:20px">' + emoFilters + '</div>' +
      '<div id="listResult"></div>';

    function renderResult() {
      var dreams = Store.getDreams().slice().sort(byNewest);
      var q = listState.q.trim().toLowerCase();
      var filtered = dreams.filter(function (d) {
        if (listState.fav && !d.favorite) return false;
        if (listState.emotion !== 'all' && d.emotion !== listState.emotion) return false;
        if (q && (d.title + ' ' + d.content).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      var host = document.getElementById('listResult');
      if (!dreams.length) {
        host.innerHTML = emptyCard('archive', '아직 기록한 꿈이 없습니다', '첫 꿈을 기록하면 이곳에 카드로 쌓입니다.', '＋ 꿈 기록하기', '/new');
      } else if (!filtered.length) {
        host.innerHTML = emptyCard('search', '검색 결과가 없습니다', '다른 검색어나 필터를 시도해보세요.');
      } else {
        host.innerHTML = '<div class="dream-grid view-enter">' +
          filtered.map(function (d) { return dreamCard(d, unlock); }).join('') + '</div>';
      }
    }
    // 위임 바인딩은 한 번만 (host 엘리먼트는 재사용, innerHTML 만 교체됨)
    bindDreamCards(document.getElementById('listResult'));

    var si = document.getElementById('searchInput');
    si.addEventListener('input', function () { listState.q = si.value; renderResult(); });
    document.getElementById('favFilter').onclick = function () {
      listState.fav = !listState.fav;
      this.classList.toggle('active', listState.fav);
      renderResult();
    };
    document.getElementById('emoFilters').addEventListener('click', function (e) {
      var b = e.target.closest('.fchip'); if (!b) return;
      listState.emotion = b.getAttribute('data-emo');
      this.querySelectorAll('.fchip').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      renderResult();
    });
    renderResult();
  }

  /* ============================ 상세 ============================ */
  function detail(c, params) {
    var d = Store.getDream(params.id);
    if (!d) { c.innerHTML = emptyCard('error', '꿈을 찾을 수 없습니다', '삭제되었거나 잘못된 주소입니다.', '아카이브로', '/dreams'); return; }
    var unlock = Classify.unlockState(Store.getDreams().length);
    var kw = kwChipsHtml(d.keywords, unlock, true);

    c.innerHTML =
      '<button class="btn sm ghost" id="backBtn" style="margin-bottom:18px">← 아카이브</button>' +
      '<div class="detail-head view-enter">' +
        '<div><h1 style="margin:0 0 8px;font-size:1.6rem">' + esc(d.title) + '</h1>' +
          '<div class="detail-meta">' + emotionBadge(d.emotion) +
          '<span class="eyebrow">' + fmtDate(d.date) + '</span></div></div>' +
        '<div class="detail-actions">' +
          '<button class="fav-btn ' + (d.favorite ? 'on' : '') + '" id="favBtn" title="즐겨찾기" aria-label="즐겨찾기">' +
          (d.favorite ? '★' : '☆') + '</button>' +
          '<button class="btn sm" id="editBtn">수정</button>' +
          '<button class="btn sm danger" id="delBtn">삭제</button>' +
        '</div>' +
      '</div>' +
      '<div class="card detail-body view-enter">' + esc(d.content).replace(/\n/g, '<br>') + '</div>' +
      (kw ? '<div class="section-label">이 꿈에서 수집한 흔적</div>' + kw : '');

    document.getElementById('backBtn').onclick = function () { go('/dreams'); };
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

    var summary = DICT.categories.map(function (cc) {
      var info = dx[cc];
      return '<div class="card dex-cat-card">' +
        '<div class="dc-top"><span class="dc-name">' + info.label + '</span>' +
        '<span class="dc-frac">' + info.discovered + '<small> / ' + info.total + '</small></span></div>' +
        '<div class="progress"><span style="width:' + info.percent + '%"></span></div></div>';
    }).join('');

    var tabs = DICT.categories.map(function (cc) {
      return '<button class="fchip' + (cc === cat ? ' active' : '') + '" data-cat="' + cc + '">' +
        DICT[cc].label + ' ' + dx[cc].discovered + '/' + dx[cc].total + '</button>';
    }).join('');

    c.innerHTML = head('Dreamdex 도감', '꿈에서 발견한 흔적을 수집하는 무의식 도감입니다.') +
      '<div class="dex-summary view-enter">' + summary + '</div>' +
      '<div class="card" style="padding:14px 16px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
        '<span style="color:var(--text-dim);font-size:.9rem">전체 완성률</span>' +
        '<div style="flex:1;min-width:160px"><div class="progress"><span style="width:' + dx.overall.percent + '%"></span></div></div>' +
        '<b>' + dx.overall.percent + '% (' + dx.overall.discovered + '/' + dx.overall.total + ')</b>' +
      '</div>' +
      '<div class="dex-tabs" id="dexTabs">' + tabs + '</div>' +
      '<div id="dexGrid"></div>';

    function renderGrid() {
      var info = dx[cat];
      var html = '<div class="dex-grid view-enter">' + info.slots.map(function (s) {
        var tierTag = s.tier === 'rare' ? '<span class="tier-tag tier-rare">희귀</span>'
          : s.tier === 'hidden' ? '<span class="tier-tag tier-hidden">숨김</span>' : '';
        if (s.count > 0) {
          return '<div class="dex-slot found" data-id="' + s.id + '">' + tierTag +
            '<div class="ds-name">' + esc(s.name) + '</div>' +
            '<div class="ds-count">' + s.count + '회 발견</div></div>';
        }
        // 미발견: 발견 가능하면 ??? / 아직 잠긴 tier 면 자물쇠
        var locked = !s.discoverable;
        var label = locked ? global.Icons.ui('lock', { size: 18 }) : '???';
        return '<div class="dex-slot locked">' + tierTag +
          '<div class="ds-name">' + label + '</div>' +
          '<div class="ds-count">' + (locked ? tierHint(s.tier) : '미발견') + '</div></div>';
      }).join('') + '</div>';
      document.getElementById('dexGrid').innerHTML = html;
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
      '<div class="card view-enter" style="padding:26px 28px;margin-bottom:22px">' +
        '<div style="font-size:.78rem;color:var(--text-faint);letter-spacing:1px">' + DICT[cat].label.toUpperCase() + '</div>' +
        '<h1 style="margin:6px 0 4px;font-size:1.7rem">' + esc(item.name) +
        (item.tier === 'rare' ? ' <span class="tier-tag tier-rare">희귀</span>' :
         item.tier === 'hidden' ? ' <span class="tier-tag tier-hidden">숨김</span>' : '') + '</h1>' +
        '<div style="color:var(--text-dim);font-size:.9rem">' +
          (slot && slot.count ? slot.count + '개의 꿈에서 발견 · 첫 발견 ' + fmtDate(slot.firstSeen) : '아직 발견하지 못한 흔적입니다.') +
        '</div></div>' +
      (related.length
        ? '<div class="section-label">이 흔적이 등장한 꿈</div><div class="dream-grid">' +
          related.map(function (d) { return dreamCard(d, unlock); }).join('') + '</div>'
        : emptyCard('archive', '아직 이 흔적을 수집하지 못했습니다', '관련된 꿈을 기록하면 이곳에 나타납니다.'));

    document.getElementById('backBtn').onclick = function () { go('/dex/' + cat); };
    bindDreamCards(c);
  }

  /* ============================ 통계 ============================ */
  function stats(c) {
    var dreams = Store.getDreams();
    var st = Classify.buildStats(dreams);

    if (!dreams.length) {
      c.innerHTML = head('통계', '꿈 데이터가 쌓이면 패턴이 보입니다.') +
        emptyCard('stats', '아직 분석할 데이터가 없습니다', '꿈을 기록하면 감정 분포와 패턴을 시각화합니다.', '＋ 꿈 기록하기', '/new');
      return;
    }

    c.innerHTML = head('통계', '당신의 무의식이 그리는 패턴을 들여다보세요.') +
      '<div class="grid cols-4 view-enter" style="margin-bottom:18px">' +
        metric('총 꿈 개수', st.total + '<small> 개</small>') +
        metric('최근 30일 기록', st.recent30 + '<small> 개</small>') +
        '<div class="metric card"><div class="label">가장 많은 감정</div>' +
          '<div style="margin-top:8px">' + (st.topEmotion ? emotionBadge(st.topEmotion) : '-') + '</div></div>' +
        metric('가장 많은 장소', st.topPlaceName ? esc(st.topPlaceName) : '-') +
      '</div>' +
      '<div class="stats-grid view-enter">' +
        '<div class="card chart-wrap">' +
          '<div class="eyebrow" style="margin-bottom:14px">감정 분포</div>' +
          '<div class="chart-box"><canvas id="emoChart"></canvas></div>' +
        '</div>' +
        '<div class="card chart-wrap">' +
          '<div class="rail-head"><span class="eyebrow">감정 흐름</span>' +
          '<span class="rail-sub">최근 ' + Math.min(dreams.length, 18) + '개</span></div>' +
          emotionTrendHtml(dreams) +
          '<div class="trend-cap">위로 갈수록 밝은 감정 · 왼쪽이 오래된 기록</div>' +
        '</div>' +
      '</div>';

    global.Viz.renderEmotionChart(document.getElementById('emoChart'), st);
  }

  /* ============================ 꿈 지도 ============================ */
  function map(c) {
    var dreams = Store.getDreams();
    var unlock = Classify.unlockState(dreams.length);

    if (!unlock.mapOpen) {
      c.innerHTML = head('꿈 지도', '꿈 속 요소들의 연결을 탐험합니다.') +
        emptyCard('map', '꿈 지도는 10개의 꿈에서 열립니다',
          '현재 ' + dreams.length + '개 · ' + (10 - dreams.length) + '개를 더 기록하면 무의식의 연결망이 그려집니다.',
          '＋ 꿈 기록하기', '/new');
      return;
    }

    var graph = Classify.buildGraph(dreams, 26);
    if (!graph.nodes.length) {
      c.innerHTML = head('꿈 지도', '꿈 속 요소들의 연결을 탐험합니다.') +
        emptyCard('map', '아직 그릴 연결이 없습니다', '키워드가 등장하는 꿈을 더 기록해보세요.');
      return;
    }

    c.innerHTML = head('꿈 지도', '같은 꿈에 함께 나타난 요소들이 서로 연결됩니다. 노드를 눌러보세요.') +
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

    c.innerHTML = head('설정', '보관소를 관리합니다.') +
      '<div class="card view-enter" style="padding:24px 26px;max-width:680px;margin-bottom:18px">' +
        '<div class="eyebrow" style="margin-bottom:14px">테마</div>' +
        '<div class="theme-grid" id="themeGrid">' + themeCards + '</div>' +
        '<div style="border-top:1px solid var(--border);margin:20px 0 4px"></div>' +
        row('닉네임', '<input id="nickInput" class="input" style="max-width:220px" value="' + esc(s.nickname) + '" placeholder="닉네임">') +
      '</div>' +
      '<div class="card" style="padding:24px 26px;max-width:680px;margin-bottom:18px">' +
        '<div class="eyebrow" style="margin-bottom:14px">데이터 · ' + count + '개 기록</div>' +
        row('백업', '<button class="btn sm" id="exportBtn">JSON 내보내기</button>') +
        row('복원', '<label class="btn sm" style="cursor:pointer">파일 가져오기<input type="file" id="importFile" accept="application/json,.json" hidden></label>') +
        row('예시', '<button class="btn sm" id="sampleBtn">예시 데이터 불러오기</button>') +
      '</div>' +
      '<div class="card" style="padding:24px 26px;max-width:680px">' +
        '<div class="eyebrow" style="margin-bottom:8px;color:var(--danger)">위험 구역</div>' +
        '<p style="color:var(--text-dim);font-size:.86rem;margin:0 0 16px">모든 꿈과 도감 기록이 영구히 삭제됩니다.</p>' +
        '<button class="btn sm danger" id="clearBtn">전체 초기화</button>' +
      '</div>';

    document.getElementById('themeGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-card'); if (!btn) return;
      var id = btn.getAttribute('data-theme-id');
      Store.saveSettings({ theme: id });
      global.applyTheme(id);
      this.querySelectorAll('.theme-card').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
    });
    document.getElementById('nickInput').addEventListener('change', function () {
      Store.saveSettings({ nickname: this.value.trim() });
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
          title: '예시 데이터를 추가할까요?',
          message: '기존 기록은 그대로 두고 예시 꿈 ' + (global.SampleData || []).length + '개가 더해집니다.',
          confirm: '추가'
        }).then(function (ok) { if (ok) run(); });
      } else { run(); }
    };
    document.getElementById('clearBtn').onclick = function () {
      confirmModal({
        title: '정말 전체 초기화할까요?', danger: true, confirm: '모두 삭제',
        message: '모든 꿈 기록과 도감 진행이 사라지며 되돌릴 수 없습니다. 먼저 백업을 권장합니다.'
      }).then(function (ok) {
        if (ok) { Store.clearAll(); toast(tmsg('trash', '초기화되었습니다.')); setTimeout(function () { global.location.reload(); }, 500); }
      });
    };
  }

  /* ============================ 조각 헬퍼 ============================ */
  function head(title, sub) {
    return '<div class="page-head"><h1>' + esc(title) + '</h1><p>' + esc(sub) + '</p></div>';
  }
  function metric(label, value) {
    return '<div class="metric card"><div class="label">' + esc(label) + '</div><div class="value">' + value + '</div></div>';
  }
  function row(label, control) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;gap:14px">' +
      '<span style="color:var(--text-dim);font-size:.92rem">' + esc(label) + '</span>' + control + '</div>';
  }
  function emptyCard(illustKey, title, desc, btnLabel, btnPath) {
    var btn = btnLabel ? '<div style="margin-top:18px"><button class="btn primary" data-go="' + btnPath + '">' + esc(btnLabel) + '</button></div>' : '';
    var el = '<div class="card empty view-enter"><div class="empty-art">' + global.Icons.empty(illustKey) + '</div>' +
      '<h3>' + esc(title) + '</h3>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + btn + '</div>';
    return el;
  }
  // 토스트 본문(글리프 + 텍스트)
  function tmsg(glyph, html) {
    return global.Icons.ui(glyph, { size: 16 }) + '<span>' + html + '</span>';
  }

  // 예시(데모) 데이터 적재 — 분류 후 저장. 적재 개수 반환.
  function loadSampleData() {
    var list = global.SampleData || [];
    list.forEach(function (s) {
      var payload = { title: s.title, date: s.date, content: s.content, emotion: s.emotion };
      payload.keywords = Classify.classifyDream(payload);
      Store.createDream(payload);
    });
    return list.length;
  }
  function dreamCard(d, unlock) {
    var excerpt = (d.content || '').slice(0, 120);
    return '<div class="card dream-card" data-id="' + d.id + '">' +
      '<div class="dc-head"><div><div class="dc-title">' + esc(d.title) + '</div>' +
      '<div class="dc-date">' + fmtDate(d.date) + '</div></div>' +
      emotionBadge(d.emotion) + '</div>' +
      '<div class="dc-excerpt">' + esc(excerpt) + (d.content.length > 120 ? '…' : '') + '</div>' +
      '<div class="dc-foot">' + (kwChipsHtml(d.keywords, unlock, false) || '<span></span>') +
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
    // 4) 꿈 카드 → 상세
    var card = e.target.closest('.dream-card');
    if (card) { go('/dreams/' + card.getAttribute('data-id')); return; }
    // 5) 피처드/압축 행 → 상세
    var drow = e.target.closest('[data-dream-id]');
    if (drow) go('/dreams/' + drow.getAttribute('data-dream-id'));
  });

  global.UI = { toast: toast, confirmModal: confirmModal, go: go };
  global.Views = {
    onboard: onboard, dashboard: dashboard, form: form, list: list,
    detail: detail, dex: dex, dexKeyword: dexKeyword, stats: stats,
    map: map, settings: settings
  };
})(window);
