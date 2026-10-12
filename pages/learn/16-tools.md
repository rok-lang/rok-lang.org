# 16. 도구

마지막 장에서는 코드를 쓰는 동안 곁에 두는 도구들을 둘러봅니다. 포매터, 린터, 테스트와 벤치마크, 문서 생성, 편집기 지원(LSP), REPL 과 Jupyter, 그리고 컴파일러 안을 들여다보는 디버그 옵션입니다. 모두 `rok` 명령 하나에서 시작합니다.

이 장의 출력은 아래 패키지에서 실제로 실행한 결과입니다. `rok new mathx` 로 만든 뒤 `main.rok` 를 이렇게 바꿨습니다.

```rok build
//! Small math helpers.

/// Greatest common divisor of `a` and `b`.
pub fn gcd(a: i64, b: i64) -> i64 {
    if b == 0 { a } else { gcd(b, a % b) }
}

/// The `n`-th Fibonacci number.
pub fn fib(n: i64) -> i64 {
    if n < 2 { return n; }
    fib(n - 1) + fib(n - 2)
}

println(f"gcd(12, 18) = {gcd(12, 18)}, fib(10) = {fib(10)}");

#[test]
fn gcd_works() {
    assert_eq(gcd(12, 18), 6);
    assert_eq(gcd(7, 0), 7);
}

#[test]
fn fib_works() {
    assert_eq(fib(10), 55);
}

#[test]
fn fib_wrong() {
    assert_eq(fib(5), 6, "deliberately wrong");
}

#[bench]
fn fib_20() {
    fib(20);
}
```

## `rok test`: 테스트

`#[test]` 를 붙인 함수가 테스트입니다. 테스트 함수는 일반 빌드에는 들어가지 않고, `rok test` 가 모아서 따로 빌드합니다. 검사는 `assert`, `assert_eq`, `assert_ne` 로 하고, 실패하면 panic 합니다. 마지막 인자로 메시지를 붙일 수 있습니다.

각 테스트는 자기 프로세스에서 실행되므로, 하나가 panic 해도 나머지는 계속 실행됩니다. 위 패키지의 `fib_wrong` 은 일부러 틀리게 만든 테스트입니다.

```text
$ rok test
   Compiling mathx (.)
    Finished in 0.69s

running 3 tests
test gcd_works ... ok
test fib_works ... ok
test fib_wrong ... FAILED

failures:

---- fib_wrong ----
thread 'main' panicked at main.rok:29:5:
assertion `left == right` failed: deliberately wrong
  left: 5
 right: 6
(panicked (exit 101))

failures:
    fib_wrong

test result: FAILED. 2 passed; 1 failed; 0 filtered out; finished in 0.22s
```

실패가 있으면 종료 코드는 1 이라서 CI 에서 그대로 쓸 수 있습니다. 인자로 이름의 일부(또는 `^`, `$`, `.*` 정도의 작은 정규식)를 주면 그 테스트만 실행합니다.

```text
$ rok test gcd
   Compiling mathx (.)
    Finished in 0.37s

running 1 test
test gcd_works ... ok

test result: ok. 1 passed; 0 failed; 2 filtered out; finished in 0.22s
```

성공한 테스트의 출력도 보려면 `--show-output`, 동시에 도는 테스트 수를 정하려면 `--threads=N` 을 씁니다.

## `rok bench`: 벤치마크

`#[bench]` 함수는 `rok bench` 가 최적화 빌드(`-O2`)로 여러 번 불러 호출 한 번의 평균 시간을 잽니다. 숫자는 기계마다, 실행마다 다릅니다.

```text
$ rok bench
   Compiling mathx (.)
    Finished in 0.42s

running 1 bench
bench fib_20 ... bench:       34,204 ns/iter (+/- 1,712)

bench result: ok. 1 measured; 0 failed; 0 filtered out; finished in 0.36s
```

`--iters=N` 은 표본 하나에서 부르는 횟수, `--samples=N` 은 표본 수입니다. 필터는 `rok test` 와 같습니다.

## `rok fmt`: 포매터

`rok fmt` 는 패키지의 `.rok` 와 `.rokon` 파일을 표준 포맷으로 고칩니다. rok 의 포매터는 일부러 보수적입니다. **줄 안의 토큰과 간격, 주석은 건드리지 않고** 들여쓰기(괄호 깊이마다 4칸), 줄 끝 공백, 연속된 빈 줄만 정리합니다. 그래서 포매터가 코드의 뜻이나 사람이 맞춘 정렬을 바꿀 일이 없습니다.

들여쓰기가 흐트러지고 탭과 줄 끝 공백이 섞인 `fib` 를 `--check` 로 검사하면, 파일은 그대로 두고 바뀔 줄을 보여 준 뒤 종료 코드 1 로 끝납니다. CI 에 넣기 좋은 모드입니다.

```text
$ rok fmt --check
Diff in ./main.rok:
+   10     if n < 2 { return n; }
+   11     let unused = 1;
+   12     fib(n - 1) + fib(n - 2)
-   10   if n < 2 { return n; }
-   11   let unused = 1;
-   12 	fib(n - 1) + fib(n - 2)
$ rok fmt
$ rok fmt --check
$
```

