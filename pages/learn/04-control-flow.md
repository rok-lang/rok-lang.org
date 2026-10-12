# 4. 제어 흐름

이 장에서는 분기 (`if`, `match`) 와 반복 (`while`, `for`, `loop`), 그리고 값을 꺼내며 분기하는 `let else`, `is` 검사, 분해를 다룹니다. rok 에서 `if`, `match`, `loop` 는 모두 값을 내는 식이라는 점이 핵심입니다.

## `if` 는 식이다

`if` 의 조건에는 괄호가 필요 없고, 본체는 항상 중괄호로 씁니다. 각 분기의 마지막 식이 `if` 전체의 값이 되므로 삼항 연산자가 따로 없습니다.

```rok
let temp = 23;
let feel = if temp >= 28 {
    "hot"
} else if temp >= 15 {
    "mild"
} else {
    "cold"
};
println(f"{temp} degrees: {feel}");
```

```output
23 degrees: mild
```

값으로 쓸 때는 모든 분기가 같은 타입이어야 합니다. 서로 다른 타입을 섞으려면 받는 변수에 `i32 | str` 같은 합 타입을 명시합니다.

## `match` 와 패턴

`match` 는 값을 위에서부터 패턴과 비교해 처음 맞는 가지를 실행합니다. 리터럴, `|` 로 묶은 여러 패턴, 범위 (`4..=9`), 바인딩 (`k @ 패턴`), 가드 (`if 조건`), 와일드카드 `_` 를 쓸 수 있습니다.

```rok
fn describe(n: i32) -> str {
    match n {
        0 => "zero",
        1 | 2 | 3 => "small",
        k @ 4..=9 => f"digit {k}",
        k if k < 0 => "negative",
        _ => "large",
    }
}

for n in [0, 2, 7, -5, 42] {
    println(f"{n}: {describe(n)}");
}
```

```output
0: zero
2: small
7: digit 7
-5: negative
42: large
```

컴파일러는 모든 경우가 처리되었는지 검사합니다. `i32` 는 값이 너무 많으므로 마지막에 `_` 가 필요합니다. 튜플도 패턴으로 분해하며 맞출 수 있습니다.

```rok
fn locate(p: (i32, i32)) -> str {
    match p {
        (0, 0) => "origin",
        (x, 0) => f"on the x-axis at {x}",
        (0, y) => f"on the y-axis at {y}",
        (a, b) if a == b => "on the diagonal",
        _ => "somewhere else",
    }
}

println(locate((0, 0)));
println(locate((5, 0)));
println(locate((2, 2)));
println(locate((1, 9)));
```

```output
origin
on the x-axis at 5
on the diagonal
somewhere else
```

## 합 타입 다루기: 타입 패턴, `is`, `let else`

값이 여러 타입 중 하나일 수 있으면 (`i32 | str | none`) **타입 검사 패턴** `이름: 타입` 으로 나눕니다. 맞는 가지 안에서 이름은 그 타입으로 좁혀집니다.

```rok
fn show(v: i32 | str | none) -> str {
    match v {
        n: i32 if n < 0 => "negative int",
        n: i32 => f"int {n}",
        s: str => f"str {s}",
        none => "nothing",
    }
}

println(show(5));
println(show(-1));
println(show("hi"));
println(show(none));
```

```output
int 5
negative int
str hi
nothing
```

타입만 확인하려면 `값 is 타입` 을 씁니다. 결과는 `bool` 이고, `if` 조건에서 지역 변수를 검사하면 본체 안 (그리고 `&&` 뒤쪽) 에서 그 타입으로 좁혀집니다.

`let 패턴 = 식 else { ... };` 는 패턴이 맞으면 변수를 만들고, 맞지 않으면 `else` 블록으로 빠져나갑니다. `else` 블록은 반드시 `return`, `break`, `continue`, `throw` 등으로 끝나야 합니다. "없으면 일찍 끝내기" 를 들여쓰기 없이 쓸 수 있습니다.

```rok
fn first_even(xs: List<i32>) -> i32 | none {
    for x in xs {
        if x % 2 == 0 { return x; }
    }
    none
}

fn report(xs: List<i32>) -> str {
    let n: i32 = first_even(xs) else {
        return "no even number";
    };
    f"first even is {n}, half is {n / 2}"
}

let v: i32 | str = 7;
if v is i32 && v > 5 {
    println(f"big int, next is {v + 1}");
}
println(report([1, 3, 8, 10]));
println(report([1, 3]));
```

```output
big int, next is 8
first even is 8, half is 4
no even number
```

한 경우만 처리하고 나머지는 넘어가려면 `if let n: i32 = 식 { ... }` 도 쓸 수 있습니다.

## `while` 과 `for`

