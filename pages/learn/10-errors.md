# 10. 에러 처리

파일이 없거나 입력이 잘못된 것처럼 실패할 수 있는 일은 어디에나 있습니다. rok 의 에러 모델은 하나입니다. 던질 수 있는 함수는 시그니처에 `throws` 를 적고, 부르는 쪽은 그 호출을 `try` 로 표시합니다. 그래서 에러가 흐를 수 있는 지점이 코드에 모두 드러납니다.

## `throws` 와 `throw`

함수가 던질 수 있는 에러 타입은 매개변수 괄호 뒤, 반환 타입 앞에 `throws (E)` 로 적습니다. 여러 종류면 합 타입 `throws (A | B)` 를 씁니다. 본체에서는 `throw` 로 에러 값을 던집니다.

에러 타입은 보통 struct 나 enum 이고, `Display` 와 `Debug` 를 갖춘 뒤 `Error` 트레잇을 구현합니다.

```rok
#[derive(Debug)]
struct NegativeError { value: i32; }

impl Display for NegativeError {
    fn fmt(self, ref f: Formatter) throws (FmtError) {
        try f.write_str(f"negative value: {self.value}");
    }
}

impl Error for NegativeError {}

fn double(n: i32) throws (NegativeError) -> i32 {
    if n < 0 { throw NegativeError { value: n }; }
    n * 2
}

fn main() {
    let a = try double(21) catch _ { 0 };
    let b = try double(-5) catch e { println(f"error: {e}"); 0 };
    println(f"{a} {b}");
}
```

```output
error: negative value: -5
42 0
```

`throws` 없는 함수 밖으로는 에러가 나갈 수 없습니다. 위의 `main` 은 `throws` 가 아니므로 두 호출 모두 그 자리에서 `catch` 로 처리했습니다.

## `try`: 호출 지점 표시와 전파

`throws` 함수를 부를 때는 반드시 `try` 를 붙입니다. 에러가 나면 가장 가까운 `catch` 로 가고, 없으면 둘러싼 함수로 전파됩니다. 이때 둘러싼 함수도 그 에러를 `throws` 해야 합니다.

```rok
#[derive(Debug)]
struct TooBig { limit: i32; }

impl Display for TooBig {
    fn fmt(self, ref f: Formatter) throws (FmtError) {
        try f.write_str(f"over the limit {self.limit}");
    }
}

impl Error for TooBig {}

fn check(n: i32) throws (TooBig) -> i32 {
    if n > 100 { throw TooBig { limit: 100 }; }
    n
}

fn total(xs: List<i32>) throws (TooBig) -> i32 {
    let sum = 0;
    for x in xs {
        sum += try check(x);
    }
    sum
}

fn main() {
    println(f"{try total([1, 2, 3]) catch _ { -1 }}");
    println(f"{try total([1, 500, 3]) catch e { println(f"{e:?}"); -1 }}");
}
```

```output
6
TooBig { limit: 100 }
-1
```

`try` 는 오른쪽 식 전체를 덮습니다. `try a(b())` 는 두 호출을 함께 표시하고, `try { .. }` 는 블록 안의 호출을 모두 덮습니다. 프로그램의 top-level 문은 암묵적으로 `throws` 인 `main` 이라서, 스크립트에서는 `try` 만 붙여도 에러가 프로그램 밖으로 나가 종료 코드 1 로 끝납니다.

## `try?` 와 `try!`

에러를 전파하지 않고 그 자리에서 다른 형태로 바꾸는 두 변형이 있습니다.

| 형태     | 에러가 나면                 |
|----------|-----------------------------|
| `try e`  | 가장 가까운 `catch` 또는 전파 |
| `try? e` | 에러를 버리고 `none`        |
| `try! e` | panic (프로그램 버그로 취급) |

```rok
fn parse_port(s: str) -> i32 {
    (try? s.parse::<i32>()) ?? 8080
}

println(f"{parse_port("3000")} {parse_port("abc")}");
let n: i32 = try! "42".parse();
println(f"{n}");
```

```output
3000 8080
42
```

`try?` 결과에 `??` 를 이으려면 위처럼 괄호로 범위를 닫습니다. `try!` 는 "여기서 실패하면 버그" 라고 확신할 때만 씁니다.

## `catch`: 패턴으로 골라 받기

`catch` 는 식 뒤에 붙는 후위 절입니다. 위에서부터 차례로 패턴을 검사해 처음 맞는 블록을 실행하고, 그 블록의 값이 식 전체의 값이 됩니다. `e: T` 는 타입으로 골라 받는 패턴이며, 그 가지 안에서 `e` 는 그 타입으로 좁혀집니다.

