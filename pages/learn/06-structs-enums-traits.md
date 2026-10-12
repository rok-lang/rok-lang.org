# 6. 구조체, enum, 트레잇

이제 자기만의 타입을 만들 차례입니다. 이 장에서는 데이터를 묶는 `struct`, 이름 붙은 경우들을 나열하는 `enum`, 그리고 여러 타입이 공유하는 동작을 정의하는 `trait` 를 배웁니다.

## 구조체와 필드 기본값

`struct` 는 이름 있는 필드의 묶음입니다. 필드는 `이름: 타입;` 으로 적고, `= 값` 으로 기본값을 줄 수 있습니다. 기본값이 있는 필드는 생성할 때 생략해도 됩니다.

```rok
struct Config {
    name: str;
    retry: i32 = 3;
    verbose: bool = false;
}

let a = Config { name: "api" };
let b = Config { name: "db", retry: 5 };
println(f"{a.name} retry={a.retry} verbose={a.verbose}");
println(f"{b.name} retry={b.retry}");
```

```output
api retry=3 verbose=false
db retry=5
```

기본값에는 리터럴이나 `const` 식만 쓸 수 있습니다. 실행 시점에 계산해야 하는 초기값은 `fn new() -> Config` 같은 생성 함수로 만듭니다. 이 밖에 위치로 필드를 구분하는 tuple struct (`struct Rgb(u8, u8, u8);`) 와 필드 없는 unit struct (`struct Marker;`) 도 있습니다.

## 메서드: `impl` 과 `self`

`impl 타입 { ... }` 블록 안의 함수가 그 타입의 메서드가 됩니다. 첫 매개변수가 `self` 이면 인스턴스 메서드 (`p.dist2(q)`), 없으면 정적 메서드 (`Point::origin()`) 입니다. 필드를 고치는 메서드는 `ref self` 로 받습니다.

```rok
struct Point { x: f64; y: f64; }

impl Point {
    fn origin() -> Point { Point { x: 0.0, y: 0.0 } }

    fn dist2(self, o: Point) -> f64 {
        let dx = self.x - o.x;
        let dy = self.y - o.y;
        dx * dx + dy * dy
    }

    fn shift(ref self, dx: f64) { self.x += dx; }
}

let p = Point { x: 3.0, y: 4.0 };
println(f"{p.dist2(Point::origin())}");
p.shift(1.5);
println(f"{p.x}");
```

```output
25
4.5
```

`ref self` 메서드의 변경은 호출한 쪽의 변수에 반영됩니다. 호출할 때 `ref` 를 따로 적을 필요는 없습니다.

## enum: 이름 붙은 경우들

`enum` 은 여러 변형 중 하나인 값을 정의합니다. 변형은 데이터가 없을 수도 (`Empty`), 위치 필드를 가질 수도 (`Circle(f64)`), 이름 있는 필드를 가질 수도 (`Rect { w: f64; h: f64; }`) 있습니다. 값은 `Shape::Circle(1.0)` 처럼 만들고, `match` 의 같은 모양 패턴으로 풉니다.

```rok
enum Shape {
    Circle(f64),
    Rect { w: f64; h: f64; },
    Empty,
}

fn area(s: Shape) -> f64 {
    match s {
        Shape::Circle(r) => 3.0 * r * r,
        Shape::Rect { w, h } => w * h,
        Shape::Empty => 0.0,
    }
}

let shapes = [Shape::Circle(1.0), Shape::Rect { w: 2.0, h: 3.0 }, Shape::Empty];
for s in shapes {
    println(f"{area(s)}");
}
println(f"{shapes[0] is Shape::Circle}");
```

```output
3
6
0
true
```

`s is Shape::Circle` 는 payload 와 상관없이 변형만 검사합니다.

합 타입과 무엇이 다를까요? 합 타입은 이미 있는 타입들을 이름 없이 묶고, `enum` 은 각 경우에 의미 있는 이름을 붙입니다. 같은 `f64` 라도 "반지름" 과 "한 변" 을 구별해야 한다면 `enum` 이 맞습니다.

## 트레잇과 기본 메서드

`trait` 는 타입이 갖춰야 할 메서드 목록입니다. 본체 없이 시그니처만 적은 메서드는 구현하는 쪽이 채워야 하고, 본체가 있는 메서드는 기본 구현으로 쓰입니다. 구현은 `impl 트레잇 for 타입` 으로 합니다.

```rok
trait Animal {
    fn name(self) -> str;
    fn sound(self) -> str;
    fn speak(self) -> str { f"{self.name()}: {self.sound()}!" }
}

struct Dog;
struct Cat { lives: i32; }

impl Animal for Dog {
    fn name(self) -> str { "dog" }
    fn sound(self) -> str { "woof" }
}

impl Animal for Cat {
    fn name(self) -> str { "cat" }
    fn sound(self) -> str { "meow" }
    fn speak(self) -> str { f"cat ({self.lives} lives): meow" }
}

println(Dog.speak());
println(Cat { lives: 9 }.speak());
```

```output
dog: woof!
cat (9 lives): meow
```

## derive 로 자동 구현

비교, 해시, 디버그 출력처럼 기계적인 구현은 `#[derive(...)]` 로 자동 생성합니다. 내장 derive 는 `Clone`, `Copy`, `Debug`, `Default`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash` 이고, 표준 라이브러리는 RokON 직렬화를 위한 `Rokon` 을 더 제공합니다.

```rok
use rok::std::rokon;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Default, Rokon)]
struct Version { major: i32; minor: i32; }

