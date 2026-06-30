/* ============================================================
   코딩 스티커 — Child Screens
   Phase 2+A: 가족코드 / 캐릭터선택 / 미션로드맵 / 퍼즐 / 외부링크 미션
   ============================================================ */

const Child = (() => {

  /* ---- LocalStorage 헬퍼 ---- */
  function _getCompleted(course) {
    return App.Storage.get(`completed_${course}`, []);
  }
  function _addCompleted(course, id) {
    const list = _getCompleted(course);
    if (!list.includes(id)) {
      list.push(id);
      App.Storage.set(`completed_${course}`, list);
    }
  }
  function _isUnlocked(course, id) {
    if (id === 1) return true;
    return _getCompleted(course).includes(id - 1);
  }
  function _isCurrent(course, id) {
    const completed = _getCompleted(course);
    if (completed.includes(id)) return false;
    return _isUnlocked(course, id);
  }

  /* ---- 가족 코드 생성 ---- */
  function _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /* ---- 코스 테마 헬퍼 ---- */
  function _theme(course)      { return course === 'fox' ? 'fox' : 'rabbit'; }
  function _bgClass(course)    { return course === 'fox' ? 'fox-bg' : 'rabbit-bg'; }
  function _courseEmoji(course){ return course === 'fox' ? '🦊' : '🐰'; }
  function _courseName(course) { return course === 'fox' ? '여우 코스' : '토끼 코스'; }
  function _charEmoji(course)  { return course === 'fox' ? '🦊' : '🐰'; }

  /* ---- 미션 타입 라벨 ---- */
  function _missionTypeLabel(m) {
    if (m.type === 'external') return `🔗 ${m.tool || '외부 도구'}`;
    return '🎮 인앱 퍼즐';
  }

  /* ============================================================
     화면 1: 가족 코드
     ============================================================ */
  App.registerScreen('family-code', () => {
    const savedCode = App.Storage.get('familyCode');
    const displayCode = savedCode || _generateCode();
    if (!savedCode) App.Storage.set('pendingCode', displayCode);

    return `
    <div class="screen screen-family-code">
      <button class="btn-mute" id="btn-mute" aria-label="소리 켜기/끄기">🔊</button>

      <span class="fc-emoji">🏠</span>
      <h1 class="fc-title">우리 가족 코드</h1>
      <p class="fc-subtitle">가족 모두가 같은 코드를 사용해요<br>코드를 나눠 가지면 함께 볼 수 있어요!</p>

      <div class="fc-code-box anim-pop">
        <div class="fc-code-label">NEW 가족 코드</div>
        <div class="fc-code-display" id="fc-code-text">${displayCode}</div>
        <button class="fc-copy-btn" onclick="Child.copyCode()">📋 코드 복사</button>
      </div>

      <div class="fc-actions">
        <button class="btn-primary" onclick="Child.confirmNewCode()">이 코드로 시작하기 →</button>
      </div>

      <div class="fc-divider">또는</div>

      <div class="fc-input-row">
        <input id="fc-input" class="fc-input" type="text" maxlength="6"
          placeholder="코드입력" autocomplete="off" autocapitalize="characters"
          oninput="this.value=this.value.toUpperCase()" />
        <button class="fc-enter-btn" onclick="Child.confirmInputCode()">입력</button>
      </div>
    </div>`;
  });

  function copyCode() {
    const code = document.getElementById('fc-code-text')?.textContent?.trim();
    if (!code) return;
    navigator.clipboard?.writeText(code)
      .then(() => App.showToast('코드를 복사했어요! 가족에게 공유해봐요 📋'))
      .catch(() => App.showToast(`코드: ${code}`));
    Sound.click();
  }

  function confirmNewCode() {
    const code = App.Storage.get('pendingCode') || document.getElementById('fc-code-text')?.textContent?.trim();
    if (!code) return;
    Sound.click();
    App.Storage.set('familyCode', code);
    App.Storage.remove('pendingCode');
    if (typeof DB !== 'undefined') { DB.init(code); DB.initFamily(); }
    App.showScreen('character-select');
  }

  function confirmInputCode() {
    const input = document.getElementById('fc-input');
    const val = input?.value?.trim().toUpperCase();
    if (!val || val.length < 4) {
      Sound.error();
      input?.classList.add('anim-shake');
      App.showToast('4자 이상 입력해주세요!');
      setTimeout(() => input?.classList.remove('anim-shake'), 500);
      return;
    }
    Sound.click();
    App.Storage.set('familyCode', val);
    App.Storage.remove('pendingCode');
    if (typeof DB !== 'undefined') { DB.init(val); DB.initFamily(); }
    App.showScreen('character-select');
  }

  /* ============================================================
     화면 2: 캐릭터 선택
     ============================================================ */
  App.registerScreen('character-select', () => `
    <div class="screen screen-character-select">
      <button class="btn-mute" id="btn-mute" aria-label="소리 켜기/끄기">🔊</button>

      <div class="cs-deco" aria-hidden="true">
        <span class="d1">⭐</span><span class="d2">✨</span>
        <span class="d3">🌟</span><span class="d4">💫</span>
      </div>

      <div class="cs-title-area">
        <span class="cs-question-emoji">🤔</span>
        <h1 class="cs-title">나는 누구?</h1>
        <p class="cs-subtitle">내 캐릭터를 선택해봐요!</p>
      </div>

      <div class="cs-cards">
        <button class="cs-card anim-slideUp" style="animation-delay:0.1s" onclick="Child.selectCourse('fox')">
          ${App.foxSVG}
          <span class="cs-card-name">🦊 여우</span>
          <span class="cs-card-grade">초5</span>
        </button>
        <button class="cs-card anim-slideUp" style="animation-delay:0.2s" onclick="Child.selectCourse('rabbit')">
          ${App.rabbitSVG}
          <span class="cs-card-name">🐰 토끼</span>
          <span class="cs-card-grade">초3</span>
        </button>
      </div>
    </div>
  `);

  function selectCourse(course) {
    Sound.characterSelect();
    App.spawnParticles(course === 'fox' ? ['🦊','⭐','✨'] : ['🐰','💗','✨'], 10);
    App.Storage.set('selectedCourse', course);
    setTimeout(() => App.showScreen('mission-map'), 400);
  }

  /* ============================================================
     화면 3: 미션 로드맵
     ============================================================ */
  App.registerScreen('mission-map', async () => {
    await Puzzle.waitReady();

    const course    = App.Storage.get('selectedCourse', 'fox');
    const theme     = _theme(course);
    const bgClass   = _bgClass(course);
    const missions  = Puzzle.getMissions(course);
    const completed = _getCompleted(course);
    const stickers  = App.Storage.get(`totalStickers_${course}`, 0);
    const rewardStickers = App.Storage.get(`rewardStickers_${course}`, 0);
    const total     = missions.length;
    const doneCount = completed.length;
    const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const cardsHTML = missions.map(m => {
      const done    = completed.includes(m.id);
      const current = _isCurrent(course, m.id);
      const locked  = !done && !current;

      const stateClass = locked ? 'mission-locked' : done ? 'mission-done' : `mission-current ${theme}-theme`;
      const statusIcon = locked ? '🔒' : done ? '✅' : '▶️';
      const badge = current ? `<span class="current-badge ${theme}-theme">지금 도전!</span>` : '';

      return `
        <button
          class="mission-card ${stateClass}"
          ${locked ? 'disabled' : `onclick="Child.openMission(${m.id})"`}
          aria-label="${m.id}단계: ${m.title}"
        >
          ${badge}
          <span class="mission-card-emoji">${m.emoji}</span>
          <div class="mission-card-body">
            <div class="mission-card-step">${m.id}단계</div>
            <div class="mission-card-title">${m.title}</div>
            <div class="mission-card-tool">${_missionTypeLabel(m)}</div>
          </div>
          <span class="mission-card-status">${statusIcon}</span>
        </button>`;
    }).join('');

    const miniProgress = stickers % 30;
    const rewardBadge = rewardStickers > 0
      ? `<button class="mm-reward-pill" onclick="App.showScreen('sticker-board',{course:'${course}'})">🎖️ ×${rewardStickers}</button>`
      : '';

    return `
    <div class="screen screen-mission-map">
      <div class="mm-header ${bgClass}">
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
        <div class="mm-course-info">
          <span class="mm-course-icon">${_courseEmoji(course)}</span>
          <span class="mm-course-name">${_courseName(course)}</span>
        </div>
        <div class="mm-header-pills">
          <button class="mm-sticker-pill" onclick="App.showScreen('sticker-board',{course:'${course}'})">⭐ ${miniProgress}/30</button>
          ${rewardBadge}
        </div>
      </div>

      <div class="mm-progress-wrap ${bgClass}">
        <div class="mm-progress-label">
          <span>🗺 미션 진행</span>
          <span>${doneCount} / ${total} 완료</span>
        </div>
        <div class="mm-progress-track">
          <div class="mm-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="mm-list">
        ${cardsHTML}
      </div>

      <button class="btn-parent-mode" onclick="Child.goParentMode()">
        👨‍👩‍👧 부모 모드
      </button>
    </div>`;
  });

  async function openMission(id) {
    Sound.click();
    const course = App.Storage.get('selectedCourse', 'fox');
    await Puzzle.waitReady();
    const mission = Puzzle.getMission(course, id);
    if (!mission) return;

    if (mission.type === 'external') {
      App.showScreen('mission-external', { mission, course });
    } else {
      App.showScreen('mission-puzzle', { mission, course });
    }
  }

  function goParentMode() {
    Sound.click();
    if (typeof Parent !== 'undefined' && Parent.showPinScreen) {
      Parent.showPinScreen();
    } else {
      App.showToast('부모 모드는 준비 중이에요! 👨‍👩‍👧');
    }
  }

  /* ============================================================
     화면 4: 퍼즐 미션 (type: "puzzle")
     ============================================================ */
  App.registerScreen('mission-puzzle', ({ mission, course }) => {
    const theme    = _theme(course);
    const bgClass  = _bgClass(course);
    const charEm   = _charEmoji(course);
    const done     = _getCompleted(course).includes(mission.id);

    Puzzle.init(mission, course, charEm, {
      onSuccess: () => _onMissionSuccess(course, mission),
      onFail:    (reason) => _onMissionFail(reason),
    });

    const gridHTML  = Puzzle.renderGrid();
    const seqHTML   = Puzzle.renderSequence();
    const ctrlHTML  = Puzzle.renderControls(!!mission.allowRepeat);

    const actionBar = done
      ? `<div class="pz-done-bar">✅ 이미 완료했어요! <button class="pz-retry-btn" onclick="Child.openMission(${mission.id})">다시 풀기</button></div>`
      : `<div class="pz-action-bar">
           <button id="pz-run-btn" class="pz-run-btn ${bgClass}" onclick="PuzzleScreen.runPuzzle()">▶ 실행!</button>
           <button class="pz-clear-btn" onclick="PuzzleScreen.clearSeq()">🗑 지우기</button>
         </div>`;

    return `
    <div class="screen screen-mission-puzzle">
      <div class="mp-header ${bgClass}">
        <button class="btn-back" onclick="App.showScreen('mission-map')" aria-label="뒤로">←</button>
        <div class="mp-header-info">
          <div class="mp-step-label">${mission.id}단계</div>
          <div class="mp-mission-title">${mission.emoji} ${mission.title}</div>
        </div>
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
      </div>

      <div class="mp-desc-row">
        <p class="mp-desc">${mission.description}</p>
        <button class="mp-tip-btn" onclick="Child.toggleTip(this)" aria-label="팁 보기">💡</button>
      </div>
      <div class="mp-tip" id="mp-tip" hidden>${mission.tip}</div>

      <div class="mp-grid-wrap">
        ${gridHTML}
      </div>

      <div id="pz-sequence-container">
        ${seqHTML}
      </div>

      ${ctrlHTML}
      ${actionBar}
    </div>`;
  });

  /* ============================================================
     화면 5: 외부링크 미션 (type: "external")
     — 가이드 체크리스트 전부 완료 시에만 스티커 버튼 활성화
     ============================================================ */
  App.registerScreen('mission-external', ({ mission, course }) => {
    const bgClass  = _bgClass(course);
    const theme    = _theme(course);
    const done     = _getCompleted(course).includes(mission.id);

    const guideItems = (mission.guide || []).map((step, i) => `
      <label class="me-step-item" for="me-step-${i}">
        <input type="checkbox" id="me-step-${i}" class="me-step-check"
               onchange="Child.onCheckStep('${course}', ${mission.id})" />
        <span class="me-step-text">${step}</span>
      </label>
    `).join('');

    const toolBtn = mission.toolUrl
      ? `<a href="${mission.toolUrl}" target="_blank" rel="noopener" class="me-tool-btn ${bgClass}" onclick="Sound.click()">
           🔗 ${mission.tool || '도구'} 열기
         </a>`
      : '';

    const actionArea = done
      ? `<div class="me-done-bar">✅ 이미 완료했어요! 잘했어요! 🎉</div>`
      : `<button id="me-sticker-btn" class="me-sticker-btn" disabled
               onclick="Child.claimExternalSticker('${course}', ${mission.id})">
           🎖️ 스티커 받기
           <span class="me-sticker-hint">체크리스트를 모두 완료하면 활성화돼요</span>
         </button>`;

    return `
    <div class="screen screen-mission-external">
      <div class="mp-header ${bgClass}">
        <button class="btn-back" onclick="App.showScreen('mission-map')" aria-label="뒤로">←</button>
        <div class="mp-header-info">
          <div class="mp-step-label">${mission.id}단계</div>
          <div class="mp-mission-title">${mission.emoji} ${mission.title}</div>
        </div>
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
      </div>

      <div class="me-body">
        <p class="me-desc">${mission.description}</p>

        ${toolBtn}

        <div class="me-checklist-card">
          <div class="me-checklist-title">📋 미션 체크리스트</div>
          <p class="me-checklist-sub">아래 단계를 모두 완료하면 스티커를 받을 수 있어요!</p>
          <div class="me-steps">
            ${guideItems}
          </div>
        </div>

        <div class="me-tip-card">
          <span class="me-tip-icon">💡</span>
          <p class="me-tip-text">${mission.tip || ''}</p>
        </div>

        ${actionArea}
      </div>
    </div>`;
  });

  /* 체크박스 변경 시 → 버튼 활성화 여부 갱신 */
  function onCheckStep(course, missionId) {
    const checkboxes = document.querySelectorAll('.me-step-check');
    const allChecked = checkboxes.length > 0 && [...checkboxes].every(cb => cb.checked);
    const btn = document.getElementById('me-sticker-btn');
    if (!btn) return;

    btn.disabled = !allChecked;
    if (allChecked) {
      btn.innerHTML = '🎖️ 스티커 받기!';
      btn.classList.add('me-sticker-btn-ready');
      Sound.unlock();
      App.spawnParticles(['⭐','✨','🌟'], 6);
    } else {
      btn.innerHTML = `🎖️ 스티커 받기<span class="me-sticker-hint">체크리스트를 모두 완료하면 활성화돼요</span>`;
      btn.classList.remove('me-sticker-btn-ready');
    }
  }

  /* 외부링크 미션 스티커 수령 */
  async function claimExternalSticker(course, missionId) {
    await Puzzle.waitReady();
    const mission = Puzzle.getMission(course, missionId);
    if (!mission) return;
    const btn = document.getElementById('me-sticker-btn');
    if (btn) btn.disabled = true;
    await _onMissionSuccess(course, mission);
  }

  function toggleTip(btn) {
    const tip = document.getElementById('mp-tip');
    if (!tip) return;
    const hidden = tip.hidden;
    tip.hidden = !hidden;
    btn.textContent = hidden ? '💡✕' : '💡';
    Sound.click();
  }

  /* ============================================================
     미션 성공 공통 처리 (퍼즐 / 외부링크 공용)
     ============================================================ */
  async function _onMissionSuccess(course, mission) {
    const alreadyDone = _getCompleted(course).includes(mission.id);

    Sound.missionComplete();
    App.spawnParticles(['⭐','✨','🌟','💫'], 14);

    if (!alreadyDone) {
      _addCompleted(course, mission.id);

      const newTotal = App.Storage.get(`totalStickers_${course}`, 0) + 1;
      App.Storage.set(`totalStickers_${course}`, newTotal);
      if (typeof DB !== 'undefined') DB.pushCourse(course);

      setTimeout(() => Sound.stickerEarn(), 500);

      if (typeof confetti === 'function') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      }

      setTimeout(() => {
        /* 미니스티커 30개 달성 → 상품스티커 지급 */
        if (newTotal % 30 === 0) {
          const rewardCount = Math.floor(newTotal / 30);
          App.Storage.set(`rewardStickers_${course}`, 