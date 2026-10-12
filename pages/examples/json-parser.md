# JSON 파서

열거형으로 JSON 값을 표현하고, 글자 단위 재귀 하강 파서가 오류 위치를 담아 `throws` 로 알리며, 들여쓰기한 형태로 다시 출력합니다.

## 코드

```rok
// A small JSON parser: recursive descent over chars, errors with positions, pretty printer.

enum Json { Null, Bool(bool), Num(f64), Str(str), Arr(List<Json>), Obj(OrderedDict<str, Json>) }

struct ParseError { msg: str; pos: usize; }

struct Parser { cs: List<char>; pos: usize = 0; }

impl Parser {
    fn peek(self) -> char | none { self.cs.get(self.pos) }

    fn fail(self, msg: str) -> ParseError { ParseError { msg: msg, pos: self.pos } }

    fn skip_ws(ref self) {
        while self.peek()?.is_whitespace() ?? false { self.pos += 1; }
    }

    // Skip whitespace, then consume `c` if it is next.
    fn eat(ref self, c: char) -> bool {
        self.skip_ws();
        if self.peek() != c { return false; }
        self.pos += 1;
        true
    }

    fn expect(ref self, c: char) throws (ParseError) {
        if !self.eat(c) { throw self.fail(f"expected '{c}'"); }
    }

    fn value(ref self) throws (ParseError) -> Json {
        self.skip_ws();
        let c: char = self.peek() else { throw self.fail("unexpected end of input"); };
        match c {
            'n' => try self.word("null", Json::Null),
            't' => try self.word("true", Json::Bool(true)),
            'f' => try self.word("false", Json::Bool(false)),
            '"' => Json::Str(try self.string()),
            '[' => try self.array(),
            '{' => try self.object(),
            _ => if c == '-' || c.is_ascii_digit() { try self.number() } else { throw self.fail(f"unexpected '{c}'"); },
        }
    }

    fn word(ref self, w: str, v: Json) throws (ParseError) -> Json {
        for c in w.chars() {
            if self.peek() != c { throw self.fail(f"invalid literal, expected {w}"); }
            self.pos += 1;
        }
        v
    }

    fn number(ref self) throws (ParseError) -> Json {
        let start = self.pos;
        let sb = StrBuf::new();
        while let c: char = self.peek() {
            if !(c.is_ascii_digit() || "+-.eE".contains(f"{c}")) { break; }
            sb.push(c);
            self.pos += 1;
        }
        let text = sb.to_str();
        let n = try text.parse::<f64>() catch _ { throw ParseError { msg: f"bad number '{text}'", pos: start }; };
        Json::Num(n)
    }

    fn string(ref self) throws (ParseError) -> str {
        self.pos += 1; // opening quote
        let sb = StrBuf::new();
        loop {
            let c: char = self.peek() else { throw self.fail("unterminated string"); };
            self.pos += 1;
            if c == '"' { break; }
            if c != '\\' { sb.push(c); continue; }
            let e: char = self.peek() else { throw self.fail("unterminated string"); };
            self.pos += 1;
            match e {
                'n' => sb.push('\n'),
                't' => sb.push('\t'),
                '"' | '\\' | '/' => sb.push(e),
                _ => throw ParseError { msg: f"unknown escape '\\{e}'", pos: self.pos - 2 },
            }
        }
        sb.to_str()
    }

    fn array(ref self) throws (ParseError) -> Json {
        self.pos += 1;
        let items: List<Json> = [];
        if self.eat(']') { return Json::Arr(items); }
        loop {
            items.push(try self.value());
            if self.eat(']') { return Json::Arr(items); }
            try self.expect(',');
        }
    }

    fn object(ref self) throws (ParseError) -> Json {
        self.pos += 1;
        let fields: OrderedDict<str, Json> = OrderedDict::new();
        if self.eat('}') { return Json::Obj(fields); }
        loop {
            self.skip_ws();
            if self.peek() != '"' { throw self.fail("expected a string key"); }
            let key = try self.string();
            try self.expect(':');
            fields[key] = try self.value();
            if self.eat('}') { return Json::Obj(fields); }
            try self.expect(',');
        }
    }
}

fn parse(text: str) throws (ParseError) -> Json {
    let cs: List<char> = [];
    for c in text.chars() { cs.push(c); }
    let p = Parser { cs: cs };
    let v = try p.value();
    p.skip_ws();
    if p.pos < cs.len() { throw p.fail("trailing characters"); }
    v
}

// Render `parts` one per line between `open` and `close`.
fn block(open: str, close: str, parts: List<str>, depth: usize) -> str {
    if parts.is_empty() { return f"{open}{close}"; }
    let sb = StrBuf::new();
    sb.push_str(open);
    for (i, p) in parts.iter().enumerate() {
        let comma = if i + 1 < parts.len() { "," } else { "" };
        sb.push_str(f"\n{"  ".repeat(depth + 1)}{p}{comma}");
    }
    sb.push_str(f"\n{"  ".repeat(depth)}{close}");
    sb.to_str()
}

fn pretty(v: Json, depth: usize) -> str {
    match v {
        Json::Null => "null",
        Json::Bool(b) => f"{b}",
        Json::Num(n) => f"{n}",
        Json::Str(s) => f"{s:?}",
        Json::Arr(items) => {
            let parts: List<str> = [];
            for x in items { parts.push(pretty(x, depth + 1)); }
            block("[", "]", parts, depth)
        },
        Json::Obj(fields) => {
            let parts: List<str> = [];
            for (k, x) in fields.entries() { parts.push(f"{k:?}: {pretty(x, depth + 1)}"); }
            block("{", "}", parts, depth)
        },
    }
}

fn main() {
    let doc = "{\"name\": \"rok\", \"tags\": [\"fast\", \"safe\"], \"version\": 0.1, \"stars\": 1.2e3,
               \"stable\": false, \"deps\": {}, \"notes\": null, \"quote\": \"say \\\"hi\\\"\"}";
    let v = try parse(doc) catch e { println(f"error: {e.msg} at {e.pos}"); return; };
    println(pretty(v, 0));

    for bad in ["[1, 2,]", "{\"a\" 1}", "[tru]", "\"open", "[1] x", "-"] {
        try parse(bad) catch e { println(f"{bad:<9} -> {e.msg} at offset {e.pos}"); };
    }
}
```