let vs = [Version { major: 1, minor: 2 }, Version { major: 0, minor: 9 }];
vs.sort();
println(f"{vs:?}");

let seen: Set<Version> = Set::new();
seen.insert(vs[0].clone());
println(f"{seen.contains(Version { major: 0, minor: 9 })}");

let zero: Version = Default::default();
println(f"{zero == vs[0]}");
println(rokon::to_string(vs[1]));
```

```output
[Version { major: 0, minor: 9 }, Version { major: 1, minor: 2 }]
true
false
Version { major: 1, minor: 2 }
```

`Ord` 는 필드를 선언 순서대로 비교하므로 `sort` 가 버전 순으로 정렬합니다. `Display` 는 derive 할 수 없습니다. 사람이 읽을 표시 형식은 타입 작성자가 직접 정합니다 (아래 연산자 절의 예).

## 트레잇은 타입이 아닙니다

rok 에서는 트레잇 이름을 타입 자리에 그대로 쓸 수 없습니다. `fn f(a: Animal)` 은 컴파일 에러입니다. 숨은 동적 디스패치 비용을 막기 위해서입니다.

```text
error: trait `Animal` cannot be used as a type directly — use a closed sum (`A | B`)
       or a generic parameter (`<T: Animal>`) instead
```

대신 상황에 맞는 세 가지 방법 중 하나를 고릅니다.

```rok
trait Animal { fn sound(self) -> str; }
struct Dog;
struct Cat;
impl Animal for Dog { fn sound(self) -> str { "woof" } }
impl Animal for Cat { fn sound(self) -> str { "meow" } }

// 1. Open set of types: a generic with a bound (static dispatch).
fn twice<T: Animal>(a: T) -> str { f"{a.sound()} {a.sound()}" }

// 2. Closed set of types: a sum type.
fn loud(a: Dog | Cat) -> str {
    match a {
        d: Dog => d.sound().to_uppercase(),
        c: Cat => c.sound().to_uppercase(),
    }
}

// 3. Mixed types decided at runtime: `any Trait` (dynamic dispatch, visible in the type).
let zoo: List<any Animal> = [Dog, Cat];

println(twice(Dog));
println(loud(Cat));
for a in zoo { println(a.sound()); }
```

```output
woof woof
MEOW
woof
meow
```

후보가 몇 개로 정해져 있으면 합 타입, 열려 있으면 제네릭 (다음 장), 한 컬렉션에 여러 구현이 섞여야 하면 비용이 `any` 로 드러나는 `any Trait` 을 씁니다.

## 연산자 트레잇

`+`, `==`, `<` 같은 연산자는 모두 트레잇 메서드 호출입니다. `+` 는 `Add`, 문자열 보간 `{x}` 는 `Display` 입니다. 그러니 트레잇을 구현하면 내 타입에도 연산자와 출력이 생깁니다.

```rok
struct V2 { x: i32; y: i32; }

impl Add for V2 {
    type Output = V2;
    fn add(self, o: V2) -> V2 { V2 { x: self.x + o.x, y: self.y + o.y } }
}

impl Display for V2 {
    fn fmt(self, ref f: Formatter) throws (FmtError) {
        try f.write_str(f"({self.x}, {self.y})")
    }
}

let v = V2 { x: 1, y: 2 } + V2 { x: 10, y: 20 };
println(f"v = {v}");
```

```output
v = (11, 22)
```

`type Output = V2;` 는 트레잇의 **연관 타입** 을 정하는 줄입니다. 다음 장에서 다시 만납니다.

## 정리

- `struct` 필드는 `= 값` 으로 기본값을 가질 수 있고, 메서드는 `impl` 블록에 둡니다. 고치는 메서드는 `ref self` 를 받습니다.
- `enum` 변형은 unit, tuple, named 세 모양이며 `match` 로 풉니다.
- `trait` 는 요구 메서드와 기본 메서드를 갖고, `impl 트레잇 for 타입` 으로 구현합니다.
- `#[derive(...)]` 로 `Debug`, `Clone`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash`, `Default`, `Rokon` 을 자동 구현합니다.
- 트레잇은 타입이 아닙니다. 제네릭, 합 타입, `any Trait` 중에서 고릅니다.
- 연산자와 `{x}` 출력도 트레잇 (`Add`, `Display` 등) 구현으로 얻습니다.

## 더 알아보기

- [2.3. `struct`](../spec/refs-lang/002-types/203-struct.html), [2.4. `enum`](../spec/refs-lang/002-types/204-enum.html), [2.5. `union`](../spec/refs-lang/002-types/205-union.html)
- [2.8. `trait`](../spec/refs-lang/002-types/208-trait.html), [2.9. `impl`](../spec/refs-lang/002-types/209-impl.html), [4.9. 메서드](../spec/refs-lang/004-functions/409-method.html)
- [6.2.1. `#[derive(...)]`](../spec/refs-lang/006-meta-system/602-built-in-attributes.html#621-derive-자동-트레잇-구현)
- [2.12. 트레잇-as-타입 금지](../spec/refs-lang/002-types/212-trait-as-type-banned.html), [2.2.10. `any Trait`](../spec/refs-lang/002-types/202-any-slot.html#2210-제약-붙은-any-any-trait)
- [3.1. 연산자 디스패치](../spec/refs-lang/003-expressions/301-operator-dispatch.html), API: [`Add`](../std/core/ops.html#trait.Add), [`Display`](../std/core/fmt.html#trait.Display), [RokON](../std/std/rokon.html)
- 다음 장: [7. 제네릭](07-generics.html)
