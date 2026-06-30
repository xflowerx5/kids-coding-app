# CLAUDE.md — kids-coding-app 프로젝트 지침서

> **모든 에이전트 필독**: 이 파일을 먼저 읽고 작업을 시작하라.  
> 기존에 작동 중인 코드를 건드리기 전에 반드시 현재 Phase 완료 여부를 확인하라.

---

## 프로젝트 개요

**앱 이름:** 코딩 스티커 (Kids Coding App)  
**목적:** 두 자녀의 코딩 학습을 미션/스티커/보상으로 동기부여하는 PWA 앱  
**핵심 원칙:** 이 앱은 코딩 에디터가 아니다. 학습 동행 앱이다 (미션 안내 + 진행 추적 + 보상 관리).

### 대상 사용자
| 사용자 | 설명 |
|--------|------|
| 아들 (여우 코스) | 초등학교 5학년, Fox Course |
| 딸 (토끼 코스) | 초등학교 3학년, Rabbit Course |
| 부모 | 진행상황 확인 + 보상 설정 |

---

## 기술 스택 및 제약 조건

### 반드시 지켜야 할 제약
- **순수 HTML/CSS/JS만 사용** — Node.js, npm, webpack, React 등 빌드 도구 절대 사용 금지
- **외부 라이브러리 CDN만 허용** — npm install 없음
- **Firebase Spark 무료 플랜만 사용** — 유료 기능 도입 금지
- **모바일 우선 설계** — 모든 UI는 스마트폰 기준으로 만든다 (부모/아이 모두 폰으로 사용)
- **한국어 전용** — 영어 UI 텍스트 사용 금지

### 기술 스택
```
프론트엔드:  순수 HTML5 / CSS3 / Vanilla JS (ES6+)
PWA:         manifest.json + Service Worker
데이터베이스: Firebase Firestore (무료 플랜)
배포:        GitHub Pages (무료)
오프라인:    Service Worker 캐싱 (미션 내용은 오프라인 가능, Firestore 동기화는 온라인 필요)
```

---

## 프로젝트 파일 구조

```
kids-coding-app/
├── CLAUDE.md                  ← 이 파일 (절대 삭제/이동 금지)
├── index.html                 ← SPA 진입점 (단일 HTML 파일)
├── manifest.json              ← PWA 설정
├── service-worker.js          ← 오프라인 캐싱
├── css/
│   └── style.css              ← 전체 스타일 (단일 CSS 파일)
├── js/
│   ├── app.js                 ← 앱 진입점, 화면 라우팅
│   ├── firebase.js            ← Firebase 초기화 및 Firestore 함수
│   ├── child.js               ← 아이 화면 로직 (미션, 스티커)
│   ├── parent.js              ← 부모 화면 로직 (대시보드, 보상 설정)
│   ├── sticker.js             ← 스티커 시스템 (미니 30개 → 상품스티커 1개)
│   ├── puzzle.js              ← 인앱 퍼즐 엔진 (그리드 렌더링, 명령 실행, 정답 검증)
│   └── sound.js               ← 효과음 시스템 (Web Audio API, 파일 없이 JS로 생성)
├── missions/
│   ├── rabbit.json            ← 토끼 코스 미션 데이터 (딸, 초3)
│   ├── fox.json               ← 여우 코스 미션 데이터 (아들, 초5)
│   └── CATALOG.md             ← 전체 미션 목록 (중복 방지용, 새 미션 추가 시 필수 업데이트)
└── icons/                     ← PWA 아이콘 및 캐릭터 이미지
    ├── icon.svg
    ├── icon-maskable.svg
    ├── fox.svg
    └── rabbit.svg
```

### 파일 추가/삭제 규칙
- **추가는 자유롭게** 허용하되 위 구조를 따른다
- **기존 파일 삭제/이름 변경 금지** — 다른 파일에서 참조 중일 수 있다
- **index.html은 단일 파일** — 화면 분리는 JS로 처리 (별도 HTML 파일 생성 금지)

---

## 데이터 구조

### Mission JSON 스키마 (missions/rabbit.json, missions/fox.json)

