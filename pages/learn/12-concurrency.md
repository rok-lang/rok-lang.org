# 12. Concurrency

The right way to do several things at once depends on the goal. Threads and `par` suit computations that use multiple CPUs, while `async` tasks suit I/O with lots of waiting. This chapter looks at each tool through short examples and also covers channels, `Mutex`, and `Atomic` for exchanging data safely.

> [!TIP]
> The output order of concurrently running code can differ from run to run. The examples in this chapter collect results with `join` or sort them before printing, so they always produce the same output.

## Threads

`rok::std::thread::spawn` runs a closure on a new OS thread and returns a `JoinHandle`. `join()` waits for that thread to finish and takes out the closure's return value. If the thread ended in a panic, it throws `JoinError`, so we add `try`.

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

Because we `join` only after creating all the handles, the four threads run concurrently. Results are collected in handle order, so the output order is fixed.

## Channels

The simplest way to pass values between threads is a channel. `channel()` returns a sending `Sender` and a receiving `Receiver`. A `Sender` can be duplicated with `clone()`, and once every `Sender` is `close()`d, the `for` loop on the receiving side ends.

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

rok values are managed by the GC, so a `Sender` is not closed automatically when it goes out of scope. The side that has finished sending must call `close()` itself for the receiver to know it is done. To bound the channel's capacity, use `channel_bounded(n)`.

## `Mutex` and `Atomic`

When several threads modify the same value, you need synchronization. For a single integer counter use `Atomic`; wrap other values in a `Mutex`. The guard returned by `Mutex::lock()` must be bound with `using` so the lock is released when the block ends (the same rule as `using` in [chapter 10](10-errors.html)).

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

Only `using` releases a guard, so the compiler refuses a guard that nothing releases: binding it with a plain `let` (or `if let`), or dropping the result of `lock()` on the floor. The same holds for the `read()` / `write()` guards of `RwLock`.

```rok norun
let g = m.lock();
```

```text
error[E200]: `g` holds a `MutexGuard` that is never released: only `using` releases a lock guard, so bind it with `using g = .. { .. }` (stdlib 2.16.3)
```

## `async` and tasks

For work with long waits, such as I/O, `async` is better because it does not tie up a thread per job. Calling an `async fn` returns a Future immediately, and `await` waits for its result. Launching Futures as separate tasks with `task::spawn` lets several make progress at once, and `task::join` collects all results **in the order they were spawned**.

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

`await` is a prefix operator that binds as tightly as `-` or `!`: it applies to the call right after it, and the rest of the expression works on the result. `await answer() == 42` compares the awaited value; it does not await a comparison.

```rok
async fn answer() -> i32 { 42 }

println(f"{await answer() == 42} {await answer() + 1}");
let r = try await task::timeout(Duration::ms(50), task::spawn(answer()));
println(f"{r}");
```

```output
true 43
42
```

As the last line shows, `try await f()` reads left to right: await the future, then propagate its error.

If the top-level statements contain an `await`, the whole program runs as an `async fn main`, so you can use `await` directly in a script. You cannot use `await` in the body of an ordinary `fn`.

Set a time limit with `task::timeout`. When the time runs out, it throws `TimeoutError`.

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

Channels work in async code too. `for await` waits for values without blocking the task.

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

## `par`: structured parallelism

When you apply the same computation to many pieces of data, you do not need to manage threads yourself. `rok::core::par` distributes the work over a worker pool, and by the time a function returns, all the work is done. `map` and `filter` preserve the input order.

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

let squares = par::map(1..=8, |x| x * x);
println(f"{squares:?}");

let count = Atomic::new(0);
par::for_each(1..=10000, |n| {
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

`reduce` folds each chunk separately and then combines the results, so you must pass an associative function (`+`, `max`, and so on) for the result to be deterministic.

For exactly two jobs, use `par::join`; when the number is decided at run time, use `par::scope`. Every job `spawn`ed inside a scope finishes before the scope ends.

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

## Streams

An `async yield fn` creates a stream that produces values one at a time, asynchronously. Think of it as the async version of a generator; consume it with `for await`.

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

The `Stream` trait has combinators such as `map`, `filter`, `take`, and `throttle` ([`Stream` API](../std/core/stream.html#trait.Stream)).

## Summary

- `thread::spawn` starts an OS thread; get its result with `try h.join()`.
- Create channels with `channel()`, and `close()` each `Sender` yourself once it is done sending.
- Protect shared values with `Atomic` or `Mutex`. Lock guards must be bound with `using`; anything else is a compile error.
- `await` is a prefix operator on the call after it (`await f() == x` compares the result). Use `async fn` / `await` and `task::spawn` / `task::join` to run wait-heavy work concurrently.
- For data-parallel computation, `par::map`, `par::for_each`, `par::join`, and `par::scope` keep things simple.
- Create and consume streams with `async yield fn` and `for await`.

## Further reading

- Spec: [Async (`async` / `await`)](../spec/refs-lang/004-functions/412-async.html), [Operator precedence](../spec/refs-lang/003-expressions/302-precedence-and-associativity.html), [Streams](../spec/refs-lang/004-functions/413-stream.html), [`using`](../spec/refs-lang/003-expressions/317-using-expression.html)
- Standard library spec: [sync](../spec/refs-standard-libraries/200-core/216-sync.html), [channel](../spec/refs-standard-libraries/200-core/217-channel.html), [task](../spec/refs-standard-libraries/200-core/218-task.html), [par](../spec/refs-standard-libraries/200-core/219-par.html)
- API: [`thread::spawn`](../std/std/thread.html#fn.spawn), [`task::spawn`](../std/core/task.html#fn.spawn), [`task::join`](../std/core/task.html#fn.join), [`channel`](../std/core/channel.html#fn.channel), [`Mutex`](../std/core/sync.html#struct.Mutex), [`Atomic`](../std/core/sync.html#struct.Atomic), [`par::map`](../std/core/par.html#fn.map), [`par::scope`](../std/core/par.html#fn.scope)
