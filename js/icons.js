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
    anxiety: '<path d="M3 10.5q2.25-3.4 4.5 0t4.5 0 4.5 0"/>' +
      '<path d="M3 15q2.25-3.4 4.5 0t4.5 0 4.5 0"/>',
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
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>'
  };

  function ui(name, opts) {
    opts = opts || {};
    var inner = UI_PATH[name] || UI_PATH.info;
    return svg(inner, { size: opts.size || 17, sw: opts.sw || 1.7, stroke: opts.stroke || 'currentColor', cls: 'ui-glyph' });
  }

  /* ---------------------------- 빈 상태 일러스트 ---------------------------- */
  // 성좌(별자리) 라인 — 종류별로 약간 다른 별 배치
  var CONSTELLATIONS = {
    archive: [[10,46],[30,22],[52,38],[74,16],[88,40]],
    search:  [[14,20],[34,40],[20,58],[54,50],[80,26],[86,52]],
    stats:   [[12,52],[30,36],[48,44],[66,20],[84,34]],
    map:     [[18,24],[42,18],[60,40],[36,54],[78,48],[88,22]],
    error:   [[16,40],[40,24],[44,52],[70,30],[84,50]]
  };

  function empty(name) {
    var pts = CONSTELLATIONS[name] || CONSTELLATIONS.archive;
    var W = 100, H = 72;
    var path = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
    var dots = pts.map(function (p, i) {
      var r = (i === 0 || i === pts.length - 1) ? 2.6 : 2.0;
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '" fill="currentColor" stroke="none"/>';
    }).join('');
    // 흩뿌린 작은 별
    var sprinkle =
      '<circle cx="8" cy="14" r="0.9" fill="currentColor" stroke="none" opacity=".5"/>' +
      '<circle cx="92" cy="60" r="0.9" fill="currentColor" stroke="none" opacity=".5"/>' +
      '<circle cx="62" cy="64" r="0.8" fill="currentColor" stroke="none" opacity=".45"/>' +
      '<circle cx="24" cy="66" r="0.8" fill="currentColor" stroke="none" opacity=".4"/>';
    return '<svg class="empty-illust" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
      '" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + path + '" opacity="0.55"/>' + dots + sprinkle + '</svg>';
  }

  global.Icons = {
    emotion: emotion,
    logo: logo,
    ui: ui,
    empty: empty,
    svg: svg
  };
})(window);
