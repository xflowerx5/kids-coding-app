/* ============================================================
   코딩 스티커 — Parent Dashboard
   Phase 4+B: PIN 보호 부모 대시보드 + 상품스티커 확인
   ============================================================ */

const Parent = (() => {

  let _buf   = '';
  let _mode  = 'verify';
  let _first = '';

  function _getPin()  { return App.Storage.get('parentPin', null); }
  function _hasPin()  { return !!_getPin(); }

  function showPinScreen() {
    App.showScreen('parent-pin');
  }

  /* ============================================================
     화면 1: PIN 입력 / 설정
     ============================================================ */
  App.registerScreen('parent-pin', () => {
    _buf   = '';
    _mode  = _hasPin() ? 'verify' : 'set-first';
    _first = '';

    const isVerify = _mode === 'verify';
    const title    = isVerify ? '부모 모드' : 'PIN 만들기';
    const subtitle = isVerify ? '4자리 PIN을 입력해주세요' : '사용할 4자리 PIN을 입력해주세요';

    const keys = [1,2,3,4,5,6,7,8,9,'',0,'⌫'];
    const keysHTML = keys.map(k => {
      if (k === '') return '<div class="pp-key-empty"></div>';
      return `<button class="pp-key" onclick="Parent.pinInput('${k}')">${k}</button>`;
    }).join('');

    return `
    <div class="screen screen-parent-pin">
      <button class="btn-back pp-back" onclick="App.showScreen('mission-map')" aria-label="뒤로">←</button>

      <div class="pp-icon">🔐</div>
      <h1 class="pp-title">${title}</h1>
      <p class="pp-subtitle" id="pp-subtitle">${subtitle}</p>

      <div class="pp-dots" id="pp-dots">
        <span class="pp-dot" id="pp-d0"></span>
        <span class="pp-dot" id="pp-d1"></span>
        <span class="pp-dot" id="pp-d2"></span>
        <span class="pp-dot" id="pp-d3"></span>
      </div>

      <div class="pp-keypad">
        ${keysHTML}
      </div>

      ${isVerify ? `<button class="pp-reset-link" onclick="Parent.resetPin()">PIN을 잊었어요</button>` : ''}
    </div>`;
  });

  function pinInput(key) {
    Sound.pinTap();
    if (key === '⌫') {
      _buf = _buf.slice(0, -1);
    } else if (_buf.length < 4) {
      _buf += String(key);
    }
    _renderDots();
    if (_buf.length === 4) {
      setTimeout(_processPin, 220);
    }
  }

  function _renderDots() {
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById(`pp-d${i}`);
      if (el) el.classList.toggle('pp-dot-filled', i < _buf.length);
    }
  }

  function _shake() {
    const dots = document.getElementById('pp-dots');
    if (!dots) return;
    dots.classList.add('anim-shake');
    setTimeout(() => dots.classList.remove('anim-shake'), 500);
  }

  function _processPin() {
    if (_mode === 'verify') {
      if (_buf === _getPin()) {
        Sound.unlock();
        App.showScreen('parent-dashboard');
      } else {
        Sound.error();
        _shake();
        _buf = '';
        _renderDots();
        App.showToast('PIN이 틀렸어요! 다시 입력해주세요');
      }
    } else if (_mode === 'set-first') {
      _first = _buf;
      _buf   = '';
      _mode  = 'set-confirm';
      _renderDots();
      const sub = document.getElementById('pp-subtitle');
      if (sub) sub.textContent = '한 번 더 입력해주세요';
    } else if (_mode === 'set-confirm') {
      if (_buf === _first) {
        App.Storage.set('parentPin', _buf);
        if (typeof DB !== 'undefined') DB.pushPin(_buf);
        Sound.missionComplete();
        App.showScreen('parent-dashboard');
      } else {
        Sound.error();
        _shake();
        _buf   = '';
        _first = '';
        _mode  = 'set-first';
        _renderDots();
        App.showToast('PIN이 일치하지 않아요. 처음부터 다시 입력해주세요');
        const sub = document.getElementById('pp-subtitle');
        if (sub) sub.textContent = '사용할 4자리 PIN을 입력해주세요';
      }
    }
  }

  function resetPin() {
    Sound.click();
    App.Storage.remove('parentPin');
    _buf   = '';
    _first = '';
    _mode  = 'set-first';
    _renderDots();
    const sub = document.getElementById('pp-subtitle');
    if (sub) sub.textContent = '새 PIN을 입력해주세요';
    const link = document.querySelector('.pp-reset-link');
    if (link) link.remove();
    App.showToast('PIN이 초기화됐어요. 새 PIN을 설정해주세요');
  }

  /* ============================================================
     화면 2: 부모 대시보드
     ============================================================ */
  App.registerScreen('parent-dashboard', async () => {
    await Puzzle.waitReady();
    const cardsHTML = ['fox', 'rabbit'].map(co => _renderChildCard(co)).join('');

    /* 상품스티커 대기 알림 */
    const foxPending    = Sticker.getPendingReward('fox');
    const rabbitPending = Sticker.getPendingReward('rabbit');
    const totalPending  = foxPending + rabbitPending;
    const alertHTML = totalPending > 0
      ? `<div class="pd-reward-alert">
           🎖️ 확인 대기 중인 상품스티커가 <strong>${totalPending}개</strong> 있어요!
         </div>`
      : '';

    return `
    <div class="screen screen-parent-dashboard">
      <div class="pd-header">
        <button class="btn-back" onclick="App.showScreen('mission-map')" aria-label="미션맵으로">←</button>
        <span class="pd-header-title">👨‍👩‍👧 부모 대시보드</span>
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
      </div>

      <div class="pd-body">
        ${alertHTML}

        <div class="pd-section-label">📊 아이 현황</div>
        ${cardsHTML}

        <button class="pd-logout-btn" onclick="Parent.logout()">🔒 부모 모드 잠금</button>
      </div>
    </div>`;
  });

  function _renderChildCard(co) {
    const isFox      = co === 'fox';
    const emoji      = isFox ? '🦊' : '🐰';
    const name       = isFox ? '여우 코스 (아들, 초5)' : '토끼 코스 (딸, 초3)';
    const theme      = isFox ? 'fox' : 'rabbit';
    const completed  = App.Storage.get(`completed_${co}`, []);
    const miniTotal  = Sticker.getMiniTotal(co);
    const miniProg   = Sticker.getMiniProgress(co);
    const rewardCount = Sticker.getRewardCount(co);
    const pending    = Sticker.getPendingReward(co);
    const confirmed  = Sticker.getConfirmedReward(co);
    const pct        = Math.round((miniProg / Sticker.MINI_GOAL) * 100);
    const total      = Puzzle.getMissions(co).length;

    const missionListHTML = completed.length > 0
      ? completed.map(id => {
          const m = Puzzle.getMission(co, id);
          return m ? `<div class="pd-mission-item">${m.emoji} <span>${m.id}단계 · ${m.title}</span></div>` : '';
        }).join('')
      : `<div class="pd-no-missions">아직 완료한 미션이 없어요 🌱</div>`;

    /* 상품스티커 확인 버튼 */
    const rewardSection = rewardCount > 0 ? `
      <div class="pd-reward-section">
        <div class="pd-reward-label">🎖️ 상품스티커</div>
        <div class="pd-reward-counts">
          <span class="pd-reward-total">총 ${rewardCount}개</span>
          ${pending > 0 ? `<span class="pd-reward-pending">⏳ 미확인 ${pending}개</span>` : ''}
          ${confirmed > 0 ? `<span class="pd-reward-confirmed">✅ 확인 ${confirmed}개</span>` : ''}
        </div>
        ${pending > 0
          ? `<button class="pd-confirm-btn ${theme}-theme" onclick="Parent.confirmReward('${co}')">
               🎁 선물 주고 확인하기
             </button>`
          : `<div class="pd-reward-done">모든 상품스티커 확인 완료 ✅</div>`}
      </div>` : '';

    return `
    <div class="pd-child-card">
      <div class="pd-card-header ${theme}-bg">
        <span class="pd-card-emoji">${emoji}</span>
        <span class="pd-card-name">${name}</span>
        <span class="pd-card-sticker-badge">⭐ ${miniTotal}</span>
      </div>
      <div class="pd-card-body">
        <div class="pd-stats">
          <div class="pd-stat-item">
            <div class="pd-stat-num">${completed.length}<span class="pd-stat-denom">/${total}</span></div>
            <div class="pd-stat-lbl">완료 미션</div>
          </div>
          <div class="pd-stat-divider"></div>
          <div class="pd-stat-item">
            <div class="pd-stat-num">⭐ ${miniTotal}</div>
            <div class="pd-stat-lbl">누적 스티커</div>
          </div>
          <div class="pd-stat-divider"></div>
          <div class="pd-stat-item">
            <div class="pd-stat-num">🎖️ ${rewardCount}</div>
            <div class="pd-stat-lbl">상품스티커</div>
          </div>
        </div>

        <div class="pd-board-progress">
          <div class="pd-board-label">
            <span>현재 스티커판</span>
            <span>${miniProg} / ${Sticker.MINI_GOAL}개</span>
          </div>
          <div class="pd-prog-track">
            <div class="pd-prog-fill ${theme}-theme" style="width:${pct}%"></div>
          </div>
        </div>

        ${rewardSection}

        <details class="pd-detail">
          <summary class="pd-detail-summary">완료한 미션 (${completed.length}개) ▾</summary>
          <div class="pd-mission-list">${missionListHTML}</div>
        </details>
      </div>
    </div>`;
  }

  /* 부모 상품스티커 확인 */
  function confirmReward(course) {
    const ok = Sticker.confirmReward(course);
    if (ok) {
      Sound.missionComplete();
      App.spawnParticles(['🎖️','🎁','✨','⭐'], 10);
      App.showToast('선물 확인 완료! 아이에게 선물을 줘요 🎁');
      /* 카드 즉시 갱신 */
      setTimeout(() => App.showScreen('parent-dashboard'), 800);
    }
  }

  function logout() {
    Sound.click();
    App.showScreen('mission-map');
  }

  /* ---- 공개 API ---- */
  return {
    showPinScreen,
    pinInput,
    resetPin,
    confirmReward,
    logout,
  };

})();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            