import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateWeightedScore } from "../app/lib/collusionData.mjs";

test("calculates weighted K-Collusion score from approved components", () => {
  const score = calculateWeightedScore({
    numbeoPressure: 88,
    oecdPriceDeviation: 74,
    cpiPressure: 62,
    affordabilityBurden: 81,
    competitionRisk: 55,
  });

  assert.equal(score, 77);
});

test("rounds score and clamps component inputs to the 0-100 range", () => {
  const score = calculateWeightedScore({
    numbeoPressure: 140,
    oecdPriceDeviation: 60,
    cpiPressure: -20,
    affordabilityBurden: 50,
    competitionRisk: 80,
  });

  assert.equal(score, 62);
});
