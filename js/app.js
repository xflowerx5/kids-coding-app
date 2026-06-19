/* ============================================================
   코딩 스티커 — App Core
   Phase 1: Service Worker 등록, 화면 라우터, 스플래시 화면
   ============================================================ */

const App = (() => {

  /* ---- 인라인 SVG (오프라인 대응, 이미지 로딩 불필요) ---- */

  const FOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130" aria-label="여우 캐릭터">
    <polygon points="22,58 38,14 54,52" fill="#FF7A00"/>
    <polygon points="28,55 38,22 48,52" fill="#CC4400" opacity="0.45"/>
    <polygon points="66,52 82,14 98,58" fill="#FF7A00"/>
    <polygon points="72,52 82,22 92,55" fill="#CC4400" opacity="0.45"/>
    <ellipse cx="60" cy="78" rx="46" ry="44" fill="#FF8C00"/>
    <ellipse cx="25" cy="85" rx="18" ry="14" fill="white" opacity="0.88"/>
    <ellipse cx="95" cy="85" rx="18" ry="14" fill="white" opacity="0.88"/>
    <ellipse cx="60" cy="60" rx="14" ry="9" fill="white" opacity="0.55"/>
    <circle cx="44" cy="72" r="11" fill="white"/>
    <circle cx="76" cy="72" r="11" fill="white"/>
    <circle cx="45" cy="73" r="7.5" fill="#1E1B2E"/>
    <circle cx="77" cy="73" r="7.5" fill="#1E1B2E"/>
    <circle cx="48" cy="70" r="2.8" fill="white"/>
    <circle cx="80" cy="70" r="2.8" fill="white"/>
    <circle cx="43" cy="75" r="1.3" fill="white" opacity="0.75"/>
    <circle cx="75" cy="75" r="1.3" fill="white" opacity="0.75"/>
    <ellipse cx="60" cy="87" rx="7" ry="5.5" fill="#CC4400"/>
    <path d="M 50 93 Q 60 101 70 93" stroke="#CC4400" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <circle cx="28" cy="84" r="9" fill="#FF5722" opacity="0.32"/>
    <circle cx="92" cy="84" r="9" fill="#FF5722" opacity="0.32"/>
    <ellipse cx="60" cy="120" rx="22" ry="10" fill="white" opacity="0.85"/>
    <ellipse cx="60" cy="123" rx="10" ry="5" fill="#FF8C00" opacity="0.5"/>
  </svg>`;

  const RABBIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 145" aria-label="토끼 캐릭터">
    <ellipse cx="38" cy="26" rx="14" ry="30" fill="#FFB3C6"/>
    <ellipse cx="38" cy="26" rx="8"  ry="23" fill="#FF69B4" opacity="0.75"/>
    <ellipse cx="82" cy="26" rx="14" ry="30" fill="#FFB3C6"/>
    <ellipse cx="82" cy="26" rx="8"  ry="23" fill="#FF69B4" opacity="0.75"/>
    <circle cx="38" cy="6" r="5" fill="white" opacity="0.5"/>
    <circle cx="82" cy="6" r="5" fill="white" opacity="0.5"/>
    <ellipse cx="60" cy="96" rx="47" ry="45" fill="#FFF0F5"/>
    <circle cx="43" cy="87" r="12" fill="white"/>
    <circle cx="77" cy="87" r="12" fill="white"/>
    <circle cx="44" cy="88" r="7.8" fill="#1E1B2E"/>
    <circle cx="78" cy="88" r="7.8" fill="#1E1B2E"/>
    <circle cx="47" cy="85" r="3.0" fill="white"/>
    <circle cx="81" cy="85" r="3.0" fill="white"/>
    <circle cx="42" cy="90" r="1.4" fill="white" opacity="0.8"/>
    <circle cx="76" cy="90" r="1.4" fill="white" opacity="0.8"/>
    <ellipse cx="60" cy="102" rx="6" ry="4.5" fill="#FF69B4"/>
    <path d="M 54 107 Q 60 114 66 107" stroke="#FF69B4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <line x1="60" y1="106" x2="60" y2="114" stroke="#FF69B4" stroke-width="2" stroke-linecap="round"/>
    <circle cx="31" cy="100" r="10" fill="#FF69B4" opacity="0.28"/>
    <circle cx="89" cy="100" r="10" fill="#FF69B4" opacity="0.28"/>
    <circle cx="46" cy="106" r="1.8" fill="#FF69B4" opacity="0.55"/>
    <circle cx="41" cy="109" r="1.8" fill="#FF69B4" opacity="0.55"/>
    <circle cx="74" cy="106" r="1.8" fill="#FF69B4" opacity="0.55"/>
    <circle cx="79" cy="109" r="1.8" fill="#FF69B4" opacity="0.55"/>
  </svg>`;

  /* ---- 화면 레지스트리 ---- */
  const _screens = {};
  let _currentScreen     = null;
  let _currentScreenData = {};

  function registerScreen(id, renderFn) {
    _screens[id] = renderFn;
  }

  /* ---- 화면 라우터 (async 렌더 함수 지원) ---- */
  function showScreen(id, data = {}) {
    _currentScreen     = id;
    _currentScreenData = data;
    const appEl = document.getElementById('app');
    if (!_screens[id]) {
      console.warn(`[App] 등록되지 않은 화면: "${id}"`);
      return;
    }

    appEl.classList.add('screen-exit');

    setTimeout(async () => {
      // 로딩 스피너 먼저 표시 (async 렌더 대비)
      appEl.innerHTML = '<div class="loading-screen"><div class="loading-spinner">⭐</div></div>';
      appEl.classList.remove('screen-exit');

      try {
        const result = _screens[id](data);
        // async 렌더 함수(Promise 반환)와 sync 함수 모두 처리
        const html = (result && typeof result.then === 'function') ? await result : result;
        appEl.innerHTML = html;
      } catch (err) {
        console.error('[App] 화면 렌더 오류:', err);
        appEl.innerHTML = '<div class="loading-screen"><p style="color:white;font-size:1.2rem">오류가 발생했어요 😢</p></div>';
      }

      appEl.classList.add('screen-enter');
      setTimeout(() => appEl.classList.remove('screen-enter'), 300);
      _bindMuteBtn();
    }, 150);
  }

  /* ---- 음소거 버튼 ---- */
  function _bindMuteBtn() {
    const btn = document.getElementById('btn-mute');
    if (!btn) return;
    btn.textContent = Sound.isMuted() ? '🔇' : '🔊';
    btn.addEventListener('click', () => {
      Sound.resume();
      const muted = Sound.toggleMute();
      btn.textContent = muted ? '🔇' : '🔊';
    });
  }

  /* ---- 토스트 알림 ---- */
  function showToast(msg, duration = 2200) {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);

    setTimeout(() => {
      el.classList.add('toast-hide');
      setTimeout(() => el.remove(), 280);
    }, duration);
  }

  /* ---- 파티클 효과 (별, 하트 등) ---- */
  function spawnParticles(emojis = ['⭐', '✨', '🌟'], count = 8, originEl = null) {
    const origin = originEl
      ? originEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };

    const cx = origin.left + origin.width / 2;
    const cy = origin.top  + origin.height / 2;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = `${cx}px`;
      el.style.top  = `${cy}px`;

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const dist  = 60 + Math.random() * 80;
      el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
      el.style.animationDuration = `${0.6 + Math.random() * 0.4}s`;

      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  /* ---- LocalStorage 헬퍼 ---- */
  const Storage = {
    get(key, fallback = null) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch {}
    },
    remove(key) {
      try { localStorage.removeItem(key); }
      catch {}
    },
  };

  /* ---- Service Worker 등록 ---- */
  function _registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .catch(err => console.warn('[SW] 등록 실패:', err));
    }
  }

  /* ---- 스플래시 화면 ---- */
  registerScreen('splash', () => `
    <div class="screen splash-screen">

      <button id="btn-mute" class="btn-mute" aria-label="소리 켜기/끄기">🔊</button>

      <div class="splash-deco" aria-hidden="true">
        <span class="deco-star s1">⭐</span>
        <span class="deco-star s2">✨</span>
        <span class="deco-star s3">🌟</span>
        <span class="deco-star s4">💫</span>
        <span class="deco-star s5">⭐</span>
        <span class="deco-star s6">✨</span>
        <span class="deco-star s7">🌟</span>
        <span class="deco-star s8">💫</span>
      </div>

      <div class="splash-content">
        <div class="splash-app-icon" aria-hidden="true">🎯</div>

        <h1 class="splash-title anim-slideUp" style="animation-delay:0.05s">
          코딩 스티커
        </h1>
        <p class="splash-subtitle anim-slideUp" style="animation-delay:0.12s">
          미션을 완료하고 스티커를 모아요! ⭐
        </p>

        <div class="splash-characters" role="img" aria-label="여우와 토끼 캐릭터">
          <div class="char-card anim-slideUp" style="animation-delay:0.18s">
            ${FOX_SVG}
            <span class="char-label">🦊 여우 코스</span>
            <span class="char-grade">초5</span>
          </div>
          <div class="char-card anim-slideUp" style="animation-delay:0.26s">
            ${RABBIT_SVG}
            <span class="char-label">🐰 토끼 코스</span>
            <span class="char-grade">초3</span>
          </div>
        </div>

        <button
          class="btn-splash-start anim-slideUp"
          style="animation-delay:0.35s"
          onclick="App.start(this)"
          aria-label="앱 시작하기"
        >
          시작하기 🚀
        </button>

        <p class="splash-hint anim-fadeIn" style="animation-delay:0.5s">
          처음 사용하면 가족 코드를 만들어요
        </p>
      </div>

    </div>
  `);

  /* ---- 시작하기 버튼 핸들러 ---- */
  function start(btn) {
    Sound.resume();
    Sound.click();

    if (btn) {
      btn.disabled = true;
      spawnParticles(['⭐', '✨', '💫', '🌟'], 10, btn);
    }

    setTimeout(() => {
      /* PWA 미설치 + 최초 방문 → 설치 안내 화면 */
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
      const skipped   = Storage.get('pwaInstallSkipped', false);
      const installed = Storage.get('pwaInstalled', false);
      if (!isStandalone && !skipped && !installed) {
        showScreen('pwa-install');
      } else {
        showScreen('family-code');
      }
    }, 350);
  }

  /* ============================================================
     PWA 설치 안내 화면
     ============================================================ */
  let _deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredInstallPrompt = e;
  });

  registerScreen('pwa-install', () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;

    if (isStandalone) {
      /* 이미 설치된 경우 → 바로 앱 진입 */
      setTimeout(() => showScreen('family-code'), 200);
      return '<div class="loading-screen"><div class="loading-spinner">⭐</div></div>';
    }

    const androidHTML = `
      <div class="pi-os-section">
        <div class="pi-os-title">🤖 안드로이드 (크롬)</div>
        <ol class="pi-steps">
          <li>주소창 오른쪽 <strong>⋮ 메뉴</strong> 탭</li>
          <li><strong>"홈 화면에 추가"</strong> 선택</li>
          <li><strong>"추가"</strong> 버튼 탭</li>
          <li>홈 화면에서 앱 아이콘 확인! ✅</li>
        </ol>
        <button class="pi-install-btn" id="pi-android-btn" onclick="App.triggerInstall(this)">
          📲 지금 설치하기
        </button>
      </div>`;

    const iosHTML = `
      <div class="pi-os-section">
        <div class="pi-os-title">🍎 아이폰 (사파리)</div>
        <ol class="pi-steps">
          <li>하단 <strong>공유 버튼 (□↑)</strong> 탭</li>
          <li><strong>"홈 화면에 추가"</strong> 선택</li>
          <li>이름 확인 후 <strong>"추가"</strong> 탭</li>
          <li>홈 화면에서 앱 아이콘 확인! ✅</li>
        </ol>
      </div>`;

    return `
    <div class="screen screen-pwa-install">
      <div class="pi-deco" aria-hidden="true">
        <span class="d1">📱</span><span class="d2">✨</span>
        <span class="d3">⭐</span><span class="d4">💫</span>
      </div>

      <div class="pi-content">
        <div class="pi-icon">📲</div>
        <h1 class="pi-title anim-slideUp">홈 화면에 추가해요!</h1>
        <p class="pi-subtitle anim-slideUp" style="animation-delay:0.08s">
          앱처럼 설치하면 더 빠르고 편하게 사용할 수 있어요 🚀
        </p>

        <div class="pi-card anim-slideUp" style="animation-delay:0.14s">
          ${androidHTML}
          <div class="pi-divider">또는</div>
          ${iosHTML}
        </div>

        <div class="pi-btns anim-slideUp" style="animation-delay:0.22s">
          <button class="btn-primary pi-skip-btn" onclick="App.skipInstall()">
            나중에 할게요 →
          </button>
        </div>
        <p class="pi-hint">설치하지 않아도 앱은 그대로 사용할 수 있어요</p>
      </div>
    </div>`;
  });

  function triggerInstall(btn) {
    if (!_deferredInstallPrompt) {
      showToast('크롬 메뉴 → "홈 화면에 추가"를 눌러주세요 📲');
      return;
    }
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        showToast('설치 완료! 홈 화면을 확인해봐요 🎉');
        Storage.set('pwaInstalled', true);
        setTimeout(() => showScreen('family-code'), 1200);
      }
      _deferredInstallPrompt = null;
      if (btn) btn.disabled = false;
    });
    if (btn) btn.disabled = true;
  }

  function skipInstall() {
    Sound.click();
    Storage.set('pwaInstallSkipped', true);
    showScreen('family-code');
  }

  /* ---- 앱 초기화 ---- */
  function _init() {
    _registerSW();
    showScreen('splash');
  }

  document.addEventListener('DOMContentLoaded', _init);

  /* ---- 공개 API ---- */
  return {
    registerScreen,
    showScreen,
    showToast,
    spawnParticles,
    start,
    Storage,
    triggerInstall,
    skipInstall,
    get foxSVG()          { return FOX_SVG; },
    get rabbitSVG()       { return RABBIT_SVG; },
    get currentScreen()     { return _currentScreen; },
    get currentScreenData() { return _currentScreenData; },
  };

})();
