# 11. 모듈과 패키지

프로그램이 커지면 코드를 나눠 담고, 다른 사람이 만든 라이브러리를 가져다 써야 합니다. rok 에서 코드를 나누는 단위는 **모듈**, 빌드하고 배포하는 단위는 **패키지** 입니다. 레지스트리에 올라간 패키지는 **stone** 이라고 부릅니다.

## `mod` 와 경로

`mod 이름 { .. }` 은 모듈 하나를 그 자리에 정의합니다. 모듈 안의 항목은 `모듈::항목` 경로로 가리키고, 모듈 안에 다시 모듈을 둘 수 있습니다.

```rok
mod geom {
    pub struct Point { pub x: f64; pub y: f64; }

    pub fn origin() -> Point { Point { x: 0.0, y: 0.0 } }

    pub mod dist {
        use sup::Point;

        pub fn manhattan(a: Point, b: Point) -> f64 {
            abs(a.x - b.x) + abs(a.y - b.y)
        }

        fn abs(v: f64) -> f64 { if v < 0.0 { -v } else { v } }
    }
}

let p = geom::Point { x: 3.0, y: -4.0 };
println(f"{geom::dist::manhattan(geom::origin(), p)}");
```

```output
7
```

경로의 첫 단어로 쓸 수 있는 것은 정해져 있습니다.

| 시작     | 뜻                                                  |
|----------|-----------------------------------------------------|
| `pkg::`  | 현재 패키지의 루트부터                              |
| `sup::`  | 부모 모듈부터 (`sup::sup::` 로 더 위로)             |
| `rok::`  | 표준 라이브러리 (`rok::core`, `rok::std`)           |
| 이름     | 현재 모듈의 항목, 자식 모듈, `use` 로 가져온 이름   |

이름을 찾을 때 부모 모듈을 저절로 뒤지지는 않습니다. 그래서 `dist` 안에서 `Point` 를 쓰려면 `use sup::Point;` 처럼 분명히 가져옵니다. 이 덕분에 어떤 이름이 어디서 왔는지 항상 그 파일 안에서 알 수 있습니다.

## `use` 로 가져오기

긴 경로를 매번 쓰는 대신 `use` 로 이름을 가져옵니다. `{..}` 로 여러 개를, `as` 로 다른 이름을, `*` 로 모듈의 공개 항목 전부를 가져올 수 있습니다.

```rok
mod shapes {
    pub fn square(x: i32) -> i32 { x * x }
    pub fn cube(x: i32) -> i32 { x * x * x }
    pub const UNIT: i32 = 1;
}

mod report {
    use pkg::shapes::{square, cube as pow3};

    pub fn show(x: i32) {
        println(f"{x}: {square(x)} {pow3(x)}");
    }
}

use report::show;
use shapes::*;

show(3);
println(f"{cube(UNIT + 1)}");
```

```output
3: 9 27
8
```

`List`, `Dict`, `println` 처럼 지금까지 `use` 없이 쓴 이름은 모든 파일에 암묵적으로 들어 있는 `use rok::core::**;` 덕분입니다. `rok::std` 의 파일, 네트워크, 스레드 같은 모듈은 `use rok::std::fs;` 처럼 가져와 씁니다.

## 가시성

항목은 기본으로 자기 모듈 안에서만 보입니다. 밖에 보이려면 가시성 키워드를 붙입니다.

| 키워드     | 보이는 범위                         |
|------------|-------------------------------------|
| (없음)     | 같은 모듈 안                        |
| `pub(sub)` | 같은 모듈과 그 하위 모듈            |
| `pub(pkg)` | 같은 패키지 안 어디서나             |
| `pub`      | 다른 패키지에서도                   |

struct 의 필드도 따로 공개해야 합니다. 위 `Point` 가 `pub x: f64` 로 필드마다 `pub` 을 붙인 이유입니다. 비공개 항목을 밖에서 쓰면 컴파일러가 어디에 `pub` 을 붙여야 하는지 알려 줍니다.

