/* ============================================================
   코딩 스티커 — Firebase Sync
   Phase 5: Firestore 실시간 동기화 (로컬 모드 fallback 포함)
   ============================================================

   사용 방법: FIREBASE_SETUP.md 를 먼저 읽고 _CONFIG 값을 채우세요.
   Firebase를 설정하지 않아도 앱은 로컬(localStorage) 모드로 작동합니다.
   ============================================================ */

const DB = (() => {

  /* ---- Firebase 설정값 (부모가 직접 입력) ---- */
  const _CONFIG = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId:             "YOUR_APP_ID",
  };

  /* ---- 내부 상태 ---- */
  let _db          = null;
  let _familyCode  = null;
  let _unsubscribe = null;
  let _online      = false;

  /* ---- 설정 완료 여부 확인 ---- */
  function _isConfigured() {
    return typeof firebase !== 'undefined'
      && !_CONFIG.apiKey.startsWith('YOUR_')
      && _CONFIG.projectId !== 'YOUR_PROJECT_ID';
  }

  /* ============================================================
     초기화
     ============================================================ */
  function init(familyCode) {
    _familyCode = familyCode;
    if (!_isConfigured()) return;
    try {
      if (!firebase.apps.length) firebase.initializeApp(_CONFIG);
      _db = firebase.firestore();
      /* 오프라인 지속성 (IndexedDB 캐싱) */
      _db.enablePersistence({ synchronizeTabs: true })
        .catch(err => {
          if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
            console.warn('[DB] 오프라인 저장 비활성화:', err.code);
          }
        });
      _online = true;
      _watchConnectivity();
    } catch (e) {
      console.warn('[DB] 초기화 실패:', e.message);
    }
  }

  function isOnline() {
    return _online && !!_db && !!_familyCode;
  }

  /* ---- 네트워크 상태 감지 ---- */
  function _watchConnectivity() {
    window.addEventListener('online',  () => {
      _online = true;
      App.showToast('📡 온라인 — 데이터 동기화 중...');
    });
    window.addEventListener('offline', () => {
      _online = false;
      App.showToast('📴 오프라인 모드로 전환됐어요');
    });
  }

  /* ---- Firestore 문서 레퍼런스 ---- */
  function _ref() {
    return _db.collection('families').doc(_familyCode);
  }

  /* ============================================================
     가족 문서 초기화 (가족 코드 입력 시 호출)
     ============================================================ */
  async function initFamily() {
    if (!isOnline()) return;
    try {
      const snap = await _ref().get();
      if (snap.exists) {
        /* 이미 존재 → 원격 데이터를 localStorage로 동기화 */
        _applySnapshot(snap);
        App.showToast('👨‍👩‍👧 가족 데이터를 불러왔어요! 📡');
      } else {
        /* 신규 → 현재 localStorage 데이터를 Firestore에 업로드 */
        await push();
      }
    } catch (e) {
      console.warn('[DB] initFamily 실패:', e.message);
    }
  }

  /* ============================================================
     Firestore → localStorage 적용
     ============================================================ */
  function _applySnapshot(snap) {
    if (!snap.exists) return;
    const d = snap.data();

    /* PIN */
    if (d.info?.parentPin) App.Storage.set('parentPin', d.info.parentPin);

    /* 설정 */
    if (d.settings) {
      ['stickerGoal_fox','stickerGoal_rabbit',
       'rewardText_fox','rewardText_rabbit'].forEach(k => {
        if (d.settings[k] !== undefined) App.Storage.set(k, d.settings[k]);
      });
    }

    /* 아이 진행도 */
    for (const co of ['fox', 'rabbit']) {
      if (!d[co]) continue;
      if (d[co].completedMissions !== undefined)
        App.Storage.set(`completed_${co}`, d[co].completedMissions);
      if (d[co].totalStickers !== undefined)
        App.Storage.set(`totalStickers_${co}`, d[co].totalStickers);
      if (d[co].boardsCompleted !== undefined)
        App.Storage.set(`boardsCompleted_${co}`, d[co].boardsCompleted);
    }
  }

  /* ============================================================
     실시간 리스너 (onSnapshot)
     ============================================================ */
  function startListening(onUpdate) {
    if (!isOnline()) return;
    if (_unsubscribe) _unsubscribe(); /* 중복 방지 */

    _unsubscribe = _ref().onSnapshot(
      snap => {
        _applySnapshot(snap);
        if (onUpdate) onUpdate();
      },
      err => console.warn('[DB] 리스너 오류:', err.message)
    );
  }

  function stopListening() {
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
  }

  /* ============================================================
     Firestore 쓰기 헬퍼
     ============================================================ */

  /* 전체 데이터 업로드 */
  async function push() {
    if (!isOnline()) return;
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    const data = {
      info: { parentPin: App.Storage.get('parentPin', ''), updatedAt: ts },
      settings: {
        stickerGoal_fox:    App.Storage.get('stickerGoal_fox', 10),
        stickerGoal_rabbit: App.Storage.get('stickerGoal_rabbit', 10),
        rewardText_fox:     App.Storage.get('rewardText_fox', ''),
        rewardText_rabbit:  App.Storage.get('rewardText_rabbit', ''),
      },
      fox: {
        completedMissions: App.Storage.get('completed_fox', []),
        totalStickers:     App.Storage.get('totalStickers_fox', 0),
        boardsCompleted:   App.Storage.get('boardsCompleted_fox', 0),
        lastActivity:      ts,
      },
      rabbit: {
        completedMissions: App.Storage.get('completed_rabbit', []),
        totalStickers:     App.Storage.get('totalStickers_rabbit', 0),
        boardsCompleted:   App.Storage.get('boardsCompleted_rabbit', 0),
        lastActivity:      ts,
      },
    };
    try { await _ref().set(data, { merge: true }); }
    catch (e) { console.warn('[DB] push 실패:', e.message); }
  }

  /* 코스 진행도만 업데이트 */
  async function pushCourse(course) {
    if (!isOnline()) return;
    const ts  = firebase.firestore.FieldValue.serverTimestamp();
    const upd = {};
    upd[course] = {
      completedMissions: App.Storage.get(`completed_${course}`, []),
      totalStickers:     App.Storage.get(`totalStickers_${course}`, 0),
      boardsCompleted:   App.Storage.get(`boardsCompleted_${course}`, 0),
      lastActivity:      ts,
    };
    try { await _ref().set(upd, { merge: true }); }
    catch (e) { console.warn('[DB] pushCourse 실패:', e.message); }
  }

  /* 보상 설정만 업데이트 */
  async function pushSettings() {
    if (!isOnline()) return;
    const settings = {
      stickerGoal_fox:    Sticker.getGoal('fox'),
      stickerGoal_rabbit: Sticker.getGoal('rabbit'),
      rewardText_fox:     Sticker.getReward('fox'),
      rewardText_rabbit:  Sticker.getReward('rabbit'),
    };
    try { await _ref().set({ settings }, { merge: true }); }
    catch (e) { console.warn('[DB] pushSettings 실패:', e.message); }
  }

  /* PIN만 업데이트 */
  async function pushPin(pin) {
    if (!isOnline()) return;
    try {
      await _ref().set(
        { info: { parentPin: pin, updatedAt: firebase.firestore.FieldValue.serverTimestamp() } },
        { merge: true }
      );
    } catch (e) { console.warn('[DB] pushPin 실패:', e.message); }
  }

  /* ---- 공개 API ---- */
  return {
    init,
    isOnline,
    initFamily,
    push,
    pushCourse,
    pushSettings,
    pushPin,
    startListening,
    stopListening,
  };

})();
