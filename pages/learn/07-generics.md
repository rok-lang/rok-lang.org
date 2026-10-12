# 7. 제네릭

같은 로직을 여러 타입에 쓰고 싶을 때 제네릭을 씁니다. rok 의 제네릭은 호출된 구체 타입마다 따로 컴파일되므로 (단형화), 손으로 타입별 함수를 쓴 것과 같은 속도로 돕니다.

## 제네릭 함수

함수 이름 뒤 `<T>` 에 타입 매개변수를 선언하고, 매개변수와 반환 타입에서 씁니다. 호출할 때는 보통 타입을 적지 않아도 컴파일러가 인자에서 추론합니다.

```rok
fn first_or<T>(xs: List<T>, fallback: T) -> T {
    xs.first() ?? fallback
}

println(f"{first_or([10, 20], 0)}");
println(first_or(["a", "b"], "-"));
let empty: List<f64> = [];
println(f"{first_or(empty, 1.5)}");
```

```output
10
a
1.5
```

한 호출 안에서 `T` 는 한 타입입니다. `first_or([1, 2], "x")` 처럼 서로 다른 타입을 넘기면 컴파일 에러입니다.

## 트레잇 바운드

바운드 없는 `T` 로는 값을 옮기는 일밖에 할 수 없습니다. 비교하거나 더하려면 `T: Ord` 처럼 **바운드** 로 필요한 트레잇을 요구합니다. 여러 개는 `+` 로 잇습니다. 컴파일러는 제네릭 본체를 바운드만 보고 검사하므로, 어떤 타입으로 호출하든 본체가 깨지지 않습니다.

```rok
fn largest<T: Ord>(xs: List<T>) -> T? {
    let best = xs.first()?;
    for x in xs {
        if x > best { best = x; }
    }
    best
}

println(f"{largest([3, 9, 2]):?}");
println(f"{largest(["pear", "apple"]):?}");
let none_here: List<i32> = [];
println(f"{largest(none_here):?}");
```

```output
9
"pear"
none
```

`T: Zero` 이면 `T::zero()` 처럼 타입 매개변수 위의 정적 메서드도 부를 수 있습니다.

```rok
fn sum<T: Zero + Add<Output = T>>(xs: List<T>) -> T {
    let acc = T::zero();
    for x in xs { acc = acc + x; }
    acc
}

println(f"{sum([1, 2, 3])} {sum([0.5, 0.25])}");
```

```output
6 0.75
```

## `where` 절

바운드가 길어지면 시그니처 끝의 `where` 로 옮기면 읽기 쉽습니다. 의미는 같습니다.

```rok
fn join_all<T>(xs: List<T>, sep: str) -> str
where
    T: Display,
{
    let out = StrBuf::new();
    for i in 0..xs.len() {
        if i > 0 { out.push_str(sep); }
        out.push_str(f"{xs[i]}");
    }
    out.to_str()
}

println(join_all([1, 2, 3], ", "));
println(join_all([true, false], " / "));
```

```output
1, 2, 3
true / false
```

## 제네릭 구조체와 impl

구조체와 enum 도 타입 매개변수를 가질 수 있습니다. 메서드를 붙일 때는 `impl<A, B> Pair<A, B>` 처럼 `impl` 에도 매개변수를 선언합니다.

```rok
struct Pair<A, B> { first: A; second: B; }

impl<A, B> Pair<A, B> {
    fn swap(self) -> Pair<B, A> {
        Pair { first: self.second, second: self.first }
    }
}

let p = Pair { first: 1, second: "one" };
let q = p.swap();
println(f"{q.first} {q.second}");
```

```output
one 1
```

## 연관 타입

트레잇이 구현마다 다른 타입을 하나 정하게 하려면 **연관 타입** `type Item;` 을 둡니다. 트레잇 안에서는 그냥 `Item` 으로, 바깥의 제네릭 코드에서는 `C::Item` 으로 가리킵니다. 표준 `Iterator` 가 이 방식입니다 (다음 장).

