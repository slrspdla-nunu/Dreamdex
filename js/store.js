/* =========================================================================
 * Dreamdex — 데이터 계층 (LocalStorage Store)
 * -------------------------------------------------------------------------
 * 저장하는 것은 단 3가지:
 *   - dreams[]    : 모든 꿈 기록 (모든 화면의 원천 데이터)
 *   - settings    : 테마 / 닉네임 / 온보딩 여부
 * 도감 현황·통계·지도는 저장하지 않고 dreams 에서 매번 계산한다(classify.js).
 * ========================================================================= */
(function (global) {
  'use strict';

  var KEY_DREAMS = 'dreamdex.dreams.v1';
  var KEY_SETTINGS = 'dreamdex.settings.v1';
  var KEY_DRAFTS = 'dreamdex.drafts.v1';

  /* 감정 정의 (단일 선택) — 표시는 Icons.emotion(id) 커스텀 글리프 사용 */
  // color 는 테마 토큰(var(--emo-*)) — CSS에서 테마 강조색과 섞여 자동 조화.
  // Chart.js 캔버스처럼 실제 색이 필요한 곳은 charts.js 에서 resolve 한다.
  var EMOTIONS = [
    { id: 'happy',   label: '행복',   color: 'var(--emo-happy)' },
    { id: 'wonder',  label: '신기함', color: 'var(--emo-wonder)' },
    { id: 'anxiety', label: '불안',   color: 'var(--emo-anxiety)' },
    { id: 'fear',    label: '공포',   color: 'var(--emo-fear)' },
    { id: 'sadness', label: '슬픔',   color: 'var(--emo-sadness)' },
    { id: 'longing', label: '그리움', color: 'var(--emo-longing)' }
  ];

  function emotionById(id) {
    for (var i = 0; i < EMOTIONS.length; i++) {
      if (EMOTIONS[i].id === id) return EMOTIONS[i];
    }
    return null;
  }

  /* --------------------------- 저수준 입출력 --------------------------- */
  function read(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[store] read 실패:', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[store] write 실패:', key, e);
      return false;
    }
  }

  /* ------------------------------ 아이디 ------------------------------ */
  var _seq = 0;
  function newId() {
    // Date.now 기반 + 시퀀스로 충돌 방지 (한 틱에 여러 개 생성 대비)
    _seq = (_seq + 1) % 1000;
    return 'd' + Date.now().toString(36) + _seq.toString(36);
  }

  /* ------------------------------ 설정 ------------------------------- */
  var VALID_THEMES = ['mongsil', 'pool', 'observatory', 'manuscript', 'specimen', 'amethyst', 'dawn', 'abyss',
                      'mist', 'lilac', 'mint'];
  var VALID_PATTERNS = ['none', 'dots', 'grid', 'diagonal', 'crosshatch', 'waves'];
  var VALID_EFFECTS = ['none', 'stars', 'shooting', 'aurora', 'petals', 'bubbles',
                       'softdots', 'glow', 'gradient', 'particles'];
  var LIGHT_THEMES = ['mongsil', 'pool', 'manuscript', 'dawn', 'mist', 'lilac', 'mint'];
  function isLightTheme(t) { return LIGHT_THEMES.indexOf(t) !== -1; }
  var DEFAULT_SETTINGS = {
    theme: 'mongsil',
    pattern: 'dots',
    effect: 'aurora',
    nickname: '',
    onboarded: false,
    lock: { on: false, pin: '' },  // 꿈 일기 잠금 (pin은 해시 저장)
    syncId: ''                     // 기기 간 동기화 코드(클라우드 blob id)
  };

  // 구버전 다크/라이트 저장값을 새 테마로 마이그레이션
  function migrateTheme(t) {
    if (t === 'dark') return 'observatory';
    if (t === 'light') return 'manuscript';
    if (VALID_THEMES.indexOf(t) !== -1) return t;
    return 'observatory';
  }

  function migratePattern(p) {
    return VALID_PATTERNS.indexOf(p) !== -1 ? p : 'none';
  }

  function migrateEffect(e) {
    return VALID_EFFECTS.indexOf(e) !== -1 ? e : 'none';
  }

  function getSettings() {
    var s = read(KEY_SETTINGS, null);
    var merged = s ? Object.assign({}, DEFAULT_SETTINGS, s) : Object.assign({}, DEFAULT_SETTINGS);
    merged.theme = migrateTheme(merged.theme);
    merged.pattern = migratePattern(merged.pattern);
    merged.effect = migrateEffect(merged.effect);
    return merged;
  }

  function saveSettings(patch) {
    var next = Object.assign(getSettings(), patch);
    write(KEY_SETTINGS, next);
    return next;
  }

  /* ----------------------------- 잠금(PIN) ----------------------------- */
  // 단순 해시 — 평문 PIN을 localStorage에 그대로 두지 않기 위함(강력한 보안 아님)
  function hashPin(pin) {
    var h = 5381, s = 'dreamdex:' + pin;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h = h >>> 0; }
    return 'h' + h.toString(36);
  }
  function hasPin() { var l = getSettings().lock; return !!(l && l.pin); }                  // PIN이 설정돼 있는가
  function appLockEnabled() { var l = getSettings().lock; return !!(l && l.on && l.pin); }   // 앱 전체 잠금(부팅 게이트)
  function setPin(pin) { var l = getSettings().lock || {}; return saveSettings({ lock: { on: !!l.on, pin: hashPin(String(pin)) } }); } // PIN만 설정(앱 게이트 변경 안 함)
  function setAppLock(on) { var l = getSettings().lock || {}; return saveSettings({ lock: { on: !!on, pin: l.pin || '' } }); }       // 앱 게이트 토글(PIN 유지)
  function clearLock() { return saveSettings({ lock: { on: false, pin: '' } }); }
  function verifyPin(pin) { var l = getSettings().lock; return !!(l && l.pin && l.pin === hashPin(String(pin))); }

  /* ----------------------------- 동기화 데이터 ----------------------------- */
  // 로컬 변경 알림(자동 동기화용) — app.js가 구독해 디바운스 업로드
  var changeFns = [];
  function onChange(fn) { if (typeof fn === 'function') changeFns.push(fn); }
  function emitChange() { for (var i = 0; i < changeFns.length; i++) { try { changeFns[i](); } catch (e) {} } }

  function exportSyncData() { return { v: 1, updatedAt: Date.now(), dreams: getDreams(), drafts: getDrafts() }; }
  function importSyncData(obj) {
    if (!obj || !Array.isArray(obj.dreams)) throw new Error('동기화 데이터가 올바르지 않아요');
    write(KEY_DREAMS, obj.dreams);
    if (Array.isArray(obj.drafts)) write(KEY_DRAFTS, obj.drafts);
    return obj.dreams.length;
  }
  function getSyncId() { return getSettings().syncId || ''; }
  function setSyncId(id) { return saveSettings({ syncId: id || '' }); }
  function getSyncStamp() { return getSettings().syncStamp || 0; }
  function setSyncStamp(ms) { return saveSettings({ syncStamp: ms || 0 }); }

  /* ------------------------------ 꿈 CRUD ----------------------------- */
  function getDreams() {
    var list = read(KEY_DREAMS, []);
    return Array.isArray(list) ? list : [];
  }

  function getDream(id) {
    var list = getDreams();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // data: { title, date, content, emotion } → 분류는 classify 가 호출 측에서 채워줌
  function createDream(data) {
    var list = getDreams();
    var now = Date.now();
    var dream = {
      id: newId(),
      title: (data.title || '').trim() || '제목 없는 꿈',
      date: data.date || new Date().toISOString().slice(0, 10),
      content: data.content || '',
      emotion: data.emotion || 'wonder',
      favorite: false,
      locked: !!data.locked,
      keywords: data.keywords || { place: [], person: [], situation: [] },
      createdAt: now,
      updatedAt: now
    };
    list.push(dream);
    write(KEY_DREAMS, list);
    emitChange();
    return dream;
  }

  function updateDream(id, patch) {
    var list = getDreams();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i] = Object.assign({}, list[i], patch, { updatedAt: Date.now() });
        write(KEY_DREAMS, list);
        emitChange();
        return list[i];
      }
    }
    return null;
  }

  function deleteDream(id) {
    var list = getDreams();
    var next = list.filter(function (d) { return d.id !== id; });
    write(KEY_DREAMS, next);
    if (next.length !== list.length) emitChange();
    return next.length !== list.length;
  }

  function toggleFavorite(id) {
    var d = getDream(id);
    if (!d) return null;
    return updateDream(id, { favorite: !d.favorite });
  }

  /* ----------------------------- 임시보관함(드래프트) ----------------------------- */
  function getDrafts() {
    var list = read(KEY_DRAFTS, []);
    return Array.isArray(list) ? list : [];
  }
  function getDraft(id) {
    var list = getDrafts();
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }
  // data: { title, content, date, emotion }. id 주어지고 존재하면 갱신, 아니면 새로 생성.
  function saveDraft(data, id) {
    var list = getDrafts();
    var now = Date.now();
    var fields = {
      title: (data.title || '').trim(),
      content: data.content || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      emotion: data.emotion || ''
    };
    if (id) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          list[i] = Object.assign({}, list[i], fields, { savedAt: now });
          write(KEY_DRAFTS, list);
          emitChange();
          return list[i];
        }
      }
    }
    var draft = Object.assign({ id: newId(), createdAt: now, savedAt: now }, fields);
    list.push(draft);
    write(KEY_DRAFTS, list);
    emitChange();
    return draft;
  }
  function deleteDraft(id) {
    var list = getDrafts();
    var next = list.filter(function (d) { return d.id !== id; });
    write(KEY_DRAFTS, next);
    if (next.length !== list.length) emitChange();
    return next.length !== list.length;
  }

  /* --------------------------- 내보내기/초기화 --------------------------- */
  function exportJSON() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      dreams: getDreams(),
      settings: getSettings()
    }, null, 2);
  }

  function importJSON(text) {
    var data = JSON.parse(text);
    if (!data || !Array.isArray(data.dreams)) {
      throw new Error('올바른 Dreamdex 백업 파일이 아닙니다.');
    }
    write(KEY_DREAMS, data.dreams);
    if (data.settings) write(KEY_SETTINGS, data.settings);
    return data.dreams.length;
  }

  function clearAll() {
    global.localStorage.removeItem(KEY_DREAMS);
    global.localStorage.removeItem(KEY_SETTINGS);
    global.localStorage.removeItem(KEY_DRAFTS);
  }

  /* 테마 메타 (설정 화면 스와치 피커용) */
  var THEMES = [
    { id: 'mongsil',     label: '몽실', desc: '포근한 구름빛 보라',
      swatch: ['#fbfaff', '#3d3858', '#7b55ea'] },
    { id: 'pool',        label: '수영장', desc: '청량한 물빛 수영장',
      swatch: ['#f0fbff', '#14414f', '#11a7c8'] },
    { id: 'observatory', label: '천문대', desc: '심야의 잉크빛 성좌',
      swatch: ['#0b1020', '#e9eafb', '#c9a04e'] },
    { id: 'manuscript',  label: '필사본', desc: '오래된 종이와 잉크',
      swatch: ['#efe6d2', '#2a2419', '#9a6b3f'] },
    { id: 'specimen',    label: '수장고', desc: '무채색 표본 카탈로그',
      swatch: ['#1a1d22', '#e7e9ec', '#7f8b96'] },
    { id: 'amethyst',    label: '자수정', desc: '보랏빛 꿈안개',
      swatch: ['#120a1e', '#f1eafb', '#c08adb'] },
    { id: 'dawn',        label: '여명', desc: '동트는 분홍빛 새벽',
      swatch: ['#f4ebf2', '#3a2630', '#b5567e'] },
    { id: 'abyss',       label: '심해', desc: '심해의 인광',
      swatch: ['#05161d', '#e2f3f4', '#43c6b8'] },
    { id: 'mist',        label: '안개', desc: '맑은 새벽 안개',
      swatch: ['#eef1f6', '#243040', '#4f7cac'] },
    { id: 'lilac',       label: '라일락', desc: '은은한 라일락빛',
      swatch: ['#f1ecf6', '#322a3d', '#8662b5'] },
    { id: 'mint',        label: '민트', desc: '산뜻한 박하빛',
      swatch: ['#e9f3ee', '#1f3329', '#2f9d78'] }
  ];

  /* 배경 패턴 메타 (설정 화면 피커용) */
  var PATTERNS = [
    { id: 'none',       label: '없음',   desc: '패턴 없이 깔끔하게' },
    { id: 'dots',       label: '도트',   desc: '점점이 박힌 작은 점' },
    { id: 'grid',       label: '모눈',   desc: '가는 격자 노트' },
    { id: 'diagonal',   label: '사선',   desc: '비스듬한 빗금' },
    { id: 'crosshatch', label: '격자무늬', desc: '교차하는 빗금' },
    { id: 'waves',      label: '물결',   desc: '겹치는 비늘 물결' }
  ];

  /* 배경 효과 메타 (움직이는 효과 · 설정 화면 피커용)
   * mode: 'both' 공통 · 'dark' 다크 테마 전용 · 'light' 밝은 테마 전용 */
  var EFFECTS = [
    { id: 'none',     label: '없음',   desc: '움직임 없이 고요하게',   mode: 'both' },
    { id: 'stars',    label: '별빛',   desc: '반짝이는 밤하늘 별',     mode: 'dark' },
    { id: 'shooting', label: '유성우', desc: '가끔 흐르는 별똥별',     mode: 'dark' },
    { id: 'aurora',   label: '오로라', desc: '천천히 흐르는 빛 무리',  mode: 'both' },
    { id: 'petals',   label: '꽃잎',   desc: '흩날리며 떨어지는 꽃잎', mode: 'light' },
    { id: 'bubbles',  label: '비눗방울', desc: '두둥실 떠오르는 방울',  mode: 'light' },
    { id: 'softdots', label: '은은한 점', desc: '부드러운 점 효과',     mode: 'both' },
    { id: 'glow',     label: '빛 번짐',  desc: '은은한 빛 효과',        mode: 'both' },
    { id: 'gradient', label: '그라데이션', desc: '부드러운 색상 변화',  mode: 'both' },
    { id: 'particles', label: '입자',    desc: '자연스러운 입자 효과',  mode: 'both' }
  ];

  // 현재 테마 밝기에 맞는 효과 목록 (피커용)
  function effectsFor(theme) {
    var light = isLightTheme(theme);
    return EFFECTS.filter(function (f) {
      return f.mode === 'both' || f.mode === (light ? 'light' : 'dark');
    });
  }

  global.Store = {
    EMOTIONS: EMOTIONS,
    THEMES: THEMES,
    PATTERNS: PATTERNS,
    EFFECTS: EFFECTS,
    VALID_THEMES: VALID_THEMES,
    VALID_PATTERNS: VALID_PATTERNS,
    VALID_EFFECTS: VALID_EFFECTS,
    isLightTheme: isLightTheme,
    effectsFor: effectsFor,
    emotionById: emotionById,
    getSettings: getSettings,
    saveSettings: saveSettings,
    hasPin: hasPin,
    appLockEnabled: appLockEnabled,
    setPin: setPin,
    setAppLock: setAppLock,
    clearLock: clearLock,
    verifyPin: verifyPin,
    exportSyncData: exportSyncData,
    importSyncData: importSyncData,
    getSyncId: getSyncId,
    setSyncId: setSyncId,
    getSyncStamp: getSyncStamp,
    setSyncStamp: setSyncStamp,
    onChange: onChange,
    getDreams: getDreams,
    getDream: getDream,
    createDream: createDream,
    updateDream: updateDream,
    deleteDream: deleteDream,
    toggleFavorite: toggleFavorite,
    getDrafts: getDrafts,
    getDraft: getDraft,
    saveDraft: saveDraft,
    deleteDraft: deleteDraft,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clearAll: clearAll
  };
})(window);