**`type: "puzzle"` — 인앱 퍼즐 미션**
```json
{
  "id": 1,
  "type": "puzzle",
  "difficulty": 1,
  "category": "sequencing",
  "title": "한 방향으로 가요!",
  "emoji": "➡️",
  "description": "→ 버튼으로 캐릭터를 별에 데려다줘요!",
  "tip": "버튼을 눌러 명령을 추가하고 실행해봐요!",
  "grid": { "cols": 6, "rows": 3 },
  "start": { "r": 1, "c": 0 },
  "goal":  { "r": 1, "c": 5 },
  "walls": [],
  "maxCommands": 8,
  "allowRepeat": false,
  "preset": ["R", "R", "D"],
  "solution": ["R", "R", "R", "R", "R"]
}
```
> `preset`: 디버깅 미션에서 미리 채워진 (틀린) 명령. 생략 가능.

**`type: "external"` — 외부 도구 미션 (Scratch, Python 등)**
```json
{
  "id": 9,
  "type": "external",
  "difficulty": 6,
  "category": "scratch",
  "title": "고양이를 움직여봐요!",
  "emoji": "🐱",
  "description": "Scratch에서 방향키로 고양이를 움직이는 프로그램을 만들어봐요.",
  "tip": "이벤트 → '오른쪽 화살표 키를 눌렀을 때' 블록을 찾아봐요!",
  "tool": "Scratch",
  "toolUrl": "https://scratch.mit.edu",
  "guide": [
    "scratch.mit.edu 에 접속해요",
    "'만들기' 버튼을 눌러요",
    "이벤트 블록에서 방향키 이벤트를 추가해요",
    "동작 블록으로 x좌표를 바꿔줘요",
    "초록 깃발을 눌러서 테스트해요"
  ]
}
```
> `guide`: 체크리스트로 표시됨. 모두 체크해야 스티커 버튼 활성화.

> **커리큘럼 확장:** `missions` 배열에 항목을 추가하면 코드 수정 없이 앱에 자동 반영된다.  
> **반드시** `missions/CATALOG.md`도 함께 업데이트하라.

### Firebase Firestore 스키마

```
families/
  {familyCode}/             ← 6자리 영문+숫자 랜덤 코드 (예: "FX7K2R")
    info:
      createdAt: timestamp
      parentPin: string     ← 4자리 숫자 PIN (부모 대시보드 접근용)
    fox/                    ← 아들 (여우 코스)
      completedMissions: number[]  ← 완료한 미션 id 배열 [1, 2, 3]
      totalStickers: number        ← 누적 미니스티커 총합
      rewardStickers: number       ← 획득한 상품스티커 총합 (30개마다 +1)
      pendingReward: number        ← 부모 미확인 상품스티커 수
      confirmedReward: number      ← 부모 확인 완료 상품스티커 수
      lastActivity: timestamp
    rabbit/                 ← 딸 (토끼 코스)
      (fox와 동일한 구조)
```

> **familyCode 생성:** 앱 최초 실행 시 자동 생성. 부모와 아이 기기에서 같은 코드 입력 시 연동.

### 스티커 시스템

- **미니스티커**: 미션 1개 완료 = 미니스티커 1개
- **상품스티커**: 미니스티커 30개 누적 시 자동 지급 (🎖️)
- **부모 확인**: 아이가 상품스티커를 부모에게 보여주면 → 부모가 앱에서 확인 → 실물 선물 증정
- `pendingReward`: 부모 미확인 상품스티커 수. 부모 대시보드에 알림 표시.
- `MINI_GOAL = 30` (고정값, 변경 불가)

---

## UX 플로우

### 아이 플로우
```
앱 열기 → 가족 코드 입력 → 캐릭터 선택 (여우/토끼)
  → 미션 로드맵 (단계별 잠금/해제)
  → 미션 상세 (설명 + 외부 링크 + 팁)
  → "완료했어요!" 버튼 클릭 → 스티커 1장 지급 (애니메이션)
  → 스티커판 확인 → 다 채우면 축하 화면 ("부모님께 보여드려요!")
```

### 부모 플로우
```
앱 열기 → 가족 코드 입력 → "부모 모드" 선택 → PIN 4자리 입력
  → 대시보드 (두 아이 현황 카드)
  → 스티커 목표/보상 설정
  → 아이 완료 내역 확인
```

