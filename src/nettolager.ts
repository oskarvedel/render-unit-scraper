import * as puppeteer from "puppeteer";
import * as fs from "fs";
import { Page } from "puppeteer";
import "dotenv/config";
import { promisify } from "util";

export class NettolagerScraper {
  async scrapeNettoLagerUnits(): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 }); // Set the window size
    await page.goto("https://www.nettolager.dk/lagerhoteller/"); // Main page URL

    // Wait for the cookie button to appear and then click it
    await page.waitForSelector(
      "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
    );
    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");

    // Code to extract department URLs goes here
    const departmentUrls = await page.$$eval(
      ".department-card .department-card__content a",
      (anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href)
    );

    const waitForTimeout = promisify(setTimeout);

    const allLocationsUnitData = [];

    // var counter = 0;

    for (let url of departmentUrls) {
      const page = await browser.newPage(); // Create a new page for each URL
      await page.setViewport({ width: 1280, height: 800 }); // Set the window size
      await page.goto(url);

      const unitData = await this.extractUnitData(page);

      allLocationsUnitData.push({ url, unitData });

      // Convert unitData to JSON and write it to a file
      const unitDataJson = JSON.stringify({ url, unitData }, null, 2);
      fs.appendFileSync("nettolager.json", unitDataJson + ",\n");

      await page.close(); // Close the department page
      await waitForTimeout(1000); // Delay before navigating to the next page
      // counter += 1;

      // if (counter > 4) {
      //   break;
      // }
    }

    await browser.close(); // Close the browser

    // Convert allLocationsUnitData to JSON
    const allLocationsUnitDataJson = JSON.stringify(
      allLocationsUnitData,
      null,
      2
    );

    // Save the JSON data to a file
    // fs.writeFileSync("nettolager.json", allLocationsUnitDataJson);

    return allLocationsUnitDataJson;
  }

  async extractUnitData(page: Page) {
    const allUnitData = [];

    const sizeButtons = await page.$$(
      ".p-button.p-component.p-button-gray.p-button-circle"
    );

    for (let i = 0; i < sizeButtons.length; i++) {
      try {
        await sizeButtons[i].hover();
      } catch (error) {
        console.error("Failed to hover over element:", error);
      }
      await sizeButtons[i].click();

      await page.waitForSelector(".room-list-item", { visible: true });
      const unitData = await this.extractRoomData(page);
      allUnitData.push(...unitData);

      if (i < sizeButtons.length - 1) {
        const nextButton = await page.$("button.p-carousel-next.p-link");
        if (nextButton) {
          await nextButton.click();
        } else {
          console.log('Button with class "p-carousel-next p-link" not found');
        }
      }
    }

    return allUnitData;
  }

  async extractRoomData(page: Page) {
    const rooms = await page.$$(".room-list-item");
    const roomData = [];

    for (const room of rooms) {
      const m2 = await room.$eval(
        ".room-list-item__size span",
        (span) => (span as HTMLSpanElement).innerText
      );

      const m3 = await room.$eval(
        ".room-list-item__size span",
        (span) => (span as HTMLSpanElement).innerText
      );

      const available = await room.$eval(
        ".room-list-item__size small",
        (small) => (small as HTMLMapElement).innerText
      );
      const price = await room.$eval(
        ".room-list-item__price",
        (price) => (price as HTMLElement).innerText
      );
      roomData.push({ m2, m3, available, price });
    }

    return roomData;
  }
}

// Example usage:
// const scraper = new NettolagerScraper();
// scraper.scrapeNettoLagerUnits().then(console.log).catch(console.error);
