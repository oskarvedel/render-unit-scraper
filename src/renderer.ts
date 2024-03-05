import * as puppeteer from "puppeteer";
import * as url from "url";
import * as fs from "fs";
import { BoxdepotetScraper } from "./boxdepotet";
import { NettolagerScraper } from "./nettolager";
// import { PelicanScraper } from "./pelican";

import { Config } from "./config";
import { PelicanScraper } from "./pelican";

type SerializedResponse = {
  status: number;
  content: string;
};

type ViewportDimensions = {
  width: number;
  height: number;
};

const MOBILE_USERAGENT =
  "Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Mobile Safari/537.36";

/**
 * Wraps Puppeteer's interface to Headless Chrome to expose high level rendering
 * APIs that are able to handle web components and PWAs.
 */
export class Renderer {
  private browser: puppeteer.Browser;
  private config: Config;

  constructor(browser: puppeteer.Browser, config: Config) {
    this.browser = browser;
    this.config = config;
  }

  async scrape(supplier: string): Promise<string> {
    console.log("scrape function");
    let file_data_units = null;
    let file_data = null;
    if (supplier === "boxdepotet") {
      console.log("getting boxdepotet scraper data");
      let lastRunTime;
      try {
        //read the file with the latest runtime
        console.log("trying to read latest runtimefile");
        lastRunTime = fs.readFileSync("scrape_time_boxdepotet.txt", "utf8");
        let lastRunDate = new Date(lastRunTime);
        console.log(
          `lastRunTime: ${lastRunDate.getHours()}:${lastRunDate.getMinutes()}:${lastRunDate.getSeconds()}`
        );

        let currentDate = new Date();
        console.log(
          `current time: ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`
        );
      } catch (err) {
        console.error("An error occurred while reading the file:", err);
      }
      //check if the last run time is more than 40 minutes ago
      if (
        lastRunTime !== undefined &&
        new Date().getTime() - new Date(lastRunTime).getTime() <
          40 * 60 * 1000 /*40 minutes*/
      ) {
        console.log("lastruntime within 40 minutes, returning cached data");
        try {
          //read the file
          console.log("trying to read file");
          file_data = fs.readFileSync("boxdepotet.json", "utf8");
          //parse the file into JSON
          file_data_units = JSON.parse(file_data);
        } catch (err) {
          console.error("An error occurred while reading the file:", err);
        }
        if (file_data_units !== null) {
          console.log("returning file_data_units");
          return file_data_units;
        }
      } else {
        console.log(
          "last run time is more than 40 minutes ago, running scraper"
        );
      }
      //delete the scraped data file
      fs.unlink("boxdepotet.json", (err) => {
        if (err) {
          if (err.code === "ENOENT") {
          } else {
            console.error(
              "An error occurred while trying to delete the file:",
              err
            );
          }
        } else {
          console.log("old scrape file deleted successfully");
        }
      });

      //if the last run time is more than 40 minutes ago, or if the file_data_units is null, then run the scraper
      const scraper = new BoxdepotetScraper();
      //declare units object of type JSON
      let scraper_units: string;
      scraper_units = await scraper.scrapeBoxdepotetUnits();
      console.log("finished scrape");
      return scraper_units;
    }
    if (supplier === "nettolager") {
      console.log("getting nettolager scraper data");
      let lastRunTime;
      try {
        //read the file with the latest runtime
        console.log("trying to read latest runtimefile");
        lastRunTime = fs.readFileSync("scrape_time_nettolager.txt", "utf8");
        let lastRunDate = new Date(lastRunTime);
        console.log(
          `lastRunTime: ${lastRunDate.getHours()}:${lastRunDate.getMinutes()}:${lastRunDate.getSeconds()}`
        );

        let currentDate = new Date();
        console.log(
          `current time: ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`
        );
      } catch (err) {
        console.error("An error occurred while reading the file:", err);
      }
      //check if the last run time is more than 40 minutes ago
      if (
        lastRunTime !== undefined &&
        new Date().getTime() - new Date(lastRunTime).getTime() <
          40 * 60 * 1000 /*40 minutes*/
      ) {
        console.log("lastruntime within 40 minutes, returning cached data");
        try {
          //read the file
          console.log("trying to read file");
          file_data = fs.readFileSync("pelican.json", "utf8");
          //parse the file into JSON
          file_data_units = JSON.parse(file_data);
        } catch (err) {
          console.error("An error occurred while reading the file:", err);
        }
        if (file_data_units !== null) {
          console.log("returning file_data_units");
          return file_data_units;
        }
      } else {
        console.log(
          "last run time is more than 40 minutes ago, running scraper"
        );
      }
      fs.unlink("nettolager.json", (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            console.error("File doesn't exist, won't try to delete it.");
          } else {
            console.error(
              "An error occurred while trying to delete the file:",
              err
            );
          }
        } else {
          console.log("old scrape file deleted successfully");
        }
      });
      //if the last run time is more than 40 minutes ago, or if the file_data_units is null, then run the scraper
      const scraper = new NettolagerScraper();
      //declare units object of type JSON
      let scraper_units: string;
      scraper_units = await scraper.scrapeNettoLagerUnits();
      console.log("finished scrape");
      return scraper_units;
    }
    if (supplier === "pelican") {
      console.log("getting pelican scraper data");
      let lastRunTime;
      try {
        //read the file with the latest runtime
        console.log("trying to read latest runtimefile");
        lastRunTime = fs.readFileSync("scrape_time_pelican.txt", "utf8");
        let lastRunDate = new Date(lastRunTime);
        console.log(
          `lastRunTime: ${lastRunDate.getHours()}:${lastRunDate.getMinutes()}:${lastRunDate.getSeconds()}`
        );

        let currentDate = new Date();
        console.log(
          `current time: ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`
        );
      } catch (err) {
        console.error("An error occurred while reading the file:", err);
      }
      //check if the last run time is more than 40 minutes ago
      if (
        lastRunTime !== undefined &&
        new Date().getTime() - new Date(lastRunTime).getTime() <
          0.1 * 60 * 1000 /*40 minutes*/
      ) {
        console.log("lastruntime within 40 minutes, returning cached data");
        try {
          //read the file
          console.log("trying to read file");
          file_data = fs.readFileSync("pelican.json", "utf8");
          //parse the file into JSON
          file_data_units = JSON.parse(file_data);
        } catch (err) {
          console.error("An error occurred while reading the file:", err);
        }
        if (file_data_units !== null) {
          console.log("returning file_data_units");
          return file_data_units;
        }
      } else {
        console.log(
          "last run time is more than 40 minutes ago, running scraper"
        );
      }
      fs.unlink("pelican.json", (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            console.error("File doesn't exist, won't try to delete it.");
          } else {
            console.error(
              "An error occurred while trying to delete the file:",
              err
            );
          }
        } else {
          console.log("old scrape file deleted successfully");
        }
      });
      //if the last run time is more than 40 minutes ago, or if the file_data_units is null, then run the scraper
      console.log("running pelican scraper");
      const scraper = new PelicanScraper();
      //declare units object of type JSON
      let scraper_units: string;
      scraper_units = await scraper.scrapePelicanUnits();
      console.log("finished scrape");
      return scraper_units;
    }
    console.log("Supplier not supported, returning error");

    //return an error and tell the user that the supplier is not supported
    return "Supplier not supported";
  }

  async serialize(
    requestUrl: string,
    isMobile: boolean
  ): Promise<SerializedResponse> {
    /**
     * Executed on the page after the page has loaded. Strips script and
     * import tags to prevent further loading of resources.
     */
    function stripPage() {
      // Strip only script tags that contain JavaScript (either no type attribute or one that contains "javascript")
      const elements = document.querySelectorAll(
        'script:not([type]), script[type*="javascript"], link[rel=import]'
      );
      for (const e of Array.from(elements)) {
        e.remove();
      }
    }

    /**
     * Injects a <base> tag which allows other resources to load. This
     * has no effect on serialised output, but allows it to verify render
     * quality.
     */
    function injectBaseHref(origin: string) {
      const base = document.createElement("base");
      base.setAttribute("href", origin);

      const bases = document.head.querySelectorAll("base");
      if (bases.length) {
        // Patch existing <base> if it is relative.
        const existingBase = bases[0].getAttribute("href") || "";
        if (existingBase.startsWith("/")) {
          bases[0].setAttribute("href", origin + existingBase);
        }
      } else {
        // Only inject <base> if it doesn't already exist.
        document.head.insertAdjacentElement("afterbegin", base);
      }
    }

    const page = await this.browser.newPage();

    // Page may reload when setting isMobile
    // https://github.com/GoogleChrome/puppeteer/blob/v1.10.0/docs/api.md#pagesetviewportviewport
    await page.setViewport({
      width: this.config.width,
      height: this.config.height,
      isMobile,
    });

    if (isMobile) {
      page.setUserAgent(MOBILE_USERAGENT);
    }

    page.evaluateOnNewDocument("customElements.forcePolyfill = true");
    page.evaluateOnNewDocument("ShadyDOM = {force: true}");
    page.evaluateOnNewDocument("ShadyCSS = {shimcssproperties: true}");

    let response: puppeteer.Response | null = null;
    // Capture main frame response. This is used in the case that rendering
    // times out, which results in puppeteer throwing an error. This allows us
    // to return a partial response for what was able to be rendered in that
    // time frame.
    page.addListener("response", (r: puppeteer.Response) => {
      if (!response) {
        response = r;
      }
    });

    try {
      // Navigate to page. Wait until there are no oustanding network requests.
      response = await page.goto(requestUrl, {
        timeout: this.config.timeout,
        waitUntil: "networkidle0",
      });
    } catch (e) {
      console.error(e);
    }

    if (!response) {
      console.error("response does not exist");
      // This should only occur when the page is about:blank. See
      // https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
      await page.close();
      return { status: 400, content: "" };
    }

    // Disable access to compute metadata. See
    // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
    if (response.headers()["metadata-flavor"] === "Google") {
      await page.close();
      return { status: 403, content: "" };
    }

    // Set status to the initial server's response code. Check for a <meta
    // name="render:status_code" content="4xx" /> tag which overrides the status
    // code.
    let statusCode = response.status();
    const newStatusCode = await page
      .$eval('meta[name="render:status_code"]', (element) =>
        parseInt(element.getAttribute("content") || "")
      )
      .catch(() => undefined);
    // On a repeat visit to the same origin, browser cache is enabled, so we may
    // encounter a 304 Not Modified. Instead we'll treat this as a 200 OK.
    if (statusCode === 304) {
      statusCode = 200;
    }
    // Original status codes which aren't 200 always return with that status
    // code, regardless of meta tags.
    if (statusCode === 200 && newStatusCode) {
      statusCode = newStatusCode;
    }

    // Remove script & import tags.
    await page.evaluate(stripPage);
    // Inject <base> tag with the origin of the request (ie. no path).
    const parsedUrl = url.parse(requestUrl);
    await page.evaluate(
      injectBaseHref,
      `${parsedUrl.protocol}//${parsedUrl.host}`
    );

    // Serialize page.
    const result = await page.evaluate("document.firstElementChild.outerHTML");

    await page.close();
    return { status: statusCode, content: result };
  }

  async screenshot(
    url: string,
    isMobile: boolean,
    dimensions: ViewportDimensions,
    options?: object
  ): Promise<Buffer> {
    const page = await this.browser.newPage();

    // Page may reload when setting isMobile
    // https://github.com/GoogleChrome/puppeteer/blob/v1.10.0/docs/api.md#pagesetviewportviewport
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
      isMobile,
    });

    if (isMobile) {
      page.setUserAgent(MOBILE_USERAGENT);
    }

    let response: puppeteer.Response | null = null;

    try {
      // Navigate to page. Wait until there are no oustanding network requests.
      response = await page.goto(url, {
        timeout: 1000000,
        waitUntil: "networkidle0",
      });
    } catch (e) {
      console.error(e);
    }

    if (!response) {
      throw new ScreenshotError("NoResponse");
    }

    // Disable access to compute metadata. See
    // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
    if (response!.headers()["metadata-flavor"] === "Google") {
      throw new ScreenshotError("Forbidden");
    }

    // Must be jpeg & binary format.
    const screenshotOptions = Object.assign({}, options, {
      type: "jpeg",
      encoding: "binary",
    });
    // Screenshot returns a buffer based on specified encoding above.
    // https://github.com/GoogleChrome/puppeteer/blob/v1.8.0/docs/api.md#pagescreenshotoptions
    let buffer: Buffer | string | undefined;
    try {
      buffer = await page.screenshot(screenshotOptions as any);
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }

    if (!buffer) {
      throw new Error("Failed to capture screenshot");
    }

    if (typeof buffer === "string") {
      return Buffer.from(buffer, "binary");
    } else {
      return buffer;
    }
  }
}

type ErrorType = "Forbidden" | "NoResponse";

export class ScreenshotError extends Error {
  type: ErrorType;

  constructor(type: ErrorType) {
    super(type);

    this.name = this.constructor.name;

    this.type = type;
  }
}
