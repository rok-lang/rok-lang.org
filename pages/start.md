# 시작하기

rok 툴체인을 설치하고, 패키지를 만들어 실행하고, REPL 과 Jupyter 에서 코드를 시험해 봅니다.

> [!NOTE]
> rok 은 아직 활발히 개발 중입니다. 배포 패키지가 없으므로 지금은 소스에서 빌드합니다.

## 툴체인 설치

### 준비물

- Rust 툴체인 (`rustup`). 저장소의 `rust-toolchain.toml` 이 버전을 고정합니다.
- LLVM / MLIR 도구: `mlir-opt`, `mlir-translate`, `clang`. `rokc` 는 MLIR 을 텍스트로 내보내고 이 도구들로 네이티브 코드를 만듭니다 ([파이프라인](spec/refs-lang/000-meta/002-pipeline.html)). macOS 에서는 `brew install llvm` 으로 설치하고 `PATH` 에 넣습니다.

### 빌드

```bash
cd rok-lang/impl
cargo build --release
export PATH="$PWD/target/release:$PATH"
```

빌드가 끝나면 세 실행 파일이 생깁니다.

| 실행 파일 | 하는 일 |
|-----------|---------|
| `rokc`    | 컴파일러. 빌드, 실행, 테스트, 포맷 ([9.1](spec/refs-lang/009-tools/901-rokc-cli.html)) |
| `rok`     | 패키지 / 빌드 front-end. `rok.rokon`, 의존성, 환경, REPL, Jupyter ([9.10](spec/refs-lang/009-tools/910-rok-frontend.html)) |
| `rokls`   | 언어 서버 (LSP) |

## 첫 패키지

`rok new` 가 패키지 디렉토리와 `rok.rokon` 매니페스트, 인사말을 출력하는 `main.rok` 를 만듭니다.

```bash
rok new hello
cd hello
rok run
```

```text
   Compiling hello (.)
    Finished in 0.82s
     Running `./target/debug/hello`
Hello, world!
```

만들어진 파일은 두 개입니다.

```rokon
Package {
    name: "hello",
    version: "0.1.0",
    deps: {},
}
```

```rok
println("Hello, world!");
```

`main.rok` 의 최상위 문장은 그대로 프로그램이 됩니다. 함수와 타입을 두려면 `fn main()` 을 씁니다 ([진입점](spec/refs-lang/004-functions/416-entry-point.html)).

### 자주 쓰는 명령

| 명령 | 하는 일 |
|------|---------|
| `rok run [-- args]`        | 빌드하고 실행 |
| `rok build` / `rok check`  | 빌드만 / 타입 검사만 |
| `rok test`                 | `#[test]` 함수 실행 |
| `rok fmt`                  | `.rok` / `.rokon` 포맷 |
| `rok new --lib <name>`     | 라이브러리 패키지 (`lib.rok`) |
| `rok add <name> --path <dir>` | 경로 의존성 추가 (`--git <url>` 도 가능) |
| `rok doc`                  | HTML 문서를 `target/doc/` 에 생성 |

파일 하나짜리 스크립트는 패키지 없이 바로 실행할 수 있습니다.

```bash
echo 'println("hi");' > hi.rok
rok run hi.rok
```

## REPL

인자 없이 `rok` 을 실행하면 REPL 이 열립니다. 식을 입력하면 값과 타입을 보여 줍니다.

```text
$ rok
> let xs = [1, 2, 3];
List<i32>: [1, 2, 3]
> xs.len() * 2
usize: 6
> :type xs
List<i32>
> :quit
```

| 명령 | 하는 일 |
|------|---------|
| `:type <식>`    | 식의 타입 (실행하지 않음) |
| `:reset`        | 세션을 처음 상태로 |
| `:add <dep>`    | 현재 환경에 의존성을 추가하고 세션에 붙임 |
| `:help`, `:quit` | 도움말, 종료 |

셀 단위 실행과 재선언 규칙은 [JIT 셀](spec/refs-lang/009-tools/907-jit-cells.html) 에 있습니다.

## Jupyter

`rok jupyter install` 이 Jupyter kernelspec 을 설치합니다. 이후 Jupyter, VS Code 등에서 `rok` 커널을 고르면 됩니다.

```bash
rok jupyter install --user
jupyter lab
```

커널 동작과 설치 위치는 [Jupyter 커널 통합](spec/refs-lang/009-tools/908-jupyter-integration.html) 을 보세요.

## 다음 단계

- [언어 참조](spec/refs-lang/index.html) — 0장부터 차례로 읽도록 짜여 있습니다.
- [표준 라이브러리](spec/refs-standard-libraries/index.html) — `bare` / `core` / `std` 계층.
- [도구](spec/refs-lang/009-tools/index.html) — `rokc`, `rok`, JIT, 디버그 도구.
- [패키지](https://packages.rok-lang.org) — rok 패키지 저장소 (준비 중).
