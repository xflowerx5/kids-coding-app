/* ============================================================
   코딩 스티커 — Sticker System
   Phase 3: 스티커판 + 보상 UI
   ============================================================ */

const Sticker = (() => {

  const DEFAULT_GOAL = 10;

  /* ---- 설정 헬퍼 ---- */
  function getGoal(course) {
    return App.Storage.get(`stickerGoal_${course}`, DEFAULT_GOAL);
  }
  function setGoal(course, n) {
    App.Storage.set(`stickerGoal_${course}`, Math.max(5, Math.min(30, n)));
  }
  function getReward(course) {
    return App.Storage.get(`rewardText_${course}`, '');
  }
  function setReward(course, text) {
    App.Storage.set(`rewardText_${course}`, text);
  }
  function getBoardsCompleted(course) {
    return App.Storage.get(`boardsCompleted_${course}`, 0);
  }

  /* 현재 스티커판에서 모은 스티커 수 */
  function getBoardProgress(course) {
    const total = App.Storage.get(`totalStickers_${course}`, 0);
    const goal  = getGoal(course);
    return total % goal;
  }

  /* 새 누적 합계가 스티커판을 완성시키는지 확인 */
  function checkBoardComplete(course, newTotal) {
    const goal = getGoal(course);
    return newTotal > 0 && newTotal % goal === 0;
  }

  /* ---- 스티커 셀 그리드 HTML 생성 ---- */
  function renderBoardGrid(course, filledCount, goalCount, animate) {
    const cols   = Math.min(5, goalCount);
    let cells = '';
    for (let i = 0; i < goalCount; i++) {
      const filled     = i < filledCount;
      const justEarned = animate && i === filledCount - 1;
      cells += `<div class="sb-cell ${filled ? `sb-cell-filled ${course}-theme` : 'sb-cell-empty'} ${justEarned ? 'anim-pop' : ''}">${filled ? '⭐' : ''}</div>`;
    }
    return `<div class="sb-grid" style="--sb-cols:${cols}">${cells}</div>`;
  }

  /* ============================================================
     화면: 스티커판
     ============================================================ */
  App.registerScreen('sticker-board', (data) => {
    const co       = (data && data.course) || App.Storage.get('selectedCourse', 'fox');
    const justEarned = !!(data && data.justEarned);
    const bgClass  = co === 'fox' ? 'fox-bg' : 'rabbit-bg';
    const courseEmoji = co === 'fox' ? '🦊' : '🐰';
    const courseName  = co === 'fox' ? '여우 코스' : '토끼 코스';
    const goal    = getGoal(co);
    const filled  = justEarned
      ? (App.Storage.get(`totalStickers_${co}`, 0) % goal || goal)
      : getBoardProgress(co);
    const reward  = getReward(co);
    const boards  = getBoardsCompleted(co);
    const pct     = Math.round((filled / goal) * 100);

    const gridHTML    = renderBoardGrid(co, filled, goal, justEarned);
    const boardsHTML  = boards > 0
      ? `<div class="sb-boards-done">🏆 스티커판 ${boards}번 완성했어요!</div>`
      : '';
    const rewardHTML  = reward
      ? `<div class="sb-reward-box">
           <div class="sb-reward-label">🎁 목표 보상</div>
           <div class="sb-reward-text">${reward}</div>
         </div>`
      : `<div class="sb-reward-box sb-reward-empty">
           <div class="sb-reward-label">🎁 보상을 아직 설정하지 않았어요!</div>
           <button class="btn-ghost sb-settings-btn" onclick="App.showScreen('reward-settings',{course:'${co}'})">설정하러 가기 →</button>
         </div>`;

    if (justEarned) {
      setTimeout(() => Sound.stickerEarn(), 80);
    }

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
          <span class="sb-count-text">⭐ <strong>${filled}</strong> / ${goal}</span>
          <span class="sb-pct-text">${pct}%</span>
        </div>
        <div class="sb-progress-track">
          <div class="sb-progress-fill ${co}-theme" style="width:${pct}%"></div>
        </div>

        <div class="sb-grid-wrap">
          ${gridHTML}
        </div>

        ${boardsHTML}
        ${rewardHTML}

        <div class="sb-btns">
          <button class="btn-primary" onclick="App.showScreen('mission-map')">미션 계속하기 →</button>
          <button class="btn-ghost sb-setting-link" onclick="App.showScreen('reward-settings',{course:'${co}'})">⚙️ 보상 설정</button>
        </div>
      </div>
    </div>`;
  });

  /* ============================================================
     화면: 스티커판 완성 축하
     ============================================================ */
  App.registerScreen('board-complete', (data) => {
    const co       = (data && data.course) || App.Storage.get('selectedCourse', 'fox');
    const bgClass  = co === 'fox' ? 'fox-bg' : 'rabbit-bg';
    const charEmoji = co === 'fox' ? '🦊' : '🐰';
    const goal     = getGoal(co);
    const reward   = getReward(co);

    const rewardHTML = reward
      ? `<div class="bc-reward-box">
           <div class="bc-reward-label">🎁 오늘의 보상!</div>
           <div class="bc-reward-text">${reward}</div>
         </div>`
      : `<div class="bc-reward-box bc-reward-empty">
           <div class="bc-reward-text">부모님과 함께 보상을 정해봐요! 🎁</div>
         </div>`;

    const fullGrid = renderBoardGrid(co, goal, goal, false);

    setTimeout(() => {
      Sound.boardComplete();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.45 } });
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.1, y: 0.6 } }), 600);
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.9, y: 0.6 } }), 900);
      }
    }, 300);

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
        <p class="bc-subtitle anim-slideUp" style="animation-delay:0.08s">🎉 부모님께 보여드려요! 🎉</p>

        <div class="bc-mini-grid-wrap anim-pop" style="animation-delay:0.15s">
          ${fullGrid}
        </div>

        ${rewardHTML}

        <button class="bc-next-btn anim-slideUp" style="animation-delay:0.3s"
                onclick="App.showScreen('mission-map')">
          다음 스티커판 시작! 🚀
        </button>
      </div>
    </div>`;
  });

  /* ============================================================
     화면: 보상 설정
     ============================================================ */
  App.registerScreen('reward-settings', (data) => {
    const co      = (data && data.course) || App.Storage.get('selectedCourse', 'fox');
    const bgClass = co === 'fox' ? 'fox-bg' : 'rabbit-bg';
    const courseEmoji = co === 'fox' ? '🦊' : '🐰';
    const goal    = getGoal(co);
    const reward  = getReward(co);

    return `
    <div class="screen screen-reward-settings">
      <div class="rs-header ${bgClass}">
        <button class="btn-back" onclick="App.showScreen('sticker-board',{course:'${co}'})" aria-label="뒤로">←</button>
        <div class="rs-header-title">${courseEmoji} 보상 설정</div>
        <div></div>
      </div>

      <div class="rs-body">
        <div class="rs-card">
          <div class="rs-section-title">⭐ 스티커 목표 수</div>
          <p class="rs-desc">몇 개를 모으면 보상을 받을까요?</p>
          <div class="rs-goal-row">
            <button class="rs-goal-btn" onclick="Sticker.adjustGoal('${co}',-1)">−</button>
            <div class="rs-goal-display" id="rs-goal-val">${goal}</div>
            <button class="rs-goal-btn" onclick="Sticker.adjustGoal('${co}',1)">+</button>
          </div>
          <p class="rs-goal-range">5 ~ 30개 설정 가능</p>
        </div>

        <div class="rs-card">
          <div class="rs-section-title">🎁 보상 내용</div>
          <p class="rs-desc">목표를 달성하면 어떤 보상을 줄까요?</p>
          <input id="rs-reward-input" class="rs-input" type="text"
            maxlength="30" placeholder="예: 치킨 먹기, 용돈 2,000원..."
            value="${reward}" />
        </div>

        <button class="btn-primary rs-save-btn" onclick="Sticker.saveSettings('${co}')">
          💾 저장하기
        </button>
      </div>
    </div>`;
  });

  /* ---- 목표 수 조정 (보상 설정 화면 내) ---- */
  function adjustGoal(course, delta) {
    const current = getGoal(course);
    const next    = Math.max(5, Math.min(30, current + delta));
    setGoal(course, next);
    const el = document.getElementById('rs-goal-val');
    if (el) el.textContent = next;
    Sound.click();
  }

  /* ---- 설정 저장 ---- */
  function saveSettings(course) {
    const rewardEl = document.getElementById('rs-reward-input');
    const reward   = rewardEl ? rewardEl.value.trim() : '';
    setReward(course, reward);
    if (typeof DB !== 'undefined') DB.pushSettings();
    Sound.missionComplete();
    App.showToast('저장했어요! 🎉');
    setTimeout(() => App.showScreen('sticker-board', { course }), 800);
  }

  /* ---- 공개 API ---- */
  return {
    getGoal, setGoal,
    getReward, setReward,
    getBoardsCompleted,
    getBoardProgress,
    checkBoardComplete,
    renderBoardGrid,
    adjustGoal,
    saveSettings,
  };

})();
