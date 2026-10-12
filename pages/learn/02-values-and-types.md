# 2. 값과 타입

이 장에서는 변수를 선언하는 `let`, 숫자와 문자열 같은 기본 타입, 그리고 여러 값을 묶는 튜플과 리스트를 다룹니다. rok 은 정적 타입 언어이지만 대부분의 타입은 추론되므로 직접 적을 일이 많지 않습니다.

## `let` 과 재할당

`let` 으로 새 변수를 만들고, 이미 있는 변수에 다시 쓸 때는 `let` 없이 `=` 만 씁니다. 변수는 기본으로 바꿀 수 있습니다 (`mut` 같은 표시가 없습니다).

```rok
let name = "rok";
let count = 0;
count = count + 1;
count += 1;
println(f"{name}: {count}");
```

```output
rok: 2
```

새 선언과 재할당이 문법으로 구분되기 때문에, 오타가 조용히 새 변수를 만드는 일이 없습니다. 선언한 적 없는 이름에 대입하면 컴파일 에러입니다.

```text
error: [type] main.rok:2:1: `coutn` is not declared. Use `let` to introduce a new binding
```

몇 가지 규칙이 더 있습니다.

- 초기값은 반드시 있어야 합니다. `let x;` 는 에러입니다. 값이 아직 없다면 `let x: i32 | none = none;` 처럼 "없음" 을 명시합니다.
- 같은 스코프에서 같은 이름을 다시 `let` 으로 선언할 수 없습니다 (Rust 식 shadowing 이 없습니다). 안쪽 블록의 `let` 은 바깥과 별개의 변수를 만듭니다.
- 변수의 타입은 선언할 때 정해지고 바뀌지 않습니다. `i32` 변수에 문자열을 대입하면 에러입니다.

```rok
let a = 1;
{
    let a = 42;
    a = 10;
    println(f"inner a = {a}");
}
println(f"outer a = {a}");
```

```output
inner a = 10
outer a = 1
```

## 숫자 타입과 리터럴

정수는 `i8` `i16` `i32` `i64` `isize` 와 부호 없는 `u8` `u16` `u32` `u64` `usize`, 실수는 `f32` `f64` 입니다. 리터럴 뒤에 타입 이름을 붙이면 그 타입이 되고, 접미사가 없으면 **기대 타입**을 따릅니다. 기대 타입이 없을 때의 기본값은 정수 `i32`, 실수 `f64` 입니다.

```rok
let a = 42;            // i32
let b: u8 = 200;       // u8, from the annotation
let c = 7i64;          // suffix
let d = 2.5f32;
let e = 3.14;          // f64
let big = 1_000_000u64;
println(f"{a} {b} {c} {d} {e} {big}");
println(f"{0xFF} {0b1010} {0o17} {1e3}");
println(f"{7 / 2} {-7 / 2} {7.0 / 2.0}");
```

```output
42 200 7 2.5 3.14 1000000
255 10 15 1000
3 -3 3.5
```

`_` 는 자릿수 구분자이고, `0x` / `0b` / `0o` 는 16 / 2 / 8 진수입니다. 정수 나눗셈은 0 쪽으로 자릅니다. 리터럴이 타입의 범위를 벗어나면 (`let x: u8 = 256;`) 컴파일 에러입니다.

## 암묵 변환은 없다: `as`

rok 은 서로 다른 숫자 타입을 자동으로 섞지 않습니다. `i32` 와 `i64` 를 더하면 에러가 납니다.

```text
error: [type] main.rok:3:12: operator `+` cannot be applied to `i32` and `i64`
```

조용한 정밀도 손실을 막기 위한 설계입니다. 변환은 직접 적습니다. `as` 는 항상 성공하지만 값이 잘리거나 바뀔 수 있고, `.into()` 는 값을 잃지 않는 변환에만 쓸 수 있습니다.

```rok
let x: i32 = 10;
let y: i64 = 3;
println(f"{(x as i64) + y}");
let w: i64 = x.into();
println(f"{w}");
println(f"{2.9 as i32} {300 as u8} {x as f64 / 4.0}");
```

```output
13
10
2 44 2.5
```

`2.9 as i32` 는 소수점 아래를 버리고, `300 as u8` 은 하위 8비트만 남깁니다. 실패할 수 있는 변환은 `.try_into::<T>()` 를 씁니다. 에러를 던지는 함수이므로 `try?` 와 함께 쓰면 실패 시 `none` 을 얻습니다.

```rok
let small: i64 = 300;
let a: u8 | none = try? small.try_into::<u8>();
let b: i32 | none = try? small.try_into::<i32>();
println(f"{a ?? 0} {b ?? 0}");
```

```output
0 300
```

## bool, char, str

`bool` 은 `true` / `false` 이고 `&&`, `||`, `!` 로 조합합니다. `char` 는 유니코드 문자 하나이며 작은따옴표로 씁니다. `str` 은 UTF-8 문자열이고 큰따옴표로 씁니다.

```rok
let ok = 3 < 5 && !false;
let ch = '가';
println(f"{ok} {ch} {ch as u32} {65u8 as char}");

let s = "héllo";
println(f"{s.len()} bytes, {s.char_count()} chars");
let t = s + ", rok";
println(f"{t} {t.to_uppercase()} {t.contains("rok")}");
println("tab:\tend");
println(r"raw: C:\path\n");
```

