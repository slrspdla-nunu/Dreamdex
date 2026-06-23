/* =========================================================================
 * Dreamdex — 분류 엔진 & 파생 데이터 (Classifier / Derivations)
 * -------------------------------------------------------------------------
 * dreams[] 라는 원천 데이터로부터 다음을 "매번 계산"한다:
 *   - classify(text)        : 텍스트 → 카테고리별 매칭 키워드 id
 *   - unlockState(count)    : 꿈 개수에 따른 해금 상태
 *   - buildDex(dreams)      : 도감 발견 현황 + 완성률
 *   - buildStats(dreams)    : 통계 집계
 *   - buildGraph(dreams)    : 꿈 지도(키워드 동시출현 그래프)
 * ========================================================================= */
(function (global) {
  'use strict';

  var DICT = global.DREAM_DICTIONARY;

  /* ----------------------------- 해금 규칙 ----------------------------- */
  // 10개: 희귀 슬롯이 도감에 (잠금 상태로) 모습을 드러냄 + 꿈 지도 개방
  // 30개: 희귀 키워드 실제 발견 가능
  // 50개: 숨겨진 도감(hidden) 발견 가능
  var MILESTONES = [
    { count: 10, key: 'reveal', title: '수집의 확장',
      desc: '희귀한 흔적의 존재가 도감에 드러나고, 꿈 지도가 열립니다.' },
    { count: 30, key: 'rare',   title: '희귀 키워드 발견',
      desc: '드물게 나타나는 희귀 키워드를 수집할 수 있습니다.' },
    { count: 50, key: 'hidden', title: '숨겨진 도감 해금',
      desc: '무의식 깊은 곳의 숨겨진 컬렉션이 모습을 드러냅니다.' }
  ];

  function unlockState(count) {
    return {
      count: count,
      mapOpen: count >= 10,
      rareRevealed: count >= 10, // 슬롯이 보이지만 잠김
      rareUnlocked: count >= 30, // 실제 발견 가능
      hiddenRevealed: count >= 50,
      hiddenUnlocked: count >= 50
    };
  }

  // 특정 tier 가 "발견 가능"한 상태인가
  function tierDiscoverable(tier, u) {
    if (tier === 'common') return true;
    if (tier === 'rare') return u.rareUnlocked;
    if (tier === 'hidden') return u.hiddenUnlocked;
    return false;
  }

  /* ----------------------------- 분류 핵심 ----------------------------- */
  // 텍스트에서 매칭되는 키워드 id 를 카테고리별로 반환
  // (tier 잠금과 무관하게 "원시 매칭"을 저장해 두고, 표시 단계에서 해금 필터링)
  function classify(text) {
    var hay = (text || '').toLowerCase();
    var result = { place: [], person: [], situation: [] };
    DICT.categories.forEach(function (cat) {
      DICT[cat].items.forEach(function (item) {
        for (var i = 0; i < item.syn.length; i++) {
          if (hay.indexOf(item.syn[i].toLowerCase()) !== -1) {
            result[cat].push(item.id);
            break;
          }
        }
      });
    });
    return result;
  }

  // 제목 + 내용을 합쳐 분류
  function classifyDream(data) {
    return classify((data.title || '') + ' ' + (data.content || ''));
  }

  function findItem(cat, id) {
    var items = DICT[cat].items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  /* --------------------------- 도감(Dex) 빌드 --------------------------- */
  // 각 키워드의 발견 여부 / 등장 횟수 / 첫 발견일 / 등장한 꿈 목록을 계산
  function buildDex(dreams) {
    var u = unlockState(dreams.length);
    var dex = {};

    DICT.categories.forEach(function (cat) {
      var slots = DICT[cat].items.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          tier: item.tier,
          discoverable: tierDiscoverable(item.tier, u),
          count: 0,
          firstSeen: null,
          dreamIds: []
        };
      });
      var byId = {};
      slots.forEach(function (s) { byId[s.id] = s; });

      // 오래된 꿈부터 처리해야 firstSeen 이 정확
      var sorted = dreams.slice().sort(function (a, b) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
      sorted.forEach(function (d) {
        var ids = (d.keywords && d.keywords[cat]) || [];
        ids.forEach(function (id) {
          var slot = byId[id];
          if (!slot || !slot.discoverable) return; // 잠긴 tier 는 발견으로 치지 않음
          slot.count++;
          slot.dreamIds.push(d.id);
          if (!slot.firstSeen) slot.firstSeen = d.date || null;
        });
      });

      var total = slots.length;
      var discovered = slots.filter(function (s) { return s.count > 0; }).length;
      dex[cat] = {
        label: DICT[cat].label,
        slots: slots,
        discovered: discovered,
        total: total,
        percent: total ? Math.round((discovered / total) * 100) : 0
      };
    });

    // 전체 완성률
    var allTotal = 0, allDisc = 0;
    DICT.categories.forEach(function (cat) {
      allTotal += dex[cat].total;
      allDisc += dex[cat].discovered;
    });
    dex.overall = {
      discovered: allDisc,
      total: allTotal,
      percent: allTotal ? Math.round((allDisc / allTotal) * 100) : 0
    };
    dex.unlock = u;
    return dex;
  }

  function getSlot(dex, cat, id) {
    if (!dex[cat]) return null;
    var slots = dex[cat].slots;
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].id === id) return slots[i];
    }
    return null;
  }

  /* ------------------------------ 통계 ------------------------------- */
  function buildStats(dreams) {
    var emotionCount = {};
    global.Store.EMOTIONS.forEach(function (e) { emotionCount[e.id] = 0; });

    var placeCount = {};
    var now = Date.now();
    var THIRTY = 30 * 24 * 60 * 60 * 1000;
    var recent30 = 0;
    var dayCounts = {};            // 'YYYY-MM-DD' → 기록 수 (연속 기록 계산용)

    dreams.forEach(function (d) {
      if (emotionCount[d.emotion] === undefined) emotionCount[d.emotion] = 0;
      emotionCount[d.emotion]++;

      var places = (d.keywords && d.keywords.place) || [];
      places.forEach(function (id) {
        placeCount[id] = (placeCount[id] || 0) + 1;
      });

      var day = (d.date || '').slice(0, 10);
      if (day) dayCounts[day] = (dayCounts[day] || 0) + 1;

      var t = d.createdAt || (d.date ? new Date(d.date).getTime() : 0);
      if (t && now - t <= THIRTY) recent30++;
    });

    // 연속 기록(streak): 오늘(없으면 어제)부터 거꾸로 연속으로 기록이 있는 날 수
    function ymd(dt) {
      var m = dt.getMonth() + 1, dd = dt.getDate();
      return dt.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
    }
    var streak = 0, cur = new Date();
    if (!dayCounts[ymd(cur)]) cur.setDate(cur.getDate() - 1);
    while (dayCounts[ymd(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }

    // 최다 감정
    var topEmotion = null, topEmotionN = 0;
    Object.keys(emotionCount).forEach(function (id) {
      if (emotionCount[id] > topEmotionN) { topEmotionN = emotionCount[id]; topEmotion = id; }
    });

    // 최다 장소
    var topPlace = null, topPlaceN = 0;
    Object.keys(placeCount).forEach(function (id) {
      if (placeCount[id] > topPlaceN) { topPlaceN = placeCount[id]; topPlace = id; }
    });
    var topPlaceItem = topPlace ? findItem('place', topPlace) : null;

    return {
      total: dreams.length,
      recent30: recent30,
      emotionCount: emotionCount,
      topEmotion: topEmotion,
      topEmotionN: topEmotionN,
      topPlaceName: topPlaceItem ? topPlaceItem.name : null,
      topPlaceN: topPlaceN,
      streak: streak
    };
  }

  /* ----------------------------- 꿈 지도 ----------------------------- */
  // 키워드 = 노드, 같은 꿈에 함께 등장 = 엣지. 빈도 상위 노드만 사용.
  function buildGraph(dreams, maxNodes, maxEdgesPerNode) {
    maxNodes = maxNodes || 24;
    maxEdgesPerNode = maxEdgesPerNode || 3;
    var freq = {};   // key: cat:id → count
    var meta = {};   // key → { cat, id, name }
    var edges = {};  // key 'a|b' → weight

    function key(cat, id) { return cat + ':' + id; }

    dreams.forEach(function (d) {
      var present = [];
      DICT.categories.forEach(function (cat) {
        var ids = (d.keywords && d.keywords[cat]) || [];
        ids.forEach(function (id) {
          var item = findItem(cat, id);
          if (!item) return;
          var kk = key(cat, id);
          freq[kk] = (freq[kk] || 0) + 1;
          meta[kk] = { cat: cat, id: id, name: item.name };
          present.push(kk);
        });
      });
      // 동시출현 엣지
      for (var i = 0; i < present.length; i++) {
        for (var j = i + 1; j < present.length; j++) {
          var a = present[i], b = present[j];
          var ek = a < b ? a + '|' + b : b + '|' + a;
          edges[ek] = (edges[ek] || 0) + 1;
        }
      }
    });

    // 빈도 상위 노드 선택
    var nodeKeys = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; });
    nodeKeys = nodeKeys.slice(0, maxNodes);
    var allow = {};
    nodeKeys.forEach(function (kk) { allow[kk] = true; });

    var nodes = nodeKeys.map(function (kk) {
      return { key: kk, cat: meta[kk].cat, id: meta[kk].id, name: meta[kk].name, weight: freq[kk] };
    });

    var edgeList = [];
    Object.keys(edges).forEach(function (ek) {
      var parts = ek.split('|');
      if (allow[parts[0]] && allow[parts[1]]) {
        edgeList.push({ source: parts[0], target: parts[1], weight: edges[ek] });
      }
    });

    // 헤어볼(과밀) 방지: 강한 연결부터 보며 양 끝 노드가 모두 한도 미만일 때만 유지.
    // → 노드당 연결을 maxEdgesPerNode 근처로 묶어 "별자리"처럼 간결하게.
    if (maxEdgesPerNode && edgeList.length) {
      edgeList.sort(function (a, b) { return b.weight - a.weight; });
      var deg = {};
      var pruned = [];
      for (var ei = 0; ei < edgeList.length; ei++) {
        var e = edgeList[ei];
        var ds = deg[e.source] || 0, dt = deg[e.target] || 0;
        if (ds < maxEdgesPerNode && dt < maxEdgesPerNode) {
          pruned.push(e);
          deg[e.source] = ds + 1;
          deg[e.target] = dt + 1;
        }
      }
      edgeList = pruned;
    }

    return { nodes: nodes, edges: edgeList };
  }

  /* ----------------------- 다음 해금까지 남은 개수 ----------------------- */
  function nextMilestone(count) {
    for (var i = 0; i < MILESTONES.length; i++) {
      if (count < MILESTONES[i].count) {
        return { milestone: MILESTONES[i], remaining: MILESTONES[i].count - count };
      }
    }
    return null; // 모두 해금
  }

  // 이번 저장으로 새로 달성한 마일스톤이 있으면 반환
  function milestoneReachedBy(prevCount, newCount) {
    for (var i = 0; i < MILESTONES.length; i++) {
      var c = MILESTONES[i].count;
      if (prevCount < c && newCount >= c) return MILESTONES[i];
    }
    return null;
  }

  global.Classify = {
    MILESTONES: MILESTONES,
    classify: classify,
    classifyDream: classifyDream,
    findItem: findItem,
    unlockState: unlockState,
    buildDex: buildDex,
    getSlot: getSlot,
    buildStats: buildStats,
    buildGraph: buildGraph,
    nextMilestone: nextMilestone,
    milestoneReachedBy: milestoneReachedBy
  };
})(window);
