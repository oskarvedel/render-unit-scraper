const express = require("express");
const fs = require("fs");
const scrapePulterBox = require("./scrapers/scrapePulterBox.js");
const scrapeShurgard = require("./scrapers/scrapeShurgard.js");

const app = express();
const port = 3000;

app.get("/scrape", async (req, res) => {
  const { site } = req.query;
  if (!site) {
    return res.status(400).send("Site parameter is required");
  }

  let data;
  try {
    if (site === "pulterbox") {
      data = await scrapePulterBox();
    } else if (site === "shurgard") {
      data = await scrapeShurgard();
    } else {
      return res.status(400).send("Unknown site parameter");
    }
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).send("An error occurred while scraping the website");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
