import { expect, test } from "@playwright/test";

const requiredPages = [
  {
    path: "/about",
    heading: "Korea Price Index 소개",
    text: "한국을 기준값 100으로 두고",
  },
  {
    path: "/methodology",
    heading: "방법론",
    text: "PA.NUS.PPPC.RF",
  },
  {
    path: "/privacy",
    heading: "개인정보 처리방침",
    text: "Google AdSense",
  },
  {
    path: "/contact",
    heading: "문의",
    text: "github.com/esin3329/korea-price-index/issues",
  },
  {
    path: "/disclaimer",
    heading: "면책 고지",
    text: "투자, 정책 결정, 법률 또는 세무 판단",
  },
];

test.describe("Trust and policy content", () => {
  test("site navigation exposes trust pages from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    for (const item of requiredPages) {
      await expect(page.getByRole("link", { name: item.heading })).toHaveAttribute(
        "href",
        item.path,
      );
    }
  });

  for (const item of requiredPages) {
    test(`${item.path} renders substantive publisher content`, async ({ page }) => {
      await page.goto(item.path);

      await expect(page).toHaveTitle(/Korea Price Index/);
      await expect(page.getByRole("heading", { name: item.heading, level: 2 })).toBeVisible();
      await expect(page.locator("body")).toContainText(item.text);
      await expect(page.getByRole("link", { name: "대시보드" })).toHaveAttribute(
        "href",
        "/dashboard",
      );
    });
  }
});
