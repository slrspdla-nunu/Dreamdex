/* =========================================================================
 * Dreamdex — 기기 간 동기화 (Sync)  ·  Firebase Realtime Database (REST)
 * -------------------------------------------------------------------------
 * 앱이 코드를 자동 생성하고, 그 코드 칸(/sync/<code>)에 데이터(JSON)를 저장한다.
 * 다른 기기에서 같은 코드를 넣으면 같은 기록을 본다. (SDK 없이 fetch만 사용)
 *   - newCode()        : 새 랜덤 동기화 코드 생성(로컬, 네트워크 X)
 *   - push(code, data) : 그 코드 칸에 데이터 저장(PUT, 덮어쓰기)
 *   - pull(code)       : 그 코드 칸의 데이터 가져오기(GET) — 없으면 null
 * 보안: 코드를 아는 사람만 그 칸 접근(규칙으로 목록 조회 차단). 충돌은 마지막 저장 우선.
 * 데이터에 updatedAt(ms)을 실어 자동 동기화 시 최신본 판별에 사용.
 * ========================================================================= */
(function (global) {
  'use strict';

  // Firebase Realtime Database 주소 (끝 슬래시 없이)
  var DB = 'https://dreamdex-b903b-default-rtdb.firebaseio.com';

  function path(code) { return DB + '/sync/' + encodeURIComponent(code) + '.json'; }

  // 읽기 쉬운 랜덤 코드 (혼동되는 글자 제외, 10자리)
  function newCode() {
    var abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    var s = '';
    for (var i = 0; i < 10; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
    return s.slice(0, 5) + '-' + s.slice(5); // 예: k7m2p-q9rtx
  }

  function push(code, data) {
    return fetch(path(code), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('올리기에 실패했어요 (' + r.status + ')');
      return true;
    });
  }
  function pull(code) {
    return fetch(path(code), { headers: { 'Accept': 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('불러오기에 실패했어요 (' + r.status + ')');
      return r.json(); // 없으면 null
    });
  }

  global.Sync = { newCode: newCode, push: push, pull: pull, configured: DB.indexOf('firebaseio') !== -1 || DB.indexOf('firebasedatabase') !== -1 };
})(window);
