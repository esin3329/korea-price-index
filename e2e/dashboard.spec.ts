import { test, expect } from '@playwright/test';

test.describe('K-Collusion Index dashboard', () => {
  test('renders the approved dashboard on the homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/K-Collusion Index/);
    await expect(page.getByRole('heading', { name: 'Korean consumer price distortion signal' })).toBeVisible();
    await expect(page.getByText('A composite dashboard that combines Numbeo cost-of-living indicators')).toBeVisible();
    await expect(page.getByText('This index does not legally determine collusion.')).toBeVisible();
  });

  test('renders category scores and source methodology', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Category K-Collusion Score' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Formula and limits' })).toBeVisible();
    await expect(page.getByText('Restaurant meals')).toBeVisible();
    await expect(page.getByText('OECD PPP price level')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Numbeo Cost of Living 2026' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'OECD Inflation CPI' })).toBeVisible();
  });

  test('keeps the dashboard route aligned with the homepage', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Korean consumer price distortion signal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Country cost-pressure comparison' })).toBeVisible();
    await expect(page.getByText('Korea = 100')).toBeVisible();
  });
});