### 미션 완료 방식 (검증 필수)
- **퍼즐 미션 (`type: "puzzle"`)**: 퍼즐 엔진이 정답 경로 도달을 자동 감지. 성공해야만 스티커 버튼 활성화.
- **외부 미션 (`type: "external"`)**: 가이드 체크리스트의 모든 항목 체크 완료 시 스티커 버튼 활성화.
- **공통**: 스티커 버튼이 활성화되기 전까지는 스티커 지급 불가. 미션 클리어 = 스티커 지급의 필요 조건.

---

## 커리큘럼

### 토끼 코스 — 딸 (초3, 8단계)
| id | 미션 | 도구 | URL |
|----|------|------|-----|
| 1 | 오프라인 화살표 카드 게임 | 없음 | - |
| 2 | Scratch 고양이 움직이기 (방향키) | Scratch | https://scratch.mit.edu |
| 3 | 미로 탈출 미션 | Scratch | https://scratch.mit.edu |
| 4 | 클릭하면 소리나는 캐릭터 만들기 | Scratch | https://scratch.mit.edu |
| 5 | 2캐릭터 대화 애니메이션 | Scratch | https://scratch.mit.edu |
| 6 | 떨어지는 과일 받기 미니게임 | Scratch | https://scratch.mit.edu |
| 7 | O/X 퀴즈 게임 만들기 (맞히면 점수 올라가요) | Scratch | https://scratch.mit.edu |
| 8 | 자유 주제 미니 프로젝트 발표 (배운 거 모두 활용!) | Scratch | https://scratch.mit.edu |

### 여우 코스 — 아들 (초5, 8단계)
| id | 미션 | 도구 | URL |
|----|------|------|-----|
| 1 | 오프라인 화살표 카드 게임 | 없음 | - |
| 2 | Scratch 고양이 움직이기 (방향키) | Scratch | https://scratch.mit.edu |
| 3 | 미로 탈출 미션 | Scratch | https://scratch.mit.edu |
| 4 | 점수/목숨/레벨 게임 만들기 | Scratch | https://scratch.mit.edu |
| 5 | Code.org App Lab 퀴즈 앱 | Code.org | https://code.org/educate/applab |
| 6 | Python turtle 그림 그리기 | Replit | https://replit.com |
| 7 | 나만의 게임 아이디어 기획서 작성 | 없음 | - |
| 8 | 자유 주제 프로젝트 발표 | 자유 | - |

> **단계 추가:** 언제든지 `missions/fox.json` 또는 `missions/rabbit.json`에 항목 추가 가능.  
> 부모가 앱 내에서 커스텀 미션을 추가하는 기능은 Phase 5 이후 선택적으로 구현.

---

## 개발 단계 (Phase)

> **규칙:** 현재 Phase가 완료되지 않으면 다음 Phase 작업을 시작하지 않는다.  
> 각 Phase 완료 기준을 반드시 충족해야 한다.

---

### Phase 1 — PWA 뼈대 구축
**목표:** 브라우저에서 열리고 "홈 화면에 추가"가 가능한 기본 앱 구조

**작업 목록:**
- [ ] `index.html` — SPA 구조, 화면 전환용 `<div id="app">` 컨테이너, canvas-confetti CDN 포함
- [ ] `manifest.json` — 앱 이름, 아이콘, 시작 URL, 색상 설정
- [ ] `service-worker.js` — 정적 자산 캐싱 (오프라인 대응)
- [ ] `css/style.css` — 모바일 우선 기본 스타일, CSS 변수 정의, 공통 @keyframes 애니메이션
- [ ] `js/app.js` — 화면 라우팅 함수 (showScreen), Service Worker 등록, 화면 전환 fade 효과
- [ ] `js/sound.js` — Web Audio API 기반 효과음 시스템 (Sound 객체), 음소거 토글
- [ ] `icons/` — PWA 필수 아이콘 (192x192, 512x512) SVG로 생성

**완료 기준:**
- Chrome 모바일에서 "홈 화면에 추가" 프롬프트 표시
- 오프라인에서 앱 껍데기 로드 가능
- Lighthouse PWA 점수 기본 통과

---

