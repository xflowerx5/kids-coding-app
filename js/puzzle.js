/* ============================================================
   코딩 스티커 — Puzzle Engine
   인앱 비주얼 코딩 퍼즐 (격자 이동 + 명령 시퀀스)
   ============================================================ */

const Puzzle = (() => {

  /* ============================================================
     미션 데이터 — 토끼 코스 (딸, 초3)
     ============================================================ */
  const _RABBIT_MISSIONS = [
    {
      id: 1,
      title: '한 방향으로 가요!',
      emoji: '➡️',
      description: '→ 버튼을 눌러서 토끼를 별에 데려다줘요!',
      tip: '→ 버튼을 3번 누르고 실행해봐요!',
      grid: { cols: 5, rows: 3 },
      start: { r: 1, c: 0 },
      goal:  { r: 1, c: 4 },
      walls: [],
      maxCommands: 6,
      solution: ['R','R','R','R'],
    },
    {
      id: 2,
      title: '위아래도 갈 수 있어요!',
      emoji: '⬆️',
      description: '→ 와 ↓ 버튼을 써서 토끼를 별에 데려다줘요!',
      tip: '오른쪽으로 가다가 아래로 내려가봐요!',
      grid: { cols: 4, rows: 4 },
      start: { r: 0, c: 0 },
      goal:  { r: 3, c: 3 },
      walls: [],
      maxCommands: 8,
      solution: ['R','R','R','D','D','D'],
    },
    {
      id: 3,
      title: '꺾어서 가요!',
      emoji: '↩️',
      description: '벽을 피해서 토끼를 별에 데려다줘요!',
      tip: '위로 먼저 가고 오른쪽으로 꺾어봐요!',
      grid: { cols: 5, rows: 4 },
      start: { r: 3, c: 0 },
      goal:  { r: 0, c: 4 },
      walls: [{ r:1, c:1 },{ r:1, c:2 },{ r:2, c:1 },{ r:2, c:2 }],
      maxCommands: 10,
      solution: ['U','U','U','R','R','R','R'],
    },
    {
      id: 4,
      title: '벽을 피해요!',
      emoji: '🧱',
      description: '벽에 부딪히면 처음으로 돌아가요. 길을 잘 찾아봐요!',
      tip: '막혀있으면 다른 방향을 먼저 시도해봐요!',
      grid: { cols: 5, rows: 5 },
      start: { r: 0, c: 0 },
      goal:  { r: 4, c: 4 },
      walls: [{ r:0, c:2 },{ r:1, c:2 },{ r:2, c:2 },{ r:2, c:3 },{ r:2, c:4 }],
      maxCommands: 12,
      solution: ['D','D','R','R','D','D','R','R'],
    },
    {
      id: 5,
      title: '반복이 뭐예요?',
      emoji: '🔁',
      description: '같은 명령을 여러 번 쓸 때 🔁 반복 블록을 써봐요!',
      tip: '→ 를 4번 쓰는 대신 🔁4 → 를 써봐요!',
      grid: { cols: 6, rows: 3 },
      start: { r: 1, c: 0 },
      goal:  { r: 1, c: 5 },
      walls: [],
      maxCommands: 4,
      allowRepeat: true,
      solution: ['R','R','R','R','R'],
    },
    {
      id: 6,
      title: '반복 + 방향',
      emoji: '🌀',
      description: '반복 블록과 방향 버튼을 함께 써서 토끼를 데려다줘요!',
      tip: '🔁3 → 누르고 🔁3 ↓ 눌러봐요!',
      grid: { cols: 5, rows: 5 },
      start: { r: 0, c: 0 },
      goal:  { r: 3, c: 3 },
      walls: [{ r:1, c:3 },{ r:2, c:1 }],
      maxCommands: 6,
      allowRepeat: true,
      solution: ['R','R','R','D','D','D'],
    },
    {
      id: 7,
      title: '버그를 찾아요!',
      emoji: '🐛',
      description: '이미 만들어진 명령이 있어요. 틀린 부분을 고쳐서 토끼를 별에 데려다줘요!',
      tip: '명령을 지우고 올바른 방향을 추가해봐요!',
      grid: { cols: 5, rows: 4 },
      start: { r: 0, c: 0 },
      goal:  { r: 3, c: 4 },
      walls: [{ r:1, c:2 },{ r:2, c:2 }],
      maxCommands: 10,
      preset: ['R','R','D','R'],
      solution: ['R','R','R','R','D','D','D'],
    },
    {
      id: 8,
      title: '자유 탐험!',
      emoji: '🗺️',
      description: '가장 적은 명령으로 토끼를 별까지 데려다줘요! 최단 경로를 찾아봐요.',
      tip: '명령이 적을수록 더 멋진 코더예요!',
      grid: { cols: 6, rows: 6 },
      start: { r: 0, c: 0 },
      goal:  { r: 5, c: 5 },
      walls: [
        { r:1, c:1 },{ r:1, c:3 },
        { r:2, c:4 },
        { r:3, c:1 },{ r:3, c:3 },
        { r:4, c:2 },
      ],
      maxCommands: 14,
      allowRepeat: true,
      solution: ['R','R','R','R','R','D','D','D','D','D'],
    },
  ];

  /* ============================================================
     미션 데이터 — 여우 코스 (아들, 초5)
     ============================================================ */
  const _FOX_MISSIONS = [
    {
      id: 1,
      title: '한 방향으로 가요!',
      emoji: '➡️',
      description: '→ 버튼으로 여우를 별에 데려다줘요!',
      tip: '버튼을 눌러 명령을 추가하고 실행해봐요!',
      grid: { cols: 6, rows: 3 },
      start: { r: 1, c: 0 },
      goal:  { r: 1, c: 5 },
      walls: [],
      maxCommands: 8,
      solution: ['R','R','R','R','R'],
    },
    {
      id: 2,
      title: '방향을 바꿔요!',
      emoji: '🔄',
      description: '→ ↑ ↓ ← 버튼을 모두 써서 여우를 별에 데려다줘요!',
      tip: '경로를 머릿속으로 먼저 그려보고 눌러봐요!',
      grid: { cols: 5, rows: 5 },
      start: { r: 4, c: 0 },
      goal:  { r: 0, c: 4 },
      walls: [{ r:2, c:2 }],
      maxCommands: 10,
      solution: ['U','U','U','U','R','R','R','R'],
    },
    {
      id: 3,
      title: '미로 탈출!',
      emoji: '🌀',
      description: '벽이 많아요! 막히지 않고 별까지 가는 길을 찾아봐요.',
      tip: '벽에 부딪히면 다시 처음부터 시작해요. 천천히 생각해요!',
      grid: { cols: 6, rows: 5 },
      start: { r: 0, c: 0 },
      goal:  { r: 4, c: 5 },
      walls: [
        { r:0, c:2 },{ r:0, c:3 },
        { r:1, c:0 },{ r:1, c:4 },
        { r:2, c:2 },{ r:2, c:4 },
        { r:3, c:2 },
        { r:4, c:1 },{ r:4, c:2 },{ r:4, c:3 },
      ],
      maxCommands: 14,
      solution: ['R','D','D','R','D','D','R','R','U','R','D','D'],
    },
    {
      id: 4,
      title: '더 복잡한 미로!',
      emoji: '🧩',
      description: '여러 방향 전환이 필요한 복잡한 미로예요. 도전해봐요!',
      tip: '한 번에 한 단계씩 추가하면서 실행해봐요!',
      grid: { cols: 7, rows: 6 },
      start: { r: 0, c: 0 },
      goal:  { r: 5, c: 6 },
      walls: [
        { r:0, c:3 },
        { r:1, c:1 },{ r:1, c:3 },{ r:1, c:5 },
        { r:2, c:1 },{ r:2, c:5 },
        { r:3, c:1 },{ r:3, c:3 },{ r:3, c:5 },
        { r:4, c:3 },
      ],
      maxCommands: 16,
      solution: ['D','D','R','R','D','D','R','R','D','D','R','R'],
    },
    {
      id: 5,
      title: '반복 블록 입문!',
      emoji: '🔁',
      description: '🔁 반복 블록으로 같은 명령을 짧게 표현해봐요!',
      tip: '명령 5개 대신 반복 블록 1개로 만들어봐요!',
      grid: { cols: 7, rows: 4 },
      start: { r: 1, c: 0 },
      goal:  { r: 1, c: 6 },
      walls: [],
      maxCommands: 4,
      allowRepeat: true,
      solution: ['R','R','R','R','R','R'],
    },
    {
      id: 6,
      title: '반복 + 미로!',
      emoji: '🌀',
      description: '반복 블록과 방향 전환을 함께 써서 미로를 빠져나가요!',
      tip: '같은 방향이 반복되면 묶어보세요!',
      grid: { cols: 6, rows: 6 },
      start: { r: 0, c: 0 },
      goal:  { r: 5, c: 5 },
      walls: [
        { r:0, c:3 },{ r:1, c:3 },
        { r:3, c:2 },{ r:4, c:2 },
      ],
      maxCommands: 8,
      allowRepeat: true,
      solution: ['R','R','D','D','D','D','D','R','R','R'],
    },
    {
      id: 7,
      title: '버그를 잡아라!',
      emoji: '🐛',
      description: '틀린 명령이 섞여 있어요. 버그를 찾아서 고쳐봐요!',
      tip: '명령을 하나씩 지워가며 어디서 막히는지 찾아봐요!',
      grid: { cols: 6, rows: 5 },
      start: { r: 0, c: 0 },
      goal:  { r: 4, c: 5 },
      walls: [
        { r:1, c:2 },{ r:2, c:2 },{ r:3, c:2 },
      ],
      maxCommands: 12,
      preset: ['R','R','D','D','D','D','R','R','R'],
      solution: ['R','D','D','D','D','R','R','R','R','R'],
    },
    {
      id: 8,
      title: '최단 경로 도전!',
      emoji: '🏆',
      description: '가장 적은 명령으로 별까지 가봐요! 반복 블록을 잘 활용하면 10개 이하로 할 수 있어요!',
      tip: '반복 블록을 여러 번 써도 돼요!',
      grid: { cols: 8, rows: 7 },
      start: { r: 0, c: 0 },
      goal:  { r: 6, c: 7 },
      walls: [
        { r:1, c:2 },{ r:1, c:5 },
        { r:2, c:2 },{ r:2, c:4 },
        { r:3, c:4 },{ r:3, c:6 },
        { r:4, c:1 },{ r:4, c:4 },{ r:4, c:6 },
        { r:5, c:1 },{ r:5, c:3 },
      ],
      maxCommands: 16,
      allowRepeat: true,
      solution: ['R','R','R','D','D','R','R','D','D','R','R','D','D'],
    },
  ];

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
     공개 API — 미션 데이터 접근
     ============================================================ */
  function getMissions(course) {
    return course === 'fox' ? _FOX_MISSIONS : _RABBIT_MISSIONS;
  }

  function getMission(course, id) {
    return getMissions(course).find(m => m.id === id) || null;
  }

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

  /* 단일 스텝 이동 → DOM 업데이트 */
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

  /* 시퀀스 실행 (async) */
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

    /* 이동 실행 */
    for (let i = 0; i < moves.length; i++) {
      const d = _DIR_MAP[moves[i]];
      const nr = _state.pos.r + d.r;
      const nc = _state.pos.c + d.c;

      _highlightCmd(i);

      if (_isWall(nr, nc)) {
        /* 벽 충돌 */
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
        /* 목표 도달 */
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

  /* 격자 렌더 */
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

  /* 시퀀스 렌더 */
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

  /* 방향 버튼 렌더 */
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
    /* 캐릭터 리셋 */
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
