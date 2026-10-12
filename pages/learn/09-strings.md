# 9. 문자열과 f-string

문자열은 거의 모든 프로그램에 나옵니다. 이 장에서는 `str` 과 `StrBuf`, 자주 쓰는 메서드, 여러 가지 리터럴, 그리고 지금까지 계속 써 온 f-string 의 형식 지정자를 정리합니다.

## `str`: 바꿀 수 없는 UTF-8

`str` 은 UTF-8 바이트열이고 한 번 만들면 바뀌지 않습니다. 그래서 `len()` 은 글자 수가 아니라 **바이트 수**입니다. 글자 (코드포인트) 수는 `char_count()` 로 셉니다.

```rok
let s = "hello, 세계";
println(f"{s.len()} bytes, {s.char_count()} chars");
println(s[0..5]);

for c in "가나".chars() {
    println(f"{c} = U+{c as u32:X}");
}
```

```output
13 bytes, 9 chars
hello
가 = U+AC00
나 = U+B098
```

슬라이스 `s[a..b]` 도 바이트 위치로 자릅니다. 한글은 한 글자가 3 바이트라서 글자 경계가 아닌 곳을 자르면 안 됩니다. 글자 단위로 다룰 때는 `chars()` 나 `char_indices()` 를 씁니다.

문자 하나는 작은따옴표로 쓰는 `char` 입니다. 유니코드 스칼라값 하나이며, 분류와 변환 메서드가 있습니다.

```rok
let c = 'A';
println(f"{c} {c.is_ascii_uppercase()} {c.to_ascii_lowercase()}");
println(f"{'7'.is_ascii_digit()} {'세'.len_utf8()} {'\u{1F600}'}");
```

```output
A true a
true 3 😀
```

## 자주 쓰는 메서드

`str` 의 메서드는 원본을 바꾸지 않고 새 값을 돌려줍니다. 찾지 못할 수 있는 연산은 `T | none` 을 돌려주므로 4장에서 본 `??`, `if let` 과 잘 어울립니다.

```rok
let line = "  name = rok  ";
let t = line.trim();
println(f"[{t}]");
println(f"{t.starts_with("name")} {t.contains("=")} {t.find("rok") ?? 99}");

if let (k, v): (str, str) = t.split_once(" = ") {
    println(f"key={k} value={v}");
}

let parts: List<str> = "a,b,,c".split(",").collect();
println(f"{parts:?}");
println(f"{"ab".repeat(3)} {t.to_uppercase()} {t.replace("rok", "ROK")}");

let n: i32 = try! "42".parse();
println(f"{n + 1}");
```

```output
[name = rok]
true true 7
key=name value=rok
["a", "b", "", "c"]
ababab NAME = ROK name = ROK
43
```