### Phase 2 — 아이 화면: 가족 코드 + 캐릭터 선택 + 미션 로드맵
**목표:** 아이가 앱을 열면 미션을 보고 완료 체크할 수 있다 (로컬 저장)

**의존성:** Phase 1 완료 후 진행

**작업 목록:**
- [ ] `missions/rabbit.json` — 토끼 코스 전체 데이터 작성
- [ ] `missions/fox.json` — 여우 코스 전체 데이터 작성
- [ ] 가족 코드 입력 화면 (localStorage에 저장)
- [ ] 캐릭터 선택 화면 (여우/토끼 큰 버튼)
- [ ] 미션 로드맵 화면 (단계 카드 목록, 완료/잠금 상태 표시)
- [ ] 미션 상세 화면 (설명, 팁, 외부 링크 버튼, "완료했어요!" 버튼)
- [ ] `js/child.js` — 위 화면 로직

**완료 기준:**
- 아이가 캐릭터 선택 후 미션 목록 확인 가능
- "완료했어요!" 클릭 시 해당 미션 완료 표시 (localStorage)
- 앱 재실행 시 완료 상태 유지

---

### Phase 3 — 스티커판 + 보상 UI
**목표:** 미션 완료 시 스티커 지급 애니메이션과 스티커판이 작동한다

**의존성:** Phase 2 완료 후 진행

**작업 목록:**
- [ ] 스티커판 화면 (격자형, 획득한 스티커 채워지는 UI)
- [ ] 스티커 지급 애니메이션 — 별 파티클 터짐 + `Sound.stickerEarn()` 호출
- [ ] 미션 완료 버튼 효과 — 체크 애니메이션 + `Sound.missionComplete()` 호출
- [ ] 스티커판 완성 감지 → 축하 화면 ("부모님께 보여드려요!") + Confetti + `Sound.boardComplete()` 호출
- [ ] `js/sticker.js` — 스티커 로직 분리
- [ ] 로컬 보상 설정 화면 (스티커 목표 수, 보상 내용 입력)

**완료 기준:**
- 미션 완료 → 스티커 +1 → 스티커판 시각적 업데이트
- 목표 수 달성 시 축하 화면 표시
- 설정한 보상 내용이 축하 화면에 표시

---

### Phase 4 — 부모 대시보드
**목표:** 부모가 두 아이의 진행상황을 한눈에 볼 수 있다

**의존성:** Phase 3 완료 후 진행

**작업 목록:**
- [ ] "부모 모드" 진입 버튼 및 PIN 입력 화면 (4자리)
- [ ] 대시보드 메인 (두 아이 현황 카드 — 완료 미션 수, 스티커 수, 마지막 활동)
- [ ] 보상 설정 화면 (스티커 목표 수, 보상 내용 텍스트)
- [ ] 미션 완료 내역 상세 보기
- [ ] `js/parent.js` — 부모 화면 로직 분리

**완료 기준:**
- PIN 없이 부모 화면 접근 불가
- 두 아이 현황 동시에 확인 가능
- 보상 설정이 아이 화면에도 반영

---

### Phase 5 — Firebase 연동 (실시간 가족 동기화)
**목표:** 가족 코드로 여러 기기가 연결되고 데이터가 실시간 동기화된다

**의존성:** Phase 4 완료 후 진행

**선행 작업 (부모가 직접 진행):**
- Firebase 콘솔에서 프로젝트 생성
- Firestore 데이터베이스 활성화
- 웹 앱 등록 후 Firebase 설정값 획득

**작업 목록:**
- [ ] Firebase 설정 안내 파일 작성 (`FIREBASE_SETUP.md`)
- [ ] `js/firebase.js` — Firebase 초기화 (설정값은 부모가 직접 입력)
- [ ] localStorage → Firestore 데이터 마이그레이션 함수
- [ ] 가족 코드 생성 로직 (신규: 6자리 랜덤 코드 자동 생성)
- [ ] Firestore 실시간 리스너 연결 (onSnapshot)
- [ ] 오프라인 → 온라인 복귀 시 자동 동기화

**완료 기준:**
- 부모 폰 + 아이 폰에서 같은 가족 코드 입력 시 데이터 동기화
- 아이가 미션 완료 시 부모 폰 대시보드 실시간 업데이트
- Firebase 없이도 로컬 모드로 앱 사용 가능 (Firebase 미설정 시 fallback)

