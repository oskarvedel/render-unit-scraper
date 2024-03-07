import * as puppeteer from "puppeteer";
import * as fs from "fs";
// import { Page } from "puppeteer";
import "dotenv/config";

//make the ts file understand that page and button are defined by puppeteer
export class ShurgardScraper {
  async scrapeShurgardUnits(): Promise<string> {
    // const browser = await puppeteer.launch({
    //   headless: false,
    //   timeout: 60000,
    // });

    const browser = await puppeteer.launch({
      headless: false,
      timeout: 60000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set the window size
    page.setExtraHTTPHeaders({
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    });
    await page.goto("https://www.shurgard.com/da-dk/opbevaringsrum"); // Main page URL

    // Wait for the cookie button to appear and then click it
    // await page.waitForSelector("#onetrust-accept-btn-handler");
    // await page.click("#onetrust-accept-btn-handler");

    // Get all 'a' elements with the classes 'elementor-button', 'elementor-button-link', and 'elementor-size-sm' that are descendants of 'div' elements with the class 'elementor-widget-container' and have the text 'Book online'
    const allLocationsUnitData = [];

    // Get all 'a' elements with the class 'region__store'
    const locations = await page.$$("a.region__store");

    for (const location of locations) {
      // Extract the location details
      // const locationDetails = await this.extractLocationDetails(location);

      //navigate to the location
      const locationLink = await location.getProperty("href");
      const locationLinkString = await locationLink.jsonValue();
      await page.goto(locationLinkString);

      // Sleep to let the page load
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extract the unit list
      const unitList = await this.extractRoomData(page);

      // Add the location details and unit list to allLocationsUnitData
      // allLocationsUnitData.push({ locationDetails, unitList });
      allLocationsUnitData.push({ unitList });
    }

    //convert allLocationsUnitData to JSON
    const allLocationsUnitDataJson = JSON.stringify(
      allLocationsUnitData,
      null,
      2
    );

    // Save the JSON data to a file
    fs.writeFileSync("pelican.json", allLocationsUnitDataJson);

    fs.writeFileSync("scrape_time_pelican.txt", new Date().toISOString());
    console.log("logged new scrape time: " + new Date().toISOString());

    browser.close();

    return allLocationsUnitDataJson;
  }

  // Function to extract location details
  async extractLocationDetails(page: puppeteer.Page) {
    const details = await page.$eval(".details", (div: Element) => {
      const nameElement = div.querySelector("h2");
      var name =
        nameElement && nameElement.textContent
          ? nameElement.textContent.trim()
          : null;

      name = "Pelican " + name;
      return { name };
    });

    return details;
  }

  async extractRoomData(page: puppeteer.Page) {
    // Get all 'li' elements with the class 'storage-unit'
    const rooms = await page.$$("li.storage-unit");

    // Create an empty array to store the extracted data
    const roomData = [];

    for (const room of rooms) {
      // Extract the href attribute
      const hrefHandle = await room.$("a.unit-cta.left");
      const hrefProperty = hrefHandle
        ? await hrefHandle.getProperty("href")
        : null;
      const href = hrefProperty ? await hrefProperty.jsonValue() : null;

      // Extract the size
      const sizeElement = await room.$(".unit-size");
      const sizeProperty = sizeElement
        ? await sizeElement.getProperty("innerText")
        : null;
      const size = sizeProperty ? await sizeProperty.jsonValue() : null;

      // Extract the promo price
      const promoPriceElement = await room.$(".unit-promo_price");
      const promoPriceProperty = promoPriceElement
        ? await promoPriceElement.getProperty("innerText")
        : null;
      const promoPrice = promoPriceProperty
        ? await promoPriceProperty.jsonValue()
        : null;

      // Extract the price
      const priceElement = await room.$(".unit-price");
      const priceProperty = priceElement
        ? await priceElement.getProperty("innerText")
        : null;
      const price = priceProperty ? await priceProperty.jsonValue() : null;

      // Extract the availability
      const availability = 1;

      // Add the extracted data to the roomData array
      roomData.push({
        size,
        price,
        availability,
        link: href,
        promoPrice,
      });
    }
    return roomData;
  }
}
