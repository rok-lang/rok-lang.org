<div class="hero">
<img src="logo.png" alt="rok 로고">

# rok

<div class="lead">언어는 작게, 라이브러리는 풍부하게.<br>정적 타입, 닫힌 합 타입, AOT 컴파일, 그리고 REPL 과 Jupyter 까지.</div>
<div class="cta"><a class="primary" href="start.html">시작하기</a><a href="spec/refs-lang/index.html">언어 참조</a><a href="spec/refs-standard-libraries/index.html">표준 라이브러리</a></div>
</div>

## rok 은

rok 은 "하고 싶은 모든 것을 할 수 있는 언어 하나" 를 목표로 하는 프로그래밍 언어입니다. 설계는 두 슬로건을 따릅니다.

- **언어는 작게, 라이브러리는 풍부하게.** 숫자 의미론, 형 변환, 컬렉션, 입출력, 동시성처럼 언어의 느낌을 정하는 요소 대부분이 표준 라이브러리에 있습니다.
- **통제 속의 자유.** 정적 타입, 닫힌 합 타입, 트레잇-as-타입 금지, 묵시적 승급 금지, AOT-only 컴파일로 길을 좁히는 대신, 그 안의 코드는 예측 가능해집니다.

자세한 동기와 철학은 [사양 소개](spec/index.html) 에 있습니다.

## 한눈에 보기

합 타입과 `match`, `T | none` 과 `??`, 그리고 `throws` / `try` / `catch` 로 드러나는 에러 흐름입니다.

```rok
enum Shape {
    Circle(f64),
    Rect { w: f64; h: f64; },
}

fn area(s: Shape) -> f64 {
    match s {
        Shape::Circle(r) => 3.14159 * r * r,
        Shape::Rect { w, h } => w * h,
    }
}

fn find(xs: List<str>, key: str) -> usize | none {
    for i in 0..xs.len() {
        if xs[i] == key { return i; }
    }
    none
}

fn parse_port(s: str) throws (ParseError) -> u16 {
    try s.parse::<u16>()
}

fn main() {
    let shapes = [Shape::Circle(1.0), Shape::Rect { w: 2.0, h: 3.0 }];
    for s in shapes { println(f"area = {area(s):.2}"); }

    let at = find(["ada", "grace", "linus"], "grace") ?? 99;
    println(f"grace at {at}");

    let port = try parse_port("80x") catch e { 8080u16 };
    println(f"port {port}");
}
```

한 줄짜리 스크립트도 그대로 실행됩니다.

```rok
println("Hello, world!");
```

<div class="cards">
<div class="card">

### 설치

툴체인을 소스에서 빌드하고 `rok new` 로 첫 패키지를 만듭니다. [시작하기](start.html)

</div>
<div class="card">

### 언어 참조

어휘 구조부터 타입, 표현식, 모듈, 메타 시스템, 런타임, ABI 까지 열 개의 장. [언어 참조](spec/refs-lang/index.html)

</div>
<div class="card">

### 표준 라이브러리

`bare` / `core` / `std` 세 계층. 컬렉션, 문자열, `fs`, `net`, `process`, RokON. [표준 라이브러리](spec/refs-standard-libraries/index.html)

</div>
<div class="card">

### 도구

`rokc` 컴파일러, `rok` 패키지 도구, REPL, Jupyter 커널, 디버그 도구. [도구](spec/refs-lang/009-tools/index.html)

</div>
</div>

## 패키지

rok 패키지(stone)는 [rokstones.io](https://rokstones.io) 에서 찾을 수 있게 될 예정입니다. 지금은 `rok add <name> --path <dir>` 이나 `--git <url>` 로 의존성을 추가합니다.