---

### Phase 6 — 마무리 + PWA 설치 테스트
**목표:** 실제 폰에 설치하고 안정적으로 사용 가능한 상태

**의존성:** Phase 5 완료 후 진행

**작업 목록:**
- [ ] PWA 설치 안내 화면 (앱 내에서 설치 유도)
- [ ] GitHub Pages 배포 설정
- [ ] 오프라인 동작 최종 확인
- [ ] 각 화면 모바일 UX 최종 점검
- [ ] 최종 점검 체크리스트 확인

**완료 기준:**
- Android/iOS Chrome에서 홈 화면 설치 완료
- 네트워크 없이 미션 내용 조회 가능
- 가족 코드로 2대 기기 연동 확인

---

## 에이전트 작업 규칙

### UI & 애셋 디자인 원칙 (최우선)
- **최대한 예쁘고 귀엽게** — 아이들이 앱을 열 때 환호할 수 있는 수준을 목표로
- 모든 요소는 둥글둥글하게: `border-radius` 최소 16px, 버튼은 `border-radius: 9999px`
- 배경은 그라디언트 필수 — flat 단색 배경 사용 금지
- 캐릭터(여우/토끼) SVG는 크고 둥근 눈, 발그레한 볼, 행복한 표정으로
- 별(⭐), 반짝이(✨), 하트(💗) 등 장식 요소를 아낌없이 사용
- 파스텔 배경 + 선명한 포인트 색상 조합
- 카드는 흰 배경 + 부드러운 그림자 (`box-shadow`)
- 글자는 굵고 크게 — 아이들이 읽기 쉽게

### 🚨 미션 추가 절차 (사용자가 요청하면 자동 수행)

> "미션 추가해줘" / "다음 미션 만들어줘" / "토끼 9번 추가해줘" 등 미션 추가 요청이 오면  
> **반드시 아래 4단계를 순서대로 자동 수행**하라. 사용자가 매번 상기시킬 필요 없다.

**Step 1 — CATALOG.md 확인**
- `missions/CATALOG.md` 를 읽어 현재 최대 ID, 사용된 카테고리·개념·그리드 크기를 파악
- 추가할 미션이 기존과 개념/그리드 중복인지 확인
- 난이도 곡선이 자연스럽게 이어지는지 확인

**Step 2 — JSON 설계**
- `type: "puzzle"` 또는 `type: "external"` 결정
- puzzle이면: 그리드, 벽, start, goal, solution(정답 경로)을 직접 설계
- external이면: tool, toolUrl, guide 체크리스트 항목(5개 내외) 작성

**Step 3 — 솔루션 시뮬레이션 검증 (puzzle 타입만)**
- Python 스크립트로 그리드 시뮬레이션 실행:
  ```python
  # 검증 로직: start에서 solution 명령을 순서대로 실행
  # 벽/경계 충돌 시 FAIL, goal 도달 시 PASS
  ```
- PASS가 확인된 뒤에만 JSON에 추가
- FAIL 시 경로를 수정하고 다시 검증

**Step 4 — 파일 업데이트**
- `missions/fox.json` 또는 `missions/rabbit.json` 에 새 미션 항목 추가
- `missions/CATALOG.md` 의 해당 코스 표에 새 행 추가 + 하단 "다음 추가 예정" 목록에서 해당 항목 제거
- CATALOG.md 마지막 줄의 "마지막 업데이트" 날짜와 미션 수 갱신

---

### 코드 작성 규칙
1. **기존 작동 코드 보호**: 이미 완료된 Phase 파일을 수정할 때는 기존 기능이 깨지지 않음을 확인 후 수정
2. **단일 HTML 원칙**: 새 HTML 파일 생성 금지. 모든 화면은 `index.html` 안에서 JS로 전환
3. **빌드 도구 금지**: `package.json`, `node_modules`, `.babelrc` 등 생성 금지
4. **모바일 우선**: 새 UI 작성 시 항상 375px 기준으로 설계. 데스크탑은 부차적
5. **CSS 변수 사용**: 색상/폰트/간격은 `style.css` 상단의 CSS 변수를 통해 관리
6. **한국어 UI**: 버튼, 레이블, 안내문 모두 한국어

