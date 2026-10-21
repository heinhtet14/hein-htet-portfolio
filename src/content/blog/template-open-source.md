---
title: "Template: an open-source contribution"
description: "Copy this file to write up a PR: what the project is, what was wrong, what you changed, what you learned."
date: 2026-10-21
kind: open-source
tags: [template]
contribution:
  repo: owner/project
  url: https://github.com/owner/project/pull/123
  status: merged
draft: true
---

Copy this file, rename it (the file name becomes the URL), fill in the front matter, and
delete `draft: true` when it's ready. Drafts only appear while `npm run dev` is running.

## The project

One paragraph: what the project does and why you were using it.

## The problem

What broke or was missing. A minimal reproduction helps:

```bash
$ project --flag
error: something specific went wrong
```

## The change

What you changed and why that approach. Link the PR in the front matter; quote only
the interesting part of the diff:

```python
def fixed(x):
    return x  # the line that mattered
```

## What I learned

- Something about the codebase
- Something about the maintainers' review
- Something you'd do differently next time

> A sentence from the review thread worth keeping.
