# 8. 컬렉션과 반복자

프로그램 대부분은 값 여러 개를 모으고, 훑고, 바꾸는 일입니다. 이 장에서는 표준 컬렉션 (`List`, `Dict`, `Set` 과 그 친척들), 슬라이싱, 그리고 이들을 하나로 이어 주는 `Iterator` 를 배웁니다.

## List

`[1, 2, 3]` 은 동적 배열 `List<T>` 입니다. 인덱스는 0 부터, 음수 인덱스는 끝에서부터 셉니다. 범위 밖 `xs[i]` 는 panic 이므로, 없을 수 있는 자리는 `T | none` 을 돌려주는 `get` 으로 읽습니다.

```rok
let xs = [5, 3, 8, 1];
xs.push(7);
println(f"{xs:?} len={xs.len()}");
println(f"{xs[0]} {xs[-1]} {xs.get(10):?}");

xs.sort();
let top = xs.pop();
println(f"{xs:?} popped={top:?}");

xs.insert(0, 0);
xs.remove(1);
println(f"{xs:?} first={xs.first():?}");
```

```output
[5, 3, 8, 1, 7] len=5
5 7 none
[1, 3, 5, 7] popped=8
[0, 3, 5, 7] first=0
```

`List`, `Dict`, `Set` 은 **참조 핸들** 입니다. `let ys = xs;` 나 함수 인자 전달은 같은 컬렉션을 공유하고, 독립된 사본이 필요하면 `clone()` 을 부릅니다.

```rok
let xs = [1, 2];
let shared = xs;
let copy = xs.clone();
shared.push(3);
copy.push(99);
println(f"{xs:?} {copy:?}");
```

```output
[1, 2, 3] [1, 2, 99]
```

## 슬라이싱

`xs[start:end:step]` 은 Python 과 같은 의미입니다. 경계는 길이에 맞춰 잘리므로 슬라이싱은 범위 때문에 panic 하지 않습니다. `List` 를 자르면 원본 버퍼를 가리키는 `Slice<T>` 뷰가 나오고, 독립된 리스트가 필요하면 `to_list()` 로 복사합니다.

```rok
let xs = [10, 20, 30, 40, 50];
println(f"{xs[1:3]:?} {xs[:2]:?} {xs[-2:]:?}");
println(f"{xs[::2]:?} {xs[::-1]:?} {xs[3:100]:?}");

let part = xs[1:4];
println(f"{part.len()} {part[0]} {part.to_list():?}");
```

```output
[20, 30] [10, 20] [40, 50]
[10, 30, 50] [50, 40, 30, 20, 10] [40, 50]
3 20 [20, 30, 40]
```

## Dict 와 Set

`{"키": 값}` 은 해시 맵 `Dict<K, V>`, `{1, 2}` 는 해시 집합 `Set<T>` 입니다. 빈 `{}` 는 블록이므로 빈 컬렉션은 `Dict::new()` / `Set::new()` 로 만듭니다. `d[k]` 는 키가 없으면 panic, `d.get(k)` 는 `V | none` 입니다.

```rok
let ages: Dict<str, i32> = {"kim": 30, "lee": 25};
ages["park"] = 41;
ages.remove("lee");
println(f"{ages["kim"]} {ages.get("choi") ?? -1} {ages.contains_key("park")} {ages.len()}");

let counts: Dict<str, i32> = Dict::new();
for w in ["a", "b", "a", "a"] {
    counts.entry(w).and_modify(|c| c + 1).or_insert(1);
}
println(f"a={counts["a"]} b={counts["b"]}");

let s: Set<i32> = {1, 2, 3};
let t: Set<i32> = {2, 3, 4};
println(f"{s.contains(2)} {s.intersection(t).len()} {s.union(t).len()}");
```

```output
30 -1 true 2
a=3 b=1
true 2 4
```

> [!WARNING]
> `Dict` 와 `Set` 의 순회 순서는 정해져 있지 않습니다. 순서가 중요하면 삽입 순서를 지키는 `OrderedDict` / `OrderedSet` 을 씁니다.

## OrderedDict, OrderedSet, Deque

`OrderedDict` 와 `OrderedSet` 은 넣은 순서대로 돕니다. `Deque` 는 양 끝에서 넣고 빼는 큐입니다.

