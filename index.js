import puppeteer from "puppeteer";
import fs from "fs";
import { join } from "path";
import { baseURL, startPage, endPage, fileName } from "./config.js";

const sleepInSeconds = async (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
  let items = new Set();
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome-stable",
    headless: true,
  });

  await sleepInSeconds(1);

  const page = await browser.newPage();

  console.log("Opening page: " + baseURL + currentPage);
  await page.goto(baseURL + currentPage);

  await page.setViewport({ width: 1080, height: 1024 });

  const scrollableSelector = ".VirtualList_virtualListWrapper__3ufr4";

  for (let i = 0; i < 10; i++) {
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollBy(0, window.innerHeight / 2);
      }
    }, scrollableSelector);

    const newItems = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".BundleItem_item__content__3l8hl")
      ).map((parent) => ({
        title:
          parent
            .querySelector(".BundleItem_item__name__1DYyY")
            ?.textContent.trim() || "N/A",
        address:
          parent
            .querySelector(".BundleItem_item__subtitle__2a2IA")
            ?.textContent.trim() || "N/A",
        website: parent.querySelector('a[href^="http"]')?.href || "No Website",
        phone:
          parent.querySelector('a[href^="tel"]')?.href.replace("tel://", "") ||
          "No Phone",
      }));
    });

    // Process extracted items
    newItems.forEach((item) => {
      if (!items.has(item.title)) {
        items.add(item.title);

        const line = `${item.title},${item.address},${item.website},${item.phone}\n`;

        fs.appendFileSync(join("data", `${fileName}.csv`), line);
      }
    });

    await sleepInSeconds(1);
  }
  await browser.close();
}
