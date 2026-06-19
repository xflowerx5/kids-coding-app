/* ============================================================
   코딩 스티커 — Sound System
   Web Audio API 기반. 외부 파일 없음. 오프라인 100% 작동.
   ============================================================ */

const Sound = (() => {
  let _ctx = null;
  let _muted = localStorage.getItem('soundMuted') === 'true';

  function _getCtx() {
    if (!_ctx) {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_ctx.state === 'suspended') {
      _ctx.resume();
    }
    return _ctx;
  }

  /* 단일 음 재생 */
  function _tone(freq, dur, { type = 'sine', vol = 0.28, delay = 0, attack = 0.01, decay = 0.05 } = {}) {
    if (_muted) return;
    const c = _getCtx();
    const osc  = c.createOscillator();
    const gain = c.createGain();

    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);

    const t0 = c.currentTime + delay;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.setValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur - decay);

    osc.start(t0);
    osc.stop(t0 + dur);
  }

  /* 멜로디 시퀀스 재생 */
  function _melody(notes) {
    let t = 0;
    notes.forEach(([freq, dur, opts = {}]) => {
      _tone(freq, dur, { delay: t, ...opts });
      t += dur + (opts.gap ?? 0.03);
    });
  }

  /* ---- 공개 효과음 ---- */

  /* 버튼 클릭: 부드럽고 짧은 팝 */
  function click() {
    _tone(620, 0.09, { vol: 0.15, type: 'sine' });
  }

  /* 캐릭터 선택: 귀엽고 밝은 두 음 */
  function characterSelect() {
    _melody([
      [523, 0.12, { vol: 0.22 }],
      [659, 0.20, { vol: 0.28, gap: 0.05 }],
    ]);
  }

  /* 잠금 해제: 상승하는 세 음 */
  function unlock() {
    _melody([
      [392, 0.12, { vol: 0.20 }],
      [523, 0.12, { vol: 0.22 }],
      [659, 0.22, { vol: 0.28 }],
    ]);
  }

  /* 미션 완료: 띠링~ 성공음 (3음 상승) */
  function missionComplete() {
    _melody([
      [523, 0.10, { vol: 0.28 }],
      [659, 0.10, { vol: 0.30 }],
      [784, 0.30, { vol: 0.35 }],
    ]);
  }

  /* 스티커 획득: 반짝이는 코인음 (고음 3연타) */
  function stickerEarn() {
    _melody([
      [880,  0.07, { vol: 0.22 }],
      [1100, 0.07, { vol: 0.24, gap: 0.02 }],
      [1320, 0.18, { vol: 0.28, gap: 0.02 }],
    ]);
  }

  /* 스티커판 완성: 짧은 팡파레 멜로디 */
  function boardComplete() {
    _melody([
      [523, 0.14, { vol: 0.30 }],
      [523, 0.14, { vol: 0.30 }],
      [523, 0.14, { vol: 0.30 }],
      [415, 0.09, { vol: 0.25, gap: -0.02 }],
      [622, 0.28, { vol: 0.35, gap: 0.04 }],
      [523, 0.14, { vol: 0.30, gap: 0.08 }],
      [415, 0.09, { vol: 0.25, gap: 0.02 }],
      [622, 0.45, { vol: 0.38, gap: 0.04 }],
    ]);
  }

  /* PIN 숫자 입력 */
  function pinTap() {
    _tone(800, 0.06, { vol: 0.12 });
  }

  /* 에러/실패 */
  function error() {
    _melody([
      [300, 0.12, { vol: 0.25, type: 'sawtooth' }],
      [250, 0.20, { vol: 0.22, type: 'sawtooth' }],
    ]);
  }

  /* ---- 음소거 제어 ---- */
  function toggleMute() {
    _muted = !_muted;
    localStorage.setItem('soundMuted', String(_muted));
    return _muted;
  }

  function isMuted() {
    return _muted;
  }

  /* 첫 터치 시 AudioContext 활성화 (모바일 브라우저 정책) */
  function resume() {
    _getCtx();
  }

  return {
    click, characterSelect, unlock,
    missionComplete, stickerEarn, boardComplete,
    pinTap, error,
    toggleMute, isMuted, resume,
  };
})();