`--check` 없이 실행하면 조용히 파일을 고칩니다. 편집기에서 저장할 때마다 실행해 두면 편합니다.

## `rok lint` 와 `rok check`

`rok lint` 는 컴파일은 하지 않고, 타입 검사와 린트만 돌립니다. 위에서 남겨 둔 `let unused = 1;` 이 걸립니다.

```text
$ rok lint
    Checking mathx (.)
warning: [lint] main.rok:11:5: unused variable `unused`
   |
11 |     let unused = 1;
   |     ^
  note: if this is intentional, prefix it with an underscore: `_unused`
  note: `#[warn(unused_variables)]` on by default
     Checked mathx: 0 errors, 1 warning
    Finished in 0.38s
```

모든 린트의 기본 수준은 `warn` 입니다. 수준은 세 곳에서 바꿀 수 있고, 뒤의 것이 이깁니다.

1. `rok.rokon` 의 `lints` 필드: `lints: { "unused": "deny", "dead_code": "allow" }`
2. 명령줄의 `-A` / `-W` / `-D` (allow / warn / deny)
3. 소스의 속성: 항목에 `#[allow(dead_code)]`, 파일 머리에 `#![deny(unused)]`

이름에는 린트 하나(`unused_variables`) 대신 그룹(`unused`, `nonstandard_style`, `all`)도 쓸 수 있습니다. `deny` 린트가 하나라도 걸리면 종료 코드는 1 입니다.

```text
$ rok lint -D unused
    Checking mathx (.)
error: [lint] main.rok:11:5: unused variable `unused`
   |
11 |     let unused = 1;
   |     ^
  note: if this is intentional, prefix it with an underscore: `_unused`
  note: `-D unused` on the command line
     Checked mathx: 1 error, 0 warnings
    Finished in 0.31s
```

전체 목록은 `rokc lint --list` 로 봅니다. `rok check` 는 여기에 코드 생성까지 더해 확인하지만, 링크나 실행 파일은 만들지 않습니다. 빌드보다 빨라서 "컴파일은 되나?" 를 볼 때 씁니다.

```text
$ rok check
    Checking hello (.)
error: [type] main.rok:2:1: mismatched types: `let s` expects `str`, found `i32`
  |
2 | let s: str = square(7);
  | ^
     Checked hello: 1 error, 0 warnings
    Finished in 0.32s
```

도구에서 읽기 좋게 하려면 `--message-format=json` 을 붙입니다. 진단마다 JSON 한 줄이 나옵니다.

## `rok doc`: 문서 주석과 API 문서

`///` 는 바로 아래 항목의 문서, `//!` 는 그 주석이 든 모듈(파일) 자체의 문서입니다. 위 패키지의 첫 줄 `//! Small math helpers.` 가 모듈 설명이 되고, `gcd` 와 `fib` 위의 `///` 가 함수 설명이 됩니다. 문서 텍스트에는 제목, 목록, 인라인 코드, 코드 블록, 링크 같은 markdown 을 쓸 수 있습니다.

```text
$ rok doc
 Documenting mathx (.)
    Finished in 0.22s
   Generated ./target/doc/index.html
```

`target/doc/` 에 패키지와 의존 패키지의 공개(`pub`) 항목 HTML 과 검색 색인이 생깁니다. 이 사이트의 [표준 라이브러리 API](../std/core/index.html) 도 같은 방식으로 라이브러리 소스의 문서 주석에서 만든 것입니다.

## 편집기: `rokls`

`rokls` 는 LSP (Language Server Protocol) 서버입니다. 진단, hover, 정의로 이동, 문서 심볼, 자동 완성, 포맷을 제공합니다. `rok lsp`, `rokc lsp` 도 같은 서버입니다. 표준 입출력으로 통신하므로, LSP 를 지원하는 편집기라면 실행 명령만 알려 주면 됩니다.

Neovim (0.11 이상) 이라면 `init.lua` 에 다음을 넣습니다.

```text
vim.filetype.add({ extension = { rok = "rok", rokon = "rokon" } })
vim.lsp.config("rokls", {
  cmd = { "rokls" },
  filetypes = { "rok", "rokon" },
  root_markers = { "rok.rokon" },
})
vim.lsp.enable("rokls")
```

Helix 라면 `languages.toml` 에 다음을 넣습니다.

```text
[language-server.rokls]
command = "rokls"

[[language]]
name = "rok"
scope = "source.rok"
file-types = ["rok"]
roots = ["rok.rokon"]
language-servers = ["rokls"]
```

VS Code 처럼 다른 편집기에서도 범용 LSP 클라이언트 확장에 `rokls` 를 등록하면 됩니다. `rokls` 가 `PATH` 에 있어야 합니다.

## REPL 과 Jupyter

