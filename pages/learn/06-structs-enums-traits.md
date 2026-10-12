# 6. Structs, Enums, and Traits

Now it's time to define your own types. This chapter covers `struct`, which groups data; `enum`, which lists named cases; and `trait`, which defines behavior shared by several types.

## Structs and field defaults

A `struct` is a group of named fields. Fields are written `name: Type;` and can be given a default with `= value`. Fields with defaults may be omitted at construction.

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

Defaults may only be literals or `const` expressions. Initial values that must be computed at runtime go in a constructor function such as `fn new() -> Config`. There are also tuple structs, whose fields are identified by position (`struct Rgb(u8, u8, u8);`), and field-less unit structs (`struct Marker;`).

## Methods: `impl` and `self`

Functions inside an `impl Type { ... }` block become methods of that type. If the first parameter is `self`, it is an instance method (`p.dist2(q)`); otherwise it is a static method (`Point::origin()`). Methods that modify fields take `ref self`.

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

Changes made by a `ref self` method are reflected in the caller's variable. You don't need to write `ref` at the call site.

## enum: named cases

An `enum` defines a value that is one of several variants. A variant may carry no data (`Empty`), positional fields (`Circle(f64)`), or named fields (`Rect { w: f64; h: f64; }`). Construct values like `Shape::Circle(1.0)` and destructure them with patterns of the same shape in `match`.

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

`s is Shape::Circle` tests only the variant, regardless of the payload.

How is this different from a sum type? A sum type groups existing types without names, while an `enum` gives each case a meaningful name. If you need to tell a "radius" from a "side length" even though both are `f64`, an `enum` is the right choice.

## Traits and default methods

A `trait` is a list of methods a type must provide. Methods written as a signature without a body must be supplied by the implementor; methods with a body serve as default implementations. Implement a trait with `impl Trait for Type`.

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

## Automatic implementations with derive

Mechanical implementations such as comparison, hashing, and debug output are generated with `#[derive(...)]`. The built-in derives are `Clone`, `Copy`, `Debug`, `Default`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, and `Hash`; the standard library adds `Rokon` for RokON serialization.

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

`Ord` compares fields in declaration order, so `sort` orders by version. `Display` cannot be derived: the type's author decides its human-readable format (see the example in the operators section below).

## Traits are not types

In rok, a trait name cannot be used directly in type position. `fn f(a: Animal)` is a compile error. This prevents hidden dynamic dispatch costs.

```text
error: trait `Animal` cannot be used as a type directly — use a closed sum (`A | B`)
       or a generic parameter (`<T: Animal>`) instead
```

Instead, choose one of three approaches depending on the situation.

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

If the candidates are a fixed few, use a sum type; if the set is open, use generics (next chapter); if one collection must mix several implementations, use `any Trait`, whose cost is made visible by `any`.

## Operator traits

Operators such as `+`, `==`, and `<` are all trait method calls. `+` is `Add`, and string interpolation `{x}` is `Display`. So implementing these traits gives your own types operators and printing.

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

`type Output = V2;` sets the trait's **associated type**. We'll see these again in the next chapter.

## Summary

- `struct` fields can have defaults via `= value`, and methods live in `impl` blocks. Methods that modify take `ref self`.
- `enum` variants come in three shapes, unit, tuple, and named, and are destructured with `match`.
- A `trait` has required and default methods and is implemented with `impl Trait for Type`.
- `#[derive(...)]` automatically implements `Debug`, `Clone`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash`, `Default`, and `Rokon`.
- Traits are not types. Choose among generics, sum types, and `any Trait`.
- Operators and `{x}` printing also come from implementing traits (`Add`, `Display`, and so on).

## Learn more

- [2.3. `struct`](../spec/refs-lang/002-types/203-struct.html), [2.4. `enum`](../spec/refs-lang/002-types/204-enum.html), [2.5. `union`](../spec/refs-lang/002-types/205-union.html)
- [2.8. `trait`](../spec/refs-lang/002-types/208-trait.html), [2.9. `impl`](../spec/refs-lang/002-types/209-impl.html), [4.9. Methods](../spec/refs-lang/004-functions/409-method.html)
- [6.2.1. `#[derive(...)]`](../spec/refs-lang/006-meta-system/602-built-in-attributes.html#621-derive-automatic-trait-implementation)
- [2.12. Trait-as-type ban](../spec/refs-lang/002-types/212-trait-as-type-banned.html), [2.2.10. `any Trait`](../spec/refs-lang/002-types/202-any-slot.html#2210-constrained-any-any-trait)
- [3.1. Operator dispatch](../spec/refs-lang/003-expressions/301-operator-dispatch.html), API: [`Add`](../std/core/ops.html#trait.Add), [`Display`](../std/core/fmt.html#trait.Display), [RokON](../std/std/rokon.html)
- Next chapter: [7. Generics](07-generics.html)
