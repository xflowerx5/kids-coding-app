/* ============================================================
   코딩 스티커 — Puzzle Engine
   미션 데이터: missions/fox.json, missions/rabbit.json
   엔진: 격자 이동 + 명령 시퀀스 실행
   ============================================================ */

const Puzzle = (() => {

  /* ============================================================
     미션 데이터 — JSON fetch + 메모리 캐시
     ============================================================ */
  const _missions = { fox: null, rabbit: null };

  /* 앱 로드 시 즉시 fetch 시작 (splash → 캐릭터 선택 사이에 완료됨) */
  const _loadPromise = Promise.all([
    fetch('./missions/fox.json').then(r => r.json()),
    fetch('./missions/rabbit.json').then(r => r.json()),
  ]).then(([fox, rabbit]) => {
    _missions.fox    = fox.missions;
    _missions.rabbit = rabbit.missions;
  }).catch(err => {
    console.warn('[Puzzle] 미션 JSON 로드 실패:', err);
    _missions.fox    = [];
    _missions.rabbit = [];
  });

  /* 미션 로드 완료 대기 (async 화면 렌더에서 사용) */
  async function waitReady() {
    return _loadPromise;
  }

  /* 동기 접근 (waitReady() 호출 후 사용 안전) */
  function getMissions(course) {
    return _missions[course] || [];
  }

  function getMission(course, id) {
    return getMissions(course).find(m => m.id === id) || null;
  }

  /* ============================================================
     퍼즐 상태 (싱글턴)
     ============================================================ */
  let _state = null;
  /* _state = {
       mission, course, charEmoji,
       pos: {r,c},
       sequence: [ {type:'move',dir:'R'} | {type:'repeat',dir:'R',count:N} ],
       running: bool,
       done: bool,
       callbacks: { onSuccess, onFail }
     }
  */

  /* ============================================================
     초기화
     ============================================================ */
  function init(mission, course, charEmoji, callbacks) {
    _state = {
      mission,
      course,
      charEmoji,
      pos: { ...mission.start },
      sequence: mission.preset
        ? mission.preset.map(d => ({ type: 'move', dir: d }))
        : [],
      running: false,
      done: false,
      callbacks: callbacks || {},
    };
  }

  /* ============================================================
     시퀀스 편집
     ============================================================ */
  function addMove(dir) {
    if (!_state || _state.running || _state.done) return false;
    if (_state.sequence.length >= _state.mission.maxCommands) {
      return 'full';
    }
    _state.sequence.push({ type: 'move', dir });
    return true;
  }

  function addRepeat(dir, count) {
    if (!_state || _state.running || _state.done) return false;
    if (_state.sequence.length >= _state.mission.maxCommands) {
      return 'full';
    }
    _state.sequence.push({ type: 'repeat', dir, count: Math.max(2, Math.min(count, 9)) });
    return true;
  }

  function removeAt(index) {
    if (!_state || _state.running) return;
    _state.sequence.splice(index, 1);
  }

  function clearAll() {
    if (!_state || _state.running) return;
    _state.sequence = [];
    _state.pos = { ..._state.mission.start };
    _state.done = false;
  }

  /* ============================================================
     실행
     ============================================================ */
  const _DIR_MAP = {
    R: { r:  0, c:  1 },
    L: { r:  0, c: -1 },
    U: { r: -1, c:  0 },
    D: { r:  1, c:  0 },
  };

  function _isWall(r, c) {
    const m = _state.mission;
    if (r < 0 || r >= m.grid.rows || c < 0 || c >= m.grid.cols) return true;
    return m.walls.some(w => w.r === r && w.c === c);
  }

  function _isGoal(r, c) {
    const g = _state.mission.goal;
    return r === g.r && c === g.c;
  }

  function _moveChar(r, c) {
    _state.pos = { r, c };
    const charEl = document.getElementById('pz-char');
    if (!charEl) return;
    const cellSize = _getCellSize();
    charEl.style.transform = `translate(${c * cellSize}px, ${r * cellSize}px)`;
  }

  function _getCellSize() {
    const grid = document.getElementById('pz-grid');
    if (!grid) return 56;
    return grid.offsetWidth / _state.mission.grid.cols;
  }

  async function run() {
    if (!_state || _state.running || _state.sequence.length === 0) return;
    _state.running = true;
    _state.pos = { ..._state.mission.start };

    _moveChar(_state.pos.r, _state.pos.c);
    await _delay(120);

    /* 시퀀스 → 이동 목록으로 펼치기 */
    const moves = [];
    for (const cmd of _state.sequence) {
      if (cmd.type === 'move') {
        moves.push(cmd.dir);
      } else {
        for (let i = 0; i < cmd.count; i++) moves.push(cmd.dir);
      }
    }

    for (let i = 0; i < moves.length; i++) {
      const d = _DIR_MAP[moves[i]];
      const nr = _state.pos.r + d.r;
      const nc = _state.pos.c + d.c;

      _highlightCmd(i);

      if (_isWall(nr, nc)) {
        await _animCrash();
        _state.running = false;
        _state.pos = { ..._state.mission.start };
        _moveChar(_state.pos.r, _state.pos.c);
        _clearHighlight();
        if (_state.callbacks.onFail) _state.callbacks.onFail('wall');
        return;
      }

      _moveChar(nr, nc);
      await _delay(340);

      if (_isGoal(nr, nc)) {
        _state.done = true;
        _state.running = false;
        _clearHighlight();
        await _animSuccess();
        if (_state.callbacks.onSuccess) _state.callbacks.onSuccess();
        return;
      }
    }

    /* 시퀀스 소진, 목표 미달 */
    _state.running = false;
    _clearHighlight();
    if (_state.callbacks.onFail) _state.callbacks.onFail('noreach');
  }

  /* ============================================================
     시각 효과 헬퍼
     ============================================================ */
  function _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function _animCrash() {
    const charEl = document.getElementById('pz-char');
    if (!charEl) return;
    charEl.classList.add('pz-crash');
    await _delay(480);
    charEl.classList.remove('pz-crash');
  }

  async function _animSuccess() {
    const charEl = document.getElementById('pz-char');
    if (charEl) charEl.classList.add('pz-success');
    await _delay(600);
  }

  function _highlightCmd(index) {
    document.querySelectorAll('.pz-cmd-item').forEach((el, i) => {
      el.classList.toggle('pz-cmd-active', i === index);
    });
  }

  function _clearHighlight() {
    document.querySelectorAll('.pz-cmd-item').forEach(el => el.classList.remove('pz-cmd-active'));
  }

  /* ============================================================
     렌더링 헬퍼 (HTML 문자열 반환)
     ============================================================ */

  function renderGrid() {
    if (!_state) return '';
    const { mission, pos, charEmoji } = _state;
    const { cols, rows } = mission.grid;

    const wallSet = new Set(mission.walls.map(w => `${w.r},${w.c}`));
    const cellSize = Math.floor(Math.min(
      (window.innerWidth - 48) / cols,
      240 / rows,
      64
    ));

    let cells = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const isWall = wallSet.has(key);
        const isGoal = r === mission.goal.r && c === mission.goal.c;
        const cls = isWall ? 'pz-cell pz-wall' : isGoal ? 'pz-cell pz-goal' : 'pz-cell';
        const content = isWall ? '' : isGoal ? '⭐' : '';
        cells += `<div class="${cls}" data-r="${r}" data-c="${c}">${content}</div>`;
      }
    }

    const charLeft = pos.c * cellSize;
    const charTop  = pos.r * cellSize;
    const gridW = cellSize * cols;
    const gridH = cellSize * rows;

    return `
      <div id="pz-grid" class="pz-grid"
           style="width:${gridW}px;height:${gridH}px;grid-template-columns:repeat(${cols},${cellSize}px);grid-template-rows:repeat(${rows},${cellSize}px);">
        ${cells}
        <div id="pz-char" class="pz-char"
             style="width:${cellSize}px;height:${cellSize}px;transform:translate(${charLeft}px,${charTop}px);">
          <span class="pz-char-emoji">${charEmoji}</span>
        </div>
      </div>
    `;
  }

  function renderSequence() {
    if (!_state) return '';
    const { sequence, mission } = _state;
    const remaining = mission.maxCommands - sequence.length;

    const DIR_LABEL = { R:'→', L:'←', U:'↑', D:'↓' };

    let items = sequence.map((cmd, i) => {
      const label = cmd.type === 'repeat'
        ? `🔁${cmd.count}${DIR_LABEL[cmd.dir]}`
        : DIR_LABEL[cmd.dir];
      return `<button class="pz-cmd-item" onclick="Puzzle.removeAt(${i});PuzzleScreen.refresh()" aria-label="명령 삭제">${label}</button>`;
    }).join('');

    if (sequence.length === 0) {
      items = `<span class="pz-seq-empty">버튼을 눌러 명령을 추가해요!</span>`;
    }

    return `
      <div class="pz-sequence-wrap">
        <div class="pz-sequence-inner">${items}</div>
        <div class="pz-seq-count">${remaining}개 남음</div>
      </div>
    `;
  }

  function renderControls(allowRepeat) {
    const repeatSection = allowRepeat ? `
      <div class="pz-repeat-row">
        <select id="pz-repeat-count" class="pz-repeat-select">
          <option value="2">🔁 2</option>
          <option value="3">🔁 3</option>
          <option value="4">🔁 4</option>
          <option value="5">🔁 5</option>
        </select>
        <button class="pz-dir-btn pz-repeat-dir" onclick="PuzzleScreen.addRepeatDir('U')">↑</button>
        <button class="pz-dir-btn pz-repeat-dir" onclick="PuzzleScreen.addRepeatDir('D')">↓</button>
        <button class="pz-dir-btn pz-repeat-dir" onclick="PuzzleScreen.addRepeatDir('L')">←</button>
        <button class="pz-dir-btn pz-repeat-dir" onclick="PuzzleScreen.addRepeatDir('R')">→</button>
      </div>
    ` : '';

    return `
      <div class="pz-controls">
        <div class="pz-dpad">
          <div class="pz-dpad-row">
            <button class="pz-dir-btn" onclick="PuzzleScreen.addDir('U')" aria-label="위">↑</button>
          </div>
          <div class="pz-dpad-row">
            <button class="pz-dir-btn" onclick="PuzzleScreen.addDir('L')" aria-label="왼쪽">←</button>
            <div class="pz-dpad-center">🎮</div>
            <button class="pz-dir-btn" onclick="PuzzleScreen.addDir('R')" aria-label="오른쪽">→</button>
          </div>
          <div class="pz-dpad-row">
            <button class="pz-dir-btn" onclick="PuzzleScreen.addDir('D')" aria-label="아래">↓</button>
          </div>
        </div>
        ${repeatSection}
      </div>
    `;
  }

  /* ---- 공개 API ---- */
  return {
    waitReady,
    getMissions,
    getMission,
    init,
    addMove,
    addRepeat,
    removeAt,
    clearAll,
    run,
    renderGrid,
    renderSequence,
    renderControls,
    getState: () => _state,
  };

})();


