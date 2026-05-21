# K-Collusion Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js dashboard for the approved K-Collusion Index metric.

**Architecture:** Add a small deterministic data/model module, test the weighted score behavior, then replace the default homepage with a production dashboard. Keep `/dashboard` aligned with the same product surface.

**Tech Stack:** Next.js App Router, TypeScript, CSS Modules, Node built-in test runner for the score formula.

---

### Task 1: Score Model

**Files:**
- Create: `app/lib/collusionData.ts`
- Create: `tests/collusion-score.test.mjs`

- [ ] Write a failing Node test that verifies the weighted composite score for a sample category.
- [ ] Implement the score helper and exported category data.
- [ ] Run `node --test tests/collusion-score.test.mjs`.

### Task 2: Dashboard UI

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/page.module.css`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] Replace the starter homepage with the dashboard.
- [ ] Use the approved metric definition and caveat copy.
- [ ] Render KPI cards, category cards, comparison table, and methodology.
- [ ] Update metadata and Korean language setting.

### Task 3: Dashboard Route Cleanup

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/layout.tsx`

- [ ] Make `/dashboard` render the same dashboard surface.
- [ ] Remove mojibake navigation labels from the active route path.

### Task 4: Verification

- [ ] Run `node --test tests/collusion-score.test.mjs`.
- [ ] Run `npm run build`.
- [ ] Report any remaining limitations clearly.
