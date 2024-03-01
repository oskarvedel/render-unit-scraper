import * as puppeteer from "puppeteer";
import * as fs from "fs";
import { Page } from "puppeteer";
import "dotenv/config";

//make the ts file understand that page and button are defined by puppeteer
export class GrantsScraper {
  async scrapeGrants(): Promise<string> {
    fs.writeFileSync("grants_scrape_time.txt", new Date().toISOString());
    console.log("logged new grants scrape time: " + new Date().toISOString());

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set the window size
    await page.goto("https://www.grants.gov/search-grants"); // Main page URL

    const allGrantsData = [];

    var counter = 0;
    for (let url of departmenUrls) {
      //check if the url starts wit  'https://boxdepotet.dk/, else add it
      if (!url.startsWith("https://boxdepotet.dk/")) {
        url = "https://boxdepotet.dk" + url;
      }

      await page.goto(url);

      if (counter === 0) {
        // Wait for the cookie popup to appear
        await page.waitForSelector(
          "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
        );

        // Click the 'Allow all' button
        await page.click(
          "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
        );
      }

      // Click the 'alle rum' button
      await page.click(
        ".grow.text-center.text-label.border-solid.border-2.border-primary.rounded.bg-white.text-text a"
      );

      const roomData = await this.extractRoomData(page);

      // console.log(roomData);

      allGrantsData.push({ url, grantData });
      counter++;
    }

    //convert allLocationsUnitData to JSON
    const allGrants = JSON.stringify(
      allGrantsData,
      null,
      2
    );

    // Save the JSON data to a file
    fs.writeFileSync("grants.json", allGrants);

    return allGrants;
  }
