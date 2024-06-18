const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const blockResourcesPlugin =
  require("puppeteer-extra-plugin-block-resources")();

const fs = require("fs");

puppeteer.use(StealthPlugin());

puppeteer.use(blockResourcesPlugin);

blockResourcesPlugin.blockedTypes.add("image");

blockResourcesPlugin.blockedTypes.add("stylesheet");
blockResourcesPlugin.blockedTypes.add("other"); // e.g. favicon

async function scrapePulterBox() {
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 60000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // Add any necessary arguments here
    ],
  });

  const pages = await browser.pages();
  const page = pages[0]; // Use the first open page
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to the mainpage
  await page.goto("https://pulterbox.dk/priser-og-booking/");

  // Custom delay function using setTimeout
  function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }

  // Assuming there are always three locations
  const numberOfLocations = 3; // If dynamic, use page.$$eval to get the count
  let allLocationsUnitData = [];

  for (let i = 0; i < numberOfLocations; i++) {
    await page.reload(); // Reload the page to reset the state
    await page.waitForSelector(".css-10wipnw", { visible: true }); // Wait for the locations to be visible

    // Click the location at the current index
    const locations = await page.$$(".css-10wipnw");
    if (locations[i]) {
      const locationName = await (
        await locations[i].$(".css-cc4jza")
      ).evaluate((el) => el.textContent.trim());
      await locations[i].click();
      await delay(1000); // Custom delay function

      // Extract data after each click
      const unitList = await extractRoomData(page);
      allLocationsUnitData.push({ [locationName]: unitList });
    }
  }

  // Convert the collected data to JSON
  const allLocationsUnitDataJson = JSON.stringify(
    allLocationsUnitData,
    null,
    2
  );

  // fs.writeFileSync("pelican.json", allLocationsUnitDataJson);
  // fs.writeFileSync("scrape_time_pelican.txt", new Date().toISOString());
  console.log("logged new scrape time: " + new Date().toISOString());

  await browser.close();
  return allLocationsUnitDataJson;
}

async function extractRoomData(page) {
  const rows = await page.$$("table.css-4dh9ox > tbody > tr.css-t4hdgk");
  const roomData = [];

  for (const row of rows) {
    let volume = await row.$eval("td.css-1szvmx4:nth-child(1) span", (el) =>
      el.textContent.trim()
    );
    volume = volume.replace(" m³", ""); // Remove " m³"

    const dimensions = await row.$eval(
      "td.css-1szvmx4:nth-child(2) span",
      (el) => el.textContent.trim()
    );

    const roomNum = await row.$eval("td.css-1szvmx4:nth-child(3) span", (el) =>
      el.textContent.trim()
    );

    const availableFrom = (
      await row.$eval("td.css-1szvmx4:nth-child(4) span", (el) =>
        el.textContent.trim()
      )
    ).replace("fra ", "");

    let price = await row.$eval("td.css-1szvmx4:nth-child(5) span", (el) =>
      el.textContent.trim()
    );
    price = price.replace(" DKK/md", ""); // Remove " DKK/md"

    // Split dimensions to get width, length, and height
    const [length, width, height] = dimensions
      .split(" x ")
      .map((dim) => dim.trim());

    const available = availableFrom === "LEDIG" ? true : false;

    // Correct typo from 'wifth' to 'width'
    const roomObj = {
      m3size: volume,
      roomNum,
      available,
      availableFrom,
      price,
      length,
      width,
      height,
    };

    roomData.push(roomObj);
  }
  return roomData;
}
module.exports = scrapePulterBox;