```rok
let od: OrderedDict<str, i32> = OrderedDict::new();
od.insert("zebra", 1);
od.insert("apple", 2);
for (k, v) in od.entries() { println(f"{k}={v}"); }

let tags = OrderedSet::from(["b", "a", "b", "c"]);
println(f"{tags:?}");

let q: Deque<i32> = Deque::new();
q.push_back(1);
q.push_back(2);
q.push_front(0);
println(f"{q:?}");
let front = q.pop_front();
let back = q.pop_back();
println(f"{front:?} {back:?} {q:?}");
```

```output
zebra=1
apple=2
{"b", "a", "c"}
[0, 1, 2]
0 2 [1]
```

## 반복자와 어댑터

`for x in 컬렉션` 은 `Iterator` 를 돕니다. 컬렉션의 `iter()` 가 돌려주는 반복자에는 `map`, `filter`, `enumerate`, `zip`, `take`, `skip`, `rev`, `step_by`, `chain` 같은 **어댑터** 를 이어 붙일 수 있습니다. 어댑터는 게으릅니다. `collect`, `sum`, `fold`, `count` 처럼 값을 실제로 소비하는 메서드가 불릴 때 비로소 돕니다.

```rok
let xs = [1, 2, 3, 4, 5, 6];

let evens: List<i32> = xs.iter().filter(|x| x % 2 == 0).map(|x| x * 10).collect();
println(f"{evens:?}");
println(f"{xs.iter().sum()} {xs.iter().count()} {xs.iter().any(|x| x > 5)}");
println(f"{xs.iter().fold(0, |acc, x| acc + x * x)}");
println(f"{xs.iter().find(|x| x > 3):?} {xs.iter().position(|x| x == 3):?} {xs.iter().max():?}");

for (i, x) in xs.iter().enumerate().skip(4) { println(f"{i}: {x}"); }

let names = ["a", "b", "c"];
let pairs: List<str> = names.iter().zip(xs.iter()).map(|p| f"{p.0}{p.1}").collect();
println(f"{pairs:?}");

let back: List<i32> = xs.iter().rev().take(2).collect();
let uniq: Set<i32> = [1, 1, 2].iter().collect();
println(f"{back:?} {uniq.len()}");
```

```output
[20, 40, 60]
21 6 true
91
4 2 6
4: 5
5: 6
["a1", "b2", "c3"]
[6, 5] 2
```

`collect` 는 받는 쪽의 타입 (`List<i32>`, `Set<i32>`, ...) 에 맞춰 모읍니다. 그래서 `let` 에 타입을 적어 줍니다.

## 직접 만드는 반복자: `Iterator` 와 `yield`

`Iterator` 트레잇은 연관 타입 `Item` 과 메서드 `next(ref self) -> Item | none` 하나만 요구합니다. 나머지 어댑터는 모두 기본 메서드로 따라옵니다.

```rok
struct Countdown { n: i32; }

impl Iterator for Countdown {
    type Item = i32;
    fn next(ref self) -> i32 | none {
        if self.n == 0 { return none; }
        self.n -= 1;
        self.n + 1
    }
}

let c: List<i32> = Countdown { n: 3 }.collect();
println(f"{c:?}");
for v in (Countdown { n: 5 }).filter(|v| v % 2 == 1) { println(f"{v}"); }
```

```output
[3, 2, 1]
5
3
1
```

상태를 손으로 관리하기 번거로우면 **제너레이터** 를 씁니다. `yield fn` 은 본체에서 `yield 값;` 으로 하나씩 내보내는 함수이고, 호출 결과는 반복자 (`GenIter<T>`) 입니다. 끝없이 도는 제너레이터도 `take` 로 필요한 만큼만 꺼내면 됩니다. 식 자리에서는 `yield { ... }` 블록으로 바로 만들 수도 있습니다.

```rok
yield fn fib() -> i64 {
    let a = 0i64;
    let b = 1i64;
    loop {
        yield a;
        let t = a + b;
        a = b;
        b = t;
    }
}

let first: List<i64> = fib().take(10).collect();
println(f"{first:?}");

let squares = yield { for i in 1..5 { yield i * i; } };
for v in squares { print(f"{v} "); }
println("");
```

```output
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
1 4 9 16
```

