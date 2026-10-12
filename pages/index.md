<div class="hero">
<img src="logo.png" alt="rok 로고">

# rok

<div class="lead">언어는 작게, 라이브러리는 풍부하게.<br>정적 타입, 닫힌 합 타입, AOT 컴파일, 그리고 REPL 과 Jupyter 까지.</div>
<div class="cta"><a class="primary" href="learn/01-getting-started.html">시작하기</a><a href="learn/index.html">rok 배우기</a><a href="examples/index.html">예제</a><a href="spec/refs-lang/index.html">언어 참조</a><a href="std/index.html">API</a></div>
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

```output
area = 3.14
area = 6.00
grace at 1
port 8080
```

한 줄짜리 스크립트도 그대로 실행됩니다.

```rok
println("Hello, world!");
```

```output
Hello, world!
```

<div class="cards">
<div class="card">

### rok 배우기

설치, 값과 타입부터 에러 처리, 모듈, 동시성, IO, FFI, 도구까지 열여섯 장. 모든 코드가 실행됩니다. [rok 배우기](learn/index.html)

</div>
<div class="card">

### 예제

CLI 도구, 파일 처리, TCP 에코 서버, 병렬 map, 인터프리터 같은 완성된 작은 프로그램들. [예제](examples/index.html)

</div>
<div class="card">

### 언어 참조

어휘 구조부터 타입, 표현식, 모듈, 메타 시스템, 런타임, ABI 까지 열 개의 장. [언어 참조](spec/refs-lang/index.html)

</div>
<div class="card">

### 표준 라이브러리

`bare` / `core` / `std` 세 계층의 [사양](spec/refs-standard-libraries/index.html) 과, 소스에서 뽑은 [API 목록](std/index.html).

</div>
<div class="card">

### 도구

`rokc` 컴파일러, `rok` 패키지 도구, REPL, Jupyter 커널, LSP, 디버그 도구. [도구](spec/refs-lang/009-tools/index.html)

</div>
</div>

## 패키지

rok 패키지는 stone 이라고 부릅니다. [rokstones.io](https://rokstones.io) 레지스트리의 stone 은 `rok add <name>` 으로, 로컬 경로나 git 저장소는 `rok add <name> --path <dir>` / `--git <url>` 로 의존성에 더합니다. 자세한 내용은 [모듈과 패키지](learn/11-modules-packages.html) 에 있습니다.
