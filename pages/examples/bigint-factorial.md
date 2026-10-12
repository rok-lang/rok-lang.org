# 큰 정수와 팩토리얼

임의 정밀도 정수 `int` 로 100!, 피보나치 300 번째 항, 128 비트를 넘는 거듭제곱을 계산하고 `i64` 가 어디서 넘치는지 확인합니다.

## 코드

```rok
// n! as an arbitrary-precision `int`.
fn factorial(n: i64) -> int {
    let acc: int = 1;
    for k in 2..=n { acc = acc * int::from(k); }
    acc
}

// n! in i64: none once it overflows.
fn factorial_i64(n: i64) -> i64 | none {
    let acc = 1i64;
    for k in 2..=n {
        acc = acc.checked_mul(k)?;
    }
    acc
}

fn fib(n: i64) -> int {
    let a: int = 0;
    let b: int = 1;
    for _ in 0..n {
        let next = a + b;
        a = b;
        b = next;
    }
    a
}

fn digit_sum(x: int) -> i64 {
    let sum = 0i64;
    for c in f"{x}".chars() { sum += (c as i64) - ('0' as i64); }
    sum
}

let f100 = factorial(100);
let text = f"{f100}";
println(f"100! = {text[:20]}...{text[-10:]}");
println(f"digits: {text.len()}, digit sum: {digit_sum(f100)}");
println(f"bits: {f100.bit_length()}");

// Where does i64 give up?
for n in 19i64..=22 {
    match factorial_i64(n) {
        v: i64 => println(f"{n}! fits in i64: {v}"),
        none => println(f"{n}! overflows i64, int says {factorial(n)}"),
    }
}

println(f"fib(300) = {fib(300)}");
println(f"fib(300) % 1_000_000_007 = {fib(300) % int::from(1_000_000_007)}");

// Literals larger than i64 work directly in an int slot.
let big: int = 123_456_789_012_345_678_901_234_567_890;
println(f"big * big = {big * big}");
println(f"2^128 = {int::from(2).pow(128)}");
println(f"gcd(100!, 2^200) = 2^{int::from(2).pow(200).gcd(f100).bit_length() - 1}");
println(f"100! / 98! = {f100 / factorial(98)}");
```

```output
100! = 93326215443944152681...0000000000
digits: 158, digit sum: 648
bits: 525
19! fits in i64: 121645100408832000
20! fits in i64: 2432902008176640000
21! overflows i64, int says 51090942171709440000
22! overflows i64, int says 1124000727777607680000
fib(300) = 222232244629420445529739893461909967206666939096499764990979600
fib(300) % 1_000_000_007 = 644264086
big * big = 15241578753238836750495351562536198787501905199875019052100
2^128 = 340282366920938463463374607431768211456
gcd(100!, 2^200) = 2^97
100! / 98! = 9900
```

## 살펴보기

- `int` 는 크기 제한이 없는 정수입니다. 작은 값은 `i64` 하나로 들고 있다가 넘치면 자릿수 배열로 넘어가므로, 작은 수에서는 고정 폭 정수와 비슷하게 빠릅니다 ([2.1.2 `int`](../spec/refs-standard-libraries/200-core/201-numbers.html#212-int--무한-정밀도-정수), [`Int`](../std/core/num/bigint.html#struct.Int)).
- `int` 와 `i64` 를 섞어 계산하지 않습니다. `int::from(k)` 처럼 명시적으로 바꿔야 하며, 이 규칙 덕분에 어느 연산이 넘칠 수 있는지 코드에서 바로 보입니다 ([2.1.6 산술 결과 타입](../spec/refs-standard-libraries/200-core/201-numbers.html#216-산술-결과-타입)).
- `i64` 쪽은 `checked_mul` 이 넘치면 `none` 을 돌려줍니다. 뒤에 붙인 `?` 가 `none` 을 그대로 함수 밖으로 돌려보내므로, `factorial_i64` 는 결과를 `i64 | none` 으로 알려 줍니다 ([합 타입](../learn/05-sum-types.html)).
- `i64` 범위를 넘는 정수 리터럴도 `int` 슬롯에서는 그대로 쓸 수 있습니다 (`let big: int = 123_456_...`).
- `int` 는 `Display` 를 구현하므로 `f"{x}"` 로 10 진 문자열을 얻고, 문자열 슬라이스 `text[:20]`, `text[-10:]` 로 앞뒤만 잘라 보여 줍니다 ([문자열](../learn/09-strings.html)).
