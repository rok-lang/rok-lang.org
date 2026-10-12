# 14. FFI 기초

이 장에서는 C 로 작성된 함수를 rok 에서 부르고, 반대로 rok 함수를 C 에 넘기는 방법을 배웁니다. 운영체제와 수많은 라이브러리가 C ABI 로 기능을 내놓기 때문에, FFI (foreign function interface) 를 알면 표준 라이브러리에 없는 기능도 바로 쓸 수 있습니다.

예제는 모두 macOS / Linux 의 libc 를 상대로 실제로 실행됩니다.

## `extern "C"` 블록

C 함수를 쓰려면 먼저 시그니처를 `extern "C" { ... }` 블록에 선언합니다. 본체는 없고 `;` 로 끝납니다. 이름은 C 심볼 이름 그대로입니다.

```rok
extern "C" {
    fn strlen(s: str) -> usize;
    fn abs(x: i32) -> i32;
    fn getpid() -> i32;
}

println(f"strlen: {unsafe { strlen("hello, C") }}");
println(f"abs: {unsafe { abs(-42) }}");
println(f"pid positive: {unsafe { getpid() } > 0}");
```

```output
strlen: 8
abs: 42
pid positive: true
```

C 의 `int` 는 `i32`, `size_t` 는 `usize`, `double` 은 `f64` 처럼 크기가 같은 원시 타입으로 적습니다. `str` 매개변수는 NUL 로 끝나는 `char*` 로 넘어갑니다. 필요하면 rok 가 NUL 을 붙인 사본을 만들어 줍니다.

`extern` 블록은 모듈 최상위에만 둘 수 있고, 반드시 ABI 문자열(`"C"`)을 적어야 합니다.

## `unsafe` 가 필요한 이유

컴파일러는 C 함수가 시그니처대로 동작하는지 확인할 방법이 없습니다. 잘못된 포인터를 넘기거나 선언을 틀리게 적으면 메모리가 망가질 수 있습니다. 그래서 `extern "C"` 블록의 함수는 모두 묵시적으로 `unsafe` 이고, `unsafe { ... }` 안에서만 부를 수 있습니다.

```text
error: [type] main.rok:4:12: call to unsafe function `abs` outside an `unsafe` block or `unsafe fn` (spec 4.15; C functions are implicitly unsafe)
  |
4 | println(f"{abs(-1)}");
  |            ^
```

`unsafe` 블록은 "여기서 내가 안전을 보장한다" 는 표시입니다. 블록을 작게 유지하고, 위험한 호출을 안전한 rok 함수로 감싸서 바깥에는 안전한 API 만 보이게 하는 것이 좋은 습관입니다.

## C 문자와 nullable 포인터

C 의 `char` 는 1바이트이고, rok 에서는 `c_char` 타입과 `c'A'` 리터럴로 씁니다. 유니코드 문자인 `char` (`'A'`) 와는 다른 타입이라서, FFI 경계에 닿는 곳이 눈에 잘 띕니다.

```rok
extern "C" {
    fn toupper(c: i32) -> i32;
}

let c: c_char = c'a';
let up = unsafe { toupper(c as i32) };
println(f"toupper: {up} = {up as u8 as char}");
```

```output
toupper: 65 = A
```

C 함수가 NULL 을 돌려줄 수 있다면 반환 타입을 `CPtr<T>` 로 선언합니다. `CPtr` 는 C 와 똑같이 null 을 담을 수 있는 포인터이고, `as_const()` 로 null 이 아닌 `ConstPtr<T> | none` 을 꺼냅니다. 아래 예제는 `getenv` 의 결과를 한 바이트씩 읽어 `str` 로 복사합니다. 위험한 부분은 `from_c` 에 가두고, 바깥에는 안전한 `env_var` 만 내놓습니다.

