import { expect, test } from "@playwright/test";

const trustPages = [
  {
    path: "/about",
    heading: "Korea Price Index 소개",
    requiredText: "공개 통계 기반 데이터 해설 프로젝트",
  },
  {
    path: "/methodology",
    heading: "방법론",
    requiredText: "Korea Price Index = 국가별 가격수준 비율 / 한국 가격수준 비율 x 100",
  },
  {
    path: "/privacy",
    heading: "개인정보 처리방침",
    requiredText: "개인 맞춤 광고를 원하지 않는 경우 Google 광고 설정",
  },
  {
    path: "/contact",
    heading: "문의",
    requiredText: "운영자 연락처",
  },
  {
    path: "/disclaimer",
    heading: "면책 고지",
    requiredText: "투자, 정책 결정, 법률 또는 세무 판단",
  },
];

const crawlFiles = [
  { path: "/robots.txt", requiredText: "Sitemap:" },
  { path: "/sitemap.xml", requiredText: "/countries/united-states" },
  { path: "/ads.txt", requiredText: "google.com, pub-0000000000000000, DIRECT" },
];

test.describe("AdSense readiness content", () => {
  test("site navigation exposes trust pages and country analysis", async ({ page }) => {
    await page.goto("/dashboard");

    for (const item of trustPages) {
      await expect(page.getByRole("link", { name: item.heading })).toHaveAttribute(
        "href",
        item.path,
      );
    }

    await expect(page.getByRole("link", { name: "국가별 해설" })).toHaveAttribute(
      "href",
      "/countries",
    );
  });

  for (const item of trustPages) {
    test(`${item.path} includes substantive publisher content`, async ({ page }) => {
      await page.goto(item.path);

      await expect(page).toHaveTitle(/Korea Price Index/);
      await expect(page.getByRole("heading", { name: item.heading, level: 2 })).toBeVisible();
      await expect(page.locator("body")).toContainText(item.requiredText);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://korea-price-index.pages.dev${item.path}`,
      );
      await expect(page.getByRole("link", { name: "대시보드" })).toHaveAttribute(
        "href",
        "/dashboard",
      );
    });
  }

  for (const item of crawlFiles) {
    test(`${item.path} is crawlable`, async ({ page }) => {
      const response = await page.request.get(item.path);
      expect(response.status()).toBe(200);
      await expect(response.text()).resolves.toContain(item.requiredText);
    });
  }

  test("country analysis pages provide index interpretation and source links", async ({ page }) => {
    await page.goto("/countries/united-states");

    await expect(page).toHaveTitle(/미국 GDP 가격수준 해설/);
    await expect(page.getByRole("heading", { name: "미국 GDP 가격수준 해설", level: 2 })).toBeVisible();
    await expect(page.locator("body")).toContainText("한국을 100으로 둔 GDP 기준 일반 가격수준 지수");
    await expect(page.locator("body")).toContainText("G20 19개 국가 비교");
    await expect(page.getByRole("link", { name: "World Bank WDI" })).toHaveAttribute(
      "href",
      /data\.worldbank\.org/,
    );
  });

  test("methodology states scope and non-ranking limitation", async ({ page }) => {
    await page.goto("/methodology");

    await expect(page.locator("body")).toContainText("EU·AU 지역기구는 제외");
    await expect(page.locator("body")).toContainText("엄격한 국가 순위를 확정하는 용도로 해석하지 않습니다");
  });
});
