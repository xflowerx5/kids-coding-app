/* ============================================================
   코딩 스티커 — Child Screens
   Phase 2: 가족코드 / 캐릭터선택 / 미션로드맵 / 퍼즐 미션
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
          <span class="cs-card-grade">초5 · 8단계</span>
        </button>
        <button class="cs-card anim-slideUp" style="animation-delay:0.2s" onclick="Child.selectCourse('rabbit')">
          ${App.rabbitSVG}
          <span class="cs-card-name">🐰 토끼</span>
          <span class="cs-card-grade">초3 · 8단계</span>
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
  App.registerScreen('mission-map', () => {
    const course    = App.Storage.get('selectedCourse', 'fox');
    const theme     = _theme(course);
    const bgClass   = _bgClass(course);
    const missions  = Puzzle.getMissions(course);
    const completed = _getCompleted(course);
    const stickers  = App.Storage.get(`totalStickers_${course}`, 0);
    const total     = missions.length;
    const doneCount = completed.length;
    const pct       = Math.round((doneCount / total) * 100);

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
            <div class="mission-card-tool">🎮 인앱 퍼즐</div>
          </div>
          <span class="mission-card-status">${statusIcon}</span>
        </button>`;
    }).join('');

    return `
    <div class="screen screen-mission-map">
      <div class="mm-header ${bgClass}">
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
        <div class="mm-course-info">
          <span class="mm-course-icon">${_courseEmoji(course)}</span>
          <span class="mm-course-name">${_courseName(course)}</span>
        </div>
        <button class="mm-sticker-pill" onclick="App.showScreen('sticker-board',{course:'${course}'})">⭐ ${stickers}</button>
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

  function openMission(id) {
    Sound.click();
    const course  = App.Storage.get('selectedCourse', 'fox');
    const mission = Puzzle.getMission(course, id);
    if (!mission) return;
    App.showScreen('mission-puzzle', { mission, course });
  }

  function goParentMode() {
    Sound.click();
    if (typeof Parent !== 'undefined' && Parent.showPinScreen) {
      Parent.showPinScreen();
    } else {
      App.showToast('부모 모드는 Phase 4에서 추가돼요! 👨‍👩‍👧');
    }
  }

  /* ============================================================
     화면 4: 퍼즐 미션
     ============================================================ */
  App.registerScreen('mission-puzzle', ({ mission, course }) => {
    const theme    = _theme(course);
    const bgClass  = _bgClass(course);
    const charEm   = _charEmoji(course);
    const done     = _getCompleted(course).includes(mission.id);

    /* 퍼즐 엔진 초기화 */
    Puzzle.init(mission, course, charEm, {
      onSuccess: () => _onPuzzleSuccess(course, mission),
      onFail:    (reason) => _onPuzzleFail(reason),
    });

    const gridHTML     = Puzzle.renderGrid();
    const seqHTML      = Puzzle.renderSequence();
    const ctrlHTML     = Puzzle.renderControls(!!mission.allowRepeat);

    const completedBar = done
      ? `<div class="pz-done-bar">✅ 이미 완료했어요! <button class="pz-retry-btn" onclick="Child.openMission(${mission.id})">다시 풀기</button></div>`
      : `<div class="pz-action-bar">
           <button id="pz-run-btn" class="pz-run-btn ${bgClass}" onclick="PuzzleScreen.runPuzzle()">▶ 실행!</button>
           <button class="pz-clear-btn" onclick="PuzzleScreen.clearSeq()">🗑 지우기</button>
         </div>`;

    return `
    <div class="screen screen-mission-puzzle">
      <!-- 헤더 -->
      <div class="mp-header ${bgClass}">
        <button class="btn-back" onclick="App.showScreen('mission-map')" aria-label="뒤로">←</button>
        <div class="mp-header-info">
          <div class="mp-step-label">${mission.id}단계</div>
          <div class="mp-mission-title">${mission.emoji} ${mission.title}</div>
        </div>
        <button class="btn-mute" id="btn-mute" aria-label="소리">🔊</button>
      </div>

      <!-- 설명 -->
      <div class="mp-desc-row">
        <p class="mp-desc">${mission.description}</p>
        <button class="mp-tip-btn" onclick="Child.toggleTip(this)" aria-label="팁 보기">💡</button>
      </div>
      <div class="mp-tip" id="mp-tip" hidden>${mission.tip}</div>

      <!-- 격자 -->
      <div class="mp-grid-wrap">
        ${gridHTML}
      </div>

      <!-- 시퀀스 -->
      <div id="pz-sequence-container">
        ${seqHTML}
      </div>

      <!-- 컨트롤 -->
      ${ctrlHTML}

      <!-- 실행/지우기 -->
      ${completedBar}
    </div>`;
  });

  function toggleTip(btn) {
    const tip = document.getElementById('mp-tip');
    if (!tip) return;
    const hidden = tip.hidden;
    tip.hidden = !hidden;
    btn.textContent = hidden ? '💡✕' : '💡';
    Sound.click();
  }

  /* ============================================================
     퍼즐 콜백
     ============================================================ */
  async function _onPuzzleSuccess(course, mission) {
    const alreadyDone = _getCompleted(course).includes(mission.id);

    Sound.missionComplete();
    App.spawnParticles(['⭐','✨','🌟','💫'], 14);

    /* 스티커 지급 (첫 완료 시만) */
    if (!alreadyDone) {
      _addCompleted(course, mission.id);
      const stickers = App.Storage.get(`totalStickers_${course}`, 0) + 1;
      App.Storage.set(`totalStickers_${course}`, stickers);
      if (typeof DB !== 'undefined') DB.pushCourse(course);

      /* 스티커 획득 효과음 (미션 완료음 후 딜레이) */
      setTimeout(() => Sound.stickerEarn(), 500);

      /* confetti */
      if (typeof confetti === 'function') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      }

      setTimeout(() => {
        /* 스티커판 완성 여부 체크 */
        if (Sticker.checkBoardComplete(course, stickers)) {
          const boardNum = Math.floor(stickers / Sticker.getGoal(course));
          App.Storage.set(`boardsCompleted_${course}`, boardNum);
          App.showScreen('board-complete', { course, stickers, boardNum });
        } else {
          App.showScreen('mission-clear', { mission, course, stickers });
        }
      }, 900);
    } else {
      App.showToast('다시 풀었어요! 멋져요! 🎉');
      setTimeout(() => App.showScreen('mission-map'), 1200);
    }
  }

  function _onPuzzleFail(reason) {
    Sound.error();
    if (reason === 'wall') {
      App.showToast('앗! 벽에 부딪혔어요 😢 다시 해봐요!');
    } else {
      App.showToast('별에 못 닿았어요! 명령을 수정해봐요 🤔');
    }
  }

  /* ============================================================
     화면 5: 미션 클리어
     ============================================================ */
  App.registerScreen('mission-clear', ({ mission, course, stickers }) => {
    const theme    = _theme(course);
    const bgClass  = _bgClass(course);
    const missions = Puzzle.getMissions(course);
    const nextId   = mission.id + 1;
    const hasNext  = nextId <= missions.length;

    const nextBtn = hasNext
      ? `<button class="btn-primary mc-next-btn" onclick="Child.openMission(${nextId})">
           다음 단계로 → ${missions[nextId - 1]?.emoji || ''}
         </button>`
      : `<button class="btn-primary mc-next-btn" onclick="App.showScreen('mission-map')">
           미션 맵으로 🗺️
         </button>`;

    /* confetti 재실행 */
    setTimeout(() => {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
      }
    }, 200);

    return `
    <div class="screen screen-mission-clear ${bgClass}">
      <div class="mc-content">
        <div class="mc-star-burst" aria-hidden="true">
          <span class="mc-s1 anim-float">⭐</span>
          <span class="mc-s2 anim-float">✨</span>
          <span class="mc-s3 anim-float">🌟</span>
          <span class="mc-s4 anim-float">💫</span>
          <span class="mc-s5 anim-float">⭐</span>
        </div>

        <div class="mc-char anim-pop">${_charEmoji(course)}</div>
        <h1 class="mc-title anim-slideUp">미션 완료!</h1>
        <p class="mc-subtitle anim-slideUp" style="animation-delay:0.08s">
          ${mission.emoji} ${mission.title}
        </p>

        <div class="mc-sticker-box anim-pop" style="animation-delay:0.15s">
          <div class="mc-sticker-label">획득한 스티커</div>
          <div class="mc-sticker-count">⭐ × 1</div>
          <div class="mc-total">합계: ⭐ ${stickers}개</div>
        </div>

        <div class="mc-btns anim-slideUp" style="animation-delay:0.22s">
          ${nextBtn}
          <button class="btn-ghost mc-sticker-btn" onclick="App.showScreen('sticker-board',{course:'${course}',justEarned:true})">
            ⭐ 스티커판 보기
          </button>
          <button class="btn-ghost mc-map-btn" onclick="App.showScreen('mission-map')">
            미션 맵 보기 🗺️
          </button>
        </div>
      </div>
    </div>`;
  });

  /* ============================================================
     App.start 오버라이드
     ============================================================ */
  App.start = function (btn) {
    Sound.resume();
    Sound.click();
    if (btn) {
      btn.disabled = true;
      App.spawnParticles(['⭐', '✨', '💫', '🌟'], 10, btn);
    }
    setTimeout(() => {
      const code   = App.Storage.get('familyCode');
      const course = App.Storage.get('selectedCourse');
      if (code && typeof DB !== 'undefined') DB.init(code);

      /* PWA 설치 안내 — 설치된 상태(standalone)가 아니면 항상 표시 */
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
      if (!isStandalone) {
        App.showScreen('pwa-install');
        return;
      }

      if (code && course) App.showScreen('mission-map');
      else if (code)      App.showScreen('character-select');
      else                App.showScreen('family-code');
    }, 380);
  };

  /* ---- 공개 API ---- */
  return {
    copyCode,
    confirmNewCode,
    confirmInputCode,
    selectCourse,
    openMission,
    goParentMode,
    toggleTip,
  };

})();
