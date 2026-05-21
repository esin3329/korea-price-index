# K-Collusion Index Design

## Goal

Turn the project into a Korean price distortion dashboard that uses Numbeo cost-of-living data and OECD price/inflation concepts as evidence signals. The product must not claim to prove collusion. It should present a price distortion and competition-risk signal that helps identify categories where Korean consumer prices look unusually high after considering purchasing power and inflation context.

## Metric Definition

The public-facing metric is `K-Collusion Index: Korean consumer price distortion signal`.

The score is a weighted composite:

```text
K-Collusion Index
= 0.35 * Numbeo relative price pressure
+ 0.25 * OECD PPP price-level deviation
+ 0.20 * OECD CPI category inflation pressure
+ 0.15 * income-adjusted affordability burden
+ 0.05 * competition risk proxy
```

Scores are normalized on a 0-100 scale. Higher scores indicate stronger price distortion signals, not legal proof of cartel behavior.

## Data Sources

- Numbeo Cost of Living Index and methodology: cost of living, groceries, restaurant, rent, and local purchasing power indicators.
- OECD price level indices and PPP concepts: international price-level comparisons that reduce exchange-rate distortion.
- OECD CPI concepts: recent category inflation pressure, especially food and energy-sensitive categories.
- Competition proxy: a small explicit placeholder signal for market concentration, regulation, import dependency, or distribution opacity. The current version uses curated illustrative values and labels them as proxy values.

## Product Surface

The first screen should be the actual dashboard, not a marketing landing page. It should include:

- A concise hero with the product name, metric definition, and legal/analytical caveat.
- Four KPI cards for overall score, highest-risk category, OECD/Numbeo basis, and Korea-relative interpretation.
- Category score cards for groceries, restaurant meals, housing/rent, transportation, and utilities.
- A country comparison table based on Korea-relative pressure.
- A source/methodology section that explains the weighting and limitations.

## Implementation Notes

- Use the existing Next.js App Router project.
- Prefer static, deterministic data for this pass because Numbeo does not provide a simple public free API in the existing project.
- Keep source attribution visible in the UI.
- Replace the default Next.js homepage.
- Route `/dashboard` should show the same finished dashboard.

## Acceptance Criteria

- The homepage is branded as K-Collusion Index.
- The dashboard includes Numbeo and OECD as named data bases.
- The score wording avoids claiming legal collusion proof.
- Browser-rendered copy is not mojibake.
- Build and e2e checks complete successfully.
