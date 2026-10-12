# 1. 시작하기

이 장에서는 rok 툴체인을 설치하고, 첫 패키지를 만들어 실행하고, 파일 하나짜리 스크립트와 REPL 까지 써 봅니다. 끝나면 이후 장의 예제를 직접 돌려 볼 수 있습니다.

## 설치

### 준비물

`rokc` 는 MLIR 을 텍스트로 내보내고 LLVM 의 `mlir-opt`, `mlir-translate`, `clang` 으로 네이티브 코드를 만듭니다 ([파이프라인](../spec/refs-lang/000-meta/002-pipeline.html)). LLVM 21 과 22 를 지원합니다.

- macOS: `brew install llvm@21` 과 Xcode Command Line Tools (`xcode-select --install`). `rokc` 가 Homebrew 위치 (`/opt/homebrew/opt/llvm@21/bin`) 를 직접 찾으므로 `PATH` 는 그대로 둡니다. 최종 링크는 Xcode 의 clang 이 합니다.
- Debian / Ubuntu: [apt.llvm.org](https://apt.llvm.org) 의 `mlir-21-tools`, `clang-21` (`/usr/lib/llvm-21/bin` 을 찾습니다).
- 다른 곳에 설치했다면 그 `bin/` 을 `PATH` 의 **뒤에** 더합니다. 앞에 두면 시스템 `clang` 을 가립니다: `export PATH="$PATH:/path/to/llvm/bin"`.

### 설치 스크립트

설치 스크립트는 툴체인을 `~/.rok` 에 풉니다. 릴리스가 나오면 한 줄로 설치합니다.

```bash
curl -fsSL https://rok-lang.org/install.sh | sh
```

> [!NOTE]
> 아직 배포 릴리스가 없습니다. 지금은 소스에서 툴체인 archive 를 만들어 같은 스크립트로 설치합니다. Rust 툴체인 (`rustup`) 이 필요합니다.
>
> ```bash
> cd rok-lang/impl
> ./dist.sh                                  # dist/rok-<version>-<triple>.tar.gz
> sh install.sh --archive dist/rok-*.tar.gz  # into ~/.rok
> ```

설치 위치는 환경 변수 `ROK_HOME` 으로 바꿀 수 있습니다 (기본값 `~/.rok`). 스크립트가 끝나면 다음과 같은 구조가 생깁니다.

```text
~/.rok/
├── bin/                        # rok, rokc, rokls proxy
└── toolchains/
    └── 0.1.0-aarch64-apple-darwin/
        ├── bin/{rok, rokc, rokls}
        └── lib/                # runtime and standard library sources
```

방금 설치한 툴체인이 기본값이 됩니다. `~/.rok/bin` 의 세 실행 파일은 **proxy** 입니다. 실제 일은 활성 툴체인의 같은 이름 실행 파일이 합니다. 그래서 툴체인을 여러 개 설치해 두고 골라 쓸 수 있습니다 (rustup 과 같은 방식). 이 디렉토리를 `PATH` 에 넣습니다.

```bash
# bash / zsh
echo 'export PATH="$HOME/.rok/bin:$PATH"' >> ~/.zshrc
# fish
fish_add_path ~/.rok/bin
```

새 셸에서 버전을 확인합니다.

```bash
rok --version
rok toolchain list
```

설치되는 실행 파일은 셋입니다.

| 실행 파일 | 하는 일 |
|-----------|---------|
| `rokc`    | 컴파일러. 빌드, 실행, 테스트, 포맷 ([9.1](../spec/refs-lang/009-tools/901-rokc-cli.html)) |
| `rok`     | 패키지 / 빌드 front-end. `rok.rokon`, 의존성, 환경, REPL, Jupyter ([9.10](../spec/refs-lang/009-tools/910-rok-frontend.html)) |
| `rokls`   | 언어 서버 (LSP) |

### 툴체인 관리

`rok toolchain` 이 설치된 툴체인을 관리합니다. 활성 툴체인은 명령줄의 `+버전` (`rok +0.1 build`), 환경 변수 `ROK_TOOLCHAIN`, 가장 가까운 `rok.rokon` 의 `toolchain` 필드, 그리고 기본값 순서로 정해집니다.

```bash
rok toolchain list                     # installed toolchains
rok toolchain default 0.1.0            # change the default
rok toolchain install 0.2.0 --from rok-0.2.0-aarch64-apple-darwin.tar.gz
```

### 소스 트리에서 바로 쓰기

컴파일러를 고치는 중이라면 설치 없이 빌드 결과를 바로 써도 됩니다.

```bash
cd rok-lang/impl
cargo build --release
export PATH="$PWD/target/release:$PATH"
```

## 첫 패키지

`rok new` 가 패키지 디렉토리를 만들고, `target/` 을 빼는 `.gitignore` 와 함께 git 저장소를 초기화합니다. 패키지 이름은 소문자, 숫자, `-`, `_` 로 쓰고 글자로 시작합니다. 코드에서는 `-` 를 `_` 로 바꿔 부릅니다 (`rok new my-lib` 는 `use my_lib::..`).

```bash
rok new hello
cd hello
```

```text
     Created executable package (hello)
```

소스 파일은 두 개입니다. 매니페스트 `rok.rokon` 은 패키지 이름과 버전, 의존성을 담습니다.

```rokon
Package { name: "hello", version: "0.1.0", deps: {} }
```

`main.rok` 는 인사말을 출력하는 한 줄입니다.

```rok
println("Hello, world!");
```

```output
Hello, world!
```

`rok run` 이 빌드하고 실행합니다. 결과물은 `target/debug/` 에 생깁니다.

```bash
rok run
```

```text
   Compiling hello (.)
    Finished in 1.55s
     Running `./target/debug/hello`
Hello, world!
```

`main.rok` 의 최상위 문장은 위에서 아래로 실행되어 그대로 프로그램이 됩니다. 함수나 타입 선언은 최상위 문장 사이 어디에 두어도 됩니다. 자주 쓰는 다른 명령은 `rok build` (빌드만), `rok check` (타입 검사만), `rok test`, `rok fmt` 입니다.

## 조금 더 큰 프로그램

`main.rok` 를 다음처럼 바꾸고 다시 `rok run` 을 실행해 봅니다.

```rok
let names = ["ada", "grace", "linus"];
for name in names {
    greet(name);
}
println(f"{names.len()} people greeted");

fn greet(name: str) {
    println(f"Hello, {name}!");
}
```

```output
Hello, ada!
Hello, grace!
Hello, linus!
3 people greeted
```

`f"..."` 는 형식 문자열입니다. `{}` 안의 식을 계산해 그 자리에 넣습니다. `greet` 는 사용하는 곳보다 아래에 선언되어 있지만 문제없이 호출됩니다. 함수 같은 선언은 순서와 무관하게 보이기 때문입니다.

최상위 문장 대신 `fn main()` 을 진입점으로 쓸 수도 있습니다. 둘 중 하나만 쓰면 됩니다.

```rok
fn main() {
    let total = add(2, 3);
    println(f"2 + 3 = {total}");
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```output
2 + 3 = 5
```

## 파일 하나짜리 스크립트

간단한 실험에는 패키지가 필요 없습니다. `rok run` 에 파일 경로를 주면 그 파일만으로 실행합니다.

```bash
echo 'println("hi");' > hi.rok
rok run hi.rok
```

```text
   Compiling hi (.)
    Finished in 1.52s
     Running `/tmp/rokc-.../hi`
hi
```

스크립트도 의존성을 쓸 수 있습니다. 파일 맨 앞의 `//!` 주석에 매니페스트를 적는 방법은 [inline 매니페스트](../spec/refs-lang/009-tools/910-rok-frontend.html) 를 보세요.

## REPL

인자 없이 `rok` 을 실행하면 REPL 이 열립니다. 식이나 `let` 을 입력하면 값과 타입을 보여 줍니다.

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

`:type 식` 은 식을 실행하지 않고 타입만 알려 줍니다. 이 튜토리얼을 읽다가 타입이 궁금해지면 REPL 에서 바로 확인해 보세요. REPL 에서는 같은 이름을 `let` 으로 다시 선언할 수 있다는 점이 일반 소스와 다릅니다 ([JIT 셀](../spec/refs-lang/009-tools/907-jit-cells.html)).

## 정리

- `curl -fsSL https://rok-lang.org/install.sh | sh` 로 `~/.rok` 에 설치하고 `~/.rok/bin` 을 `PATH` 에 넣습니다.
- `rok new 이름` 은 `rok.rokon` 과 `main.rok` 를 만들고, `rok run` 은 빌드 후 실행합니다.
- `main.rok` 의 최상위 문장이 곧 프로그램입니다. `fn main()` 을 써도 됩니다.
- `rok run 파일.rok` 으로 스크립트를, `rok` 만으로 REPL 을 실행합니다.

다음 장 [2. 값과 타입](02-values-and-types.html) 에서 변수와 기본 타입을 다룹니다.

## 더 알아보기

- [설치 레이아웃](../spec/refs-lang/009-tools/902-aot-pipeline.html#9219-설치-레이아웃), [toolchain 고정](../spec/refs-lang/009-tools/910-rok-frontend.html#9106-toolchain)
- [`rok` front-end](../spec/refs-lang/009-tools/910-rok-frontend.html), [`rokc` CLI](../spec/refs-lang/009-tools/901-rokc-cli.html)
- [진입점](../spec/refs-lang/004-functions/416-entry-point.html)
- [JIT 셀과 REPL](../spec/refs-lang/009-tools/907-jit-cells.html)
