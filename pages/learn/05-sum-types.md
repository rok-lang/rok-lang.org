# 5. 합 타입과 none

값이 "이것 아니면 저것" 일 때 rok 은 `A | B` 처럼 타입을 `|` 로 이어 씁니다. 이 장에서는 합 타입과, 그중 가장 자주 쓰는 "값이 없을 수도 있음" 인 `T | none` 을 다루는 도구들을 익힙니다.

## 합 타입 `A | B`

합 타입의 값은 적힌 항 중 정확히 하나에 속합니다. 어느 항인지는 값이 태그로 기억하므로, `match` 에서 타입 검사 패턴 `이름: 타입` 으로 꺼낼 수 있습니다.

```rok
fn describe(v: i32 | str | bool) -> str {
    match v {
        n: i32 => f"정수 {n}",
        s: str => f"문자열 {s}",
        b: bool => f"참거짓 {b}",
    }
}

println(describe(42));
println(describe("rok"));
println(describe(true));
```

```output
정수 42
문자열 rok
참거짓 true
```

합 타입은 **닫혀** 있습니다. 컴파일러가 가능한 항을 모두 알기 때문에, 위 `match` 에서 `bool` 분기를 빼면 "모든 경우를 다루지 않았다" 는 컴파일 에러가 납니다. 새 항을 추가하면 손봐야 할 곳을 컴파일러가 알려 주는 셈입니다.

합 타입은 집합처럼 동작합니다. `i32 | str` 과 `str | i32` 는 같은 타입이고, `i32 | i32` 는 그냥 `i32` 입니다. 긴 합에는 `type` 으로 이름을 붙일 수 있습니다.

```rok
type Number = i32 | f64;

fn half(n: Number) -> f64 {
    match n {
        i: i32 => i as f64 / 2.0,
        f: f64 => f / 2.0,
    }
}

println(f"{half(7)} {half(1.5)}");
```

```output
3.5 0.75
```

## `none` 과 `T?`

`none` 은 "값 없음" 을 뜻하는 리터럴입니다. 다른 언어의 `Option<T>` / `null` 자리를 rok 에서는 합 타입 `T | none` 이 맡고, 줄여서 `T?` 라고 씁니다. 별도의 `Some(..)` 포장이 없으므로 값은 그대로 돌려주면 됩니다.

```rok
fn find(xs: List<i32>, target: i32) -> usize? {
    for i in 0..xs.len() {
        if xs[i] == target { return i; }
    }
    none
}

let xs = [3, 1, 4];
println(f"{find(xs, 4):?}");
println(f"{find(xs, 7):?}");
```

```output
2
none
```

표준 라이브러리도 같은 관례를 따릅니다. `List::get`, `Dict::get`, `List::pop` 처럼 실패할 수 있는 조회는 모두 `T | none` 을 돌려줍니다.

> [!TIP]
> `T | none` 은 공짜에 가깝습니다. `bool`, 포인터, 필드 없는 `enum` 처럼 쓰지 않는 비트 패턴이 있는 타입은 그 자리에 `none` 을 넣어 태그 없이 저장합니다 ([niche 최적화](../spec/refs-lang/002-types/207-niche-optimization.html)). 그래서 `bool?` 은 1 바이트입니다.

## `is` 로 좁히기

`x is T` 는 값이 지금 `T` 항인지 검사하는 `bool` 식입니다. `if` 조건에서 지역 변수를 검사하면, 그 분기 안에서는 변수가 `T` 로 **좁혀져** 바로 `T` 의 연산을 쓸 수 있습니다. `&&` 로 이어진 뒤쪽 조건에서도 마찬가지입니다.

```rok
let v: i32 | str = 7;
if v is i32 && v > 5 {
    println(f"큰 수: {v + 1}");
}

let w: i32 | str = "hello";
if w is str {
    println(f"글자 수: {w.len()}");
}
println(f"{w is i32}");
```

```output
큰 수: 8
글자 수: 5
false
```

## `if let` 과 `match`

검사와 동시에 값을 새 이름으로 받고 싶으면 `if let 이름: T = 식` 을 씁니다. `match` 에서는 `none` 을 리터럴 패턴으로 적습니다.

```rok
fn lookup(id: i32) -> str? {
    if id == 1 { "kim" } else { none }
}

if let name: str = lookup(1) {
    println(f"찾음: {name}");
} else {
    println("없음");
}

for id in [1, 2] {
    match lookup(id) {
        name: str => println(f"{id} → {name}"),
        none => println(f"{id} → (없음)"),
    }
}
```

