import { expect, test } from "@playwright/test";

type IndexDataItem = {
  countryCode: string;
  countryName: string;
  indexValue: number;
  baseYear: number;
  source: string;
  sourceDetail: string;
  rawPriceLevelRatio: number;
  consumerInflationRate: number;
  consumerInflationYear: number;
  consumerInflationSource: string;
  consumerInflationSourceDetail: string;
  consumerInflationVintage: string;
  consumerInflationPublicationDate: string;
  consumerInflationIsForecast: boolean;
  latestCpiInflationRate: number;
  latestCpiInflationYear: number;
  latestCpiInflationSource: string;
  latestCpiInflationSourceDetail: string;
};

test.describe("K-Collusion Index Dashboard", () => {
  test("대시보드 페이지가 정상적으로 로드된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveTitle(/K-Collusion Index/);
    await expect(
      page.getByRole("heading", { name: "한국 기준 국제 물가 수준 비교" }),
    ).toBeVisible();
  });

  test("통계 요약이 표시된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("기준 국가")).toBeVisible();
    await expect(page.getByText("평균 지수")).toBeVisible();
    await expect(page.getByText("가장 높은 물가 수준")).toBeVisible();
    await expect(page.getByText("가장 낮은 물가 수준")).toBeVisible();
  });

  test("차트와 순위표가 표시된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("물가 수준 지수 비교")).toBeVisible();
    await expect(page.locator(".recharts-wrapper")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("국가별 순위")).toBeVisible();

    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(19);
  });

  test("대한민국은 기준 지수 100으로 표시된다", async ({ page }) => {
    await page.goto("/dashboard");

    const koreaRow = page.locator("table tbody tr", { hasText: "대한민국" });
    await expect(koreaRow).toContainText("100.0");
    await expect(koreaRow).toContainText("기준");
  });

  test("정적 JSON 데이터 파일이 올바른 공식 데이터 구조를 가진다", async ({ page }) => {
    const response = await page.request.get("/data/k-collusion-index.json");
    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(19);
    expect(json.expectedCountryCount).toBe(19);
    expect(json.officialCountryCount).toBe(19);
    expect(json.missingCountries).toEqual([]);
    expect(json.hasIncompleteOfficialPull).toBe(false);
    expect(json.isFallback).toEqual(expect.any(Boolean));
    expect(json.source).toBe("World Bank WDI");
    expect(json.indicatorCode).toBe("PA.NUS.PPPC.RF");
    expect(json.consumerInflationYear).toBe(2026);
    expect(json.consumerInflationSource).toBe(
      "IMF World Economic Outlook (April 2026)",
    );
    expect(json.consumerInflationIndicatorCode).toBe("PCPIPCH");
    expect(json.consumerInflationVintage).toBe("April 2026");
    expect(json.consumerInflationPublicationDate).toBe("2026-04-14");
    expect(json.consumerInflationIsForecast).toBe(true);
    expect(json.latestCpiInflationYear).toBe(2024);
    expect(json.latestCpiInflationSource).toBe("World Bank WDI");
    expect(json.latestCpiInflationIndicatorCode).toBe("FP.CPI.TOTL.ZG");
    expect(json.datasetType).toBe(
      "PRICE_LEVEL_RATIO_GDP_PPP_TO_MARKET_EXCHANGE_RATE",
    );

    const firstItem = json.data[0] as IndexDataItem;
    expect(firstItem.countryCode).toBeDefined();
    expect(firstItem.countryName).toBeDefined();
    expect(firstItem.indexValue).toEqual(expect.any(Number));
    expect(firstItem.baseYear).toEqual(expect.any(Number));
    expect(firstItem.source).toBe("World Bank WDI");
    expect(firstItem.sourceDetail).toBe("world_bank_wdi:PA.NUS.PPPC.RF");
    expect(firstItem.rawPriceLevelRatio).toEqual(expect.any(Number));
    expect(firstItem.consumerInflationRate).toEqual(expect.any(Number));
    expect(firstItem.consumerInflationYear).toBe(2026);
    expect(firstItem.consumerInflationSource).toBe(
      "IMF World Economic Outlook (April 2026)",
    );
    expect(firstItem.consumerInflationSourceDetail).toBe("imf_weo:PCPIPCH");
    expect(firstItem.consumerInflationVintage).toBe("April 2026");
    expect(firstItem.consumerInflationPublicationDate).toBe("2026-04-14");
    expect(firstItem.consumerInflationIsForecast).toBe(true);
    expect(firstItem.latestCpiInflationRate).toEqual(expect.any(Number));
    expect(firstItem.latestCpiInflationYear).toBe(2024);
    expect(firstItem.latestCpiInflationSource).toBe("World Bank WDI");
    expect(firstItem.latestCpiInflationSourceDetail).toBe(
      "world_bank_wdi:FP.CPI.TOTL.ZG",
    );

    const koreaData = json.data.find(
      (item: IndexDataItem) => item.countryCode === "KOR",
    );
    expect(koreaData).toBeDefined();
    expect(koreaData.indexValue).toBe(100);
    expect(koreaData.consumerInflationRate).toBe(2.5);
    expect(koreaData.latestCpiInflationRate).toBe(2.3);
  });

  test("완전한 공식 데이터에서는 누락 경고를 표시하지 않는다", async ({ page }) => {
    await page.goto("/dashboard");

    const response = await page.request.get("/data/k-collusion-index.json");
    const json = await response.json();

    expect(json.hasIncompleteOfficialPull).toBe(false);
  });

  test("CSV와 JSON 다운로드 동선이 제공된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("button", { name: "CSV 다운로드" })).toBeVisible();

    const jsonLink = page.getByRole("link", { name: "JSON 다운로드" });
    await expect(jsonLink).toBeVisible();
    await expect(jsonLink).toHaveAttribute("href", "/data/k-collusion-index.json");
  });
});