1장에서 본 REPL (`rok` 또는 `rok repl`) 을 조금 더 알아봅니다. 셀은 한 번씩 실행되고, 최상위 `let` 과 `fn` / `struct` 정의는 다음 셀로 이어집니다. 식 셀과 `let` 셀은 `타입: 값` 을 보여 줍니다. 일반 소스와 달리 같은 이름을 다시 `let` 할 수 있고, `fn` 을 다시 정의하면 바뀝니다. 에러가 난 셀은 아무 흔적도 남기지 않습니다.

```text
$ rok repl
> let xs = [3, 1, 2];
List<i32>: [3, 1, 2]
> xs.len()
usize: 3
> :type xs
List<i32>
> fn twice(x: i32) -> i32 { x * 2 }
> twice(21)
i32: 42
> :quit
```

| 명령 | 하는 일 |
|------|---------|
| `:type 식` | 실행하지 않고 타입만 출력 |
| `:reset` | 모든 셀을 잊고 처음부터 |
| `:add 이름 --path 경로` | 의존성을 현재 환경에 추가 |
| `:help`, `:quit` | 도움말, 종료 |

`rok repl --package 경로` 는 라이브러리 패키지를 붙이고 `use 이름::*;` 를 넣은 채로 시작합니다. 라이브러리를 만들면서 함수를 바로 불러 보기 좋습니다.

같은 셀 엔진을 Jupyter 노트북에서도 쓸 수 있습니다. 커널을 한 번 등록하면 Jupyter, VS Code 노트북 등에서 `rok` 커널을 고를 수 있습니다.

```text
$ rok jupyter install
   Installed kernel `rok` (/Users/me/Library/Jupyter/kernels/rok/kernel.json)
```

macOS 는 `~/Library/Jupyter`, 그 밖에는 `~/.local/share/jupyter` 아래에 설치되며, `JUPYTER_DATA_DIR` 로 위치를 바꿀 수 있습니다.

## 컴파일러 들여다보기

빌드 단계별 시간이 궁금하면 `-v` 를 붙입니다.

```text
$ rok build -v
   Compiling hello (.)
   Stage: front end (250ms)
    Building ./target/debug/hello
   Stage: codegen + link (160ms)
    Finished in 0.41s
```

`--emit` 은 중간 결과물을 `target/debug/build/` 에 씁니다. 종류는 `ast`, `hir`, `mir`, `mlir`, `llvmir`, `asm`, `obj`, `expanded` (메타 확장 결과) 입니다.

```text
$ rok emit --emit=llvmir
   Compiling hello (.)
       Wrote ./target/debug/build/hello.ll
    Finished in 0.32s
$ grep define target/debug/build/hello.ll | head -2
define i32 @_Y2cfee941__square_(i32 %0) {
define void @_Y2cfee941__main_() {
```

`_Y` 로 시작하는 이름은 rok 의 맹글링된 심볼입니다. 디버거나 프로파일러에서 이런 이름을 만나면 `rokc demangle` 로 풉니다.

```text
$ rokc demangle _Y2cfee941__square_
package:  2cfee941
path:     (root)
name:     square
generics: (none)
```

`-g` 로 빌드하면 DWARF 디버그 정보가 들어가서 `lldb` / `gdb` 에서 소스 줄 단위로 따라갈 수 있습니다.

## 정리

- `rok test` / `rok bench` 는 `#[test]` / `#[bench]` 함수를 따로 빌드해 실행합니다. 테스트마다 프로세스가 따로입니다.
- `rok fmt` 는 들여쓰기와 공백 줄만 정리합니다. CI 에서는 `rok fmt --check`.
- `rok lint` 는 린트, `rok check` 는 코드 생성까지 확인합니다. 수준은 `rok.rokon` < `-A/-W/-D` < 소스 속성 순으로 정해집니다.
- `///` 와 `//!` 문서 주석으로 `rok doc` 이 `target/doc/` 에 HTML 을 만듭니다.
- 편집기에는 `rokls` 를 LSP 서버로 등록합니다.
- REPL 은 `:type` / `:reset` / `:add`, 노트북은 `rok jupyter install`.
- 문제를 파고들 때는 `-v`, `--emit`, `rokc demangle`, `-g`.

## 더 알아보기

- 명세: [rokc CLI](../spec/refs-lang/009-tools/901-rokc-cli.html), [표준 포맷](../spec/refs-lang/009-tools/901-rokc-cli.html#9111-표준-포맷-rokc-fmt), [린트 제어](../spec/refs-lang/006-meta-system/602-built-in-attributes.html#629-allow--deny--warn-린트-제어), [rok front-end](../spec/refs-lang/009-tools/910-rok-frontend.html), [JIT 셀과 REPL](../spec/refs-lang/009-tools/907-jit-cells.html), [Jupyter](../spec/refs-lang/009-tools/908-jupyter-integration.html), [디버그 도구](../spec/refs-lang/009-tools/909-debug-tools.html), [심볼 맹글링](../spec/refs-lang/009-tools/905-symbol-mangling.html)
- API: [rok::core 의 assert 함수들](../std/core/panic.html)
