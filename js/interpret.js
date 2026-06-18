/* =========================================================================
 * Dreamdex — 무의식 해석 엔진 (Interpretation Engine)
 * -------------------------------------------------------------------------
 * 오프라인/LocalStorage 환경이므로 실제 LLM 호출 없이, 꿈의 감정 + 자동
 * 분류된 키워드(장소·인물·상황)를 조합해 "상징 기반" 해석 문단을 만든다.
 *
 *   - SYMBOL: 키워드 id → 상징 의미 구절
 *   - EMOTION_LENS: 감정 id → 해석의 도입/맺음 톤
 *   - analyze(dream): 2~4문장 해석을 즉석 생성 (dream.id 해시로 결정론적 변주)
 *
 * 진짜 정신분석이 아니라 수집된 상징을 엮은 해석이며, UI에 그 점을 밝힌다.
 * ========================================================================= */
(function (global) {
  'use strict';

  /* ----------------------- 키워드별 상징 의미 ----------------------- */
  // 명사구로 끝내, 뒤에 조사를 붙여 문장으로 엮는다.
  var SYMBOL = {
    /* 장소 (50) */
    school: '평가받는 상황과 성장의 압박', home: '안식과 내면의 본거지',
    sea: '무의식의 깊이와 감정의 너울', forest: '길을 찾는 혼란과 미지의 가능성',
    hospital: '치유의 바람과 약함을 마주하는 두려움', mountain: '넘어야 할 목표와 인내',
    river: '흘려보내야 할 감정의 흐름', city: '사회적 역할과 일상의 무게',
    academy: '끊임없는 자기검증의 부담', office: '책임과 인정받고 싶은 마음',
    subway: '정해진 길 위를 떠도는 이행의 시기', bus: '함께 실려 가는 흐름과 수동성',
    airport: '떠남과 새로운 국면에 대한 기대', hotel: '잠시 머무는 과도기와 익명의 자유',
    amusement: '즐거움 뒤에 감춘 들뜸과 불안', market: '선택의 욕망과 비교',
    cafe: '잠깐의 쉼과 관계에 대한 갈망', restaurant: '채우고 싶은 욕구와 나눔',
    library: '답을 찾으려는 내면의 탐색', church: '위안과 더 큰 무언가에 기대고 싶은 마음',
    temple: '마음을 비우려는 성찰', cave: '숨고 싶은 마음과 깊은 내면',
    desert: '메마른 고립감과 견딤', field: '탁 트인 자유와 새 출발',
    bridge: '두 시기를 잇는 전환점', alley: '드러내지 않은 비밀스러운 길',
    rooftop: '거리를 두고 내려다보는 관조', basement: '억눌러 둔 기억과 무의식의 바닥',
    stairs: '오르내리는 처지의 변화', elevator: '통제 밖에서 빠르게 뒤바뀌는 상황',
    toilet: '비워내고 싶은 감정과 사적인 해소', kitchen: '보살핌과 일상을 데우는 온기',
    park: '잠시 풀어놓는 여유', lake: '잔잔한 표면 아래에 가라앉은 마음',
    waterfall: '쏟아지는 감정의 분출', island: '단절과 홀로 있고 싶은 마음',
    space: '무한한 가능성과 까마득한 고독', sky: '자유에의 동경과 초월',
    tunnel: '끝을 알 수 없는 통과의 시기', train: '정해진 궤도 위의 인생 여정',
    ruins: '무너진 과거와 끝나버린 무언가', maze: '출구를 찾지 못하는 혼란',
    mirror: '마주하기 어려운 자기 자신', underwater: '가라앉은 감정과 무의식의 심연',
    heaven: '이상향과 안식에 대한 동경', hell: '죄책감과 벗어나고 싶은 고통',
    alienworld: '완전히 낯선 자기 영역', shrine: '마음 깊이 모셔둔 신념',
    rift: '현실과 무의식 사이의 균열', dreamindream: '더 깊은 무의식으로의 침잠',

    /* 인물 (30) */
    friend: '지지와 소속에 대한 바람', family: '뿌리와 책임의 끈',
    mother: '보살핌과 의존의 원형', father: '권위와 인정받고 싶은 마음',
    sibling: '비교와 동반의 감정', grandma: '따뜻한 보호와 그리움',
    grandpa: '지혜와 지나간 시간', teacher: '평가하는 시선과 배움의 권위',
    stranger: '아직 모르는 나의 한 면', lover: '친밀함과 결핍된 애정',
    oldfriend: '돌아가고 싶은 시절', coworker: '사회적 평가와 경쟁의 긴장',
    child: '지켜야 할 순수함, 또는 내면의 어린아이', crowd: '휩쓸리는 익명성과 시선의 압박',
    doctor: '도움받고 싶은 마음과 통제', police: '규율과 죄책감의 감시자',
    soldier: '의무와 억눌린 긴장', celebrity: '동경과 인정 욕구',
    animal: '길들지 않은 본능과 순수한 마음', deceased: '떠나보낸 것에 대한 미련',
    self: '받아들이지 못한 또 다른 자아', acquaintance: '적당한 거리의 관계',
    ghost: '떨쳐내지 못한 과거의 잔상', monster: '마주하기 두려운 내면의 그림자',
    alien: '이질적이고 통제 밖의 무언가', angel: '구원과 보호받고 싶은 마음',
    demon: '억눌린 충동과 유혹', god: '절대적인 의지처에 대한 갈망',
    shadowman: '외면해 온 자신의 어두운 면', futureself: '다가올 자신에 대한 불안과 기대',

    /* 상황 (40) — 무의식 신호가 가장 또렷한 층 */
    fall: '통제력을 잃는 두려움', fly: '억압에서 벗어나려는 해방의 욕구',
    chase: '회피하고 싶은 압박과 마주하지 못한 문제', exam: '평가받는 부담과 준비되지 않은 두려움',
    travel: '변화에 대한 갈망과 새로운 자아의 탐색', late: '뒤처질까 하는 초조함',
    lost: '방향을 잃은 혼란과 정체성의 흔들림', fight: '풀지 못한 갈등과 억눌린 분노',
    death: '한 시기의 끝과 변화의 예감', wedding: '결합과 새로운 책임에 대한 마음',
    breakup: '떠나보냄과 미완의 감정', reunion: '회복하고 싶은 관계',
    present: '드러나는 것에 대한 긴장과 인정 욕구', hide: '감추고 싶은 마음과 회피',
    swim: '감정의 흐름을 헤쳐 나가려는 안간힘', drive: '인생을 스스로 끌고 가려는 통제 욕구',
    war: '안팎의 격렬한 갈등', fire: '걷잡을 수 없는 감정의 분출과 변화',
    flood: '감당하기 벅찬 감정의 범람', quake: '안정의 토대가 흔들리는 불안',
    eat: '채우고 싶은 결핍과 욕구', shopping: '채워지지 않는 욕망',
    study: '인정받기 위한 노력과 부담', work: '책임의 무게와 소진',
    meet: '새로운 관계의 가능성', talk: '미처 전하지 못한 마음',
    cry: '쌓아둔 슬픔의 해소', laugh: '풀어놓고 싶은 기쁨',
    surgery: '도려내고 싶은 아픔과 회복의 바람', birth: '새로운 시작과 창조의 욕구',
    transform: '달라지고 싶은 변화의 갈망', timetravel: '되돌리거나 앞당기고 싶은 마음',
    invisible: '드러나고 싶지 않거나 외면당하는 느낌', superpower: '무력감을 넘어서려는 통제의 욕구',
    drown: '감정에 잠식당하는 압도감', paralysis: '움직이지 못하는 무력감과 억눌림',
    giant: '비대해지거나 작아진 자기감', lucid: '스스로를 들여다보려는 자각',
    apocalypse: '송두리째 무너뜨리고 다시 시작하려는 마음', rebirth: '거듭나고 싶은 깊은 변화의 갈망'
  };

  var CAT_FALLBACK = { place: '그 공간', person: '그 존재', situation: '그 사건' };

  /* ----------------------- 감정 렌즈 (도입/맺음) ----------------------- */
  // open/close: 해석 문단의 도입·맺음 / warm: 해석과 분리된 따뜻한 맺음말(위로·축하 + 잘 자요 인사)
  var EMOTION_LENS = {
    happy: {
      open: '이 꿈에는 따뜻한 충족감이 흐르고 있어요.',
      close: '지금 마음이 바라는 안정과 기쁨이 꿈으로 비친 듯해요.',
      warm: '좋은 꿈이었네요. 오늘 하루도 이 온기처럼 환하길 바라요. 오늘 밤도 포근한 잠이 함께하길.'
    },
    wonder: {
      open: '이 꿈은 낯설고도 신비로운 호기심으로 물들어 있어요.',
      close: '익숙한 일상 너머를 들여다보고 싶은 마음이 엿보여요.',
      warm: '이렇게 신비로운 꿈을 꾼다는 건 마음이 건강하다는 신호이기도 해요. 오늘도 좋은 꿈 꾸며 푹 쉬어요.'
    },
    anxiety: {
      open: '마음 한켠의 불안이 형태를 빌려 떠오른 듯한 꿈이에요.',
      close: '아직 풀리지 않은 긴장이 꿈속에서 신호를 보내고 있어요.',
      warm: '불안한 꿈을 꿨더라도 괜찮아요. 꿈은 마음이 긴장을 흘려보내는 방식이니까요. 오늘 밤은 한결 편안한 잠이 찾아오길 바라요.'
    },
    fear: {
      open: '이 꿈에는 마주하기 두려운 무언가가 어른거려요.',
      close: '외면해 온 두려움이 모습을 드러내려 하는지도 몰라요.',
      warm: '무서운 꿈이었죠. 그래도 그건 꿈일 뿐, 지금 당신은 안전한 곳에 있어요. 오늘 밤은 부디 포근하고 평온한 잠이 되길.'
    },
    sadness: {
      open: '잔잔한 슬픔이 가라앉아 있는 꿈이에요.',
      close: '흘려보내지 못한 감정이 조용히 머물러 있는 듯해요.',
      warm: '슬픈 꿈에 마음이 가라앉았을지도 몰라요. 그 감정도 천천히 흘려보내도 괜찮아요. 오늘은 따뜻하게 몸을 누이고 푹 쉬어요.'
    },
    longing: {
      open: '그리움이 짙게 배어 있는 꿈이에요.',
      close: '닿고 싶은 무언가를 향한 마음이 꿈결에 스며 있어요.',
      warm: '그리운 무언가가 꿈에 찾아왔네요. 그 마음 소중히 품고, 오늘 밤도 편안히 잠들기를 바라요.'
    }
  };

  /* ----------------------- 한국어 조사 도우미 ----------------------- */
  // 마지막 음절의 종성(받침) 여부로 조사를 고른다.
  function jong(w) {
    if (!w) return -1;
    var c = w.charCodeAt(w.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return -1; // 한글 음절이 아님
    return (c - 0xAC00) % 28;
  }
  function T(w) { return jong(w) > 0 ? '은' : '는'; }   // 은/는
  function S(w) { return jong(w) > 0 ? '이' : '가'; }   // 이/가
  function O(w) { return jong(w) > 0 ? '을' : '를'; }   // 을/를
  function R(w) { var j = jong(w); return (j > 0 && j !== 8) ? '으로' : '로'; } // (으)로, ㄹ받침은 '로'
  function IRA(w) { return jong(w) > 0 ? '이라는' : '라는'; }

  /* ----------------------- 결정론적 해시 ----------------------- */
  function hash(str) {
    str = String(str || '');
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h;
  }
  function pick(arr, n) { return arr[n % arr.length]; }

  /* ----------------------- 문장 템플릿 ----------------------- */
  var PLACE_T = [
    function (n, s) { return '꿈의 무대였던 ‘' + n + '’' + T(n) + ' ' + s + O(s) + ' 떠올리게 해요.'; },
    function (n, s) { return '배경으로 떠오른 ‘' + n + '’에는 ' + s + S(s) + ' 깃들어 있어요.'; }
  ];
  var PERSON_T = [
    function (n, s) { return '그곳에 함께한 ‘' + n + '’' + T(n) + ' ' + s + R(s) + ' 읽혀요.'; },
    function (n, s) { return '곁에 나타난 ‘' + n + '’에게서는 ' + s + S(s) + ' 느껴져요.'; }
  ];
  var SIT_T = [
    function (n, s) { return '무엇보다 ‘' + n + '’' + IRA(n) + ' 장면은 ' + s + O(s) + ' 드러내요.'; },
    function (n, s) { return '특히 ‘' + n + '’' + T(n) + ' ' + s + O(s) + ' 가장 선명하게 보여줘요.'; }
  ];

  function nameOf(cat, id) {
    var dict = global.DREAM_DICTIONARY || {};
    var items = (dict[cat] && dict[cat].items) || [];
    for (var i = 0; i < items.length; i++) { if (items[i].id === id) return items[i].name; }
    return id;
  }

  /* ----------------------- 해석 생성 ----------------------- */
  function analyze(dream) {
    if (!dream) return '';
    var lens = EMOTION_LENS[dream.emotion] || EMOTION_LENS.wonder;
    var kw = dream.keywords || {};
    var places = kw.place || [], persons = kw.person || [], situations = kw.situation || [];
    var h = hash(dream.id || dream.title || '');
    var parts = [lens.open];

    if (places.length) {
      var pid = places[0];
      parts.push(pick(PLACE_T, h)(nameOf('place', pid), SYMBOL[pid] || CAT_FALLBACK.place));
    }
    if (persons.length) {
      var rid = persons[0];
      parts.push(pick(PERSON_T, h + 1)(nameOf('person', rid), SYMBOL[rid] || CAT_FALLBACK.person));
    }
    if (situations.length) {
      var sid = situations[0];
      parts.push(pick(SIT_T, h + 2)(nameOf('situation', sid), SYMBOL[sid] || CAT_FALLBACK.situation));
    }

    if (!places.length && !persons.length && !situations.length) {
      var len = (dream.content || '').length;
      parts.push(len > 200
        ? '뚜렷한 상징보다 감정의 결이 길게 이어지는 꿈이에요. 머릿속을 맴돌던 마음의 온도가 그대로 흘러나온 듯해요.'
        : '또렷한 상징은 옅지만, 그만큼 지금의 감정 자체가 이 꿈을 이끌고 있어요.');
    }

    parts.push(lens.close);
    return parts.join(' ');
  }

  // 해석과 분리된 따뜻한 맺음말 (위로·축하 + 잘 자요 인사)
  function warmth(dream) {
    var lens = EMOTION_LENS[(dream && dream.emotion)] || EMOTION_LENS.wonder;
    return lens.warm;
  }

  global.Interpret = { analyze: analyze, warmth: warmth, SYMBOL: SYMBOL };
})(window);
