---
title: "Template: a theory note"
description: "Copy this file to explain something you learned. Example below: symmetric int8 quantization in one page."
date: 2026-10-20
kind: theory
tags: [template, quantization]
draft: true
---

Theory notes work best as: the question, the idea in one sentence, a worked example, and
where it bites in practice. The example below is filler to show the formatting; replace it.

## The question

How does a float tensor fit into 8-bit integers without wrecking accuracy?

## The idea

Pick a scale `s` so the largest magnitude maps to 127, then round:

```text
s = max(|x|) / 127
q = clamp(round(x / s), -127, 127)
x ≈ q · s
```

## Worked example

| x      | x / s   | q    | q · s  |
| ------ | ------- | ---- | ------ |
| 0.50   | 63.5    | 64   | 0.504  |
| -1.00  | -127.0  | -127 | -1.000 |
| 0.013  | 1.65    | 2    | 0.016  |

With `max(|x|) = 1.0`, `s = 1/127 ≈ 0.00787`. Small values lose the most relative
precision: 0.013 comes back as 0.016.

## Where it bites

1. One outlier stretches `s` for the whole tensor. Per-channel scales help.
2. Activations change per input, so their ranges need calibration data.
3. Accumulate in int32; only the stored values are int8.
