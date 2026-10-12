# 3. 함수

이 장에서는 함수를 선언하고 부르는 방법, 기본값과 이름 있는 인자, 그리고 값처럼 주고받는 클로저를 다룹니다. rok 에서는 함수 본체도 블록 식이라서, 마지막 식이 곧 반환값이 됩니다.

## 선언과 반환값

`fn 이름(매개변수: 타입, ...) -> 반환 타입 { 본체 }` 로 선언합니다. 본체의 마지막 식 (세미콜론이 없는 식) 이 반환값이고, 중간에 빠져나갈 때만 `return` 을 씁니다.

```rok
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn sign(n: i32) -> str {
    if n < 0 {
        return "negative";
    }
    if n == 0 { "zero" } else { "positive" }
}

fn divmod(a: i32, b: i32) -> (i32, i32) {
    (a / b, a % b)
}

println(f"{add(2, 3)} {sign(-4)} {sign(0)}");
let (q, r) = divmod(17, 5);
println(f"17 = 5 * {q} + {r}");
```

```output
5 negative zero
17 = 5 * 3 + 2
```

값을 여러 개 돌려줄 때는 튜플로 묶고 받는 쪽에서 분해합니다.

반환 타입과 매개변수 타입은 생략할 수도 있습니다. 반환 타입을 생략하면 마지막 식의 타입으로 추론하고 (마지막이 `;` 로 끝나면 `()`), 매개변수 타입을 생략하면 그 매개변수는 제네릭이 되어 호출하는 타입마다 따로 컴파일됩니다.

> [!NOTE]
> 현재 툴체인은 생략한 반환 타입을 언제나 `()` 로, 타입 없는 매개변수를 `any` 로 다루어 아래 예제가 컴파일되지 않습니다. 당분간은 타입을 적어 주세요 (`fn id<T>(x: T) -> T` 처럼 제네릭을 명시하면 됩니다).

```rok norun
fn double(x: i32) { x * 2 }   // return type inferred: i32
fn id(x) { x }                // generic: fn id<T>(x: T) -> T
println(f"{double(4)} {id("hi")}");
```

블록 `{ ... }` 은 함수 본체가 아닌 곳에서도 식입니다. 임시 변수를 블록 안에 가두고 결과만 꺼낼 때 유용합니다.

```rok
let area = {
    let w = 3;
    let h = 4;
    w * h
};
println(f"{area}");
```

```output
12
```

## 기본값과 이름 있는 인자

매개변수에 `= 값` 으로 기본값을 줄 수 있고, 호출할 때 `이름: 값` 으로 인자를 지정할 수 있습니다. 위치 인자가 먼저, 이름 있는 인자가 뒤에 옵니다.

```rok
fn greet(name: str, greeting: str = "Hello", punct: str = "!") -> str {
    f"{greeting}, {name}{punct}"
}

println(greet("rok"));
println(greet("rok", punct: "?"));
println(greet(name: "Ada", greeting: "Hi"));
```

```output
Hello, rok!
Hello, rok?
Hi, Ada!
```

기본값은 리터럴이나 `const` 처럼 컴파일 타임에 정해지는 값만 쓸 수 있습니다. 개수가 정해지지 않은 인자는 `...T` 로 받습니다. 본체에서는 읽기 전용 슬라이스입니다.

```rok
fn sum(xs: ...i32) -> i32 {
    let total = 0;
    for x in xs {
        total += x;
    }
    total
}

println(f"{sum()} {sum(1, 2, 3)}");
```

```output
0 6
```

## 클로저

클로저는 이름 없는 함수 값입니다. `|매개변수| 식` 또는 `|매개변수| { 블록 }` 으로 씁니다. 매개변수 타입은 문맥에서 추론되지만, 문맥이 없으면 적어 줍니다.

```rok
let double = |x: i32| x * 2;
let describe = |x: i32| -> str {
    let half = x / 2;
    f"{x} is {half} * 2"
};
println(f"{double(21)}");
println(describe(10));
```

```output
42
10 is 5 * 2
```

클로저는 주변 변수를 **값으로 복사해** 캡처합니다. 클로저를 만든 뒤 바깥 변수가 바뀌어도 클로저는 만들 때의 값을 기억합니다. 바깥 변수 자체를 바꾸고 싶으면 `[ref 이름]` 캡처 리스트로 참조 캡처를 명시합니다.

```rok
let count = 0;
let snapshot = || count + 1;
count = 10;
println(f"snapshot: {snapshot()}");

let inc = [ref count] || { count += 1; };
inc();
inc();
println(f"count: {count}");
```

```output
snapshot: 1
count: 12
```

값 캡처한 변수에 대입하려 하면 컴파일러가 `[ref count]` 를 붙이라고 알려 줍니다. 다만 `List` 같은 힙 객체는 변수가 객체를 가리키는 참조이므로, 값 캡처로도 `push` 처럼 객체 자체를 바꿀 수는 있습니다.

## 함수 타입

함수와 클로저는 `fn(매개변수 타입) -> 반환 타입` 타입의 값입니다. 변수에 담고, 인자로 넘기고, 반환하고, 리스트에 넣을 수 있습니다.