```rok
#[derive(Debug)]
struct NotFound { key: str; }
impl Display for NotFound {
    fn fmt(self, ref f: Formatter) throws (FmtError) { try f.write_str(f"no key {self.key}"); }
}
impl Error for NotFound {}

#[derive(Debug)]
struct Invalid { reason: str; }
impl Display for Invalid {
    fn fmt(self, ref f: Formatter) throws (FmtError) { try f.write_str(self.reason); }
}
impl Error for Invalid {}

fn lookup(key: str) throws (NotFound | Invalid) -> i32 {
    if key == "" { throw Invalid { reason: "empty key" }; }
    if key != "a" { throw NotFound { key: key }; }
    1
}

fn describe(key: str) -> str {
    try f"found {lookup(key)}"
    catch e: NotFound { f"missing: {e.key}" }
    catch e: Invalid { f"invalid: {e}" }
}

fn main() {
    for k in ["a", "b", ""] {
        println(describe(k));
    }
}
```

```output
found 1
missing: b
invalid: empty key
```

`catch` 뒤에는 어떤 패턴이든 올 수 있으므로, struct 패턴으로 필드를 바로 꺼내는 것도 사양상 가능합니다.

```rok norun
try lookup(key)
catch NotFound { key } { println(f"missing: {key}"); 0 }
```

> [!NOTE]
> `catch` 의 struct 패턴은 현재 툴체인에서 아직 파싱되지 않습니다. 지금은 위 예처럼 `e: NotFound` 로 받아 `e.key` 를 씁니다.

`lookup` 은 에러 종류가 `NotFound | Invalid` 로 닫혀 있으므로, 두 타입을 모두 덮은 `describe` 는 더 이상 던지지 않는 함수가 됩니다. 컴파일러가 이것을 검사합니다.

`throws (E)` 대신 타입 없이 `throws` 라고만 쓰면 `Error` 를 구현한 어떤 에러든 던질 수 있습니다 (`throws (any Error)` 의 줄임). 공개 API 처럼 에러 종류를 닫아 두기 어려울 때 씁니다. 받는 쪽은 `catch e` 나 `catch e: any Error` 로 모두 받습니다.

```rok
fn read_age(s: str) throws -> i32 {
    let n: i32 = try s.parse();
    if n < 0 { throw ValueError { msg: f"age {n} is negative" }; }
    n
}

for s in ["30", "x", "-1"] {
    let age = try read_age(s) catch e: any Error { println(f"  {e}"); -1 };
    println(f"{s} -> {age}");
}
```

```output
30 -> 30
  cannot parse "x": invalid digit
x -> -1
  age -1 is negative
-1 -> -1
```