```rok
use rok::bare::ptr::{CPtr, ConstPtr};

extern "C" {
    fn getenv(name: str) -> CPtr<c_char>;
    fn setenv(name: str, value: str, overwrite: i32) -> i32;
    fn strerror(code: i32) -> str;
}

// Copy a NUL-terminated C string into a rok str.
unsafe fn from_c(p: ConstPtr<c_char>) -> str {
    let sb = StrBuf::new();
    let i: usize = 0;
    loop {
        let b = p.add(i).read();
        if b == c'\0' { break; }
        sb.push_byte(b as u8);
        i += 1;
    }
    sb.to_str()
}

fn env_var(name: str) -> str | none {
    let p = unsafe { getenv(name) }.as_const()?;
    unsafe { from_c(p) }
}

unsafe { setenv("ROK_FFI_DEMO", "hello", 1) };
println(env_var("ROK_FFI_DEMO") ?? "(unset)");
println(env_var("ROK_FFI_MISSING") ?? "(unset)");
println(unsafe { strerror(2) });
```

```output
hello
(unset)
No such file or directory
```

`strerror` 처럼 결코 NULL 을 돌려주지 않는 함수는 반환 타입을 `str` 로 적으면 rok 가 `strlen` 으로 길이를 재서 문자열로 바꿔 줍니다.

## 포인터와 메모리: `rok::bare::ptr`

C 에 버퍼를 넘기려면 원시 포인터가 필요합니다. `rok::bare` 계층에 다음 타입이 있습니다.

| 타입 | C 대응 | null |
|------|--------|------|
| `Ptr<T>`      | `T*`        | 불가 (null 은 `none` 으로 표현) |
| `ConstPtr<T>` | `const T*`  | 불가 |
| `CPtr<T>`     | `T*`        | 가능 |

포인터를 따라 읽고 쓰는 `read()` / `write()` 와 `add(n)` (원소 n 개만큼 이동), `cast::<U>()` 가 기본 연산입니다. 메모리는 `rok::bare::alloc` 으로 C 힙에서 받고 직접 돌려줍니다. GC 가 관리하지 않는 메모리이므로 `dealloc` 을 잊으면 누수입니다.

```rok
use rok::bare::ptr::{Ptr, ConstPtr, size_of};
use rok::bare::alloc;

let xs: List<i32> = [10, 20, 30];
let p = unsafe { alloc::alloc_array::<i32>(xs.len()) }.as_ptr() ?? panic("out of memory");
for i in 0..xs.len() { unsafe { p.add(i).write(xs[i] * 2) }; }
let second = unsafe { p.add(1).read() };
println(f"second: {second}, i32 is {size_of::<i32>()} bytes");
unsafe { alloc::dealloc_array(p, xs.len()) };
```

```output
second: 40, i32 is 4 bytes
```

C 와 구조체를 주고받을 때는 `#[repr(C)]` 를 붙여 필드 배치를 C 와 맞춥니다.

```rok
#[repr(C)]
struct DivT { quot: i32; rem: i32; }

extern "C" {
    fn div(num: i32, den: i32) -> DivT;
}

let r = unsafe { div(17, 5) };
println(f"17 / 5 = {r.quot} rem {r.rem}");
```

```output
17 / 5 = 3 rem 2
```

## 콜백: `extern "C" fn`

`qsort` 처럼 함수 포인터를 받는 C 함수에는 rok 함수를 C ABI 로 컴파일해서 넘깁니다. 함수 정의 앞에 `extern "C"` 를 붙이면 됩니다. 이런 함수는 클로저가 아니므로 주변 변수를 잡을 수 없고, 매개변수와 반환은 FFI 호환 타입(정수, 실수, 포인터, `#[repr(C)]` 구조체)이어야 합니다.

```rok
use rok::bare::ptr::{Ptr, ConstPtr, size_of};
use rok::bare::alloc;

extern "C" {
    fn qsort(base: Ptr<u8>, n: usize, size: usize, cmp: extern "C" fn(ConstPtr<u8>, ConstPtr<u8>) -> i32);
}

extern "C" fn by_value(a: ConstPtr<u8>, b: ConstPtr<u8>) -> i32 {
    let x = unsafe { a.cast::<i32>().read() };
    let y = unsafe { b.cast::<i32>().read() };
    if x < y { -1 } else if x > y { 1 } else { 0 }
}

let xs: List<i32> = [42, 7, 19, 3, 25];
let p = unsafe { alloc::alloc_array::<i32>(xs.len()) }.as_ptr() ?? panic("out of memory");
for i in 0..xs.len() { unsafe { p.add(i).write(xs[i]) }; }

unsafe { qsort(p.cast::<u8>(), xs.len(), size_of::<i32>(), by_value) };

let sorted: List<i32> = [];
for i in 0..xs.len() { sorted.push(unsafe { p.add(i).read() }); }
unsafe { alloc::dealloc_array(p, xs.len()) };
println(f"{sorted:?}");
```

