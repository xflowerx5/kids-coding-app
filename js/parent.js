/* ============================================================
   코딩 스티커 — Parent Dashboard
   Phase 4: PIN 보호 부모 대시보드
   ============================================================ */

const Parent = (() => {

  /* ---- PIN 상태 (화면 전환 간 유지) ---- */
  let _buf  = '';   // 현재 입력 버퍼
  let _mode = 'verify';   // 'verify' | 'set-first' | 'set-confirm'
  let _first = '';  // set-confirm 단계에서 첫 번째 입력 보관

  /* ---- PIN 저장/조회 ---- */
  function _getPin()      { return App.Storage.get('parentPin', null); }
  function _hasPin()      { return !!_getPin(); }

  /* ---- 공개: PIN 화면 진입점 ---- */
  function showPinScreen() {
    App.showScreen('parent-pin');
  }

  /* ============================================================
     화면 1: PIN 입력 / 설정
     ============================================================ */
  App.registerScreen('parent-pin', () => {
    _buf  = '';
    _mode = _hasPin() ? 'verify' : 'set-first';
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

  /* ---- 숫자/삭제 키 입력 ---- */
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

  /* ---- PIN 초기화 (분실 시) ---- */
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
  App.registerScreen('parent-dashboard', () => {
    const cardsHTML = ['fox', 'rabbit'].map(co => _renderChildCard(co)).join('');

    return `
    <div class="screen screen-parent-dashboard">
      <div class="pd-header">
        <button class="btn-back" onclick="App.showScreen('mission-map')" aria-label="미션맵으로">←</button>
        <span class="pd-header-title">👨‍👩‍👧 부모 대시보드</span>
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
      </div>

      <div class="pd-body">
        <div class="pd-section-label">📊 아이 현황</div>
        ${cardsHTML}

        <div class="pd-section-label" style="margin-top:8px">⚙️ 보상 설정</div>
        <div class="pd-reward-row">
          <button class="pd-reward-btn fox-border" onclick="App.showScreen('parent-reward-settings',{course:'fox'})">
            🦊 여우 보상
          </button>
          <button class="pd-reward-btn rabbit-border" onclick="App.showScreen('parent-reward-settings',{course:'rabbit'})">
            🐰 토끼 보상
          </button>
        </div>

        <button class="pd-logout-btn" onclick="Parent.logout()">🔒 부모 모드 잠금</button>
      </div>
    </div>`;
  });

  function _renderChildCard(co) {
    const isFox     = co === 'fox';
    const emoji     = isFox ? '🦊' : '🐰';
    const name      = isFox ? '여우 코스 (아들, 초5)' : '토끼 코스 (딸, 초3)';
    const theme     = isFox ? 'fox' : 'rabbit';
    const completed = App.Storage.get(`completed_${co}`, []);
    const stickers  = App.Storage.get(`totalStickers_${co}`, 0);
    const boards    = App.Storage.get(`boardsCompleted_${co}`, 0);
    const goal      = Sticker.getGoal(co);
    const reward    = Sticker.getReward(co);
    const boardProg = stickers % goal;
    const pct       = Math.round((boardProg / goal) * 100);
    const total     = Puzzle.getMissions(co).length;

    const missionListHTML = completed.length > 0
      ? completed.map(id => {
          const m = Puzzle.getMission(co, id);
          return m ? `<div class="pd-mission-item">${m.emoji} <span>${m.id}단계 · ${m.title}</span></div>` : '';
        }).join('')
      : `<div class="pd-no-missions">아직 완료한 미션이 없어요 🌱</div>`;

    return `
    <div class="pd-child-card">
      <div class="pd-card-header ${theme}-bg">
        <span class="pd-card-emoji">${emoji}</span>
        <span class="pd-card-name">${name}</span>
        <span class="pd-card-sticker-badge">⭐ ${stickers}</span>
      </div>
      <div class="pd-card-body">
        <div class="pd-stats">
          <div class="pd-stat-item">
            <div class="pd-stat-num">${completed.length}<span class="pd-stat-denom">/${total}</span></div>
            <div class="pd-stat-lbl">완료 미션</div>
          </div>
          <div class="pd-stat-divider"></div>
          <div class="pd-stat-item">
            <div class="pd-stat-num">⭐ ${stickers}</div>
            <div class="pd-stat-lbl">누적 스티커</div>
          </div>
          <div class="pd-stat-divider"></div>
          <div class="pd-stat-item">
            <div class="pd-stat-num">🏆 ${boards}</div>
            <div class="pd-stat-lbl">판 완성</div>
          </div>
        </div>

        <div class="pd-board-progress">
          <div class="pd-board-label">
            <span>현재 스티커판</span>
            <span>${boardProg} / ${goal}개</span>
          </div>
          <div class="pd-prog-track">
            <div class="pd-prog-fill ${theme}-theme" style="width:${pct}%"></div>
          </div>
        </div>

        ${reward ? `<div class="pd-reward-display">🎁 목표 보상: <strong>${reward}</strong></div>` : ''}

        <details class="pd-detail">
          <summary class="pd-detail-summary">완료한 미션 (${completed.length}개) ▾</summary>
          <div class="pd-mission-list">${missionListHTML}</div>
        </details>
      </div>
    </div>`;
  }

  /* ============================================================
     화면 3: 부모용 보상 설정 (대시보드로 복귀)
     ============================================================ */
  App.registerScreen('parent-reward-settings', (data) => {
    const co          = (data && data.course) || 'fox';
    const bgClass     = co === 'fox' ? 'fox-bg' : 'rabbit-bg';
    const courseEmoji = co === 'fox' ? '🦊' : '🐰';
    const goal        = Sticker.getGoal(co);
    const reward      = Sticker.getReward(co);

    return `
    <div class="screen screen-reward-settings">
      <div class="rs-header ${bgClass}">
        <button class="btn-back" onclick="App.showScreen('parent-dashboard')" aria-label="뒤로">←</button>
        <div class="rs-header-title">${courseEmoji} 보상 설정</div>
        <div></div>
      </div>

      <div class="rs-body">
        <div class="rs-card">
          <div class="rs-section-title">⭐ 스티커 목표 수</div>
          <p class="rs-desc">몇 개를 모으면 보상을 받을까요?</p>
          <div class="rs-goal-row">
            <button class="rs-goal-btn" onclick="Parent.adjustGoal('${co}',-1)">−</button>
            <div class="rs-goal-display" id="rs-goal-val">${goal}</div>
            <button class="rs-goal-btn" onclick="Parent.adjustGoal('${co}',1)">+</button>
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

        <button class="btn-primary rs-save-btn" onclick="Parent.saveRewardSettings('${co}')">
          💾 저장하기
        </button>
      </div>
    </div>`;
  });

  /* ---- 보상 설정 인터랙션 ---- */
  function adjustGoal(course, delta) {
    Sticker.setGoal(course, Sticker.getGoal(course) + delta);
    const el = document.getElementById('rs-goal-val');
    if (el) el.textContent = Sticker.getGoal(course);
    Sound.click();
  }

  function saveRewardSettings(course) {
    const el = document.getElementById('rs-reward-input');
    Sticker.setReward(course, el ? el.value.trim() : '');
    if (typeof DB !== 'undefined') DB.pushSettings();
    Sound.missionComplete();
    App.showToast('저장했어요! 🎉');
    setTimeout(() => App.showScreen('parent-dashboard'), 800);
  }

  /* ---- 잠금 ---- */
  function logout() {
    Sound.click();
    App.showScreen('mission-map');
  }

  /* ---- 공개 API ---- */
  return {
    showPinScreen,
    pinInput,
    resetPin,
    adjustGoal,
    saveRewardSettings,
    logout,
  };

})();
