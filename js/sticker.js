/* ============================================================
   코딩 스티커 — Sticker System
   Phase B: 미니스티커 30개 → 상품스티커 1개
   ============================================================ */

const Sticker = (() => {

  const MINI_GOAL = 30; // 미니스티커 30개 = 상품스티커 1개

  /* ---- 스티커 데이터 접근 ---- */
  function getMiniTotal(course) {
    return App.Storage.get(`totalStickers_${course}`, 0);
  }
  function getMiniProgress(course) {
    return getMiniTotal(course) % MINI_GOAL;
  }
  function getRewardCount(course) {
    return App.Storage.get(`rewardStickers_${course}`, 0);
  }
  function getPendingReward(course) {
    return App.Storage.get(`pendingReward_${course}`, 0);
  }
  function getConfirmedReward(course) {
    return App.Storage.get(`confirmedReward_${course}`, 0);
  }

  /* 부모가 상품스티커 확인 → pending 차감, confirmed 증가 */
  function confirmReward(course) {
    const pending = getPendingReward(course);
    if (pending <= 0) return false;
    App.Storage.set(`pendingReward_${course}`, pending - 1);
    App.Storage.set(`confirmedReward_${course}`, getConfirmedReward(course) + 1);
    if (typeof DB !== 'undefined') DB.pushCourse(course);
    return true;
  }

  /* ---- 미니스티커 격자 HTML ---- */
  function renderMiniBoard(course, animate) {
    const filled = getMiniProgress(course) || (getMiniTotal(course) > 0 && getMiniTotal(course) % MINI_GOAL === 0 ? MINI_GOAL : getMiniProgress(course));
    const cols   = 6; // 6×5 = 30

    let cells = '';
    for (let i = 0; i < MINI_GOAL; i++) {
      const isFilled   = i < filled;
      const justEarned = animate && i === filled - 1;
      cells += `<div class="sb-cell ${isFilled ? `sb-cell-filled ${course}-theme` : 'sb-cell-empty'} ${justEarned ? 'anim-pop' : ''}">${isFilled ? '⭐' : ''}</div>`;
    }
    return `<div class="sb-grid" style="--sb-cols:${cols}">${cells}</div>`;
  }

  /* ============================================================
     화면: 스티커판 (미니스티커 30칸)
     ============================================================ */
  App.registerScreen('sticker-board', (data) => {
    const co          = (data && data.course) || App.Storage.get('selectedCourse', 'fox');
    const justEarned  = !!(data && data.justEarned);
    const bgClass     = co === 'fox' ? 'fox-bg' : 'rabbit-bg';
    const courseEmoji = co === 'fox' ? '🦊' : '🐰';
    const courseName  = co === 'fox' ? '여우 코스' : '토끼 코스';

    const miniProgress = getMiniProgress(co);
    const rewardCount  = getRewardCount(co);
    const pending      = getPendingReward(co);
    const confirmed    = getConfirmedReward(co);
    const pct          = Math.round((miniProgress / MINI_GOAL) * 100);

    if (justEarned) setTimeout(() => Sound.stickerEarn(), 80);

    const rewardHTML = rewardCount > 0
      ? `<div class="sb-reward-section">
           <div class="sb-reward-title">🎖️ 획득한 상품스티커</div>
           <div class="sb-reward-stickers">
             ${Array.from({ length: rewardCount }, (_, i) => {
               const isConfirmed = i < confirmed;
               return `<div class="sb-reward-item ${isConfirmed ? 'sb-reward-confirmed' : 'sb-reward-pending'}"
                            title="${isConfirmed ? '부모님 확인 완료' : '부모님 확인 대기 중'}">
                 🎖️<span class="sb-reward-status">${isConfirmed ? '✅' : '⏳'}</span>
               </div>`;
             }).join('')}
           </div>
           ${pending > 0
             ? `<p class="sb-reward-hint">⏳ 부모님께 상품스티커를 보여드리고 선물을 받아요!</p>`
             : `<p class="sb-reward-hint sb-reward-all-done">✅ 모든 상품스티커를 확인받았어요!</p>`}
         </div>`
      : `<div class="sb-reward-empty-hint">
           <p>⭐ 30개를 모으면 🎖️ 상품스티커를 받아요!</p>
         </div>`;

    return `
    <div class="screen screen-sticker-board">
      <div class="sb-header ${bgClass}">
        <button class="btn-back" onclick="App.showScreen('mission-map')" aria-label="뒤로">←</button>
        <div class="sb-header-info">
          <span>${courseEmoji}</span>
          <span>${courseName} 스티커판</span>
        </div>
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
      </div>

      <div class="sb-body">
        <div class="sb-progress-label">
          <span class="sb-count-text">⭐ <strong>${miniProgress}</strong> / ${MINI_GOAL}</span>
          <span class="sb-pct-text">${pct}%</span>
        </div>
        <div class="sb-progress-track">
          <div class="sb-progress-fill ${co}-theme" style="width:${pct}%"></div>
        </div>

        <div class="sb-grid-wrap">
          ${renderMiniBoard(co, justEarned)}
        </div>

        ${rewardHTML}

        <div class="sb-btns">
          <button class="btn-primary" onclick="App.showScreen('mission-map')">미션 계속하기 →</button>
        </div>
      </div>
    </div>`;
  });

  /* ============================================================
     화면: 상품스티커 획득 축하 (미니스티커 30개 달성)
     ============================================================ */
  App.registerScreen('board-complete', (data) => {
    const co          = (data && data.course) || App.Storage.get('selectedCourse', 'fox');
    const bgClass     = co === 'fox' ? 'fox-bg' : 'rabbit-bg';
    const charEmoji   = co === 'fox' ? '🦊' : '🐰';
    const rewardCount = data?.rewardCount || getRewardCount(co);

    setTimeout(() => {
      Sound.boardComplete();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.45 } });
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.1, y: 0.6 } }), 600);
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.9, y: 0.6 } }), 900);
      }
    }, 300);

    /* 완성된 30칸 그리드 */
    let fullCells = '';
    for (let i = 0; i < MINI_GOAL; i++) {
      fullCells += `<div class="sb-cell sb-cell-filled ${co}-theme">⭐</div>`;
    }
    const fullGrid = `<div class="sb-grid" style="--sb-cols:6">${fullCells}</div>`;

    return `
    <div class="screen screen-board-complete ${bgClass}">
      <div class="bc-deco" aria-hidden="true">
        <span class="bc-d1 anim-float">⭐</span>
        <span class="bc-d2 anim-float">✨</span>
        <span class="bc-d3 anim-float">🌟</span>
        <span class="bc-d4 anim-float">💫</span>
        <span class="bc-d5 anim-float">⭐</span>
        <span class="bc-d6 anim-float">✨</span>
      </div>

      <div class="bc-content">
        <div class="bc-char anim-pop">${charEmoji}</div>
        <h1 class="bc-title anim-slideUp">스티커판 완성!</h1>
        <p class="bc-subtitle anim-slideUp" style="animation-delay:0.08s">
          ⭐ 30개를 모두 모았어요!
        </p>

        <div class="bc-reward-box anim-pop" style="animation-delay:0.15s">
          <div class="bc-reward-icon">🎖️</div>
          <div class="bc-reward-title">상품스티커 획득!</div>
          <div class="bc-reward-count">총 ${rewardCount}개 보유</div>
          <p class="bc-reward-desc">부모님께 이 화면을 보여드리고<br>선물을 받아요! 🎁</p>
        </div>

        <div class="bc-mini-grid-wrap anim-pop" style="animation-delay:0.2s">
          ${fullGrid}
        </div>

        <button class="bc-next-btn anim-slideUp" style="animation-delay:0.3s"
                onclick="App.showScreen('mission-map')">
          새 스티커판 시작! 🚀
        </button>
        <button class="btn-ghost bc-sticker-btn anim-slideUp" style="animation-delay:0.38s"
                onclick="App.showScreen('sticker-board',{course:'${co}'})">
          🎖️ 내 상품스티커 보기
        </button>
      </div>
    </div>`;
  });

  /* ---- 공개 API ---- */
  return {
    MINI_GOAL,
    getMiniTotal,
    getMiniProgress,
    getRewardCount,
    getPendingReward,
    getConfirmedReward,
    confirmReward,
    renderMiniBoard,
  };

})();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      