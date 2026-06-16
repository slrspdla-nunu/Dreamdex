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

  /* 감정 정의 (단일 선택) — 표시는 Icons.emotion(id) 커스텀 글리프 사용 */
  var EMOTIONS = [
    { id: 'happy',   label: '행복',   color: '#f5c451' },
    { id: 'wonder',  label: '신기함', color: '#56cdbe' },
    { id: 'anxiety', label: '불안',   color: '#e8995a' },
    { id: 'fear',    label: '공포',   color: '#8a7ef0' },
    { id: 'sadness', label: '슬픔',   color: '#5b9bd5' },
    { id: 'longing', label: '그리움', color: '#e08bb5' }
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
  var VALID_THEMES = ['observatory', 'manuscript', 'specimen'];
  var DEFAULT_SETTINGS = {
    theme: 'observatory',
    nickname: '',
    onboarded: false
  };

  // 구버전 다크/라이트 저장값을 새 테마로 마이그레이션
  function migrateTheme(t) {
    if (t === 'dark') return 'observatory';
    if (t === 'light') return 'manuscript';
    if (VALID_THEMES.indexOf(t) !== -1) return t;
    return 'observatory';
  }

  function getSettings() {
    var s = read(KEY_SETTINGS, null);
    var merged = s ? Object.assign({}, DEFAULT_SETTINGS, s) : Object.assign({}, DEFAULT_SETTINGS);
    merged.theme = migrateTheme(merged.theme);
    return merged;
  }

  function saveSettings(patch) {
    var next = Object.assign(getSettings(), patch);
    write(KEY_SETTINGS, next);
    return next;
  }

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
      keywords: data.keywords || { place: [], person: [], situation: [] },
      createdAt: now,
      updatedAt: now
    };
    list.push(dream);
    write(KEY_DREAMS, list);
    return dream;
  }

  function updateDream(id, patch) {
    var list = getDreams();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i] = Object.assign({}, list[i], patch, { updatedAt: Date.now() });
        write(KEY_DREAMS, list);
        return list[i];
      }
    }
    return null;
  }

  function deleteDream(id) {
    var list = getDreams();
    var next = list.filter(function (d) { return d.id !== id; });
    write(KEY_DREAMS, next);
    return next.length !== list.length;
  }

  function toggleFavorite(id) {
    var d = getDream(id);
    if (!d) return null;
    return updateDream(id, { favorite: !d.favorite });
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
  }

  /* 테마 메타 (설정 화면 스와치 피커용) */
  var THEMES = [
    { id: 'observatory', label: '천문대', desc: '심야의 잉크빛 성좌',
      swatch: ['#0b1020', '#e9eafb', '#c9a04e'] },
    { id: 'manuscript',  label: '필사본', desc: '오래된 종이와 잉크',
      swatch: ['#efe6d2', '#2a2419', '#9a6b3f'] },
    { id: 'specimen',    label: '수장고', desc: '무채색 표본 카탈로그',
      swatch: ['#1a1d22', '#e7e9ec', '#7f8b96'] }
  ];

  global.Store = {
    EMOTIONS: EMOTIONS,
    THEMES: THEMES,
    VALID_THEMES: VALID_THEMES,
    emotionById: emotionById,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getDreams: getDreams,
    getDream: getDream,
    createDream: createDream,
    updateDream: updateDream,
    deleteDream: deleteDream,
    toggleFavorite: toggleFavorite,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clearAll: clearAll
  };
})(window);
