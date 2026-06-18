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
  var VALID_THEMES = ['mongsil', 'observatory', 'manuscript', 'specimen', 'amethyst', 'dawn', 'abyss',
                      'mist', 'lilac', 'mint'];
  var VALID_PATTERNS = ['none', 'dots', 'grid', 'diagonal', 'crosshatch', 'waves'];
  var VALID_EFFECTS = ['none', 'stars', 'shooting', 'aurora', 'petals', 'bubbles'];
  var LIGHT_THEMES = ['mongsil', 'manuscript', 'dawn', 'mist', 'lilac', 'mint'];
  function isLightTheme(t) { return LIGHT_THEMES.indexOf(t) !== -1; }
  var DEFAULT_SETTINGS = {
    theme: 'mongsil',
    pattern: 'none',
    effect: 'none',
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
    { id: 'mongsil',     label: '몽실', desc: '포근한 구름빛 보라',
      swatch: ['#fbfaff', '#3d3858', '#7b55ea'] },
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
    { id: 'bubbles',  label: '비눗방울', desc: '두둥실 떠오르는 방울',  mode: 'light' }
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
