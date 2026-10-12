# Jupyter 노트북으로 데이터 살펴보기

rok 커널을 Jupyter 에 설치하고 셀 단위로 기온 데이터를 탐색하는 흐름을, 같은 일을 하는 하나의 실행 가능한 프로그램과 함께 보여 줍니다.

노트북에서는 데이터를 불러오는 셀, 함수를 정의하는 셀, 결과를 확인하는 셀을 하나씩 실행하며 생각을 이어 갑니다. 아래 프로그램은 그 셀들을 위에서부터 차례로 이어 붙인 것입니다. 4 주 동안의 일 최고 기온으로 요약 통계, 주별 평균, 텍스트 히스토그램을 만듭니다.

## 코드

```rok
// Daily high temperatures (°C) for four weeks.
let temps: List<f64> = [
    12.5, 14.0, 13.2, 15.8, 17.1, 16.4, 18.9,
    19.5, 21.0, 20.2, 22.7, 24.1, 23.3, 22.0,
    20.8, 19.4, 21.6, 23.9, 25.2, 26.0, 24.4,
    22.1, 20.5, 18.7, 17.9, 19.2, 21.3, 22.8,
];

fn mean(xs: List<f64>) -> f64 {
    let sum = 0.0;
    for x in xs { sum += x; }
    sum / xs.len() as f64
}

fn std_dev(xs: List<f64>) -> f64 {
    let m = mean(xs);
    let sq = 0.0;
    for x in xs { sq += (x - m) * (x - m); }
    (sq / xs.len() as f64).sqrt()
}

fn median(xs: List<f64>) -> f64 {
    let sorted: List<f64> = [];
    for x in xs { sorted.push(x); }
    sorted.sort_by(|a, b| a.partial_cmp(b) ?? Ordering::Equal);
    let n = sorted.len();
    if n % 2 == 1 { sorted[n / 2] } else { (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0 }
}

// Summary statistics.
let lo = temps.iter().fold(f64::INFINITY, |a, x| if x < a { x } else { a });
let hi = temps.iter().fold(f64::NEG_INFINITY, |a, x| if x > a { x } else { a });
println(f"n      = {temps.len()}");
println(f"mean   = {mean(temps):.2}");
println(f"median = {median(temps):.2}");
println(f"stddev = {std_dev(temps):.2}");
println(f"range  = {lo:.1} .. {hi:.1}");

// Weekly averages.
for week in 0..4 {
    let days = temps[week * 7:(week + 1) * 7];
    let w: List<f64> = days.iter().collect();
    println(f"week {week + 1}: {mean(w):5.2}");
}

// An ASCII histogram with 2-degree buckets.
let start = 12.0;
let width = 2.0;
let counts: List<usize> = [];
for _ in 0..8 { counts.push(0); }
for t in temps {
    let b = ((t - start) / width) as usize;
    counts[b] = counts[b] + 1;
}
println("histogram:");
for (i, c) in counts.iter().enumerate() {
    let from = start + width * i as f64;
    println(f"  {from:4.1}-{from + width:4.1} | {"#".repeat(c)} {c}");
}
```

```output
n      = 28
mean   = 20.16
median = 20.65
stddev = 3.49
range  = 12.5 .. 26.0
week 1: 15.41
week 2: 21.83
week 3: 23.04
week 4: 20.36
histogram:
  12.0-14.0 | ## 2
  14.0-16.0 | ## 2
  16.0-18.0 | ### 3
  18.0-20.0 | ##### 5
  20.0-22.0 | ###### 6
  22.0-24.0 | ###### 6
  24.0-26.0 | ### 3
  26.0-28.0 | # 1
```

## 살펴보기