```output
찾음: kim
1 → kim
2 → (없음)
```

## 기본값 `??` 와 체이닝 `?.`

매번 `match` 를 쓰기는 번거롭습니다. `a ?? b` 는 `a` 가 `none` 이면 `b` 를, 아니면 `a` 의 값을 돌려줍니다. `x?.field` 와 `x?.method()` 는 `x` 가 `none` 이면 전체가 `none` 이 되고, 값이 있을 때만 접근합니다. 둘을 이으면 "있으면 꺼내고 없으면 기본값" 이 한 줄이 됩니다.

```rok
struct User { name: str; nick: str?; }

let u: User? = User { name: "kim", nick: none };
let nobody: User? = none;

println(u?.name ?? "anonymous");
println(nobody?.name ?? "anonymous");
println(f"{u?.name?.len():?}");

let scores: Dict<str, i32> = {"kim": 90};
println(f"{scores.get("kim") ?? 0} {scores.get("lee") ?? 0}");
```

```output
kim
anonymous
3
90 0
```

`?.` 는 단축 평가입니다. 좌변이 `none` 이면 뒤의 메서드는 아예 호출되지 않습니다.

## 후위 `?`: none 이면 바로 반환

함수 안에서 여러 단계의 `T | none` 을 차례로 풀어야 할 때는 후위 `?` 를 씁니다. `e?` 는 `e` 의 값을 꺼내고, `none` 이면 둘러싼 함수에서 곧바로 `none` 을 반환합니다. 그래서 함수의 반환 타입에 `none` 이 들어 있어야 합니다.

```rok
struct User { name: str; nick: str?; }

fn nick_len(u: User?) -> usize? {
    let user = u?;
    let nick = user.nick?;
    nick.len()
}

println(f"{nick_len(User { name: "a", nick: "bob" }):?}");
println(f"{nick_len(User { name: "a", nick: none }):?}");
println(f"{nick_len(none):?}");
```

```output
3
none
none
```

`?` 는 `T | none` 전용입니다. 에러를 전파하는 수단이 아니며, 에러는 `throws` / `try` 로 다룹니다 ([에러 제어 흐름](../spec/refs-lang/003-expressions/314-error-control-flow.html)).

> [!NOTE]
> 컬렉션에 `none` 자체를 담으면 (`List<i32?>`) `get` 의 결과는 "원소 없음" 과 "저장된 none" 을 구별하는 두 층 optional `(i32 | none)?` 이 됩니다. `??`, `?.`, `?` 는 바깥 층에만 작용합니다. 자세한 규칙은 [중첩 optional](../spec/refs-lang/002-types/206-sum-types.html#중첩-optional) 을 보세요.

## 정리

- `A | B` 는 닫힌 합 타입입니다. 항의 순서와 중복은 의미가 없고, `match` 는 모든 항을 다뤄야 합니다.
- 값이 없을 수 있으면 `T | none`, 줄여서 `T?` 를 씁니다. 값은 포장 없이 그대로 반환합니다.
- `x is T` 는 검사이자 좁히기입니다. `if let x: T = ...` 와 `match` 의 `n: T` / `none` 패턴으로 값을 꺼냅니다.
- `??` 는 기본값, `?.` 는 none 이면 건너뛰는 접근, 후위 `?` 는 none 이면 함수에서 바로 반환합니다.
- niche 최적화 덕분에 많은 `T?` 는 `T` 와 크기가 같습니다.

## 더 알아보기

- [2.6. 합 타입](../spec/refs-lang/002-types/206-sum-types.html), [2.1.5a. optional 타입 `T?`](../spec/refs-lang/002-types/201-type-expressions.html#215a-optional-타입-t)
- [2.2.6. 좁히기](../spec/refs-lang/002-types/202-any-slot.html#226-좁히기-narrowing), [3.10.5. `if let`](../spec/refs-lang/003-expressions/310-if-expression.html#3105-if-let-패턴-매칭과의-결합), [3.11. 패턴](../spec/refs-lang/003-expressions/311-patterns.html)
- [3.8. 옵셔널 체이닝과 null 합체](../spec/refs-lang/003-expressions/308-optional-chaining-and-coalescing.html), [3.14.10. `?` 연산자](../spec/refs-lang/003-expressions/314-error-control-flow.html#31410--연산자--none-조기-반환)
- [2.7. niche 최적화](../spec/refs-lang/002-types/207-niche-optimization.html)
- 다음 장: [6. 구조체, enum, 트레잇](06-structs-enums-traits.html)
