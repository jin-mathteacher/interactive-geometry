# 인터랙티브 기하 (with Mong Teacher)

고등학교 기하(이) 교과 수업용 인터랙티브 학습 사이트입니다.
로그인·설치 없이 브라우저에서 바로 사용할 수 있는 정적 사이트입니다.

> 바이브 코딩을 활용해 천재교육, 두산동아, 비상 등 고등학교 기하(이) 교과서를 참고하여 제작한 학습 자료입니다.

## 실행 방법 (로컬)

`index.html`을 더블클릭으로 직접 열면 콘텐츠 로딩이 되지 않습니다 (브라우저가 로컬 파일 fetch를 차단).
반드시 간단한 서버로 열어 주세요:

```bash
cd site
python -m http.server 8765
```

브라우저에서 http://localhost:8765 접속.

## 배포 (GitHub Pages)

`site/` 폴더 내용을 GitHub 저장소에 올리고 Settings → Pages에서 배포하면
로그인 없이 누구나 접속 가능한 수업용 주소가 생깁니다.

## 구조

```
site/
├── index.html          # 홈 (대단원 카드)
├── unit.html           # 대단원별 소단원 목록  (?u=1)
├── lesson.html         # 소단원 활동 페이지    (?u=1&l=1)
├── css/style.css       # 칠판·분필 테마 (승인 시안 B)
├── js/
│   ├── lesson.js       # 소단원 렌더러 (훅/탐구/문제/PDF 흐름)
│   ├── embed.js        # 유튜브·알지오매스 링크 → iframe 자동 변환
│   ├── pdf-export.js   # 활동 화면 PDF 저장 (jsPDF + html2canvas CDN)
│   ├── nav.js          # 햄버거 메뉴
│   ├── hooks/          # ⓪ 들어가기 도입 게임 (소단원별)
│   └── simulations/    # ② 원리 탐구 시뮬레이션 (소단원별)
└── content/
    ├── units.json      # 대단원/소단원 목차
    └── lessons/        # 소단원별 콘텐츠 (1-1.json ...)
```

## 수업 흐름 (소단원 페이지)

⓪ 들어가기(도입 게임, 성공 시 수업 공개) → ① 개념 열기(텍스트+유튜브)
→ ② 원리 탐구(조작형 시뮬레이션 + 브릴리언트식 단계형 탐구)
→ ③ 문제 풀이(단계별 힌트, 즉시 채점) → ④ 실생활 적용(알지오매스 임베드)
→ 활동 결과 PDF 저장

## 사용한 오픈소스

| 라이브러리 | 용도 | 라이선스 |
|---|---|---|
| [KaTeX](https://katex.org) | 수식 렌더링 — 콘텐츠 텍스트에 `\( y^2=4px \)` 또는 `$$ ... $$`로 쓰면 교과서 수준 조판 | MIT |
| [jsPDF](https://github.com/parallax/jsPDF) | 활동 결과 PDF 저장 | MIT |
| [html2canvas](https://html2canvas.hertzen.com) | 활동 화면 캡처 | MIT |

임베드 지원(링크만 붙여넣으면 자동 감지): **유튜브 · 알지오매스 · GeoGebra(geogebra.org/m/자료ID) · Desmos**

### 참고할 만한 무료 학습 자원 (링크로 임베드 가능)
- **GeoGebra 자료실** (geogebra.org/materials) — 이차곡선·벡터·공간도형 시뮬레이션 수천 개, 링크 임베드 지원
- **알지오매스** (algeomath.kr) — 한국 수학교육용 공식 도구, 만든 활동 공유 링크 임베드
- **Desmos** (desmos.com/calculator) — 그래프 계산기, 만든 그래프 링크 임베드
- **PhET 시뮬레이션** (phet.colorado.edu) — 콜로라도대 무료 과학·수학 시뮬레이션 (iframe 임베드 지원)

## 콘텐츠 추가/수정 방법

- **유튜브·알지오매스 링크**: `content/lessons/X-Y.json`의 `intro.youtube`, `apply.algeomath`에
  공유 링크만 붙여넣으면 자동으로 임베드됩니다.
- **문제 추가**: `practice.problems` 배열에 `{id, prompt, hints[], answer, explanation}` 추가.
  `answer`는 문자열 또는 배열(복수 표기 허용, 예: `["-3/2", "-1.5"]`).
  비교 시 공백·대소문자는 무시됩니다.
- **단계형 탐구 추가**: `explore.activities`에 `{type:"steps", title, steps:[{prompt, choices:[{label, correct}], feedback}]}`.
  코드 없이 JSON만으로 추가할 수 있습니다.
- **시뮬레이션 추가**: `js/simulations/`에 `export function mount(container){...}` 모듈을 만들고
  `explore.activities`에 `{type:"sim", title, text, module:"js/simulations/파일명.js"}` 등록.