- 노트북 셀의 최상위 `let` 과 `fn` 은 세션 내내 유지됩니다. 일반 소스 파일과 달리 셀 최상위에서는 같은 이름을 다시 `let` 해도 되므로, 데이터를 바꿔 가며 같은 셀을 여러 번 실행할 수 있습니다 ([5.1.4 같은 스코프 내 재선언 금지](../spec/refs-lang/005-modules/501-variable-declaration.html#514-같은-스코프-내-재선언-금지)).
- `f64` 는 전순서가 아니므로 `sort_by` 에 `partial_cmp` 를 넘기고, 비교할 수 없는 NaN 은 `?? Ordering::Equal` 로 처리합니다 ([컬렉션과 반복자](../learn/08-collections-iterators.html)).
- 최솟값과 최댓값은 `fold` 하나로 구합니다. 초깃값으로 `f64::INFINITY` / `f64::NEG_INFINITY` 를 쓰면 빈 목록이 아닌 한 첫 원소에서 바로 바뀝니다 ([`Iterator`](../std/core/iter.html#trait.Iterator)).
- `temps[week * 7:(week + 1) * 7]` 은 리스트의 한 구간을 슬라이스로 꺼냅니다 ([3.6 인덱싱과 슬라이싱](../spec/refs-lang/003-expressions/306-indexing-and-slicing.html)).
- 히스토그램 막대는 `"#".repeat(c)` 로, 칸 너비는 `{from:4.1}` 같은 형식 지정으로 맞춥니다. `{}` 로 찍는 `f64` 는 다시 읽어 같은 값이 되는 가장 짧은 자릿수라서 `26.0` 은 `26` 으로 나오므로, 자릿수를 고정하고 싶을 때는 `{hi:.1}` 처럼 정밀도를 적습니다 ([문자열](../learn/09-strings.html)).

## 실행하기

먼저 rok 커널을 Jupyter 에 등록합니다. `rok jupyter install` 은 kernelspec(`kernels/rok/kernel.json`)을 Jupyter 데이터 디렉토리(macOS 는 `~/Library/Jupyter`, 그 밖에는 `~/.local/share/jupyter`)에 씁니다 ([9.8.3 kernelspec 설치](../spec/refs-lang/009-tools/908-jupyter-integration.html#983-kernelspec-설치)).

```bash
rok jupyter install
jupyter lab            # 새 노트북에서 커널로 "rok" 을 고릅니다
```

환경별로 커널을 따로 두고 싶다면 `rok jupyter install --env <name>` 으로 설치합니다. 표시 이름이 `rok (<name>)` 인 커널이 따로 생깁니다.

노트북에서는 위 프로그램을 몇 개의 셀로 나눠 실행합니다. 셀의 마지막 식이 그 셀의 결과가 되고, `타입: 값` 형태로 표시됩니다.

```text
In [1]:  let temps: List<f64> = [12.5, 14.0, 13.2, 15.8, 17.1, 16.4, 18.9,
                                 19.5, 21.0, 20.2, 22.7, 24.1, 23.3, 22.0,
                                 20.8, 19.4, 21.6, 23.9, 25.2, 26.0, 24.4,
                                 22.1, 20.5, 18.7, 17.9, 19.2, 21.3, 22.8];
         temps.len()
Out[1]:  usize: 28

In [2]:  fn mean(xs: List<f64>) -> f64 {
             let sum = 0.0;
             for x in xs { sum += x; }
             sum / xs.len() as f64
         }
         mean(temps)
Out[2]:  f64: 20.16071428571428

In [3]:  temps[0:7]
Out[3]:  Slice<f64>: [12.5, 14, 13.2, 15.8, 17.1, 16.4, 18.9]

In [4]:  let week1: List<f64> = temps[0:7].iter().collect();
         mean(week1)
Out[4]:  f64: 15.414285714285715
```

`let temps` 와 `fn mean` 은 다음 셀에서도 그대로 남아 있으므로, 셀 `[3]`, `[4]` 에서는 앞에서 만든 값과 함수를 바로 씁니다. 함수를 고쳐 다시 실행하면 다음 셀부터 새 정의가 쓰입니다 ([9.7 JIT 셀 실행 흐름](../spec/refs-lang/009-tools/907-jit-cells.html)). 터미널에서 같은 셀 세션을 쓰고 싶다면 `rok repl` 을 실행합니다 ([도구](../learn/16-tools.html)).
