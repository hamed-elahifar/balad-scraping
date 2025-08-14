console.clear();
import puppeteer from "puppeteer";
import fs from "fs";
import { join } from "path";
import { baseURL, startPage, categories, cities } from "./config.js";

const fileName = extractFileName(baseURL);

const sleepInSeconds = async (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

for (let cat of categories) {
  for (let city of cities) {
    const url = baseURL.replace("{cat}", cat).replace("{city}", city);

    for (let currentPage = startPage; currentPage <= 500; currentPage++) {
      let noNewItems = false;
      let items = new Set();
      const browser = await puppeteer.launch({
        executablePath: "/usr/bin/google-chrome-stable",
        headless: true,
      });

      await sleepInSeconds(1);

      const page = await browser.newPage();

      console.log("Opening page: " + url + currentPage);
      await page.goto(url + currentPage);

      await page.setViewport({ width: 1080, height: 1024 });

      const scrollableSelector = ".VirtualList_virtualListWrapper__3ufr4";

      for (let i = 0; i < 10; i++) {
        // this for loop is to scroll
        await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollBy(0, window.innerHeight / 2);
            console.log(element.textContent.trim());
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
            website:
              parent.querySelector('a[href^="http"]')?.href || "No Website",
            phone:
              parent
                .querySelector('a[href^="tel"]')
                ?.href.replace("tel://", "") || "No Phone",
          }));
        });

        if (newItems.length === 0) {
          noNewItems = true; // to brake outer loop
        }

        // Process extracted items
        newItems.forEach((item) => {
          if (!items.has(item.title)) {
            items.add(item.title);

            const line = `${item.title},${item.address},${item.website},${item.phone}\n`;

            // if city directory does not exist, create it
            if (!fs.existsSync(join("data", `${city}`))) {
              fs.mkdirSync(join("data", `${city}`), { recursive: true });
            }

            fs.appendFileSync(join("data", `${city}`, `${cat}.csv`), line);
          }
        });

        await sleepInSeconds(1);
      }
      await browser.close();

      if (noNewItems) {
        console.log("No new items found, stopping the scraping.");
        break;
      }
    }
  }
}

function extractFileName(url) {
  // Create a URL object for easier parsing
  const urlObj = new URL(url);

  // Get the pathname part of the URL
  const pathname = urlObj.pathname; // e.g., "/branch/tehran-iran-insurance-agency"

  // Split the pathname into segments
  const segments = pathname.split("/").filter(Boolean); // Remove empty segments

  // Determine prefix based on the first segment
  const type = segments[0]; // e.g., 'branch' or 'city'

  // Extract the relevant part (the last segment)
  const namePart = segments.slice(1).join("-"); // e.g., 'tehran-iran-insurance-agency' or 'tehran--cat-infirmary'

  // Replace hyphens with double hyphens for clarity if needed
  // But based on your examples, you want to keep hyphens as is, prefix with type--
  const filename = `${type}--${namePart}`;

  return filename;
}
