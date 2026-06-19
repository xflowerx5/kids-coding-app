# Firebase 설정 가이드 — 코딩 스티커 앱

> Firebase를 설정하지 않아도 앱은 정상 작동합니다 (로컬 모드).  
> 여러 기기에서 진행 상황을 **실시간 공유**하려면 아래 단계를 따라 주세요.

---

## 1단계 — Firebase 프로젝트 만들기

1. [Firebase 콘솔](https://console.firebase.google.com/) 접속 → Google 계정 로그인
2. **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 (예: `kids-coding-sticker`)
4. Google 애널리틱스 → 원하는 대로 선택 후 **프로젝트 만들기**

---

## 2단계 — Firestore 데이터베이스 활성화

1. 왼쪽 메뉴 **빌드 → Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택 → 지역은 `asia-northeast3 (서울)` 권장
4. **완료**

> **보안 규칙 (30일 후 수동 설정 필요):**  
> Firestore 콘솔 → **규칙** 탭에서 아래 내용으로 교체하세요.
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /families/{familyCode}/{document=**} {
>       allow read, write: if true;
>     }
>   }
> }
> ```
> 이 규칙은 가족 코드를 아는 사람만 접근 가능한 구조입니다.

---

## 3단계 — 웹 앱 등록 및 설정값 복사

1. Firebase 콘솔 홈 → 프로젝트 설정 (⚙️ 아이콘) → **일반** 탭
2. **앱 추가** → `</>` (웹) 아이콘 클릭
3. 앱 닉네임 입력 (예: `코딩스티커`) → **앱 등록**
4. **Firebase SDK 추가** 화면에서 아래 형태의 설정값을 복사해 두기:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "kids-coding-sticker.firebaseapp.com",
  projectId:         "kids-coding-sticker",
  storageBucket:     "kids-coding-sticker.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abc123...",
};
```

---

## 4단계 — 앱에 설정값 입력

### `js/firebase.js` 파일 열기

파일 상단 `_CONFIG` 객체를 찾아 값 교체:

```js
const _CONFIG = {
  apiKey:            "여기에 복사한 apiKey 붙여넣기",
  authDomain:        "여기에 복사한 authDomain 붙여넣기",
  projectId:         "여기에 복사한 projectId 붙여넣기",
  storageBucket:     "여기에 복사한 storageBucket 붙여넣기",
  messagingSenderId: "여기에 복사한 messagingSenderId 붙여넣기",
  appId:             "여기에 복사한 appId 붙여넣기",
};
```

### `index.html` 파일 열기

아래 주석 처리된 두 줄을 찾아 `<!--` 와 `-->` 제거:

```html
<!-- 변경 전 (주석 상태) -->
<!--
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
-->

<!-- 변경 후 (주석 해제) -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
```

---

## 5단계 — 확인

앱을 열어 가족 코드를 입력하면 Firestore 콘솔에 `families` 컬렉션이 생성됩니다.

**두 기기 연동 방법:**
1. 부모 폰에서 가족 코드 생성 후 메모
2. 아이 폰에서 같은 가족 코드 입력
3. 한 기기에서 미션 완료 시 다른 기기에도 즉시 반영

---

## 무료 플랜 한도 (Spark)

| 항목 | 한도 |
|------|------|
| 읽기 | 50,000회 / 일 |
| 쓰기 | 20,000회 / 일 |
| 삭제 | 20,000회 / 일 |
| 저장 용량 | 1 GiB |

가족 앱 용도로는 충분합니다 — 유료 업그레이드 불필요.

---

## 문제 해결

| 증상 | 해결 방법 |
|------|----------|
| 앱이 흰 화면으로 멈춤 | 브라우저 콘솔(F12)에서 Firebase 오류 확인. projectId가 맞는지 재확인 |
| Firestore에 데이터 없음 | 보안 규칙이 쓰기 허용 상태인지 확인 |
| 오프라인에서 데이터 사라짐 | 정상 동작. Firestore 지속성은 온라인 재연결 시 자동 복구됨 |
| 동기화 안됨 | 두 기기가 같은 가족 코드를 사용하는지 확인 |

Firebase 설정 없이도 앱은 항상 로컬 모드로 정상 작동합니다.