```rok
mod bank {
    pub struct Account { pub owner: str; balance: i64; }

    pub fn open(owner: str) -> Account { Account { owner: owner, balance: 0 } }

    pub fn deposit(a: Account, amount: i64) -> Account {
        Account { owner: a.owner, balance: a.balance + check(amount) }
    }

    pub fn balance(a: Account) -> i64 { a.balance }

    fn check(amount: i64) -> i64 { if amount < 0 { 0 } else { amount } }
}

let a = bank::deposit(bank::open("kim"), 500);
println(f"{a.owner}: {bank::balance(a)}");
```

```output
kim: 500
```

`balance` 필드와 `check` 함수는 `bank` 밖에서 보이지 않으므로, 잔액은 `bank` 의 함수를 거쳐서만 바뀝니다.

## 파일로 나누기

실제 패키지에서는 모듈을 파일로 나눕니다. `mod shapes;` 처럼 본체 없이 선언하면 같은 디렉토리의 `shapes.rok` 가 그 모듈의 본체가 됩니다. 하위 모듈이 있으면 `shapes.rok` 옆에 같은 이름의 `shapes/` 디렉토리를 둡니다 (`mod.rok` 같은 특별한 파일 이름은 없습니다).

```text
geom/
├── rok.rokon
├── lib.rok          // mod shapes;
├── shapes.rok       // shapes module body, declares mod circle;
└── shapes/
    └── circle.rok   // shapes::circle
```

패키지 루트 모듈은 실행 파일이면 `main.rok`, 라이브러리면 `lib.rok` 입니다. 실행되는 top-level 문은 `main.rok` 에만 둘 수 있고, 다른 모듈에는 항목만 둡니다.

## 패키지와 `rok.rokon`

`rok new` 가 패키지를 만듭니다. `--lib` 를 주면 라이브러리 패키지가 됩니다. 매니페스트 `rok.rokon` 은 [RokON](../spec/refs-standard-libraries/300-std/309-rokon.html) 형식입니다.

```bash
rok new --lib geom
rok new app
```

```text
     Created library package (geom)
     Created executable package (app)
```

`geom` 에 모듈 두 개를 만들어 봅니다. `pub use` 로 하위 모듈의 항목을 패키지 루트에서 다시 내보내면, 쓰는 쪽은 내부 구조를 몰라도 됩니다.

```rok norun
// geom/lib.rok
mod shapes;

pub use shapes::Circle;

pub(pkg) const PI: f64 = 3.14159;

pub fn area_sum(cs: List<Circle>) -> f64 {
    cs.iter().map(|c| c.area()).sum()
}
```

```rok norun
// geom/shapes.rok
pub struct Circle { pub r: f64; }

impl Circle {
    pub fn area(self) -> f64 { sup::PI * self.r * self.r }
}
```

`app` 에서 `rok add` 로 의존성을 더하면 `rok.rokon` 의 `deps` 에 들어갑니다. 의존 패키지의 이름이 곧 최상위 경로입니다 (`-` 는 `_` 로 바뀝니다).

```bash
cd app
rok add geom --path ../geom
```

```rokon
Package { name: "app", version: "0.1.0", deps: {
    "geom": Dep::path("../geom"),
} }
```

```rok norun
// app/main.rok
use geom::{Circle, area_sum};

println(f"{area_sum([Circle { r: 1.0 }, Circle { r: 2.0 }])}");
```

```text
$ rok run
   Compiling geom (../geom)
   Compiling app (.)
    Finished in 1.97s
     Running `./target/debug/app`
15.70795
```

`PI` 는 `pub(pkg)` 라서 `geom` 안에서는 어디서나 쓰지만 `app` 에서는 보이지 않습니다. git 저장소는 `rok add parser --git <url> --tag v1.2` 처럼 더합니다. git 과 stone 의존은 정확한 커밋이 `rok.lock` 에 고정되므로, `rok.lock` 도 버전 관리에 함께 넣습니다. 고정된 버전을 올리는 것은 `rok update` 뿐입니다.

## stone 과 rokstones.io

