import * as puppeteer from "puppeteer";
import * as fs from "fs";
import { Page } from "puppeteer";
import "dotenv/config";

//make the ts file understand that page and button are defined by puppeteer
export class PelicanScraper {
  async scrapePelicanUnits(): Promise<string> {
    fs.writeFileSync("scrape_time_pelican.txt", new Date().toISOString());
    console.log("logged new scrape time: " + new Date().toISOString());

    const browser = await puppeteer.launch({
      headless: false,
      timeout: 60000,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set the window size
    await page.goto("https://pelican.dk/find-opbevaringsrum"); // Main page URL

    // Get all 'a' elements with the classes 'elementor-button', 'elementor-button-link', and 'elementor-size-sm' that are descendants of 'div' elements with the class 'elementor-widget-container' and have the text 'Book online'
    const allLocationsUnitData = [];

    {
      const roomData = await this.extractRoomData(page);

      // console.log(roomData);

      allLocationsUnitData.push({ roomData });
    }

    //convert allLocationsUnitData to JSON
    const allLocationsUnitDataJson = JSON.stringify(
      allLocationsUnitData,
      null,
      2
    );

    // Save the JSON data to a file
    fs.writeFileSync("boxdepotet.json", allLocationsUnitDataJson);

    return allLocationsUnitDataJson;
  }

  // Function to extract data from the room list
  async extractRoomData(page: Page) {
    // Get all 'a' elements with the class 'bookinglink'
    const rooms = await page.$$("a.bookinglink");

    // Create an empty array to store the extracted data
    const roomData = [];

    for (const room of rooms) {
      // Extract the href attribute
      const href = await page.evaluate(
        (a: HTMLAnchorElement) => a.getAttribute("href"),
        room
      );

      // Extract the unit size
      const unitSize = await page.evaluate(
        (a: HTMLAnchorElement) => a.dataset.unitSize,
        room
      );

      // Extract the size
      const size = await room.$eval(".size", (div: Element) =>
        (div as HTMLElement).innerText.trim()
      );

      // Extract the intro price
      const introPrice = await room.$eval(".intro.price", (div: Element) =>
        (div as HTMLElement).innerText.trim()
      );

      // Extract the regular price
      const regularPrice = await room.$eval(".regular.price", (div: Element) =>
        (div as HTMLElement).innerText.trim()
      );

      // Extract the action text
      const actionText = await room.$eval(".action button", (button: Element) =>
        (button as HTMLElement).innerText.trim()
      );

      // Add the extracted data to the roomData array
      roomData.push({
        href,
        unitSize,
        size,
        introPrice,
        regularPrice,
        actionText,
      });
    }
    return roomData;
  }
}
