# 12. 동시성

여러 일을 동시에 하는 방법은 목적에 따라 다릅니다. CPU 를 여러 개 쓰는 계산에는 스레드와 `par`, 기다림이 많은 입출력에는 `async` task 가 어울립니다. 이 장에서는 각 도구를 짧은 예로 살펴보고, 데이터를 안전하게 주고받는 채널과 `Mutex` / `Atomic` 도 다룹니다.

> [!TIP]
> 동시에 도는 코드의 출력 순서는 실행할 때마다 달라질 수 있습니다. 이 장의 예제는 결과를 `join` 으로 모으거나 정렬한 뒤에 출력해서 늘 같은 결과가 나오게 했습니다.

## 스레드

`rok::std::thread::spawn` 은 클로저를 새 OS 스레드에서 실행하고 `JoinHandle` 을 돌려줍니다. `join()` 은 그 스레드가 끝날 때까지 기다려 클로저의 반환값을 꺼냅니다. 스레드가 panic 으로 끝났으면 `JoinError` 를 던지므로 `try` 를 붙입니다.

```rok
use rok::std::thread;

let handles: List<thread::JoinHandle<i32>> = [];
for i in 1..=4 {
    handles.push(thread::spawn(|| i * i));
}

let results: List<i32> = [];
for h in handles {
    results.push(try h.join());
}
println(f"{results:?}");

let named = try thread::Builder::new().name("worker").spawn(|| {
    thread::current().name() ?? "?"
});
println(try named.join());
```

```output
[1, 4, 9, 16]
worker
```

핸들을 모두 만든 다음에 `join` 하므로 네 스레드는 동시에 돕니다. 결과는 핸들 순서대로 모이기 때문에 출력 순서가 정해집니다.

## 채널

스레드 사이에 값을 넘기는 가장 단순한 방법은 채널입니다. `channel()` 은 보내는 쪽 `Sender` 와 받는 쪽 `Receiver` 를 돌려줍니다. `Sender` 는 `clone()` 으로 여러 개 만들 수 있고, 모든 `Sender` 가 `close()` 되면 받는 쪽의 `for` 가 끝납니다.

```rok
use rok::std::thread;
use rok::core::channel::channel;

let (tx, rx) = channel::<str>();
let workers: List<thread::JoinHandle<()>> = [];
for id in 0..3 {
    let tx = tx.clone();
    workers.push(thread::spawn(|| {
        for j in 0..2 {
            try! tx.send(f"w{id}-{j}");
        }
        tx.close();
    }));
}
tx.close();

let got: List<str> = [];
for msg in rx {
    got.push(msg);
}
for w in workers { try w.join(); }

got.sort();
println(f"{got:?}");
```

```output
["w0-0", "w0-1", "w1-0", "w1-1", "w2-0", "w2-1"]
```

rok 의 값은 GC 가 관리하므로 스코프를 벗어나도 `Sender` 가 저절로 닫히지 않습니다. 보내기를 마친 쪽에서 직접 `close()` 를 불러야 받는 쪽이 끝을 압니다. 크기를 제한하려면 `channel_bounded(n)` 을 씁니다.

## `Mutex` 와 `Atomic`

여러 스레드가 같은 값을 고칠 때는 동기화가 필요합니다. 정수 카운터 하나라면 `Atomic`, 그 밖의 값은 `Mutex` 로 감쌉니다. `Mutex::lock()` 이 돌려주는 guard 는 `using` 으로 묶어야 블록이 끝날 때 락이 풀립니다 ([10장](10-errors.html) 의 `using` 과 같은 규칙입니다).

```rok
use rok::std::thread;
use rok::core::sync::{Mutex, Atomic};

let counter = Atomic::new(0);
let log = Mutex::new([]);

let hs: List<thread::JoinHandle<()>> = [];
for i in 1..=5 {
    hs.push(thread::spawn(|| {
        counter.fetch_add(i);
        using g = log.lock() {
            g.get().push(i * 10);
        }
    }));
}
for h in hs { try h.join(); }

let items = using g = log.lock() { g.get() };
items.sort();
println(f"sum = {counter.load()}, items = {items:?}");
```

```output
sum = 15, items = [10, 20, 30, 40, 50]
```

> [!WARNING]
> `let g = m.lock();` 처럼 guard 를 그냥 변수에 두면 락이 풀리지 않아, 다음 `lock()` 이 영원히 기다립니다. guard 는 항상 `using` 으로 묶으세요.

## `async` 와 task

입출력처럼 기다리는 시간이 긴 일은 스레드를 하나씩 붙잡지 않는 `async` 가 낫습니다. `async fn` 을 부르면 바로 Future 가 돌아오고, `await` 가 그 결과를 기다립니다. `task::spawn` 으로 Future 를 별도의 task 로 띄우면 여러 개가 동시에 진행되며, `task::join` 이 모든 결과를 **띄운 순서대로** 모아 줍니다.

```rok
async fn fetch(id: i32) -> str {
    await task::sleep(Duration::ms((40 - id * 10) as i64));
    f"item-{id}"
}

let tasks = [task::spawn(fetch(1)), task::spawn(fetch(2)), task::spawn(fetch(3))];
let items = await task::join(tasks);
println(f"{items:?}");

let f = fetch(3);
println("not started waiting yet");
println(await f);
```

```output
["item-1", "item-2", "item-3"]
not started waiting yet
item-3
```

top-level 문에 `await` 가 있으면 프로그램 전체가 `async fn main` 으로 실행되므로 스크립트에서도 바로 `await` 를 쓸 수 있습니다. 일반 `fn` 본체에서는 `await` 를 쓸 수 없습니다.

시간 제한은 `task::timeout` 으로 겁니다. 시간이 지나면 `TimeoutError` 를 던집니다.

