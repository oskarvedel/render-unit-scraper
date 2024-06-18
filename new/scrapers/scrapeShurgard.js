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

async function scrapeShurgard() {
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


  // Navigate to the main Shurgard page
  await page.goto("https://www.shurgard.com/da-dk/opbevaringsrum");

  // Wait for the cookies banner to appear and click the "Accept all cookies" button
  await page.waitForSelector("#onetrust-accept-btn-handler", { visible: true });
  await page.click("#onetrust-accept-btn-handler");

  const allLocationsUnitData = [];

  // Step 2: Extract the URLs of all locations
  const locationUrls = await page.$$eval(".region__store", (links) =>
    links.map((link) => link.href)
  );

  for (const url of locationUrls) {
    await page.goto(url);

    if (await page.$(".btn.btn-primary.see-all-btn")) {
      // Check if the button exists
      await page.click(".btn.btn-primary.see-all-btn");
    }
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    const unitList = await extractRoomData(page);
    allLocationsUnitData.push({ [url]: unitList }); // Use the URL as a key for the object
  }

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
  const rooms = await page.$$("li.storage-unit");
  const roomData = [];

  for (const room of rooms) {
    let href = "";
    try {
      href = await room.$eval("a.unit-cta.left", (el) =>
        el.getAttribute("href")
      );
    } catch (error) {
      console.log(
        "Link (a.unit-cta.left) not found for a room, setting href as empty string."
      );
    }

    let m2size = "";
    try {
      m2size = await room.$eval(".unit-size", (el) => el.textContent.trim());
    } catch (error) {
      console.log(
        "Size (.unit-size) not found for a room, setting size as empty string."
      );
    }

    let promoPrice = "";
    try {
      promoPrice = await room.$eval(".unit-promo_price", (el) =>
        el.textContent.trim()
      );
    } catch (error) {
      console.log("Promo price not found for a room, setting as empty string.");
    }

    const price = await room
      .$eval(".price-current", (el) => el.textContent.trim())
      .catch(() => "Price not found");

    let oldPrice = "";
    try {
      oldPrice = await room.$eval(".price-old", (el) => el.textContent.trim());
    } catch (error) {
      console.log("Old price not found for a room, setting as empty string.");
    }

    // Determine unitType and clean m2size
    let unitType, m2sizeCleaned;
    if (m2size.includes("Skab")) {
      unitType = "closet";
      // Assuming the format "Skab X,Y" where X,Y is the size, extract just the numeric part
      m2sizeCleaned = m2size.replace("Skab", "").trim();
    } else {
      unitType = "indoor";
      // Remove "m²" and trim for indoor types, if needed
      m2sizeCleaned = m2size.replace("m²", "").trim();
    }

    // Use a regular expression to match all kinds of spaces (including non-breaking spaces) globally in the string
    const priceCleaned = price.replace(/\s+kr\.\/måned/g, "").trim();
    const oldPriceCleaned = oldPrice.replace(/\s+kr\.\/måned/g, "").trim();

    // Construct room object with available data
    const roomObj = {
      href,
      m2size: m2sizeCleaned,
      unitType,
      promoPrice, // Assuming promoPrice is what was intended to be used as firstMonthPromoPrice
      price: priceCleaned,
      oldPrice: oldPriceCleaned,
      // Add other properties as needed
    };

    roomData.push(roomObj);
  }
  return roomData;
}
module.exports = scrapeShurgard;