```rok
trait Container {
    type Item;
    fn get(self, i: usize) -> Item | none;
    fn first(self) -> Item | none { self.get(0) }
}

struct Shelf { books: List<str>; }

impl Container for Shelf {
    type Item = str;
    fn get(self, i: usize) -> str? { self.books.get(i) }
}

fn first_of<C: Container>(c: C) -> C::Item | none { c.first() }

let s = Shelf { books: ["Dune", "Emma"] };
println(f"{first_of(s):?} {s.get(5):?}");
```

```output
"Dune" none
```

타입 매개변수로 두지 않고 연관 타입으로 두는 이유는, 한 타입에 대해 `Item` 이 딱 하나로 정해지기 때문입니다. 쓰는 쪽은 `Shelf` 의 원소 타입을 따로 적을 필요가 없습니다.

## const 제네릭

타입 대신 컴파일 타임 **값** 을 매개변수로 받을 수도 있습니다. 고정 길이 배열 `[T; N]` 의 길이처럼, 값이 타입의 일부가 되는 경우에 씁니다.

```rok
fn total<const N: usize>(a: [i32; N]) -> i32 {
    let s = 0;
    for i in 0..N { s += a[i]; }
    s
}

let a: [i32; 4] = [1, 2, 3, 4];
let z: [f64; 3] = [0.5; 3];
println(f"{total(a)} {a.len()} {z:?}");
```

```output
10 4 [0.5, 0.5, 0.5]
```

`const` 매개변수는 정수, `bool`, `char` 만 될 수 있습니다.

## 제네릭과 `any`

제네릭은 정적입니다. 반대로 실행 중에 담긴 값의 타입이 바뀌어도 되는 슬롯이 필요하면 `any` 라고 **명시** 합니다. `any` 값은 `is` 로 좁혀서 씁니다. 동적 디스패치 비용은 `any` 라고 적은 자리에만 생깁니다.

```rok
let v: any = 1;
println(f"{v is i32}");
v = "text";
if v is str {
    println(f"이제 문자열, 길이 {v.len()}");
}
```

```output
true
이제 문자열, 길이 4
```

사양에서는 매개변수 타입을 생략한 함수 `fn show_sum(x, y)` 를 `any` 가 아니라 암묵 제네릭으로 정의합니다. 본체의 쓰임에서 바운드를 추론하고, 호출 지점마다 단형화합니다.

```rok norun
fn show_sum(x, y) { println(f"{x + y}"); }   // implicit generic: T: Add<U>

show_sum(1, 2);       // 3
show_sum(1.5, 2.0);   // 3.5
```

> [!NOTE]
> 현재 툴체인은 타입을 생략한 매개변수를 `any` 로 다루어 위 예제가 컴파일되지 않습니다. 그동안은 `fn show_sum<T: Add<Output = T> + Display>(x: T, y: T)` 처럼 바운드를 적어 주세요.

## 정리

- `fn f<T>(..)`, `struct S<A, B>`, `impl<A, B> S<A, B>` 로 제네릭을 선언합니다. 타입 인자는 대개 추론됩니다.
- 바운드 `T: Ord + Clone` 이 본체에서 쓸 수 있는 연산을 정합니다. 길면 `where` 절로 옮깁니다.
- 연관 타입 `type Item;` 은 구현마다 하나로 정해지는 타입이며, 바깥에서는 `C::Item` 으로 씁니다.
- `const N: usize` 로 값을 타입 매개변수로 받을 수 있습니다.
- 제네릭은 정적 (단형화), `any` 는 명시한 자리에만 생기는 동적 슬롯입니다.

## 더 알아보기

- [2.10. 제네릭](../spec/refs-lang/002-types/210-generics.html): [2.10.3. 트레잇 바운드](../spec/refs-lang/002-types/210-generics.html#2103-트레잇-바운드), [2.10.4. where 절](../spec/refs-lang/002-types/210-generics.html#2104-where-절), [2.10.7. 점진과의 결합](../spec/refs-lang/002-types/210-generics.html#2107-점진과의-결합)
- [2.8.3. 연관 타입](../spec/refs-lang/002-types/208-trait.html#283-연관-타입-associated-type)
- [2.11. `const` 제네릭](../spec/refs-lang/002-types/211-const-generics.html)
- [2.2. `any` 슬롯](../spec/refs-lang/002-types/202-any-slot.html)
- 다음 장: [8. 컬렉션과 반복자](08-collections-iterators.html)
