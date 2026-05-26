# Price Level Interpretation Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Korea-based price-level comparison accurately communicate its GDP-level scope, avoid overstated rankings, and compare OECD CPI values on one common month.

**Architecture:** Keep the World Bank rebasing formula unchanged because it correctly converts the official GDP price-level ratio to a Korea=100 basis. Tighten interpretation in React content and make the Python OECD enrichment select the latest month available for every included country before exporting JSON.

**Tech Stack:** Next.js App Router, React, TypeScript, Python standard library, pytest, Playwright.

---

## File Map

- Modify `python/inflation_sources.py`: select an OECD CPI observation from a common month.
- Modify `python/tests/test_generate_data.py`: cover common-month selection when country releases differ.
- Modify `app/components/DashboardClient.tsx`: replace ranking/consumer-like claims with GDP-scope comparison language.
- Modify `app/countries/[slug]/page.tsx`: remove strict rank claims and disclose 19-country scope.
- Modify `app/about/page.tsx` and `app/methodology/page.tsx`: document GDP aggregate and G20 regional-body exclusions.
- Modify `e2e/dashboard.spec.ts` and `e2e/content-pages.spec.ts`: assert visible accuracy disclosures.
- Modify `README.md`: align public documentation with visible language.

### Task 1: OECD Common-Month Comparison

**Files:**
- Modify: `python/tests/test_generate_data.py`
- Modify: `python/inflation_sources.py`

- [ ] **Step 1: Write the failing test**

Add a test that feeds country CPI records where one country lacks the newest period and asserts that all returned values use the previous common period.

- [ ] **Step 2: Verify the test fails**

Run: `.\venv\Scripts\python.exe -m pytest python\tests\test_generate_data.py -q`

Expected: FAIL because the current reader picks each country's latest value and reports only the maximum period.

- [ ] **Step 3: Implement common-month selection**

Collect values by `TIME_PERIOD`, find the newest period containing all `G20_COUNTRIES`, and return values only from that period. Raise `InflationDataUnavailableError` if no common period exists.

- [ ] **Step 4: Verify the test passes**

Run: `.\venv\Scripts\python.exe -m pytest python\tests\test_generate_data.py -q`

Expected: PASS.

### Task 2: Accurate Public Interpretation

**Files:**
- Modify: `e2e/dashboard.spec.ts`
- Modify: `e2e/content-pages.spec.ts`
- Modify: `app/components/DashboardClient.tsx`
- Modify: `app/countries/[slug]/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/methodology/page.tsx`
- Modify: `README.md`

- [ ] **Step 1: Write failing UI assertions**

Require visible text for `GDP 기준 일반 가격수준`, `19개국 단순평균`, `EU·AU 지역기구 제외`, and the warning that small value differences are not strict rankings.

- [ ] **Step 2: Verify the assertions fail**

Run: `npx playwright test dashboard content-pages --workers=1`

Expected: FAIL because the current UI still says `평균 지수`, `국가별 순위`, and `가격수준 순위`.

- [ ] **Step 3: Implement minimal content changes**

Update headings, cards, dashboard explanatory text, country explanation, methodology, and README without changing the validated Korea=100 formula.

- [ ] **Step 4: Verify visible behavior passes**

Run: `npm run build` followed by `npx playwright test --workers=1`

Expected: PASS.

### Task 3: Follow-Up Roadmap

**Files:**
- Modify: `docs/superpowers/plans/2026-05-26-price-level-interpretation.md`

- [ ] **Step 1: Record later work**

Add the roadmap below so future work is separated from this accuracy correction.

## Follow-Up Roadmap

1. Add a separate consumer-focused comparison series using a consumption/AIC price-level indicator, keeping it visually distinct from the GDP-level series.
2. Expand country coverage pages from 12 to all supported 19 country members, each with identical disclosure and source sections.
3. Add structured data and a source/version history page showing each monthly update and any fallback usage.
4. Replace the placeholder AdSense publisher identifier in `ads.txt` only after the real account identifier is issued.
5. Add monitoring that fails deployment when live-source refresh unexpectedly falls back or when source periods diverge.