## 브로드캐스트 연산자 (미리보기)

`.+`, `.*`, `.>` 처럼 점이 붙은 연산자는 원소별 (element-wise) 연산입니다. 각각 `DotAdd`, `DotMul`, `DotGt` 같은 트레잇으로 desugar 되므로, 내 타입에 구현하면 바로 쓸 수 있습니다.

```rok
struct Vec { xs: List<f64>; }

impl DotAdd for Vec {
    type Output = Vec;
    fn dot_add(self, o: Vec) -> Vec {
        Vec { xs: self.xs.iter().zip(o.xs.iter()).map(|p| p.0 + p.1).collect() }
    }
}

impl DotMul<f64> for Vec {
    type Output = Vec;
    fn dot_mul(self, k: f64) -> Vec {
        Vec { xs: self.xs.iter().map(|x| x * k).collect() }
    }
}

let a = Vec { xs: [1.0, 2.0, 3.0] };
let b = Vec { xs: [10.0, 20.0, 30.0] };
let c = a .+ b .* 2.0;
println(f"{c.xs:?}");
```

```output
[21, 42, 63]
```

사양은 `List` 와 고정 배열에 이 연산자들을, 그리고 함수 뒤에 점을 붙여 모든 원소에 적용하는 `f.(xs)` 를 표준으로 정의합니다.

```rok norun
let a = [1.0, 2.0, 3.0];
let b = [10.0, 20.0, 30.0];
let c = a .+ b;              // [11.0, 22.0, 33.0]
let d = a .* 2.0;            // [2.0, 4.0, 6.0]
let r = f64::sqrt.(a);       // [1.0, 1.414..., 1.732...]
```

> [!NOTE]
> 현재 툴체인에는 `List` 의 `Dot*` 구현과 `f.(x)` 문법이 아직 없어 위 예제는 동작하지 않습니다. 그동안은 `a.iter().map(...)` 을 쓰세요.

## 정리

- `List` 는 `push` / `pop` / `insert` / `remove` / `sort` / `get` 을, `Dict` 는 `d[k]` / `get` / `entry` 를, `Set` 은 집합 연산을 제공합니다.
- 컬렉션은 참조 핸들입니다. 사본이 필요하면 `clone()` 을 부릅니다.
- `xs[a:b:s]` 슬라이싱은 Python 과 같고 panic 하지 않습니다. 결과는 `Slice<T>` 뷰입니다.
- 순서가 필요하면 `OrderedDict` / `OrderedSet`, 양 끝 큐는 `Deque` 입니다.
- `iter()` 뒤에 어댑터를 잇고 `collect` / `sum` / `fold` 로 소비합니다. `next` 하나만 구현하면 내 타입도 반복자가 됩니다.
- `yield fn` 과 `yield { }` 로 반복자를 간단히 만듭니다.

## 더 알아보기

- [stdlib 2.9. 컬렉션](../spec/refs-standard-libraries/200-core/209-collections.html), [참조 핸들](../spec/refs-standard-libraries/200-core/209-collections.html#참조-핸들)
- [3.6. 인덱싱과 슬라이싱](../spec/refs-lang/003-expressions/306-indexing-and-slicing.html)
- [stdlib 2.7. iter](../spec/refs-standard-libraries/200-core/207-iter.html), [4.11. 제너레이터](../spec/refs-lang/004-functions/411-generators.html)
- [3.3. 브로드캐스트 연산자](../spec/refs-lang/003-expressions/303-broadcast-operators.html), [stdlib 2.6. broadcast](../spec/refs-standard-libraries/200-core/206-broadcast.html)
- API: [`List`](../std/core/collections/list.html#struct.List), [`Dict`](../std/core/collections/dict.html#struct.Dict), [`Set`](../std/core/collections/set.html#struct.Set), [`OrderedDict`](../std/core/collections/ordered_dict.html#struct.OrderedDict), [`OrderedSet`](../std/core/collections/ordered_set.html#struct.OrderedSet), [`Deque`](../std/core/collections/deque.html#struct.Deque), [`Slice`](../std/core/collections/slice.html#struct.Slice), [`Iterator`](../std/core/iter.html#trait.Iterator), [`GenIter`](../std/core/iter.html#struct.GenIter)
