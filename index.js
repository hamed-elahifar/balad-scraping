console.clear();
import puppeteer from "puppeteer";
import fs from "fs";
import { join } from "path";
import { baseURL, startPage, categories, cities } from "./config.js";
import { Url, Item } from "./models.js";

import { mongoDB, mongoDBConnection } from "./mongodb.js";

mongoDBConnection();

const sleepInSeconds = async (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

function writeToFile(logLine) {
  // Create logs directory if it doesn't exist
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs", { recursive: true });
  }

  const filePath = join("logs", "log.txt");
  console.log(logLine);
  fs.appendFile(filePath, logLine + "\n", (err) => {
    if (err) {
      console.error("Error writing log line:", err);
    }
  });
}

async function main() {
  for (let cat of categories) {
    for (let city of cities) {
      let existingUrl;

      existingUrl = await Url.findOne({
        cat,
        city,
        status: { $ne: "Done" },
      });

      if (!existingUrl) {
        await Url.create({
          type: "cat",
          cat,
          city,
          page: 1,
          status: "in-progress",
        });
      }

      existingUrl = await Url.findOne({
        cat,
        city,
        status: { $ne: "Done" },
      });

      // const url = baseURL.replace("{cat}", cat).replace("{city}", city);
      const { url, page } = existingUrl;
      // console.log(existingUrl);

      for (let currentPage = page; currentPage <= 500; currentPage++) {
        let noNewItems = false;
        let items = new Set();
        const browser = await puppeteer.launch({
          executablePath: "/usr/bin/google-chrome-stable",
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        await sleepInSeconds(1);

        const webPage = await browser.newPage();

        await webPage.goto(url);

        await webPage.setViewport({ width: 1080, height: 1024 });

        const scrollableSelector = ".VirtualList_virtualListWrapper__3ufr4";

        // this for loop is to scroll
        for (let i = 0; i < 10; i++) {
          await webPage.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
              element.scrollBy(0, window.innerHeight / 2);
              console.log(element.textContent.trim());
            }
          }, scrollableSelector);

          const newItems = await webPage.evaluate(() => {
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
              website: parent.querySelector('a[href^="http"]')?.href || "",
              phone:
                parent
                  .querySelector('a[href^="tel"]')
                  ?.href.replace("tel://", "") || "",
            }));
          });

          if (newItems.length === 0) {
            noNewItems = true; // to brake outer loop
          }

          // Process extracted items
          newItems.forEach(async (item) => {
            if (!items.has(item.title)) {
              items.add(item.title);

              await Item.create({
                title: item.title,
                address: item.address,
                website: item.website,
                phone: item.phone,
                city,
                category: cat,
                url,
              });

              // const line = `${item.title},${item.address},${item.website},${item.phone}\n`;

              // // if city directory does not exist, create it
              // if (!fs.existsSync("data")) {
              //   fs.mkdirSync("data", { recursive: true });
              // }
              // if (!fs.existsSync(join("data", `${city}`))) {
              //   fs.mkdirSync(join("data", `${city}`), { recursive: true });
              // }

              // fs.appendFileSync(join("data", `${city}`, `${cat}.csv`), line);
            }
          });

          await sleepInSeconds(1);
        }
        await browser.close();

        existingUrl.page = existingUrl.page + 1;
        await existingUrl.save();

        // this will break the current page loop
        if (noNewItems) {
          existingUrl.status = "Done";
          await existingUrl.save();
          writeToFile("No new items found, stopping the scraping.");
          break;
        }
      }
    }
  }
}

mongoDB.connection.once("open", () => {
  writeToFile(`main started at ${new Date().toISOString()}`);
  // Ensure connection is ready before starting
  if (mongoDB.connection.readyState === 1) {
    console.info("MongoDB is connected and ready");
    main().catch(console.error);
  } else {
    console.error(
      "MongoDB is not ready. Current state:",
      mongoDB.connection.readyState
    );
  }
});

// Also add a ready event listener as backup
mongoDB.connection.on("ready", () => {
  console.info("MongoDB connection is ready");
});
