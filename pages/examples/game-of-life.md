# 생명 게임

콘웨이의 생명 게임을 가장자리가 이어진 10×8 토러스 격자 위에서 돌려 몇 세대를 텍스트로 출력합니다.

## 코드

```rok
const W: usize = 10;
const H: usize = 8;

// A grid of cells on a torus: the edges wrap around.
struct Grid {
    cells: [[bool; 10]; 8];
}

impl Grid {
    fn parse(rows: List<str>) -> Grid {
        let cells = [[false; 10]; 8];
        for (y, row) in rows.iter().enumerate() {
            for (x, c) in row.chars().enumerate() {
                cells[y][x] = c == '#';
            }
        }
        Grid { cells: cells }
    }

    fn alive(self, x: usize, y: usize) -> bool { self.cells[y][x] }

    fn neighbours(self, x: usize, y: usize) -> usize {
        let n = 0usize;
        for dy in [H - 1, 0, 1] {
            for dx in [W - 1, 0, 1] {
                if dx == 0 && dy == 0 { continue; }
                // Adding W - 1 and taking % W steps one cell left with wraparound.
                if self.alive((x + dx) % W, (y + dy) % H) { n += 1; }
            }
        }
        n
    }

    fn step(self) -> Grid {
        let next = [[false; 10]; 8];
        for y in 0..H {
            for x in 0..W {
                next[y][x] = match (self.alive(x, y), self.neighbours(x, y)) {
                    (true, 2) | (true, 3) => true,
                    (false, 3) => true,
                    _ => false,
                };
            }
        }
        Grid { cells: next }
    }

    fn population(self) -> usize {
        let n = 0usize;
        for row in self.cells {
            for c in row { if c { n += 1; } }
        }
        n
    }
}

impl Display for Grid {
    fn fmt(self, ref f: Formatter) throws (FmtError) {
        for row in self.cells {
            for c in row { try f.write_char(if c { '#' } else { '.' }); }
            try f.write_char('\n');
        }
    }
}

// A glider in the corner and a blinker on the right.
let grid = Grid::parse([
    ".#........",
    "..#.......",
    "###.......",
    "..........",
    "......###.",
    "..........",
    "..........",
    "..........",
]);

for gen in 0..4 {
    println(f"generation {gen} (population {grid.population()})");
    println(f"{grid}");
    grid = grid.step();
}

// A lone glider returns to its shape every 4 steps, shifted by (1, 1);
// on a 10x8 torus it needs lcm(10, 8) = 40 such moves to come home.
let glider = Grid::parse([".#", "..#", "###"]);
let g = glider.step();
let period = 1;
while g.cells != glider.cells {
    g = g.step();
    period += 1;
}
println(f"a lone glider comes back after {period} generations");
```

```output
generation 0 (population 8)
.#........
..#.......
###.......
..........
......###.
..........
..........
..........

generation 1 (population 8)
..........
#.#.......
.##.......
.#.....#..
.......#..
.......#..
..........
..........

generation 2 (population 8)
..........
..#.......
#.#.......
.##.......
......###.
..........
..........
..........

generation 3 (population 8)
..........
.#........
..##......
.##....#..
.......#..
.......#..
..........
..........

a lone glider comes back after 160 generations
```

## 살펴보기

- 격자는 고정 크기 2 차원 배열 `[[bool; 10]; 8]` 입니다. 배열은 크기가 타입에 들어 있어 따로 할당하지 않고, `[[false; 10]; 8]` 처럼 반복 표기로 만들고 `==` / `!=` 로 통째로 비교합니다 ([값과 타입](../learn/02-values-and-types.html)).
- 이웃을 셀 때 `x - 1` 대신 `(x + W - 1) % W` 를 씁니다. `usize` 에서 뺄셈이 0 아래로 내려가는 일을 피하면서 가장자리가 반대편으로 이어집니다.
- 생존 규칙은 `(살아 있음, 이웃 수)` 튜플에 대한 `match` 하나로 표현합니다. `(true, 2) | (true, 3)` 처럼 패턴을 `|` 로 묶을 수 있습니다 ([3.12 match](../spec/refs-lang/003-expressions/312-match-expression.html), [흐름 제어](../learn/04-control-flow.html)).
- `impl Display for Grid` 에서 `Formatter::write_char` 로 한 글자씩 써서, `f"{grid}"` 가 격자를 그대로 그립니다 ([`Formatter`](../std/core/fmt.html#struct.Formatter), [구조체, 열거형, 트레잇](../learn/06-structs-enums-traits.html)).
- 글라이더는 4 세대마다 같은 모양으로 한 칸씩 대각선 이동합니다. 10×8 토러스에서는 lcm(10, 8) = 40 번 이동해야 제자리로 오므로 160 세대가 걸립니다.

> [!NOTE]
> 구조체 필드 타입에서 배열 길이에 상수를 쓰는 `[[bool; W]; H]` 는 현재 툴체인에서 아직 지원되지 않아 길이를 리터럴로 적었습니다.
