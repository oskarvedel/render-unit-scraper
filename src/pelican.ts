import * as puppeteer from "puppeteer";
import * as fs from "fs";
// import { Page } from "puppeteer";
import "dotenv/config";

//make the ts file understand that page and button are defined by puppeteer
export class PelicanScraper {
  async scrapePelicanUnits(): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      timeout: 15000,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set the window size
    await page.goto("https://pelican.dk/find-opbevaringsrum"); // Main page URL

    // Wait for the cookie button to appear and then click it
    await page.waitForSelector(
      "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
    );
    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");

    // Get all 'a' elements with the classes 'elementor-button', 'elementor-button-link', and 'elementor-size-sm' that are descendants of 'div' elements with the class 'elementor-widget-container' and have the text 'Book online'
    const allLocationsUnitData = [];

    // Get all 'section' elements with the class 'location'
    const locations = await page.$$("section.location");

    for (const location of locations) {
      // Extract the location details
      const locationDetails = await this.extractLocationDetails(location);

      // Extract the unit list
      const unitList = await this.extractRoomData(location);

      // Add the location details and unit list to allLocationsUnitData
      allLocationsUnitData.push({ locationDetails, unitList });
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

    return allLocationsUnitDataJson;
  }

  // Function to extract location details
  async extractLocationDetails(location: puppeteer.ElementHandle<Element>) {
    const details = await location.$eval(".details", (div: Element) => {
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

  async extractRoomData(location: puppeteer.ElementHandle<Element>) {
    // Get all 'a' elements with the class 'bookinglink' within the location element
    const rooms = await location.$$("a.bookinglink");

    // Create an empty array to store the extracted data
    const roomData = [];

    for (const room of rooms) {
      // Extract the href attribute
      const hrefHandle = await room.getProperty("href");
      const link = await hrefHandle.jsonValue();

      // Extract the size
      const sizeText = await room.$eval(".size", (div: Element) =>
        (div as HTMLElement).innerText.trim()
      );

      const sizeMatch = sizeText.match(/(\d+)\s*m2/);
      const m2size = sizeMatch ? sizeMatch[0] : null;

      let introPeriod = null;
      const introPriceSpans = await room.$$(".intro.price span");
      if (introPriceSpans.length > 0) {
        const innerTextProperty =
          await introPriceSpans[0].getProperty("innerText");
        introPeriod = await innerTextProperty.jsonValue();
        introPeriod = introPeriod.trim();
      }

      var available = 1;

      const introPriceElement = await room.$(".intro.price");
      let introPrice = null;
      if (introPriceElement !== null) {
        const emElements = await introPriceElement.$$("em");
        for (const emElement of emElements) {
          const className = await emElement.getProperty("className");
          const innerText = await emElement.getProperty("innerText");
          if ((await className.jsonValue()).includes("limited-or-soldout")) {
            available = 0;
            introPrice = "";
            break;
          } else {
            introPrice = await innerText.jsonValue();
          }
        }
      }

      // Extract the regular price
      const regularPriceElement = await room.$(".regular.price");
      let price = null;
      if (regularPriceElement !== null) {
        price = await regularPriceElement.$eval("em", (em: Element) =>
          (em as HTMLElement).innerText.trim()
        );
      }

      if (price === "Kontakt os") {
        price = "";
      }

      // Add the extracted data to the roomData array
      roomData.push({
        m2size,
        price,
        available,
        link,
        introPrice,
        introPeriod,
      });
    }
    return roomData;
  }
}