```output
true 가 44032 A
6 bytes, 5 chars
héllo, rok HÉLLO, ROK true
tab:	end
raw: C:\path\n
```

`len()` 은 바이트 수입니다. 문자 수가 필요하면 `char_count()` 를 씁니다. `r"..."` 는 이스케이프를 처리하지 않는 원시 문자열입니다. `str` 의 다른 메서드 (`trim`, `split`, `replace`, `parse` 등) 는 [표준 라이브러리 문서](../std/core/str.html) 에 있습니다.

## 튜플, 배열, 리스트

**튜플**은 타입이 다른 값 몇 개를 묶습니다. `.0`, `.1` 로 꺼내거나 `let` 으로 분해합니다.

```rok
let p = (1, "one", true);
println(f"{p.0} {p.1} {p:?}");
let (n, word, _) = p;
println(f"{word} = {n}");
```

```output
1 one (1, "one", true)
one = 1
```

`[...]` 리터럴은 기본으로 **`List`** 입니다. 길이가 늘어나는 리스트이고, 같은 리스트를 가리키는 모든 변수가 변경을 함께 봅니다. `List` 는 `{}` 로 출력할 수 없으므로 Debug 형식 `{:?}` 을 씁니다.

```rok
let names = ["ada", "grace"];
names.push("linus");
println(f"{names:?} {names.len()} {names[0]}");

let empty: List<i32> = [];
println(f"{empty.is_empty()}");
```

```output
["ada", "grace", "linus"] 3 ada
true
```

변수 타입이 `[T; N]` 이면 같은 리터럴이 길이가 고정된 **배열**이 됩니다. 크기가 컴파일 타임에 정해지므로 행렬이나 버퍼처럼 모양이 정해진 데이터에 씁니다.

```rok
let grid: [[i32; 2]; 2] = [[1, 2], [3, 4]];
println(f"{grid:?} {grid[1][0]} {grid.len()}");
```

```output
[[1, 2], [3, 4]] 3 2
```

빈 리스트처럼 원소에서 타입을 알 수 없을 때는 `let xs: List<i32> = [];` 처럼 타입을 적어 줍니다.

## 큰 정수: `int`

`i32` 같은 고정 폭 타입은 빠르지만 범위가 있습니다. 범위 걱정 없이 정확한 정수가 필요하면 `int` 를 씁니다. 작은 값은 고정 폭처럼 저장되고, 커지면 자동으로 큰 정수로 바뀝니다. `int` 는 타입을 적은 곳에서만 생기며, 고정 폭 타입과 섞으려면 역시 명시 변환이 필요합니다.

```rok
let big: int = 1;
for _ in 0..100 {
    big = big * 2;
}
println(f"2^100 = {big}");
```

```output
2^100 = 1267650600228229401496703205376
```

## 상수

`const` 는 컴파일 타임에 정해지는 값입니다. `let` 과 달리 타입을 반드시 적고, 모듈 최상위에도 둘 수 있습니다. 쓰는 자리마다 값이 그대로 들어갑니다.

```rok
const MAX_USERS: i32 = 100;
const GREETING: str = "welcome";

fn capacity_left(used: i32) -> i32 {
    MAX_USERS - used
}

println(f"{GREETING}: {capacity_left(42)} seats left");
```

```output
welcome: 58 seats left
```

## 정리

- `let` 은 새 선언, `=` 는 재할당입니다. 같은 스코프에서 재선언은 금지이고 초기값은 필수입니다.
- 접미사 없는 리터럴은 기대 타입을 따르며 기본값은 `i32` / `f64` 입니다.
- 숫자 타입끼리 자동 변환은 없습니다. `as`, `.into()`, `.try_into::<T>()` 중 하나를 씁니다.
- `[...]` 는 `List` 이고, `[T; N]` 타입이면 고정 배열입니다. `List` 는 `{:?}` 로 출력합니다.
- 범위 제한 없는 정수는 `int`, 컴파일 타임 상수는 `const` 입니다.

다음 장 [3. 함수](03-functions.html) 에서 함수와 클로저를 다룹니다.

## 더 알아보기

- [변수 선언](../spec/refs-lang/005-modules/501-variable-declaration.html), [`const`](../spec/refs-lang/005-modules/502-const.html)
- [숫자 리터럴](../spec/refs-lang/001-lexical/106-numeric-literals.html), [문자열 리터럴](../spec/refs-lang/001-lexical/107-string-literals.html), [문자 리터럴](../spec/refs-lang/001-lexical/108-character-literals.html)
- [형 변환](../spec/refs-lang/002-types/214-cast-and-conversion.html), [타입 표현식](../spec/refs-lang/002-types/201-type-expressions.html)
- [숫자 타입과 `int`](../spec/refs-standard-libraries/200-core/201-numbers.html), [형식 문자열 출력](../spec/refs-standard-libraries/200-core/210-fmt.html)
- 표준 라이브러리 API: [`str`](../std/core/str.html), [`List`](../std/core/collections/list.html)