```output
[3, 7, 19, 25, 42]
```

`str` 는 FFI 타입이 아니므로 `extern "C" fn` 의 매개변수로 쓸 수 없습니다. 컴파일러가 `Ptr<u8>` 과 길이를 쓰라고 알려 줍니다.

C 에서 rok 함수를 이름으로 찾게 하려면 `#[export_name]` 으로 심볼 이름을 정합니다. 아래 예제는 같은 프로그램 안에서 그 심볼을 다시 C 함수처럼 선언해 불러 봅니다.

```rok
#[export_name("rok_add")]
pub extern "C" fn add(a: i32, b: i32) -> i32 { a + b }

extern "C" {
    fn rok_add(a: i32, b: i32) -> i32;
}

println(f"{unsafe { rok_add(2, 3) }}");
println(f"{add(4, 5)}");
```

```output
5
9
```

## 라이브러리 링크: `#[link]`

libc 함수는 따로 지정하지 않아도 링크됩니다. 다른 라이브러리는 `extern` 블록에 `#[link("이름")]` 을 붙여 알립니다. 링커에 `-l이름` 이 붙는 것과 같습니다.

```rok
#[link("m")]
extern "C" {
    fn sqrt(x: f64) -> f64;
    fn pow(x: f64, y: f64) -> f64;
}

println(f"{unsafe { sqrt(2.0) }:.4}");
println(f"{unsafe { pow(2.0, 10.0) }}");
```

```output
1.4142
1024
```

정적 라이브러리를 고르려면 `#[link(name = "foo", kind = "static")]` 처럼 씁니다.

> [!NOTE]
> 현재 툴체인은 `#[link]` 를 아직 링커에 전달하지 않습니다. libc 와 libm 은 늘 링크되므로 위 예제는 실행되지만, 아래처럼 다른 라이브러리를 쓰는 코드는 아직 링크 에러가 납니다.

```rok norun
#[link("z")]
extern "C" {
    fn zlibVersion() -> str;
}
println(f"zlib {unsafe { zlibVersion() }}");
```

## 정리

- C 함수는 `extern "C" { fn name(..) -> T; }` 로 선언하고 `unsafe { }` 안에서 부릅니다.
- C `char` 는 `c_char` / `c'A'`, NULL 이 될 수 있는 포인터는 `CPtr<T>` 입니다.
- `Ptr` / `ConstPtr` 의 `read` / `write` / `add` / `cast`, 그리고 `rok::bare::alloc` 으로 C 메모리를 다룹니다.
- 구조체는 `#[repr(C)]`, 콜백은 `extern "C" fn`, 노출할 이름은 `#[export_name]`.
- 위험한 호출은 작은 `unsafe` 함수에 가두고 바깥에는 안전한 함수를 내놓습니다.

## 더 알아보기

- 명세: [5.9 extern 블록](../spec/refs-lang/005-modules/509-extern-block.html), [4.15 unsafe](../spec/refs-lang/004-functions/415-unsafe.html), [6.2.3 link 속성](../spec/refs-lang/006-meta-system/602-built-in-attributes.html#623-link-외부-라이브러리-명시), [C 호환 문자](../spec/refs-lang/001-lexical/108-character-literals.html)
- 표준 라이브러리 명세: [FFI](../spec/refs-standard-libraries/100-bare/107-ffi.html), [포인터](../spec/refs-standard-libraries/100-bare/101-ptr.html)
- API: [rok::bare::ptr](../std/bare/ptr.html), [rok::bare::alloc](../std/bare/alloc.html), [rok::bare::mem](../std/bare/mem.html)
