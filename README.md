# rok-lang.org

rok 언어 문서 사이트입니다. 사이트 생성기 자체도 rok 으로 작성했습니다. 사양 저장소의 한국어 마크다운 (`spec/ko`) 을 읽어 언어 참조와 표준 라이브러리 참조를 만들고, 이 저장소의 `pages/` 에 있는 랜딩 / 시작하기 페이지를 더해 `public/` 에 정적 사이트를 씁니다.

## 빌드

준비물은 rok 툴체인 (`rok`, `rokc`) 과 사양 저장소입니다. 기본 설정은 두 저장소가 나란히 있다고 가정합니다.

```
Works/
├── rok-lang/          # impl/ (툴체인), spec/ko/ (사양)
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
rok run              # public/ 에 사이트 생성
rok run -- check     # 생성 + 깨진 내부 링크가 있으면 종료 코드 1
rok test             # 마크다운 렌더러 테스트
```

빌드가 끝나면 페이지 수, 깨진 링크 수, 걸린 시간을 출력합니다. 링크 검사는 매번 생성된 HTML 을 다시 읽어 모든 `href` / `src` 의 대상 파일과 `#앵커` 가 있는지 확인합니다.

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
| `packages`    | 패키지 사이트 주소 (`https://packages.rok-lang.org`) |
| `out`         | 출력 디렉토리 (기본 `public`) |

## 구조

| 파일 | 내용 |
|------|------|
| `main.rok`      | 설정 읽기, 사양 수집, 페이지 생성, 검색 색인, 정적 파일 복사, 링크 검사 |
| `markdown.rok`  | CommonMark 부분집합 + GFM 표 / 취소선 / 콜아웃 렌더러, GitHub 호환 헤딩 id |
| `highlight.rok` | ` ```rok ` / ` ```rokon ` 코드 블록 하이라이터 |
| `layout.rok`    | 페이지 틀: 헤더, 내비게이션, 장 사이드바와 목차, 이전 / 다음, 푸터 |
| `pages/`        | 랜딩 (`index.md`), 시작하기 (`start.md`) |
| `static/`       | `style.css` (라이트 / 다크), `search.js`, 로고 |

사양 파일은 `x/README.md` → `spec/x/index.html`, `x/foo.md` → `spec/x/foo.html` 로 옮겨지며, 본문의 `.md` 링크는 생성된 `.html` 상대 경로로 바뀝니다. 앵커는 GitHub 와 같은 규칙으로 만들기 때문에 사양의 `#...` 링크가 그대로 맞습니다.
