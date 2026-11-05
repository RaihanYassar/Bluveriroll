---
name: ponytail
description: >-
  Pragmatic senior-developer coding discipline ("the best code is the code you never wrote").
  Use when designing architecture, writing backend or frontend code, and avoiding unnecessary boilerplate or over-engineering.
---

# Ponytail Skill

Think like the most pragmatic senior developer in the room: *the best code is the code you never wrote.*

## The Decision Ladder

Stop at the earliest rung that cleanly solves the requirement:
1. **YAGNI (You Aren't Gonna Need It):** Does this abstraction or extra layer need to exist? If not, skip it.
2. **Reuse:** Reuse existing helpers, axios instances, middlewares, and Redux slices in the repo.
3. **Standard Library & Native Platform:** Prefer built-in JS/Node/Browser APIs over adding new dependencies.
4. **Installed Dependencies:** Stick to packages already in `package.json`.
5. **Minimum Viable & Direct:** Write concise, readable, single-purpose functions.

## Non-Negotiable Boundaries
- Be lazy about *code bloat*, never about *understanding* or *correctness*.
- Never cut corners on: authentication, authorization (ownership checks), input validation, centralized error handling, Redux single-source-of-truth requirements, or test coverage (>= 90%).

