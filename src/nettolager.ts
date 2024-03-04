import * as puppeteer from "puppeteer";
import * as fs from "fs";
import { Page } from "puppeteer";
import "dotenv/config";

export class NettolagerScraper {
  async scrapeNettoLagerUnits(): Promise<string> {
    fs.writeFileSync("scrape_time_nettolager.txt", new Date().toISOString());
    console.log("logged new scrape time: " + new Date().toISOString());

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

    const allLocationsUnitData = [];

    // var counter = 0;
    for (let url of departmentUrls) {
      await page.goto(url);

      // if (counter === 15) {
      // }

      const unitData = await this.extractUnitData(page);

      allLocationsUnitData.push({ url, unitData });
      // counter++;
    }

    // Convert allLocationsUnitData to JSON
    const allLocationsUnitDataJson = JSON.stringify(
      allLocationsUnitData,
      null,
      2
    );

    // Save the JSON data to a file
    fs.writeFileSync("nettolager.json", allLocationsUnitDataJson);

    return allLocationsUnitDataJson;
  }

  // Function to extract data from each department page
  async extractUnitData(page: Page) {
    const allUnitData = [];

    const sizeButtons = await page.$$(
      ".p-button.p-component.p-button-gray.p-button-circle"
    );

    for (let i = 0; i < sizeButtons.length; i++) {
      await sizeButtons[i].hover();
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

  // Function to extract data from the room list
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
