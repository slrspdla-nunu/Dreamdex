/* =========================================================================
 * Dreamdex — 꿈 내보내기/공유 (Share)
 * -------------------------------------------------------------------------
 * 단일 꿈을 (1) 평문 텍스트, (2) 이미지 카드로 변환한다. 외부 전송 없음 —
 * 텍스트는 클립보드, 이미지는 캔버스로 그려 PNG Blob을 반환한다.
 * ========================================================================= */
(function (global) {
  'use strict';

  var FONT = '"Pretendard", system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

  function emo(id) { return (global.Store && global.Store.emotionById(id)) || { label: '', color: '' }; }

  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length < 3) return iso;
    return p[0] + '년 ' + Number(p[1]) + '월 ' + Number(p[2]) + '일';
  }

  function keywordNames(dream) {
    var dict = global.DREAM_DICTIONARY || {};
    var names = [];
    (dict.categories || []).forEach(function (cat) {
      var items = (dict[cat] && dict[cat].items) || [];
      ((dream.keywords && dream.keywords[cat]) || []).forEach(function (id) {
        for (var i = 0; i < items.length; i++) { if (items[i].id === id) { names.push(items[i].name); break; } }
      });
    });
    return names;
  }

  /* ----------------------------- 텍스트 ----------------------------- */
  function toText(dream) {
    if (!dream) return '';
    var e = emo(dream.emotion);
    var kw = keywordNames(dream);
    var parts = [];
    parts.push(dream.title || '제목 없는 꿈');
    parts.push(fmtDate(dream.date) + (e.label ? ' · ' + e.label : ''));
    parts.push('');
    parts.push((dream.content || '').trim());
    if (kw.length) { parts.push(''); parts.push('수집한 흔적: ' + kw.join(', ')); }
    parts.push('');
    parts.push('— Dreamdex');
    return parts.join('\n');
  }

  /* ----------------------------- 이미지 ----------------------------- */
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  // 폭에 맞춰 줄바꿈 (명시적 \n 존중, 글자 단위 — 한글 대응)
  function wrapText(ctx, text, maxW) {
    var lines = [];
    String(text).split('\n').forEach(function (para) {
      if (para === '') { lines.push(''); return; }
      var line = '';
      for (var i = 0; i < para.length; i++) {
        var test = line + para[i];
        if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = para[i]; }
        else line = test;
      }
      if (line !== '') lines.push(line);
    });
    return lines;
  }

  function toImage(dream) {
    return new Promise(function (resolve) {
      if (!dream) { resolve(null); return; }
      var W = 900, P = 64;
      var DPR = Math.min(global.devicePixelRatio || 1, 2);
      var e = emo(dream.emotion);
      var m = document.createElement('canvas').getContext('2d');

      m.font = '700 44px ' + FONT;
      var titleLines = wrapText(m, dream.title || '제목 없는 꿈', W - 2 * P);
      m.font = '400 26px ' + FONT;
      var bodyLines = wrapText(m, (dream.content || '').trim(), W - 2 * P);
      var MAXB = 18;
      if (bodyLines.length > MAXB) { bodyLines = bodyLines.slice(0, MAXB); bodyLines[MAXB - 1] += '…'; }

      var metaH = 34, gap1 = 26, titleLH = 54, gap2 = 34, bodyLH = 42, footerGap = 44, footerH = 26;
      var afterMeta = P + metaH + gap1;
      var afterTitle = afterMeta + titleLines.length * titleLH + gap2;
      var afterBody = afterTitle + bodyLines.length * bodyLH;
      var footerY = afterBody + footerGap;
      var H = footerY + footerH + P;

      var canvas = document.createElement('canvas');
      canvas.width = W * DPR; canvas.height = H * DPR;
      var ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);

      // 배경 — 현재 테마 하늘 그라데이션
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, cssVar('--sky-1', '#1a2150'));
      g.addColorStop(1, cssVar('--sky-2', '#0d1030'));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      var text = cssVar('--text', '#eaeaf5');
      var dim = cssVar('--text-dim', '#a7a7bd');
      ctx.textBaseline = 'top';

      // 감정 점 + 라벨 · 날짜
      var mx = P, my = P + 2;
      if (e.color) { ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(mx + 7, my + 12, 7, 0, Math.PI * 2); ctx.fill(); mx += 26; }
      ctx.font = '600 22px ' + FONT; ctx.fillStyle = dim;
      ctx.fillText((e.label ? e.label + '   ·   ' : '') + fmtDate(dream.date), mx, my);

      // 제목
      ctx.font = '700 44px ' + FONT; ctx.fillStyle = text;
      var y = afterMeta;
      titleLines.forEach(function (l) { ctx.fillText(l, P, y); y += titleLH; });

      // 본문
      ctx.font = '400 26px ' + FONT; ctx.fillStyle = text;
      y = afterTitle;
      bodyLines.forEach(function (l) { ctx.fillText(l, P, y); y += bodyLH; });

      // 워터마크 (우하단)
      ctx.font = '700 20px ' + FONT; ctx.fillStyle = dim; ctx.textAlign = 'right';
      ctx.fillText('Dreamdex · 꿈 아카이브', W - P, footerY);
      ctx.textAlign = 'left';

      if (canvas.toBlob) canvas.toBlob(function (b) { resolve(b); }, 'image/png');
      else resolve(null);
    });
  }

  global.Share = { toText: toText, toImage: toImage };
})(window);