`while` 은 조건이 참인 동안 반복합니다. `for` 는 범위, 리스트, 반복자의 원소를 하나씩 꺼냅니다. `a..b` 는 `b` 를 포함하지 않고, `a..=b` 는 포함합니다. `continue` 는 다음 반복으로, `break` 는 반복 밖으로 갑니다.

```rok
let i = 0;
while i < 3 {
    print(f"{i} ");
    i += 1;
}
println("");

for k in 0..10 {
    if k % 2 == 1 { continue; }
    if k > 6 { break; }
    print(f"{k} ");
}
println("");

for (idx, name) in ["ada", "grace"].iter().enumerate() {
    println(f"{idx}: {name}");
}
```

```output
0 1 2 
0 2 4 6 
0: ada
1: grace
```

`while let` 은 패턴이 맞는 동안 반복합니다. `pop()` 은 `T | none` 을 돌려주므로, 빌 때까지 꺼내는 코드가 간단해집니다.

```rok
let stack = [1, 2, 3];
while let top: i32 = stack.pop() {
    print(f"{top} ");
}
println("");
```

```output
3 2 1 
```

## `loop` 와 값을 든 `break`

`loop` 는 `break` 할 때까지 무한히 반복합니다. `break 값` 으로 빠져나가면 그 값이 `loop` 식의 결과입니다. 끝나는 시점에 결과가 정해지는 계산에 알맞습니다.

```rok
let n = 27;
let steps = 0;
let total = loop {
    if n == 1 { break steps; }
    n = if n % 2 == 0 { n / 2 } else { 3 * n + 1 };
    steps += 1;
};
println(f"Collatz(27) reaches 1 in {total} steps");
```

```output
Collatz(27) reaches 1 in 111 steps
```

## 라벨

중첩된 반복에서 바깥 반복을 직접 끝내려면 `'이름:` 라벨을 붙이고 `break '이름` 이나 `continue '이름` 을 씁니다. `loop` 와 블록에 붙인 라벨은 값도 들고 나갈 수 있습니다.

```rok
let pair = 'search: loop {
    for a in 1..10 {
        for b in a..10 {
            if a * b == 42 { break 'search (a, b); }
        }
    }
    break (0, 0);
};
println(f"{pair:?}");

let limit = 50;
let checked = 'check: {
    if limit > 100 { break 'check -1; }
    limit * 2
};
println(f"{checked}");
```

```output
(6, 7)
100
```

## 분해

`let` 과 `for` 의 왼쪽에는 언제나 맞는 (반증 불가능한) 패턴을 둘 수 있습니다. 튜플을 중첩해 풀거나, `..` 로 나머지를 묶거나, `_` 로 버립니다.

```rok
let ((a, b), c) = ((1, 2), 3);
let (first, ..rest) = (10, 20, 30, 40);
let (_, second) = ("skip", "keep");
println(f"{a} {b} {c} {first} {rest:?} {second}");

let points = [(1, 2), (3, 4)];
for (x, y) in points {
    println(f"({x}, {y}) -> {x + y}");
}
```

```output
1 2 3 10 (20, 30, 40) keep
(1, 2) -> 3
(3, 4) -> 7
```

## 정리

- `if`, `match`, `loop`, 블록은 값을 내는 식입니다. 분기는 같은 타입이어야 합니다.
- `match` 는 리터럴, `|`, 범위, `@` 바인딩, 가드, 타입 검사 패턴을 지원하고 완전성을 검사합니다.
- `is` 는 타입 검사, `let ... else` 와 `if let` / `while let` 은 패턴이 맞을 때만 진행합니다.
- `for x in a..b` / `a..=b` 로 범위를, `.iter().enumerate()` 로 인덱스와 함께 반복합니다.
- `break 값` 과 `'라벨:` 로 중첩 반복을 빠져나오며 결과를 돌려줄 수 있습니다.

## 더 알아보기

- [`if` 표현식](../spec/refs-lang/003-expressions/310-if-expression.html), [`match` 표현식](../spec/refs-lang/003-expressions/312-match-expression.html), [패턴](../spec/refs-lang/003-expressions/311-patterns.html)
- [루프 표현식](../spec/refs-lang/003-expressions/313-loop-expressions.html), [범위 표현식](../spec/refs-lang/003-expressions/307-range-expressions.html), [라벨 블록](../spec/refs-lang/003-expressions/309-block-expressions.html)
- [분해 대입](../spec/refs-lang/003-expressions/315-destructuring.html), [`let-else`](../spec/refs-lang/003-expressions/316-let-else.html)
- [`is` 와 슬롯의 타입 검사](../spec/refs-lang/002-types/202-any-slot.html), [합 타입](../spec/refs-lang/002-types/206-sum-types.html)