> [!NOTE]
> 사양 ([4.14.3](../spec/refs-lang/004-functions/414-throws.html#4143-untyped-throws)) 은 untyped `throws` 의 에러도 `catch e: ValueError` 처럼 구체 타입으로 좁혀 받을 수 있다고 정합니다. 현재 툴체인에서는 이 가지가 실행되지 않으므로, 지금은 `catch e` 로 받아 처리하세요.

## 블록 형태와 `finally`

여러 단계를 한 번에 감싸려면 `try { .. } catch .. { .. }` 형태를 씁니다. `finally` 블록은 정상 종료, 에러, `return` 등 어떻게 빠져나가든 마지막에 실행됩니다.

```rok
fn half(n: i32) throws -> i32 {
    if n % 2 != 0 { throw ValueError { msg: f"{n} is odd" }; }
    n / 2
}

for input in [8, 6] {
    let r = try {
        let a = try half(input);
        let b = try half(a);
        a + b
    } catch e {
        println(f"failed: {e}");
        0
    } finally {
        println(f"done with {input}");
    };
    println(f"result {r}");
}
```

```output
done with 8
result 6
failed: 3 is odd
done with 6
result 0
```

## `rethrows`: 받은 함수만큼만 던지기

함수를 인자로 받는 고차 함수는 `rethrows` 로 선언할 수 있습니다. 넘긴 함수가 던지지 않으면 호출에 `try` 가 필요 없고, 던지는 함수를 넘길 때만 `try` 를 붙입니다.

```rok
fn apply_all(xs: List<i32>, f: fn(i32) throws -> i32) rethrows -> List<i32> {
    let out: List<i32> = [];
    for x in xs { out.push(try f(x)); }
    out
}

fn half(n: i32) throws -> i32 {
    if n % 2 != 0 { throw ValueError { msg: f"{n} is odd" }; }
    n / 2
}

let doubled = apply_all([1, 2, 3], |x| x * 2);
println(f"{doubled:?}");
let halves = try apply_all([2, 4], half) catch _ { [] };
println(f"{halves:?}");
let bad = try apply_all([2, 3], half) catch e { println(f"{e}"); [] };
println(f"{bad:?}");
```

```output
[2, 4, 6]
[1, 2]
3 is odd
[]
```

## `using`: 자원 정리

GC 가 메모리는 회수하지만 파일, 소켓, 락 같은 자원은 정해진 시점에 닫아야 합니다. `using x = 획득식 { .. }` 은 블록을 어떻게 빠져나가든 (정상, `return`, 에러 전파) `x` 의 `Drop::drop` 을 부릅니다. 여러 자원은 쉼표로 잇고, 거꾸로 된 순서로 정리됩니다.

```rok
struct Conn { name: str; }

impl Drop for Conn {
    fn drop(ref self) { println(f"close {self.name}"); }
}

fn open(name: str) -> Conn {
    println(f"open {name}");
    Conn { name: name }
}

fn work() throws -> i32 {
    using a = open("db"), b = open("cache") {
        println("working");
        throw ValueError { msg: "query failed" };
    }
}

try work() catch e { println(f"work failed: {e}"); };
```

```output
open db
open cache
working
close cache
close db
work failed: query failed
```

`using` 은 식이라서 `let text = using f = try fs::open(path) { try f.read_to_end() };` 처럼 값을 돌려줄 수도 있습니다. 일반 `let` 바인딩은 스코프를 벗어나도 `drop` 되지 않는다는 점을 기억하세요. 결정적인 정리가 필요하면 `using` 을 씁니다.

## 에러와 panic

`throws` 의 에러는 "일어날 수 있는 실패" 입니다. 반면 범위를 벗어난 인덱스, 0 으로 나누기, `try!` 의 실패, `panic(..)` 호출은 **panic** 이며 프로그램 버그로 봅니다. panic 은 `catch` 로 잡을 수 없고, 메시지를 stderr 에 쓰고 종료 코드 101 로 끝납니다. `finally` 와 `using` 의 정리도 실행되지 않습니다.

```rok build
let xs = [1, 2, 3];
let i = 7;
println(f"{xs[i]}");
```

```text
thread 'main' panicked at main.rok:3:12:
List index out of bounds
```

에러를 값으로 담아 두어야 할 때 (여러 결과를 모아 두거나 나중에 처리할 때) 만 `Result<T, E>` 를 씁니다. 규칙은 "던지면 `throws`, 담아 두면 `Result`" 입니다.

```rok
fn half(n: i32) throws -> i32 {
    if n % 2 != 0 { throw ValueError { msg: f"{n} is odd" }; }
    n / 2
}

for n in [4, 5] {
    let r = Result::catching(|| try half(n));
    println(f"{n}: ok={r.is_ok()} value={r.unwrap_or(-1)}");
}
```

```output
4: ok=true value=2
5: ok=false value=-1
```

## 정리

- 던질 수 있는 함수는 `throws (E)` (또는 `throws`) 를 적고 `throw` 로 던집니다.
- 호출은 `try` 로 표시합니다. 잡지 않은 에러는 둘러싼 함수로 전파됩니다.
- `try?` 는 에러를 `none` 으로, `try!` 는 panic 으로 바꿉니다.
- `catch` 는 패턴으로 골라 받는 식이고, `finally` 는 언제나 실행됩니다.
- `rethrows` 는 받은 함수가 던질 때만 던집니다.
- 자원은 `using` 으로 묶으면 어떻게 빠져나가든 정리됩니다.
- panic 은 잡을 수 없는 버그 신호입니다. 에러를 값으로 담아야 할 때만 `Result` 를 씁니다.

## 더 알아보기

- 사양: [에러 제어 흐름](../spec/refs-lang/003-expressions/314-error-control-flow.html), [`throws` 시그니처](../spec/refs-lang/004-functions/414-throws.html), [`using` 표현식](../spec/refs-lang/003-expressions/317-using-expression.html), [panic 과 fatal 에러](../spec/refs-lang/003-expressions/314-error-control-flow.html#3148-panic-과-fatal-에러)
- 표준 라이브러리 사양: [error](../spec/refs-standard-libraries/200-core/214-error.html)
- API: [`Error`](../std/core/error.html#trait.Error), [`ValueError`](../std/core/error.html#struct.ValueError), [`Result`](../std/core/error.html#enum.Result), [`Drop`](../std/core/marker.html#trait.Drop)