### 색상 테마
```css
--fox-primary: #FF8C00;     /* 여우 코스: 주황 */
--fox-secondary: #FFD700;   /* 여우 코스: 노랑 */
--rabbit-primary: #FF69B4;  /* 토끼 코스: 핑크 */
--rabbit-secondary: #DDA0DD; /* 토끼 코스: 라벤더 */
--bg-main: #FFFDF5;         /* 배경: 따뜻한 흰색 */
--text-main: #333333;
--success: #4CAF50;
--shadow: 0 4px 12px rgba(0,0,0,0.1);
```

### Phase 진행 규칙
1. 작업 시작 전 현재 어느 Phase인지 파악 (완료된 파일 존재 여부 확인)
2. 현재 Phase 내 미완료 항목만 작업
3. 다음 Phase 파일을 미리 생성하거나 수정하지 않는다
4. Phase 완료 기준을 충족하지 못했으면 완료로 처리하지 않는다

### 금지 사항
- `npm install` / `yarn add` 등 패키지 설치 명령 실행 금지
- Firebase 유료 기능 (Functions, Blaze 플랜) 도입 금지
- 외부 폰트는 Google Fonts CDN만 허용 (로컬 폰트 파일 추가 금지)
- 이미지 파일은 SVG 또는 Data URL 우선 (용량 최소화)
- `CLAUDE.md` 의 **설계 원칙·규칙 섹션** 수정 금지 (사용자만 수정 가능)  
  단, **"현재 상태"** 섹션은 에이전트가 Phase 완료 시 업데이트할 수 있다
- 효과음을 MP3/WAV 파일로 추가 금지 — 반드시 Web Audio API로 JS 생성

---

## 효과음 & 애니메이션 스펙

### 효과음 (`js/sound.js` — Web Audio API, 외부 파일 없음)

| 함수명 | 이벤트 | 설명 |
|--------|--------|------|
| `Sound.click()` | 모든 버튼 클릭 | 부드러운 팝 소리 (짧고 가벼운 클릭음) |
| `Sound.missionComplete()` | "완료했어요!" 버튼 | 띠링~ 상승하는 성공음 (3음 연속) |
| `Sound.stickerEarn()` | 스티커 1장 지급 | 반짝이는 코인 획득음 |
| `Sound.boardComplete()` | 스티커판 완성 | 팡파레 (5음 이상 멜로디) |
| `Sound.characterSelect()` | 여우/토끼 선택 | 귀엽고 짧은 선택음 |
| `Sound.unlock()` | 다음 미션 잠금 해제 | 자물쇠 열리는 느낌의 상승음 |

**구현 방식:**
```js
// sound.js 기본 구조
const Sound = (() => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  // 각 함수는 OscillatorNode로 음을 합성
  // 사용자 인터랙션 후 AudioContext를 resume() — 브라우저 정책 준수
  return { click, missionComplete, stickerEarn, boardComplete, characterSelect, unlock };
})();
```

> **주의:** 모바일 브라우저는 사용자 터치 이벤트 이후에만 AudioContext 활성화 가능.  
> 첫 번째 버튼 클릭 시 `ctx.resume()` 호출 필수.

**음소거 설정:** 앱 우측 상단에 🔊/🔇 토글 버튼. 설정값 localStorage 저장.

---

### 애니메이션 (CSS `@keyframes` + JS 클래스 토글)

| 이벤트 | 효과 | 구현 |
|--------|------|------|
| 앱 첫 실행 | 캐릭터(여우/토끼) 아래서 위로 등장 | CSS `slideUp` + `fadeIn` |
| 캐릭터 선택 hover | 통통 튀는 모션 | CSS `bounce` keyframe |
| 미션 카드 완료 | 체크 표시 + 초록빛 flash | CSS `checkPop` |
| 스티커 1장 지급 | 별 3개 터지는 파티클 | JS로 DOM 생성 후 CSS 애니메이션 |
| 스티커판 완성 | 색종이 비 (Confetti) | CDN: `canvas-confetti` |
| 버튼 클릭 | 살짝 눌리는 scale 효과 | CSS `transform: scale(0.95)` |
| 화면 전환 | 부드러운 fade 전환 | CSS `opacity` transition |
| 미션 잠금 해제 | 카드 flip + 빛나는 효과 | CSS `rotateY` + `glow` |

