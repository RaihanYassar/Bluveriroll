---
name: ui-ux-pro-max
description: >-
  Design intelligence skill for building cohesive, modern, high-craft UI/UX in React and Tailwind CSS.
  Use when designing, creating, or refactoring frontend pages, components, layouts, color palettes, typography, and interactive states.
---

# UI/UX Pro Max Skill

Apply high-craft design intelligence before writing or modifying frontend UI code.

## Core Design System Principles

1. **Aesthetic Direction & Visual Hierarchy**
   - Use intentional dark-mode layering: deep obsidian/slate canvas (`bg-slate-950`), elevated glass cards (`bg-slate-900/80 backdrop-blur-md`), subtle borders (`border-slate-800/80`), and high-contrast accent highlights (`cyan-400`, `sky-400`, `amber-400`).
   - Use Bento Grid layouts and clear typographic scale (`font-black tracking-tight` for hero headings, `text-xs`/`text-sm` with `text-slate-400` for metadata).

2. **Interactive States & Micro-Interactions**
   - Every interactive element (buttons, cards, tabs, inputs) must have distinct `hover:`, `focus:`, `active:`, and `disabled:` states.
   - Poster cards use `aspect-[2/3]` or `aspect-[3/4]` with `group-hover:scale-105 transition duration-300` and gradient overlays for legibility.

3. **UX Completeness**
   - Always provide meaningful Loading states (skeletons/spinners), Empty states (with clear CTA), Error banners, and Feedback notifications.
   - Ensure full responsiveness across mobile (`grid-cols-2`), tablet (`sm:grid-cols-3 md:grid-cols-4`), and desktop (`lg:grid-cols-5` / `lg:grid-cols-6`).
   - Maintain accessible contrast ratios, semantic HTML landmarks (`header`, `main`, `nav`, `section`, `footer`), and keyboard-friendly forms.

