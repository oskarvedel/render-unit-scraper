import * as puppeteer from "puppeteer";
import * as fs from "fs";
// import { Page } from "puppeteer";
import "dotenv/config";

//make the ts file understand that page and button are defined by puppeteer
export class GrantsScraper {
  async scrapeGrants(): Promise<string> {
    fs.writeFileSync("grants_scrape_time.txt", new Date().toISOString());
    console.log("logged new grants scrape time: " + new Date().toISOString());

    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    // Set user agent to mimic a common browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537"
    );

    // Set the viewport size to mimic a desktop browser
    await page.setViewport({ width: 1280, height: 800 });

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);

    await page.setCacheEnabled(false);

    const url = "https://www.grants.gov/search-grants";

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    // const allGrantsData = [];

    await page.goto(url);

    //convert allLocationsUnitData to JSON
    // const allGrants = JSON.stringify(
    //   allGrantsData,
    //   null,
    //   2
    // );

    const allGrants = "test";

    // Save the JSON data to a file
    fs.writeFileSync("grants.json", allGrants);

    return allGrants;
  }
}
