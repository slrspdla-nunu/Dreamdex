/* =========================================================================
 * Dreamdex — 클라우드 동기화 (Cloud)  ·  Firebase Auth(Google) + Realtime DB
 * -------------------------------------------------------------------------
 * 구글 로그인 한 번이면, 그 계정의 데이터(/users/<uid>)를 기기 간 실시간 동기화.
 * 코드 입력 없음 · 새로고침 없이 자동 반영. (SDK compat 빌드 사용)
 *   - signIn()/signOut()  : 구글 로그인/로그아웃 (모바일은 팝업 실패 시 리디렉트)
 *   - onUser(cb)          : 로그인 상태 변화 구독 (cb(user|null))
 *   - currentUser()       : 현재 사용자(없으면 null)
 *   - push(data)          : 내 계정 칸에 저장(덮어쓰기)
 *   - watch(onData)       : 내 계정 칸 실시간 구독 → 변경 시 onData(value)
 * 오프라인/SDK 미로딩이면 isReady()=false → 앱은 로컬로 정상 동작.
 * ========================================================================= */
(function (global) {
  'use strict';

  // Firebase 웹 설정값 (공개돼도 안전 — 보안은 로그인 + DB 규칙이 담당)
  var firebaseConfig = {
    apiKey: "AIzaSyDD0LI0n0soB8Z9rpm3O-eXY10SOg2nmo0",
    authDomain: "dreamdex-b903b.firebaseapp.com",
    databaseURL: "https://dreamdex-b903b-default-rtdb.firebaseio.com",
    projectId: "dreamdex-b903b",
    storageBucket: "dreamdex-b903b.firebasestorage.app",
    messagingSenderId: "555011250603",
    appId: "1:555011250603:web:897bea9e30522e4f0b1aee",
    measurementId: "G-R4LH1Z31B3"
  };

  var ready = false, auth = null, db = null;
  var user = undefined;          // undefined=아직 모름, null=로그아웃, obj=로그인
  var userCbs = [];

  function init() {
    if (ready) return true;
    if (!global.firebase || !global.firebase.initializeApp) return false; // 오프라인 등 SDK 미로딩
    try {
      global.firebase.initializeApp(firebaseConfig);
      auth = global.firebase.auth();
      db = global.firebase.database();
      ready = true;
      // 모바일 리디렉트 로그인 결과 회수(있으면)
      auth.getRedirectResult().catch(function () {});
      auth.onAuthStateChanged(function (u) {
        user = u || null;
        for (var i = 0; i < userCbs.length; i++) { try { userCbs[i](user); } catch (e) {} }
      });
      return true;
    } catch (e) { return false; }
  }

  function signIn() {
    if (!ready) return Promise.reject(new Error('오프라인이거나 로그인 모듈을 불러오지 못했어요'));
    var prov = new global.firebase.auth.GoogleAuthProvider();
    // 팝업 우선(모바일 포함) — GitHub Pages는 firebaseapp.com과 도메인이 달라
    // 리디렉트 방식이 스토리지 분리로 자주 실패하므로 팝업이 더 안정적.
    return auth.signInWithPopup(prov).catch(function (err) {
      // 팝업이 막히거나 닫힌 경우에만 리디렉트로 폴백
      if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/operation-not-supported-in-this-environment')) {
        return auth.signInWithRedirect(prov);
      }
      throw err;
    });
  }
  function signOut() { return ready ? auth.signOut() : Promise.resolve(); }
  function currentUser() { return user || null; }
  function onUser(cb) {
    if (typeof cb !== 'function') return;
    userCbs.push(cb);
    if (user !== undefined) cb(user); // 이미 상태를 알면 즉시 호출
  }

  function ref() { return db.ref('users/' + currentUser().uid); }
  function push(data) {
    if (!ready || !currentUser()) return Promise.reject(new Error('로그인이 필요해요'));
    return ref().set(data);
  }
  function watch(onData) {
    if (!ready || !currentUser()) return function () {};
    var r = ref();
    var handler = r.on('value', function (snap) { onData(snap.val()); });
    return function () { r.off('value', handler); };
  }

  global.Cloud = {
    isReady: function () { return ready; },
    signIn: signIn, signOut: signOut,
    currentUser: currentUser, onUser: onUser,
    push: push, watch: watch
  };

  init();
})(window);