**CDN 허용 목록:**
```html
<!-- canvas-confetti (색종이 효과, 스티커판 완성 시 사용) -->
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
```

**애니메이션 원칙:**
- 모든 애니메이션은 0.3초 이하로 짧게 — 아이들이 답답하지 않게
- 스티커판 완성 축하만 예외적으로 3초 이상 허용
- `prefers-reduced-motion` 미디어 쿼리 대응 — 애니메이션 민감 사용자 배려
- JS로 직접 DOM에 `class` 추가/제거하는 방식으로 트리거

---

## 현재 상태 (2026-06-30 기준)

```
Phase 1: ✅ 완료 — PWA 뼈대 (index.html, manifest.json, service-worker.js, css/style.css, js/app.js, js/sound.js, icons/)
Phase 2: ✅ 완료 — 아이 화면 (가족코드 입력, 캐릭터 선택, 미션 로드맵, 미션 상세, js/child.js)
Phase 3: ✅ 완료 — 스티커판 + 보상 UI (js/sticker.js, 미니스티커 30개 → 상품스티커 시스템)
Phase 4: ✅ 완료 — 부모 대시보드 (PIN 입력, 현황 카드, 상품스티커 확인, js/parent.js)
Phase 5: ✅ 완료 — Firebase 연동 (js/firebase.js — 설정값 미입력 시 로컬 모드로 fallback)
Phase 6: 🔄 진행 중 — GitHub Pages 배포 미완료 (사용자가 직접 배포 필요)
```

**아키텍처 추가 완료 (Phase A/B):**
- `js/puzzle.js` — 인앱 퍼즐 엔진 (JSON fetch, 그리드 렌더링, 정답 검증)
- `missions/fox.json` / `missions/rabbit.json` — 통합 스키마로 전면 재작성 (각 8개 퍼즐 미션, 솔루션 검증 완료)
- `missions/CATALOG.md` — 전체 미션 목록 + 중복 방지 체크리스트

**현재 미션 현황:**
- 여우 코스: 퍼즐 8개 완료 | 외부 미션 7개 예정 (ID 9~15)
- 토끼 코스: 퍼즐 8개 완료 | 외부 미션 7개 예정 (ID 9~15)

**다음 작업:** 외부 미션 (Scratch / Python / Code.org) 추가 — 미션 추가 절차에 따라 진행

---

## 배포 정보 및 절차

### 저장소 & 배포 URL
```
GitHub 저장소: https://github.com/xflowerx5/kids-coding-app
배포 URL (앱 접속 주소): https://xflowerx5.github.io/kids-coding-app
브랜치: main (push하면 GitHub Pages 자동 배포)
```

> **폰 설치 방법:** 폰 Chrome에서 위 배포 URL 접속 → 주소창 옆 메뉴(⋮) → '홈 화면에 추가'

### 변경사항 배포 절차 (코드 수정 후 반드시 수행)

```bash
# 1. F:\coding\kids-coding-app 폴더에서 cmd/터미널 열기
# 2. 아래 명령 순서대로 실행

git add .
git commit -m "작업 내용 한 줄 요약"
git push origin main

# → 약 1~2분 후 https://xflowerx5.github.io/kids-coding-app 에 자동 반영
```

### 배포 확인 방법
- GitHub → https://github.com/xflowerx5/kids-coding-app → 우측 "Deployments" → github-pages 상태 확인
- 초록 체크(✅)이면 배포 완료

### 에이전트 규칙
- 코드/미션 파일 수정 후 사용자에게 위 git 명령 실행을 안내한다
- 배포 URL과 저장소 URL을 임의로 변경하지 않는다

---

## 참고 정보

- **구글 드라이브 기획 문서:** kids-coding-app-프로젝트요약 (Drive ID: 15k7oznDEo50xOR-tZOm277gY9CyKQFBhciPjFyRz5wU)
- **Firebase 무료 플랜 한도:** Firestore 읽기 50,000회/일, 쓰기 20,000회/일 — 가족 앱에 충분
- **GitHub Pages:** xflowerx5.github.io/kids-coding-app (이미 활성화 완료)
