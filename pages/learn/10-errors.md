# 10. Error Handling

Things that can fail, like a missing file or bad input, are everywhere. rok has a single error model. A function that can throw writes `throws` in its signature, and the caller marks that call with `try`. As a result, every point where an error can flow is visible in the code.

## `throws` and `throw`

The error type a function can throw is written as `throws (E)` after the parameter list and before the return type. For several kinds, use a sum type: `throws (A | B)`. In the body, `throw` throws an error value.

An error type is usually a struct or enum that has `Display` and `Debug` and then implements the `Error` trait.

```rok
#[derive(Debug)]
struct NegativeError { value: i32; }

impl Display for NegativeError {
    fn fmt(self, ref f: Formatter) throws (FmtError) {
        try f.write_str(f"negative value: {self.value}");
    }
}

impl Error for NegativeError {}

fn double(n: i32) throws (NegativeError) -> i32 {
    if n < 0 { throw NegativeError { value: n }; }
    n * 2
}

fn main() {
    let a = try double(21) catch _ { 0 };
    let b = try double(-5) catch e { println(f"error: {e}"); 0 };
    println(f"{a} {b}");
}
```

```output
error: negative value: -5
42 0
```

An error cannot escape a function without `throws`. The `main` above is not `throws`, so both calls handle the error on the spot with `catch`.

## `try`: marking call sites and propagating

You must put `try` on every call to a `throws` function. If an error occurs, control goes to the nearest `catch`; if there is none, the error propagates to the enclosing function. In that case the enclosing function must also `throws` that error.

```rok
#[derive(Debug)]
struct TooBig { limit: i32; }

impl Display for TooBig {
    fn fmt(self, ref f: Formatter) throws (FmtError) {
        try f.write_str(f"over the limit {self.limit}");
    }
}

impl Error for TooBig {}

fn check(n: i32) throws (TooBig) -> i32 {
    if n > 100 { throw TooBig { limit: 100 }; }
    n
}

fn total(xs: List<i32>) throws (TooBig) -> i32 {
    let sum = 0;
    for x in xs {
        sum += try check(x);
    }
    sum
}

fn main() {
    println(f"{try total([1, 2, 3]) catch _ { -1 }}");
    println(f"{try total([1, 500, 3]) catch e { println(f"{e:?}"); -1 }}");
}
```

```output
6
TooBig { limit: 100 }
-1
```

`try` covers the entire expression to its right. `try a(b())` marks both calls together, and `try { .. }` covers every call inside the block. A program's top-level statements form an implicitly `throws` `main`, so in a script just adding `try` lets the error leave the program, which then exits with code 1.

## `try?` and `try!`

Two variants turn the error into something else on the spot instead of propagating it.

| Form     | On error                              |
|----------|---------------------------------------|
| `try e`  | Nearest `catch`, or propagate         |
| `try? e` | Discard the error and yield `none`    |
| `try! e` | Panic (treated as a program bug)      |

```rok
fn parse_port(s: str) -> i32 {
    (try? s.parse::<i32>()) ?? 8080
}

println(f"{parse_port("3000")} {parse_port("abc")}");
let n: i32 = try! "42".parse();
println(f"{n}");
```

```output
3000 8080
42
```

To chain `??` onto a `try?` result, close its scope with parentheses as above. Use `try!` only when you are certain that "failing here is a bug".

## `catch`: selecting by pattern

`catch` is a postfix clause attached to an expression. Patterns are tested from top to bottom, the first matching block runs, and that block's value becomes the value of the whole expression. `e: T` is a pattern that selects by type, and inside that branch `e` is narrowed to that type.

```rok
#[derive(Debug)]
struct NotFound { key: str; }
impl Display for NotFound {
    fn fmt(self, ref f: Formatter) throws (FmtError) { try f.write_str(f"no key {self.key}"); }
}
impl Error for NotFound {}

#[derive(Debug)]
struct Invalid { reason: str; }
impl Display for Invalid {
    fn fmt(self, ref f: Formatter) throws (FmtError) { try f.write_str(self.reason); }
}
impl Error for Invalid {}

fn lookup(key: str) throws (NotFound | Invalid) -> i32 {
    if key == "" { throw Invalid { reason: "empty key" }; }
    if key != "a" { throw NotFound { key: key }; }
    1
}

fn describe(key: str) -> str {
    try f"found {lookup(key)}"
    catch e: NotFound { f"missing: {e.key}" }
    catch e: Invalid { f"invalid: {e}" }
}

fn main() {
    for k in ["a", "b", ""] {
        println(describe(k));
    }
}
```

```output
found 1
missing: b
invalid: empty key
```

Any pattern can follow `catch`, so a struct pattern can pull out fields directly.

```rok
#[derive(Debug)]
struct NotFound { key: str; }
impl Display for NotFound {
    fn fmt(self, ref f: Formatter) throws (FmtError) { try f.write_str(f"no key {self.key}"); }
}
impl Error for NotFound {}

fn lookup(key: str) throws (NotFound) -> i32 {
    if key != "a" { throw NotFound { key: key }; }
    1
}

for key in ["a", "b"] {
    let n = try lookup(key)
    catch NotFound { key } { println(f"missing: {key}"); 0 };
    println(f"{n}");
}
```

```output
1
missing: b
0
```

The error kinds of `lookup` are closed as `NotFound | Invalid`, so `describe`, which covers both types, becomes a function that no longer throws. The compiler checks this.

