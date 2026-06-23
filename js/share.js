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
    return keywordChips(dream).map(function (k) { return k.name; });
  }
  // 카테고리 + 이름 (이미지 칩 색상용)
  function keywordChips(dream) {
    var dict = global.DREAM_DICTIONARY || {};
    var out = [];
    (dict.categories || []).forEach(function (cat) {
      var items = (dict[cat] && dict[cat].items) || [];
      ((dream.keywords && dream.keywords[cat]) || []).forEach(function (id) {
        for (var i = 0; i < items.length; i++) { if (items[i].id === id) { out.push({ cat: cat, name: items[i].name }); break; } }
      });
    });
    return out;
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

  /* --- 캔버스 헬퍼 --- */
  function roundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function hexToRgb(hex) {
    var h = (hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n) || h.length < 6) return '150,150,200';
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function sparkle(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.18, cy - r * 0.18, cx + r, cy);
    ctx.quadraticCurveTo(cx + r * 0.18, cy + r * 0.18, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.18, cy + r * 0.18, cx - r, cy);
    ctx.quadraticCurveTo(cx - r * 0.18, cy - r * 0.18, cx, cy - r);
    ctx.closePath(); ctx.fill();
  }

  function toImage(dream) {
    return new Promise(function (resolve) {
      if (!dream) { resolve(null); return; }
      var W = 1000, M = 84, PI = 48;        // 폭 / 바깥 마진 / 패널 안쪽 패딩
      var CW = W - 2 * M - 2 * PI;          // 콘텐츠 폭
      var DPR = Math.min(global.devicePixelRatio || 1, 2);
      var e = emo(dream.emotion);
      var chips = keywordChips(dream);
      var m = document.createElement('canvas').getContext('2d');

      // --- 측정 ---
      m.font = '800 50px ' + FONT;
      var titleLines = wrapText(m, dream.title || '제목 없는 꿈', CW);
      m.font = '400 27px ' + FONT;
      var bodyLines = wrapText(m, (dream.content || '').trim(), CW);
      var MAXB = 12;
      if (bodyLines.length > MAXB) { bodyLines = bodyLines.slice(0, MAXB); bodyLines[MAXB - 1] += '…'; }

      // 칩 줄바꿈 배치 미리 계산
      var chipH = 40, chipGap = 9, chipPadX = 18;
      m.font = '600 22px ' + FONT;
      var chipRows = 0;
      if (chips.length) {
        var cx0 = 0; chipRows = 1;
        chips.forEach(function (k) {
          var cw = m.measureText(k.name).width + chipPadX * 2;
          if (cx0 > 0 && cx0 + cw > CW) { chipRows++; cx0 = 0; }
          cx0 += cw + chipGap;
        });
      }

      var titleLH = 62, bodyLH = 44;
      var yMeta = M + PI;
      var yTitle = yMeta + 30 + 28;                          // 메타 높이 + 간격
      var yDiv = yTitle + titleLines.length * titleLH + 10;
      var yBody = yDiv + 4 + 28;
      var yChips = yBody + bodyLines.length * bodyLH + (chips.length ? 26 : 0);
      var yFooterDiv = yChips + chipRows * (chipH + chipGap) + (chips.length ? 18 : 6);
      var yFooter = yFooterDiv + 26;
      var panelBottom = yFooter + 26;                        // 푸터 텍스트 하단
      var H = panelBottom + PI + M;                          // + 패널 하단 패딩 + 바깥 마진
      H = Math.max(H, 520);

      var canvas = document.createElement('canvas');
      canvas.width = W * DPR; canvas.height = H * DPR;
      var ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);

      // 색상 토큰
      var surface = cssVar('--surface-solid', '#141828');
      var text = cssVar('--text', '#eaeaf5'), dim = cssVar('--text-dim', '#a7a7bd'), faint = cssVar('--text-faint', '#6a6f8e');
      var accent = cssVar('--accent', '#7b55ea'), moon = cssVar('--moon', '#f3d98a'), borderStrong = cssVar('--border-strong', 'rgba(150,160,210,0.26)');
      var catColor = { place: cssVar('--cat-place', '#8c77e9'), person: cssVar('--cat-person', '#dfa0c8'), situation: cssVar('--cat-situation', '#efbd7d') };
      var faintRgb = hexToRgb(faint);
      var accentRgb = hexToRgb(accent), accent2Rgb = hexToRgb(cssVar('--accent-2', '#8aa0d8'));
      function shade(rgb, f) { return rgb.split(',').map(function (v) { return Math.round(Math.min(255, v * f)); }).join(','); }

      // --- 배경: 테마 강조색 기반의 진한 밤하늘 그라데이션 (모든 테마에서 또렷) ---
      var g = ctx.createLinearGradient(0, 0, W * 0.35, H);
      g.addColorStop(0, 'rgb(' + shade(accentRgb, 0.52) + ')');
      g.addColorStop(1, 'rgb(' + shade(accent2Rgb, 0.32) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 달빛 글로우 (우상단)
      var mg = ctx.createRadialGradient(W - 130, 120, 10, W - 130, 120, 280);
      mg.addColorStop(0, 'rgba(' + hexToRgb(moon) + ',0.34)'); mg.addColorStop(1, 'rgba(' + hexToRgb(moon) + ',0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      // 별 — 진한 배경 위 흰 별 (결정적 좌표, 또렷하게)
      for (var i = 0; i < 64; i++) {
        var sx = (i * 137 + 31) % W, sy = (i * 89 + 23) % H;
        var sr = ((i % 4) * 0.7 + 0.9);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.38 + (i % 5) * 0.12).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
        if (i % 11 === 0) { // 가끔 십자 반짝임
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx - sr * 2.4, sy); ctx.lineTo(sx + sr * 2.4, sy);
          ctx.moveTo(sx, sy - sr * 2.4); ctx.lineTo(sx, sy + sr * 2.4); ctx.stroke();
        }
      }

      // --- 카드 패널 ---
      var px = M, py = M, pw = W - 2 * M, ph = panelBottom - M + PI;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      roundRect(ctx, px, py, pw, ph, 28);
      ctx.fillStyle = surface; ctx.fill();
      ctx.restore();
      roundRect(ctx, px + 0.5, py + 0.5, pw - 1, ph - 1, 28);
      ctx.lineWidth = 1; ctx.strokeStyle = borderStrong; ctx.stroke();

      ctx.textBaseline = 'top';
      var L = M + PI;

      // 1) 메타: 감정 점 + 라벨 · 날짜
      var mx = L, my2 = yMeta + 2;
      if (e.color) { ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(mx + 6, my2 + 11, 6, 0, Math.PI * 2); ctx.fill(); mx += 22; }
      ctx.font = '600 22px ' + FONT; ctx.fillStyle = dim;
      ctx.fillText((e.label ? e.label + '   ·   ' : '') + fmtDate(dream.date), mx, my2);

      // 2) 제목
      ctx.font = '800 50px ' + FONT; ctx.fillStyle = text;
      var y = yTitle;
      titleLines.forEach(function (l) { ctx.fillText(l, L, y); y += titleLH; });

      // 3) 강조 구분선
      roundRect(ctx, L, yDiv, 64, 4, 2); ctx.fillStyle = accent; ctx.fill();

      // 4) 본문
      ctx.font = '400 27px ' + FONT; ctx.fillStyle = dim;
      y = yBody;
      bodyLines.forEach(function (l) { ctx.fillText(l, L, y); y += bodyLH; });

      // 5) 키워드 칩
      if (chips.length) {
        ctx.font = '600 22px ' + FONT;
        var cxp = L, cyp = yChips;
        chips.forEach(function (k) {
          var cw = ctx.measureText(k.name).width + chipPadX * 2;
          if (cxp > L && cxp + cw > L + CW) { cxp = L; cyp += chipH + chipGap; }
          var rgb = hexToRgb(catColor[k.cat] || accent);
          roundRect(ctx, cxp, cyp, cw, chipH, chipH / 2);
          ctx.fillStyle = 'rgba(' + rgb + ',0.16)'; ctx.fill();
          ctx.fillStyle = 'rgb(' + rgb + ')';
          ctx.fillText(k.name, cxp + chipPadX, cyp + (chipH - 22) / 2 - 1);
          cxp += cw + chipGap;
        });
      }

      // 6) 푸터: 구분선 + ✦ + 로고
      ctx.strokeStyle = 'rgba(' + faintRgb + ',0.28)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, yFooterDiv); ctx.lineTo(W - M - PI, yFooterDiv); ctx.stroke();
      sparkle(ctx, L + 8, yFooter + 10, 8, accent);
      ctx.font = '700 21px ' + FONT; ctx.fillStyle = faint; ctx.textBaseline = 'top';
      ctx.fillText('Dreamdex · 꿈 아카이브', L + 24, yFooter);

      if (canvas.toBlob) canvas.toBlob(function (b) { resolve(b); }, 'image/png');
      else resolve(null);
    });
  }

  global.Share = { toText: toText, toImage: toImage };
})(window);
