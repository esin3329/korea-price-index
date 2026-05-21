export const SCORE_WEIGHTS = {
  numbeoPressure: 0.35,
  oecdPriceDeviation: 0.25,
  cpiPressure: 0.2,
  affordabilityBurden: 0.15,
  competitionRisk: 0.05,
};

function clampScore(value) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function calculateWeightedScore(components) {
  const weightedTotal = Object.entries(SCORE_WEIGHTS).reduce(
    (total, [key, weight]) => total + clampScore(components[key] ?? 0) * weight,
    0,
  );

  return Math.round(weightedTotal);
}

export const categories = [
  {
    id: "groceries",
    label: "Groceries",
    score: calculateWeightedScore({
      numbeoPressure: 92,
      oecdPriceDeviation: 78,
      cpiPressure: 69,
      affordabilityBurden: 84,
      competitionRisk: 64,
    }),
    status: "Very high",
    summary: "Numbeo grocery pressure and OECD food inflation pressure both point to a high-risk category.",
    drivers: ["Import-sensitive items", "Distribution layers", "Fresh-food volatility"],
    numbeoIndex: 72.8,
    koreaRelative: 151,
  },
  {
    id: "restaurants",
    label: "Restaurant meals",
    score: calculateWeightedScore({
      numbeoPressure: 83,
      oecdPriceDeviation: 71,
      cpiPressure: 66,
      affordabilityBurden: 76,
      competitionRisk: 52,
    }),
    status: "High",
    summary: "Dining prices combine labor, rent, and ingredient pressure, making the burden visible to consumers.",
    drivers: ["Ingredient costs", "Commercial rent", "Labor cost"],
    numbeoIndex: 52.3,
    koreaRelative: 161,
  },
  {
    id: "housing",
    label: "Housing and rent",
    score: calculateWeightedScore({
      numbeoPressure: 58,
      oecdPriceDeviation: 67,
      cpiPressure: 45,
      affordabilityBurden: 88,
      competitionRisk: 48,
    }),
    status: "Watch",
    summary: "The stronger signal is affordability pressure and regional concentration, not only absolute rent.",
    drivers: ["Capital-region demand", "Income burden", "Lease structure"],
    numbeoIndex: 28.4,
    koreaRelative: 123,
  },
  {
    id: "transport",
    label: "Transportation",
    score: calculateWeightedScore({
      numbeoPressure: 35,
      oecdPriceDeviation: 42,
      cpiPressure: 41,
      affordabilityBurden: 32,
      competitionRisk: 22,
    }),
    status: "Low",
    summary: "Public-transit-centered costs remain comparatively low, so the distortion signal is limited.",
    drivers: ["Public fares", "Urban rail", "Bus subsidy"],
    numbeoIndex: 35.8,
    koreaRelative: 87,
  },
  {
    id: "utilities",
    label: "Utilities and energy",
    score: calculateWeightedScore({
      numbeoPressure: 49,
      oecdPriceDeviation: 54,
      cpiPressure: 72,
      affordabilityBurden: 46,
      competitionRisk: 35,
    }),
    status: "Monitor",
    summary: "Recent CPI volatility is notable, while the international price-level distortion remains moderate.",
    drivers: ["Energy prices", "Tariff adjustment", "Policy lag"],
    numbeoIndex: 44.2,
    koreaRelative: 96,
  },
];

export const countryComparisons = [
  { country: "Switzerland", code: "CH", costOfLiving: 101.2, groceries: 112.5, localPower: 118.6, relativeToKorea: 164 },
  { country: "Australia", code: "AU", costOfLiving: 72.5, groceries: 78.2, localPower: 121.3, relativeToKorea: 118 },
  { country: "United States", code: "US", costOfLiving: 68.8, groceries: 73.4, localPower: 111.5, relativeToKorea: 112 },
  { country: "Germany", code: "DE", costOfLiving: 68.7, groceries: 58.6, localPower: 109.2, relativeToKorea: 112 },
  { country: "France", code: "FR", costOfLiving: 66.3, groceries: 67.8, localPower: 101.7, relativeToKorea: 108 },
  { country: "South Korea", code: "KR", costOfLiving: 61.6, groceries: 72.8, localPower: 111.5, relativeToKorea: 100 },
  { country: "Japan", code: "JP", costOfLiving: 47.5, groceries: 52.4, localPower: 103.8, relativeToKorea: 77 },
  { country: "Thailand", code: "TH", costOfLiving: 35.2, groceries: 34.6, localPower: 44.6, relativeToKorea: 57 },
  { country: "Vietnam", code: "VN", costOfLiving: 27.8, groceries: 24.3, localPower: 35.2, relativeToKorea: 45 },
];

export const methodology = [
  { label: "Numbeo relative price", weight: "35%", description: "Cost of living, groceries, restaurant, and rent pressure relative to Korea" },
  { label: "OECD PPP price level", weight: "25%", description: "Purchasing-power-parity price-level deviation to reduce exchange-rate distortion" },
  { label: "OECD CPI pressure", weight: "20%", description: "Recent category inflation pressure and accumulated CPI movement" },
  { label: "Affordability burden", weight: "15%", description: "Local Purchasing Power and disposable-income context for consumer burden" },
  { label: "Competition risk proxy", weight: "5%", description: "Supplemental signal for concentration, import barriers, and distribution opacity" },
];

export const overallScore = Math.round(
  categories.reduce((sum, category) => sum + category.score, 0) / categories.length,
);