```output
{
  "name": "rok",
  "tags": [
    "fast",
    "safe"
  ],
  "version": 0.1,
  "stars": 1200,
  "stable": false,
  "deps": {},
  "notes": null,
  "quote": "say \"hi\""
}
[1, 2,]   -> unexpected ']' at offset 6
{"a" 1}   -> expected ':' at offset 5
[tru]     -> invalid literal, expected true at offset 4
"open     -> unterminated string at offset 5
[1] x     -> trailing characters at offset 4
-         -> bad number '-' at offset 0
```

## 살펴보기

- JSON 값은 변형 여섯 개짜리 열거형 `Json` 입니다. 배열과 객체는 자기 자신을 담는 `List<Json>` 과 `OrderedDict<str, Json>` 이고, 객체는 키 순서를 지키려고 `OrderedDict` 를 씁니다 ([합 타입](../learn/05-sum-types.html), [구조체, 열거형, 트레잇](../learn/06-structs-enums-traits.html)).
- 파서는 위치 `pos` 를 가진 구조체이고, 위치를 옮기는 메서드는 `ref self` 입니다. 메서드가 끝나면(에러를 던질 때도) 바뀐 `self` 가 호출한 쪽에 되써집니다 ([4.7.5 메서드 receiver](../spec/refs-lang/004-functions/407-ref-keyword.html#475-메서드-receiver-의-예외)).
- 입력이 끝났는지는 `let c: char = self.peek() else { throw ...; };` 로 확인합니다. `peek()` 가 `char | none` 을 돌려주므로 `let-else` 가 `none` 일 때 바로 빠져나가고, 그 아래에서는 `c` 가 `char` 입니다 ([3.16 `let-else`](../spec/refs-lang/003-expressions/316-let-else.html#3161-형태)).
- 오류는 메시지와 위치를 담은 `ParseError` 하나로 던집니다. 숫자 파싱처럼 표준 라이브러리가 던진 에러는 `catch _ { throw ParseError { ... }; }` 로 위치가 있는 에러로 바꿉니다 ([에러 처리](../learn/10-errors.html)).
- 출력은 재귀 함수 `pretty` 가 문자열을 만들어 돌려줍니다. 배열과 객체는 각 원소를 먼저 문자열로 만든 뒤 `block` 이 들여쓰기와 쉼표를 붙이고, 문자열 값은 `{s:?}` (Debug) 로 따옴표와 이스케이프를 붙입니다 ([문자열](../learn/09-strings.html)).