```rok
fn apply(f: fn(i32) -> i32, x: i32) -> i32 {
    f(x)
}

fn make_adder(n: i32) -> fn(i32) -> i32 {
    |x| x + n
}

let add5 = make_adder(5);
println(f"{apply(add5, 10)}");

let ops: List<fn(i32, i32) -> i32> = [|a, b| a + b, |a, b| a * b];
for op in ops {
    println(f"{op(6, 7)}");
}
```

```output
15
13
42
```

`make_adder` 가 돌려준 클로저는 `n` 을 캡처한 채로 살아남습니다.

## 트레일링 클로저

마지막 인자가 클로저면 괄호 밖으로 뺄 수 있습니다. 매개변수가 있으면 `f(인자) |x| { ... }`, 없으면 `f(인자) { ... }` 입니다. 반복이나 자원 관리 같은 패턴이 언어 구문처럼 읽힙니다.

```rok
fn repeat(times: i32, body: fn(i32)) {
    for i in 0..times {
        body(i);
    }
}

fn measure(label: str, body: fn() -> i32) -> i32 {
    let r = body();
    println(f"{label}: {r}");
    r
}

repeat(3) |i| {
    println(f"tick {i}");
};
let total = measure("sum") { 1 + 2 + 3 };
let evens: List<i32> = [1, 2, 3, 4].iter().filter |x| { x % 2 == 0 }.collect();
println(f"{total} {evens:?}");
```

```output
tick 0
tick 1
tick 2
sum: 6
6 [2, 4]
```

## 메서드 미리 보기

`impl` 블록 안의 함수가 메서드입니다. 첫 매개변수가 `self` 면 `값.메서드()` 로 부르고, `self` 가 없으면 `타입::함수()` 로 부르는 정적 메서드입니다. 메서드 안에서 필드를 바꾸려면 `ref self` 로 받습니다. 구조체와 메서드는 뒤 장에서 자세히 다룹니다.

```rok
struct Counter { n: i32 }

impl Counter {
    fn new() -> Counter { Counter { n: 0 } }
    fn bump(ref self) { self.n += 1; }
    fn get(self) -> i32 { self.n }
}

let c = Counter::new();
c.bump();
c.bump();
println(f"{c.get()}");
```

```output
2
```

## 중첩 함수와 진입점

함수 안에 함수를 선언할 수 있습니다. 중첩 함수는 그 블록 안에서만 보이고, 클로저와 달리 바깥 변수를 캡처하지 **않습니다**. 바깥 상태가 필요 없는 도우미를 숨길 때 씁니다.

> [!NOTE]
> 중첩 함수는 현재 툴체인에서 아직 파싱되지 않습니다. 당분간은 모듈 최상위 함수나 클로저를 쓰세요.

```rok norun
fn hypot_sq(a: i32, b: i32) -> i32 {
    fn sq(x: i32) -> i32 { x * x }
    sq(a) + sq(b)
}
println(f"{hypot_sq(3, 4)}");
```

프로그램의 시작점은 `main.rok` 의 최상위 문장 또는 `fn main()` 입니다. 최상위 문장은 컴파일러가 만든 암묵 `main` 의 본체가 되므로, 최상위 `let` 변수는 **지역 변수**입니다. 따라서 다른 함수 본체에서는 보이지 않습니다. 함수가 그 값을 써야 하면 인자로 넘기거나, 클로저로 캡처합니다.

```rok
let base = 100;
let shifted = |x: i32| x + base;

fn scale(x: i32, factor: i32) -> i32 {
    x * factor
}

println(f"{shifted(1)} {scale(base, 3)}");
```

```output
101 300
```

## 정리

- 함수 본체의 마지막 식이 반환값입니다. `return` 은 일찍 빠져나갈 때 씁니다.
- 매개변수에 기본값을 주고, 호출할 때 `이름: 값` 으로 지정할 수 있습니다. `...T` 는 가변 인자입니다.
- 클로저 `|x| 식` 은 기본으로 값을 복사해 캡처하고, `[ref x]` 로 참조 캡처를 명시합니다.
- 함수 값의 타입은 `fn(A) -> R` 입니다. 마지막 인자 클로저는 트레일링 형태로 쓸 수 있습니다.
- 최상위 `let` 은 암묵 `main` 의 지역 변수라 다른 함수에서 보이지 않습니다.

다음 장 [4. 제어 흐름](04-control-flow.html) 에서 `if`, `match`, 반복문을 다룹니다.

## 더 알아보기

- [함수 선언](../spec/refs-lang/004-functions/401-function-declaration.html), [매개변수](../spec/refs-lang/004-functions/402-parameters.html), [반환](../spec/refs-lang/004-functions/403-return.html)
- [함수 타입](../spec/refs-lang/004-functions/404-function-type.html), [클로저](../spec/refs-lang/004-functions/405-closure.html), [캡처 의미론](../spec/refs-lang/004-functions/406-capture-semantics.html)
- [트레일링 클로저](../spec/refs-lang/004-functions/408-trailing-closure.html), [메서드](../spec/refs-lang/004-functions/409-method.html), [중첩 함수](../spec/refs-lang/004-functions/410-nested-functions.html)
- [진입점](../spec/refs-lang/004-functions/416-entry-point.html), [블록 표현식](../spec/refs-lang/003-expressions/309-block-expressions.html)