레지스트리의 패키지를 stone 이라 하고, 기본 레지스트리는 [rokstones.io](https://rokstones.io) 입니다. 이름으로 찾고, 버전 요구와 함께 더합니다. 버전 요구는 Cargo 와 같아서 `^1.2` 는 `>=1.2.0, <2.0.0` 입니다. 요구를 생략하면 가장 새 버전에 `^` 를 붙여 적습니다.

```text
$ rok search textwrap
    Updating index https://github.com/rok-lang/rokstones.io-index
textwrap = "1.2.0"
$ rok add textwrap@^1.2
       Added textwrap to deps of rok.rokon
```

```rokon
Package { name: "app", version: "0.1.0", deps: {
    "textwrap": Dep::version("^1.2"),
} }
```

내 라이브러리를 올릴 때는 `rok publish` 를 씁니다. 기본은 무엇을 올릴지 보여 주기만 하는 dry run 이고, 깨끗한 git 저장소의 루트에 있는 `lib.rok` 패키지여야 합니다. path / git 의존이 있으면 올릴 수 없습니다.

```bash
rok publish             # dry run: prints the index entry
rok publish --commit    # adds it to the index checkout
```

## 단일 파일 스크립트와 환경

패키지를 만들 것도 없는 작은 스크립트는 파일 맨 앞 `//!` 주석 안에 ```` ```rokon ```` 블록으로 의존성을 적습니다. 경로는 스크립트 파일 기준이고, lockfile 은 캐시에 둡니다.

````rok norun
//! ```rokon
//! Package {
//!     deps: { "geom": Dep::path("../geom") },
//! }
//! ```

use geom::{Circle, area_sum};
println(f"{area_sum([Circle { r: 1.0 }])}");
````

```bash
rok run tool.rok
```

여러 스크립트나 REPL 에서 같은 의존성 묶음을 쓰고 싶다면 이름 있는 환경을 만듭니다. 활성화 단계 없이 `--env` 로 고르거나 `rok env use` 로 기본을 바꿉니다.

```text
$ rok env create sci
     Created environment `sci` (~/.rok/envs/sci)
$ rok add geom --path ~/work/geom --env sci
$ rok --env sci run plot.rok
$ rok env use sci
$ rok env list
* sci
```

`rok.rokon` 이 있는 디렉토리는 그 자체가 환경이므로, 패키지 안에서는 따로 고를 필요가 없습니다.

## 정리

- `mod` 로 모듈을 만들고, `pkg::` / `sup::` / `rok::` 경로와 `use` 로 이름을 가리킵니다.
- 항목은 기본 비공개입니다. `pub(sub)`, `pub(pkg)`, `pub` 으로 범위를 넓힙니다.
- `mod x;` 는 `x.rok` (와 `x/`) 에 매핑됩니다. 루트는 `main.rok` 또는 `lib.rok` 입니다.
- `rok new [--lib]` 로 패키지를, `rok add` 로 의존성 (path, git, stone) 을 더합니다. `rok.lock` 은 커밋합니다.
- stone 은 rokstones.io 에서 `rok search` / `rok add name@^1.2` / `rok publish` 로 다룹니다.
- 스크립트는 `//! ```rokon` 매니페스트로, 공유 의존성은 `rok env` 로 다룹니다.

## 더 알아보기

- 사양: [모듈](../spec/refs-lang/005-modules/504-modules.html), [`use`](../spec/refs-lang/005-modules/505-use.html), [가시성](../spec/refs-lang/005-modules/506-visibility.html), [경로](../spec/refs-lang/005-modules/507-paths.html), [재내보내기](../spec/refs-lang/005-modules/508-re-export.html)
- 도구: [`rok` front-end](../spec/refs-lang/009-tools/910-rok-frontend.html), [`rok.rokon` / `rok.lock`](../spec/refs-lang/009-tools/910-rok-frontend.html#9103-rokrokon--roklock), [stone 과 rokstones.io](../spec/refs-lang/009-tools/910-rok-frontend.html#9104a-stone-과-rokstonesio), [환경](../spec/refs-lang/009-tools/910-rok-frontend.html#9105-환경), [inline 매니페스트](../spec/refs-lang/009-tools/910-rok-frontend.html#9107-단일-파일-스크립트의-inline-매니페스트)
- [1. 시작하기](01-getting-started.html)