`parse` 는 실패하면 에러를 던지는 함수라서 `try!` 를 붙였습니다. 에러는 [다음 장](10-errors.html)에서 다룹니다. 그 밖에 `lines()`, `split_whitespace()`, `strip_prefix()`, `trim_start()` 등이 있습니다 ([`str` API](../std/core/str.html#impl.str)).

## `StrBuf`: 조금씩 만들어 가기

`str` 은 바뀌지 않으므로 반복문에서 `+` 로 이어 붙이면 매번 새 문자열이 생깁니다. 조금씩 만들어 갈 때는 버퍼 `StrBuf` 에 쓰고, 다 되면 `to_str()` 로 꺼냅니다.

```rok
let b = StrBuf::new();
for i in 1..=5 {
    if !b.is_empty() { b.push_str(", "); }
    b.push_str(f"{i * i}");
}
b.push('!');
let s = b.to_str();
println(f"{s} ({s.len()} bytes)");
```

```output
1, 4, 9, 16, 25! (16 bytes)
```

두 문자열을 한 번 잇는 정도라면 `+` 로 충분합니다. 다만 C 나 Python 처럼 나란히 놓은 문자열 리터럴 (`"abc" "def"`) 을 자동으로 잇지는 않습니다. 그렇게 쓰면 컴파일 에러이며, 잇고 싶으면 `+` 를 적습니다 ([1.7.4](../spec/refs-lang/001-lexical/107-string-literals.html#174-인접-문자열의-자동-결합)).

```rok
let greeting = "hello, " + "world";
println(greeting);
```

```output
hello, world
```

## 리터럴: 이스케이프, 원시 문자열, 줄 잇기

일반 문자열은 `\n`, `\t`, `\"`, `\\`, `\u{..}` 같은 이스케이프를 처리합니다. 백슬래시가 많은 경로나 정규식은 `r"..."` 원시 문자열이 편합니다. 안에 `"` 가 필요하면 양쪽에 같은 수의 `#` 을 두릅니다.

```rok
println("tab:\t| quote:\" | snow: \u{2603}");
println(r"C:\path\to\file\n");
println(r#"she said "hi""#);
println("one long \
         line");
```

```output
tab:	| quote:" | snow: ☃
C:\path\to\file\n
she said "hi"
one long line
```

마지막 예처럼 줄 끝의 `\` 는 줄바꿈과 다음 줄의 앞 공백을 함께 지웁니다. 원시 문자열에서는 이 규칙도 적용되지 않습니다 ([1.7.2](../spec/refs-lang/001-lexical/107-string-literals.html#172-원시-문자열)).

## f-string 의 구멍

`f"..."` 의 `{ }` 안에는 아무 식이나 씁니다. Python 3.12 (PEP 701) 와 같은 규칙이라 구멍 안에서 바깥과 같은 따옴표를 다시 써도 되고, f-string 을 중첩해도 됩니다. 중괄호 자체를 쓰려면 `{{` 와 `}}` 로 적습니다.

```rok
let d = {"lang": "rok"};
let words = ["a", "b"];
println(f"{d["lang"]} has {words.len()} words: {words[0] + words[1]}");
println(f"nested: {f"[{1 + 1}]"}");
println(f"{{literal braces}}");
```

```output
rok has 2 words: ab
nested: [2]
{literal braces}
```

구멍 안에서는 `\"` 같은 이스케이프를 쓰지 않습니다. 따옴표를 그대로 쓰면 됩니다. 여러 줄에 걸친 텍스트나 구멍은 `f"""..."""` 로 씁니다.

## 형식 지정자

구멍의 식 뒤에 `:` 를 두고 형식을 지정합니다. 문법은 `[fill][align][sign][#][0][width][.precision][type]` 입니다.

```rok
let pi = 3.14159;
println(f"[{pi:.2}] [{pi:8.3}] [{pi:e}]");
println(f"[{42:>6}] [{42:<6}] [{42:^6}] [{42:*^6}]");
println(f"[{"ab":5}] [{"ab":>5}] [{7:03}] [{5:+}]");
println(f"{255:x} {255:#X} {5:b} {-1i8:x}");
println(f"{"hi":?} {[1, 2]:?}");
```

```output
[3.14] [   3.142] [3.14159e0]
[    42] [42    ] [  42  ] [**42**]
[ab   ] [   ab] [007] [+5]
ff 0xFF 101 ff
"hi" [1, 2]
```

정렬을 적지 않으면 수는 오른쪽, 그 밖의 값은 왼쪽으로 붙습니다. `?` 는 `Debug` 형식으로, 문자열을 따옴표와 이스케이프까지 보여 줍니다. 지정자는 컴파일할 때 구멍의 타입과 맞춰 검사하므로 `{s:x}` (`s: str`) 같은 실수는 바로 에러가 납니다.

너비나 정밀도를 실행 중에 정하려면 지정자 안에 다시 구멍을 둡니다. `{..}` 와 `${..}` 둘 다 됩니다 ([동적 형식 지정자](../spec/refs-lang/001-lexical/107-string-literals.html#동적-형식-지정자)).

```rok
let x = 2.0 / 3.0;
for prec in 1..=3 {
    let width = prec + 4;
    println(f"[{x:>${width}.${prec}f}] [{x:.{prec}f}]");
}
```

```output
[  0.7] [0.7]
[  0.67] [0.67]
[  0.667] [0.667]
```

## 내 타입을 출력하기: `Display` 와 `Debug`

`f"{x}"` 는 `Display`, `f"{x:?}"` 는 `Debug` 트레잇을 부릅니다. `Debug` 는 `#[derive(Debug)]` 로 자동 구현할 수 있고, 사용자에게 보여 줄 `Display` 는 직접 구현합니다. `fmt` 는 받은 `Formatter` 에 글자를 씁니다.

```rok
#[derive(Debug)]
struct Point { x: i32; y: i32; }

impl Display for Point {
    fn fmt(self, ref f: Formatter) throws (FmtError) {
        try f.write_str(f"({self.x}, {self.y})");
    }
}

#[derive(Debug)]
enum Shape { Circle(f64), Rect { w: f64; h: f64; } }

let p = Point { x: 1, y: -2 };
println(f"{p} | {p:?} | [{p:>10}]");
println(f"{[p, Point { x: 3, y: 4 }]:?}");
println(f"{Shape::Circle(1.5):?} {Shape::Rect { w: 2.5, h: 3.0 }:?}");
```

```output
(1, -2) | Point { x: 1, y: -2 } | [   (1, -2)]
[Point { x: 1, y: -2 }, Point { x: 3, y: 4 }]
Circle(1.5) Rect { w: 2.5, h: 3 }
```

너비와 정렬 (`{p:>10}`) 은 `fmt` 가 쓴 결과 전체에 적용됩니다. `Display` 를 구현하면 그 타입을 f-string 어디에나 바로 넣을 수 있고, `Debug` 가 있으면 그 타입을 담은 `List` 나 `Dict` 도 `{:?}` 로 출력됩니다. `3.0` 이 `3` 으로 나오는 것은 부동소수의 기본 출력이 "다시 읽어 같은 값이 되는 가장 짧은 표기" 이기 때문입니다.

## 정리

- `str` 은 바뀌지 않는 UTF-8 입니다. `len()` 과 슬라이스는 바이트 기준, 글자는 `chars()` 로 다룹니다.
- 조금씩 만드는 문자열은 `StrBuf` 에 쓰고 `to_str()` 로 꺼냅니다. 리터럴 자동 결합은 없고 `+` 로 잇습니다.
- 원시 문자열 `r"..."`, `r#"..."#` 은 이스케이프를 처리하지 않습니다.
- f-string 구멍에는 아무 식이나, 같은 따옴표도 그대로 씁니다. `{{` `}}` 는 중괄호입니다.
- `:.2`, `:>8`, `:x`, `:?` 같은 지정자로 형식을 정하고, `${..}` 로 동적으로 바꿀 수 있습니다.
- 내 타입은 `Display` 를 구현하고 `Debug` 는 derive 합니다.

## 더 알아보기

- 사양: [문자열 리터럴과 f-string](../spec/refs-lang/001-lexical/107-string-literals.html), [문자 리터럴](../spec/refs-lang/001-lexical/108-character-literals.html)
- 표준 라이브러리 사양: [fmt](../spec/refs-standard-libraries/200-core/210-fmt.html), [문자열](../spec/refs-standard-libraries/200-core/215-string.html)
- API: [`str` 메서드](../std/core/str.html#impl.str), [`StrBuf`](../std/core/str.html#struct.StrBuf), [`Display`](../std/core/fmt.html#trait.Display), [`Formatter`](../std/core/fmt.html#struct.Formatter)
