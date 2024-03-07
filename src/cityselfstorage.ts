import * as puppeteer from "puppeteer";
import * as fs from "fs";
// import { Page } from "puppeteer";
import "dotenv/config";

//make the ts file understand that page and button are defined by puppeteer
export class CitySelfStorageScraper {
  async scrapeCitySelfStorageUnits(): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      timeout: 60000,
      // args: [
      //   "--no-sandbox",
      //   "--disable-setuid-sandbox",
      //   '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
      // ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set the window size
    // page.setExtraHTTPHeaders({
    //   accept:
    //     "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    // });
    await page.goto("https://cityselfstorage.dk/opbevaring/"); // Main page URL

    // Wait for the cookie button to appear and then click it
    // await page.waitForSelector("#onetrust-accept-btn-handler");
    // await page.click("#onetrust-accept-btn-handler");

    await page.waitForSelector(
      "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
    );
    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");

    // Get all 'a' elements with the classes 'elementor-button', 'elementor-button-link', and 'elementor-size-sm' that are descendants of 'div' elements with the class 'elementor-widget-container' and have the text 'Book online'
    const allLocationsUnitData = [];

    // Get all 'a' elements with the class 'region__store'
    const locationUrls = await page.$$eval(".stock-button", (buttons) =>
      buttons.map((button) => button.getAttribute("href"))
    );

    for (const locationUrl of locationUrls) {
      // Extract the location details
      // const locationDetails = await this.extractLocationDetails(location);

      //navigate to the location
      if (locationUrl) {
        await page.goto(locationUrl);
      } else {
        continue;
      }

      // Extract the unit list
      const unitList = await this.extractRoomData(page);
      // Add the location details and unit list to allLocationsUnitData
      // allLocationsUnitData.push({ locationDetails, unitList });
      allLocationsUnitData.push({ locationUrl, unitList });
    }

    //convert allLocationsUnitData to JSON
    const allLocationsUnitDataJson = JSON.stringify(
      allLocationsUnitData,
      null,
      2
    );

    // Save the JSON data to a file
    fs.writeFileSync("cityselfstorage.json", allLocationsUnitDataJson);

    fs.writeFileSync(
      "scrape_time_cityselfstorage.txt",
      new Date().toISOString()
    );
    console.log("logged new scrape time: " + new Date().toISOString());

    //close the browser
    await browser.close();

    return allLocationsUnitDataJson;
  }

  async extractRoomData(page: puppeteer.Page) {
    // Get all 'div' elements with the class 'item-card-wrapper'
    const rooms = await page.$$("div.item-card-wrapper");

    // Create an empty array to store the extracted data
    const roomData = [];

    for (const room of rooms) {
      // Extract the size
      const sizeElement = await room.$("h3.margin-0");
      const sizeProperty = sizeElement
        ? await sizeElement.getProperty("innerText")
        : null;
      const size = sizeProperty ? await sizeProperty.jsonValue() : null;

      // Extract the volume
      const volumeElement = await room.$(".volume");
      const volumeProperty = volumeElement
        ? await volumeElement.getProperty("innerText")
        : null;
      const volume = volumeProperty ? await volumeProperty.jsonValue() : null;

      // Extract the discount
      const discountElement = await room.$(
        ".product-cat.btn.btn-primary.Percent"
      );
      const discountProperty = discountElement
        ? await discountElement.getProperty("innerText")
        : null;
      const discountText = discountProperty
        ? await discountProperty.jsonValue()
        : null;

      let introPrice = null;
      let introPeriod = null;

      if (discountText) {
        const parts = discountText.split(" i ");
        introPrice = parts[0];
        introPeriod = parts[1];
      }

      // Extract the price
      const priceElement = await room.$(".distance p span");
      const priceProperty = priceElement
        ? await priceElement.getProperty("innerText")
        : null;
      const price = priceProperty ? await priceProperty.jsonValue() : null;

      // Extract the link
      const linkElement = await room.$("a.city-card-red-btn.btn.btn-primary");
      const linkProperty = linkElement
        ? await linkElement.getProperty("href")
        : null;
      const link = linkProperty ? await linkProperty.jsonValue() : null;

      // Add the extracted data to the roomData array
      roomData.push({
        size,
        volume,
        introPrice,
        introPeriod,
        price,
        link,
      });
      return roomData;
    }
  }
}