If you write just `throws` with no type instead of `throws (E)`, the function can throw any error that implements `Error` (short for `throws (any Error)`). Use it when it is hard to close the set of error kinds, as in a public API. The receiver catches everything with `catch e` or `catch e: any Error`, or narrows to a concrete type first, as in `catch e: ValueError` ([4.14.3](../spec/refs-lang/004-functions/414-throws.html#4143-untyped-throws)).

```rok
fn read_age(s: str) throws -> i32 {
    let n: i32 = try s.parse();
    if n < 0 { throw ValueError { msg: f"age {n} is negative" }; }
    n
}

for s in ["30", "x", "-1"] {
    let age = try read_age(s)
    catch e: ValueError { println(f"  {e.msg}"); -1 }
    catch e { println(f"  {e}"); -1 };
    println(f"{s} -> {age}");
}
```

```output
30 -> 30
  cannot parse "x": invalid digit
x -> -1
  age -1 is negative
-1 -> -1
```

## Block form and `finally`

To wrap several steps at once, use the `try { .. } catch .. { .. }` form. A `finally` block runs last no matter how control leaves: normal completion, an error, `return`, and so on.

```rok
fn half(n: i32) throws -> i32 {
    if n % 2 != 0 { throw ValueError { msg: f"{n} is odd" }; }
    n / 2
}

for input in [8, 6] {
    let r = try {
        let a = try half(input);
        let b = try half(a);
        a + b
    } catch e {
        println(f"failed: {e}");
        0
    } finally {
        println(f"done with {input}");
    };
    println(f"result {r}");
}
```

```output
done with 8
result 6
failed: 3 is odd
done with 6
result 0
```

## `rethrows`: throwing only as much as the argument does

A higher-order function that takes a function as an argument can be declared `rethrows`. If the function passed in does not throw, the call needs no `try`; you add `try` only when passing a throwing function.

```rok
fn apply_all(xs: List<i32>, f: fn(i32) throws -> i32) rethrows -> List<i32> {
    let out: List<i32> = [];
    for x in xs { out.push(try f(x)); }
    out
}

fn half(n: i32) throws -> i32 {
    if n % 2 != 0 { throw ValueError { msg: f"{n} is odd" }; }
    n / 2
}

let doubled = apply_all([1, 2, 3], |x| x * 2);
println(f"{doubled:?}");
let halves = try apply_all([2, 4], half) catch _ { [] };
println(f"{halves:?}");
let bad = try apply_all([2, 3], half) catch e { println(f"{e}"); [] };
println(f"{bad:?}");
```

```output
[2, 4, 6]
[1, 2]
3 is odd
[]
```

## `using`: cleaning up resources

The GC reclaims memory, but resources such as files, sockets, and locks must be closed at a definite point. `using x = acquire_expr { .. }` calls `x`'s `Drop::drop` however the block is exited (normally, via `return`, or by error propagation). Multiple resources are separated by commas and cleaned up in reverse order.

```rok
struct Conn { name: str; }

impl Drop for Conn {
    fn drop(ref self) { println(f"close {self.name}"); }
}

fn open(name: str) -> Conn {
    println(f"open {name}");
    Conn { name: name }
}

fn work() throws -> i32 {
    using a = open("db"), b = open("cache") {
        println("working");
        throw ValueError { msg: "query failed" };
    }
}

try work() catch e { println(f"work failed: {e}"); };
```

```output
open db
open cache
working
close cache
close db
work failed: query failed
```

`using` is an expression, so it can also produce a value, as in `let text = using f = try fs::open(path) { try f.read_to_end() };`. Remember that ordinary `let` bindings are not `drop`ped when they go out of scope. When you need deterministic cleanup, use `using`.

## Errors and panics

An error from `throws` is "a failure that can happen". By contrast, an out-of-range index, division by zero, a failed `try!`, or a call to `panic(..)` is a **panic**, which is treated as a program bug. A panic cannot be caught with `catch`; it writes a message to stderr and exits with code 101. Cleanup in `finally` and `using` does not run either.

```rok build
let xs = [1, 2, 3];
let i = 7;
println(f"{xs[i]}");
```

```text
thread 'main' panicked at main.rok:3:12:
List index out of bounds
```

Use `Result<T, E>` only when you need to hold an error as a value (to collect several results or handle them later). The rule is: "if you throw it, `throws`; if you keep it, `Result`".

```rok
fn half(n: i32) throws -> i32 {
    if n % 2 != 0 { throw ValueError { msg: f"{n} is odd" }; }
    n / 2
}

for n in [4, 5] {
    let r = Result::catching(|| try half(n));
    println(f"{n}: ok={r.is_ok()} value={r.unwrap_or(-1)}");
}
```

```output
4: ok=true value=2
5: ok=false value=-1
```

## Summary

- A function that can throw declares `throws (E)` (or `throws`) and throws with `throw`.
- Calls are marked with `try`. An uncaught error propagates to the enclosing function.
- `try?` turns an error into `none`; `try!` turns it into a panic.
- `catch` is an expression that selects by pattern, and `finally` always runs.
- `rethrows` throws only when the function it received throws.
- Resources bound with `using` are cleaned up however the block is exited.
- A panic is an uncatchable bug signal. Use `Result` only when you need to hold an error as a value.

## Further reading

- Spec: [Error control flow](../spec/refs-lang/003-expressions/314-error-control-flow.html), [`throws` signatures](../spec/refs-lang/004-functions/414-throws.html), [`using` expressions](../spec/refs-lang/003-expressions/317-using-expression.html), [Panics and fatal errors](../spec/refs-lang/003-expressions/314-error-control-flow.html#3148-panics-and-fatal-errors)
- Standard library spec: [error](../spec/refs-standard-libraries/200-core/214-error.html)
- API: [`Error`](../std/core/error.html#trait.Error), [`ValueError`](../std/core/error.html#struct.ValueError), [`Result`](../std/core/error.html#enum.Result), [`Drop`](../std/core/marker.html#trait.Drop)
