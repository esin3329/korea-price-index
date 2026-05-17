import { expect, test } from "@playwright/test";

type IndexDataItem = {
  countryCode: string;
  countryName: string;
  indexValue: number;
  baseYear: number;
  source: "OECD" | "sample";
  isSampleBacked: boolean;
  sourceDetail: string;
};

test.describe("K-Collusion Index Dashboard", () => {
  test("대시보드 페이지가 정상적으로 로드된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveTitle(/K-Collusion Index/);
    await expect(
      page.getByRole("heading", { name: "한국 물가 국제 비교" }),
    ).toBeVisible();
  });

  test("통계 요약이 표시된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("기준 국가")).toBeVisible();
    await expect(page.getByText("평균 지수")).toBeVisible();
    await expect(page.getByText("최고 물가")).toBeVisible();
    await expect(page.getByText("최저 물가")).toBeVisible();
  });

  test("차트와 순위표가 표시된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("물가 지수 비교")).toBeVisible();
    await expect(page.locator(".recharts-wrapper")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("국가별 순위")).toBeVisible();

    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(20);
  });

  test("대한민국은 기준 지수 100으로 표시된다", async ({ page }) => {
    await page.goto("/dashboard");

    const koreaRow = page.locator("table tbody tr", { hasText: "대한민국" });
    await expect(koreaRow).toContainText("100.0");
    await expect(koreaRow).toContainText("기준");
  });

  test("정적 JSON 데이터 파일이 올바른 구조를 가진다", async ({ page }) => {
    const response = await page.request.get("/data/k-collusion-index.json");
    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(20);
    expect(json.baseYear).toBe(2023);
    expect(json.expectedCountryCount).toBe(20);
    expect(json.oecdCountryCount).toEqual(expect.any(Number));
    expect(json.sampleBackedCountryCount).toEqual(expect.any(Number));
    expect(Array.isArray(json.missingOecdCountries)).toBe(true);
    expect(json.hasIncompleteOecdPull).toEqual(expect.any(Boolean));

    const firstItem = json.data[0] as IndexDataItem;
    expect(firstItem.countryCode).toBeDefined();
    expect(firstItem.countryName).toBeDefined();
    expect(firstItem.indexValue).toEqual(expect.any(Number));
    expect(firstItem.baseYear).toBe(2023);
    expect(["OECD", "sample"]).toContain(firstItem.source);
    expect(firstItem.isSampleBacked).toEqual(expect.any(Boolean));
    expect(firstItem.sourceDetail).toEqual(expect.any(String));

    const koreaData = json.data.find(
      (item: IndexDataItem) => item.countryCode === "KOR",
    );
    expect(koreaData).toBeDefined();
    expect(koreaData.indexValue).toBe(100);
  });

  test("샘플 기반 행과 불완전 OECD metadata를 화면에 표시한다", async ({ page }) => {
    await page.goto("/dashboard");

    const response = await page.request.get("/data/k-collusion-index.json");
    const json = await response.json();

    if (json.isFallback || json.hasIncompleteOecdPull) {
      await expect(page.getByRole("status")).toContainText("샘플 기반 행:");
      await expect(page.getByText("샘플").first()).toBeVisible();
    }
  });

  test("CSV와 JSON 다운로드 동선이 제공된다", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("button", { name: "CSV 다운로드" })).toBeVisible();

    const jsonLink = page.getByRole("link", { name: "JSON 다운로드" });
    await expect(jsonLink).toBeVisible();
    await expect(jsonLink).toHaveAttribute("href", "/data/k-collusion-index.json");
  });
});