```rok
async fn slow() -> i32 {
    await task::sleep(Duration::ms(200));
    1
}

let r = try await task::timeout(Duration::ms(10), task::spawn(slow()))
    catch e: TimeoutError { -1 };
println(f"{r}");
```

```output
-1
```

채널은 async 코드에서도 쓸 수 있습니다. `for await` 는 task 를 막지 않고 값을 기다립니다.

```rok
use rok::core::channel::channel;

let (tx, rx) = channel::<i32>();
let producer = task::spawn(async {
    for i in 1..=3 {
        try! tx.send(i);
        await task::sleep(Duration::ms(5));
    }
    tx.close();
    "producer done"
});

let sum = 0;
for await v in rx {
    println(f"got {v}");
    sum += v;
}
println(f"{await producer}, sum = {sum}");
```

```output
got 1
got 2
got 3
producer done, sum = 6
```

## `par`: 구조적 병렬 처리

데이터 여러 개에 같은 계산을 하는 경우라면 스레드를 직접 다룰 필요가 없습니다. `rok::core::par` 는 작업을 worker pool 에 나눠 주고, 함수가 돌아올 때는 모든 작업이 끝나 있습니다. `map` 과 `filter` 는 입력 순서를 그대로 지킵니다.

```rok
use rok::core::par;
use rok::core::sync::Atomic;

fn is_prime(n: i32) -> bool {
    if n < 2 { return false; }
    let d = 2;
    while d * d <= n {
        if n % d == 0 { return false; }
        d += 1;
    }
    true
}

let squares = par::map(1..=8, |x: i32| x * x);
println(f"{squares:?}");

let count = Atomic::new(0);
par::for_each(1..=10000, |n: i32| {
    if is_prime(n) { count.fetch_add(1); }
});
println(f"primes below 10000: {count.load()}");

let evens = par::filter([1, 2, 3, 4, 5, 6], |x| x % 2 == 0);
let total = par::reduce([1, 2, 3, 4], 0, |a, b| a + b);
println(f"{evens:?} {total}");
```

```output
[1, 4, 9, 16, 25, 36, 49, 64]
primes below 10000: 1229
[2, 4, 6] 10
```

> [!NOTE]
> 사양의 `par::map` / `par::for_each` 는 클로저 매개변수 타입을 입력에서 추론합니다. 현재 툴체인에서는 추론되지 않으므로 위처럼 `|x: i32|` 로 타입을 적어 줍니다.

`reduce` 는 조각마다 따로 접은 뒤 합치므로, 결합 법칙을 만족하는 함수 (`+`, `max` 등) 를 넘겨야 결과가 늘 같습니다.

일이 정확히 두 개면 `par::join`, 개수가 실행 중에 정해지면 `par::scope` 를 씁니다. scope 안에서 `spawn` 한 작업은 scope 가 끝나기 전에 모두 끝납니다.

```rok
use rok::core::par;

let (a, b) = par::join(|| (1..=100).sum(), || "done");
println(f"{a} {b}");

par::scope(|s| {
    let left = s.spawn(|| (1..=50).sum());
    let right = s.spawn(|| (51..=100).sum());
    println(f"{left.join() + right.join()}");
});
```

```output
5050 done
5050
```

## 스트림

`async yield fn` 은 값을 하나씩 비동기로 내놓는 스트림을 만듭니다. 제너레이터의 async 판이라고 보면 되고, `for await` 로 받습니다.

```rok
async yield fn ticks(n: i32) -> i32 {
    for i in 1..=n {
        await task::sleep(Duration::ms(5));
        yield i * 10;
    }
}

for await t in ticks(3) {
    println(f"tick {t}");
}
```

```output
tick 10
tick 20
tick 30
```

`Stream` 트레잇에는 `map`, `filter`, `take`, `throttle` 같은 조합기가 있습니다 ([`Stream` API](../std/core/stream.html#trait.Stream)).

## 정리

- `thread::spawn` 은 OS 스레드를 띄우고, `try h.join()` 으로 결과를 받습니다.
- 채널은 `channel()` 로 만들고, 보내기를 마친 `Sender` 는 직접 `close()` 합니다.
- 공유 값은 `Atomic` 이나 `Mutex` 로 보호하고, `Mutex` guard 는 `using` 으로 묶습니다.
- `async fn` / `await` 와 `task::spawn` / `task::join` 으로 기다림이 많은 일을 동시에 진행합니다.
- 데이터 병렬 계산은 `par::map`, `par::for_each`, `par::join`, `par::scope` 가 간단합니다.
- `async yield fn` 과 `for await` 로 스트림을 만들고 소비합니다.

## 더 알아보기

- 사양: [비동기 (`async` / `await`)](../spec/refs-lang/004-functions/412-async.html), [스트림](../spec/refs-lang/004-functions/413-stream.html), [`using`](../spec/refs-lang/003-expressions/317-using-expression.html)
- 표준 라이브러리 사양: [sync](../spec/refs-standard-libraries/200-core/216-sync.html), [channel](../spec/refs-standard-libraries/200-core/217-channel.html), [task](../spec/refs-standard-libraries/200-core/218-task.html), [par](../spec/refs-standard-libraries/200-core/219-par.html)
- API: [`thread::spawn`](../std/std/thread.html#fn.spawn), [`task::spawn`](../std/core/task.html#fn.spawn), [`task::join`](../std/core/task.html#fn.join), [`channel`](../std/core/channel.html#fn.channel), [`Mutex`](../std/core/sync.html#struct.Mutex), [`Atomic`](../std/core/sync.html#struct.Atomic), [`par::map`](../std/core/par.html#fn.map), [`par::scope`](../std/core/par.html#fn.scope)