/* ============================================================
   PuzzleScreen — 퍼즐 화면 이벤트 핸들러 (전역)
   ============================================================ */
const PuzzleScreen = (() => {

  function addDir(dir) {
    if (!Puzzle.getState()) return;
    Sound.click();
    const result = Puzzle.addMove(dir);
    if (result === 'full') {
      App.showToast('명령이 꽉 찼어요! ✂️ 지워서 조정해봐요.');
      return;
    }
    _refreshSeq();
  }

  function addRepeatDir(dir) {
    if (!Puzzle.getState()) return;
    Sound.click();
    const select = document.getElementById('pz-repeat-count');
    const count = select ? parseInt(select.value, 10) : 3;
    const result = Puzzle.addRepeat(dir, count);
    if (result === 'full') {
      App.showToast('명령이 꽉 찼어요! ✂️ 지워서 조정해봐요.');
      return;
    }
    _refreshSeq();
  }

  function refresh() {
    _refreshSeq();
  }

  function _refreshSeq() {
    const seqEl = document.getElementById('pz-sequence-container');
    if (seqEl) seqEl.innerHTML = Puzzle.renderSequence();
  }

  async function runPuzzle() {
    const state = Puzzle.getState();
    if (!state || state.running || state.done) return;
    if (state.sequence.length === 0) {
      App.showToast('버튼을 눌러 명령을 추가해봐요! 🎮');
      return;
    }

    const runBtn = document.getElementById('pz-run-btn');
    if (runBtn) runBtn.disabled = true;

    await Puzzle.run();

    if (runBtn && !state.done) runBtn.disabled = false;
  }

  function clearSeq() {
    Puzzle.clearAll();
    _refreshSeq();
    const state = Puzzle.getState();
    if (state) {
      const charEl = document.getElementById('pz-char');
      if (charEl) {
        const cellSize = Math.floor(Math.min(
          (window.innerWidth - 48) / state.mission.grid.cols,
          240 / state.mission.grid.rows,
          64
        ));
        charEl.style.transform = `translate(${state.mission.start.c * cellSize}px,${state.mission.start.r * cellSize}px)`;
        charEl.classList.remove('pz-crash','pz-success');
      }
    }
    Sound.click();
  }

  return { addDir, addRepeatDir, refresh, runPuzzle, clearSeq };

})();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      