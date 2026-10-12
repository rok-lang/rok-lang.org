# rok-lang.org

rok 언어 문서 사이트입니다. 사이트 생성기 자체도 rok 으로 작성했습니다. 사양 저장소의 한국어 마크다운 (`spec/ko`) 을 읽어 언어 참조와 표준 라이브러리 참조를 만들고, 구현 저장소의 표준 라이브러리 소스 (`impl/library`) 에서 API 목록 (`/std/`) 을 뽑고, 이 저장소의 `pages/` 에 있는 랜딩, 안내서 (`/learn/`), 예제 (`/examples/`) 를 더해 `public/` 에 정적 사이트를 씁니다.

## 빌드

준비물은 rok 툴체인 (`rok`, `rokc`) 과 `rok-lang` 저장소 (사양과 표준 라이브러리 소스) 입니다. 기본 설정은 두 저장소가 나란히 있다고 가정합니다.

```
Works/
├── rok-lang/          # impl/ (툴체인, impl/library 표준 라이브러리), spec/ko/ (사양)
└── rok-lang.org/      # 이 저장소
```

툴체인이 없으면 먼저 빌드합니다.

```bash
cd ../rok-lang/impl
cargo build --release
export PATH="$PWD/target/release:$PATH"
```

그다음 이 저장소에서 실행합니다.

```bash
rok run                      # public/ 에 사이트 생성 (사양 + 안내서 + 예제 + API)
rok run -- check             # 생성 + 코드 블록 실행; 깨진 링크나 실패한 블록이 있으면 종료 코드 1
rok run -- code [filter]     # 코드 블록만 실행 (경로에 filter 가 든 페이지만), public/ 은 건드리지 않음
rok test                     # 마크다운 렌더러 테스트
```

빌드가 끝나면 페이지 수, 깨진 링크 수, 걸린 시간을 출력합니다. 링크 검사는 매번 생성된 HTML 을 다시 읽어 모든 `href` / `src` 의 대상 파일과 `#앵커` 가 있는지 확인합니다. 생성만은 1–5 초, `check` 는 코드 블록 수백 개를 병렬로 컴파일하고 실행하므로 머신에 따라 1–3 분쯤 걸립니다.

### 코드 블록 검사

`pages/` 아래 모든 마크다운의 ` ```rok ` 블록은 하나하나가 독립된 프로그램으로 컴파일되고 실행됩니다 (`rokc run <블록>.rok`, 시스템 임시 디렉토리의 `rok-lang.org-snippets/` 에서). info 문자열의 두 번째 단어로 동작을 바꿉니다.

| 블록 | 검사 |
|------|------|
| ` ```rok `        | 컴파일하고 실행. 종료 코드 0 이어야 함 |
| ` ```rok build `  | 컴파일만 (서버, 표준 입력을 읽는 프로그램 등) |
| ` ```rok norun `  | 검사하지 않음 (조각 코드, 툴체인 버그로 아직 안 도는 예) |

실행 블록 바로 뒤의 ` ```output ` 블록은 기대 표준 출력입니다. 줄 끝 공백을 빼고 정확히 같아야 합니다. 페이지에서는 코드 아래 "출력" 상자로 보입니다. 표준 입력은 비어 있고 인자는 없으며, 블록마다 60 초 제한이 있습니다. 툴체인은 `ROKC` 환경 변수, 없으면 `PATH` 의 `rokc` 입니다.

### 표준 라이브러리 API

`site.rokon` 의 `library` (기본 `../rok-lang/impl/library`) 에서 `bare` / `core` / `std` 의 `lib.rok` 부터 `pub mod` 를 따라가며 모듈마다 한 페이지 (`std/<계층>/<모듈 경로>.html`) 를 만듭니다. `pub` 항목의 시그니처를 쓰인 그대로 보여 주고, 바로 위의 `///` 주석을 문서로, 파일 첫 주석 덩어리를 모듈 설명으로 씁니다. 구조체 / enum / 트레잇 / 고유 `impl` 의 멤버와 트레잇 구현 목록도 붙습니다. 항목과 메서드는 검색 색인에 들어갑니다.

`rokc doc` 을 쓰지 않는 이유: `rokc doc` 은 사용자 패키지와 `--extern` 의존성만 문서로 만들고 `rok::` 표준 라이브러리는 빼며, 표준 라이브러리는 사용자 패키지로 컴파일되지 않습니다 (lang 슬롯, 타입 키워드, `rok::core` 경로). 그래서 `apidoc.rok` 이 소스를 직접 훑습니다 (주석 / 문자열을 가린 뒤 괄호 깊이로 항목 경계를 찾음).

## 미리 보기

검색 색인 (`search-index.json`) 을 `fetch` 로 읽기 때문에 `file://` 이 아니라 로컬 서버로 엽니다.

```bash
python3 -m http.server -d public 8000
# http://localhost:8000
```

## 설정

`site.rokon` (RokON) 에서 바꿉니다.

| 필드          | 뜻 |
|---------------|----|
| `title`       | 사이트 이름 |
| `tagline`     | 첫 페이지 제목에 붙는 문구 |
| `spec`        | 사양의 언어 디렉토리 (기본 `../rok-lang/spec/ko`) |
| `spec_repo`, `spec_branch` | 사양 디렉토리 밖을 가리키는 링크 (`../LICENSE` 등) 가 향할 저장소 |
| `packages`    | 패키지 사이트 주소 (`https://rokstones.io`) |
| `library`     | 표준 라이브러리 소스 디렉토리 (기본 `../rok-lang/impl/library`) |
| `out`         | 출력 디렉토리 (기본 `public`) |

## 구조

| 파일 | 내용 |
|------|------|
| `main.rok`      | 설정 읽기, 사양 / 페이지 수집, 페이지 생성, 검색 색인, 정적 파일 복사, 링크 검사 |
| `check.rok`     | 코드 블록 추출과 병렬 컴파일 / 실행 / 출력 비교 |
| `apidoc.rok`    | 표준 라이브러리 소스에서 API 페이지 생성 |
| `markdown.rok`  | CommonMark 부분집합 + GFM 표 / 취소선 / 콜아웃 렌더러, GitHub 호환 헤딩 id |
| `highlight.rok` | ` ```rok ` / ` ```rokon ` 코드 블록 하이라이터 |
| `layout.rok`    | 페이지 틀: 헤더, 내비게이션, 장 사이드바와 목차, 이전 / 다음, 차례, 푸터 |
| `pages/`        | 랜딩 (`index.md`), 안내서 (`learn/`), 예제 (`examples/`) |
| `static/`       | `style.css` (라이트 / 다크), `search.js`, 로고 |

사양 파일은 `x/README.md` → `spec/x/index.html`, `x/foo.md` → `spec/x/foo.html` 로 옮겨지며, 본문의 `.md` 링크는 생성된 `.html` 상대 경로로 바뀝니다. 앵커는 GitHub 와 같은 규칙으로 만들기 때문에 사양의 `#...` 링크가 그대로 맞습니다.

`pages/x.md` 는 `x.html` 이 됩니다. 하위 디렉토리 (`pages/learn/`) 는 하나의 장으로 묶여 사이드바와 이전 / 다음이 붙고, 그 `index.md` 뒤에는 디렉토리의 페이지 차례가 자동으로 붙습니다 (각 페이지 제목과 첫 문단; `examples/` 는 카드). 페이지는 파일 이름 순서입니다.
