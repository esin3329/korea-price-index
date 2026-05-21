import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "@playwright/test";

const root = join(process.cwd(), "out");
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

function fileForUrl(url) {
  const pathname = new URL(url, "http://localhost").pathname;
  const cleanPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");

  if (cleanPath === "/" || cleanPath === "\\") {
    return join(root, "index.html");
  }

  if (!extname(cleanPath)) {
    const htmlFile = join(root, `${cleanPath}.html`);
    return htmlFile;
  }

  return join(root, cleanPath);
}

const port = 4173;
const server = createServer(async (request, response) => {
  try {
    const filePath = fileForUrl(request.url ?? "/");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, resolve);
});

try {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
  await page.getByText("Korean consumer price distortion signal").waitFor({ state: "visible" });
  await page.getByText("Category K-Collusion Score").waitFor({ state: "visible" });
  await page.getByText("Formula and limits").waitFor({ state: "visible" });
  await page.getByText("Numbeo Cost of Living 2026").waitFor({ state: "visible" });

  await page.goto(`http://localhost:${port}/dashboard`, { waitUntil: "networkidle" });
  await page.getByText("Country cost-pressure comparison").waitFor({ state: "visible" });
  await page.getByText("Korea = 100").waitFor({ state: "visible" });

  await browser.close();
  console.log("Dashboard browser verification passed.");
} finally {
  server.close();
}
