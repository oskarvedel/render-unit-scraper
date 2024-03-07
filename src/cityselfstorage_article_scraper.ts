import * as puppeteer from "puppeteer";
import * as fs from "fs";
import { Page } from "puppeteer";
import "dotenv/config";
import * as os from "os";

//make the ts file understand that page and button are defined by puppeteer
export class CitySelfStorageArticleScraper {
  async scrapeCitySelfStorageArticles(): Promise<void> {
    // fs.writeFileSync("scrape_time.txt", new Date().toISOString());
    console.log(
      "scraping city self storage articles: " + new Date().toISOString()
    );

    // const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require("puppeteer");

    // puppeteer.use(
    //   require("puppeteer-extra-plugin-block-resources")({
    //     blockedTypes: new Set(["image", "stylesheet"]),
    //     // Optionally enable Cooperative Mode for several request interceptors
    //     interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    //   })
    // );

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set the window size
    await page.goto("https://cityselfstorage.dk/blog/"); // Main page URL

    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");

    // const articleUrls = await page.$$eval(
    //   ".location h2 a",
    //   (links: Element[]) =>
    //     links.map((link: Element) => link.getAttribute("href") as string)
    // );

    //create new array allArticeUrls
    const allArticleUrls = [];

    // var counter = 0;

    while (true) {
      const articleUrls = await this.getArticleUrls(page);

      //add the articleUrls to the allArticleUrls array
      allArticleUrls.push(...articleUrls);

      const nextPageUrl = await page.$$eval(
        ".search-pagination .next.page-numbers",
        (links: Element[]) =>
          links.map((link: Element) => link.getAttribute("href") as string)
      );

      if (nextPageUrl.length === 0) {
        break;
      }

      //go to the first url in the nextPageUrl array
      await page.goto(nextPageUrl[0]);
    }

    var allArticles = [];
    var article = {};

    var counter = 0;
    for (const articleUrl of allArticleUrls) {
      await page.goto(articleUrl);
      var title = await page.$eval(
        '.elementor-location-single div[data-widget_type="heading.default"] .elementor-heading-title',
        (h1: Element) => (h1 as HTMLElement).innerText
      );
      var excerpt = await page.$eval(
        '.elementor-location-single div[data-widget_type="text-editor.default"] .elementor-widget-container ',
        (div: Element) => (div as HTMLElement).innerText
      );
      var paragraphs = await page.$$eval(
        ".elementor-location-single .elementor-widget-container p, h2, h3",
        (elements: Element[]) =>
          elements.map((element: Element) => (element.textContent || "").trim())
      );

      const index = paragraphs.findIndex((paragraph) =>
        paragraph.includes("Relaterede indlæg")
      );
      if (index !== -1) {
        paragraphs = paragraphs.slice(0, index - 1);
      }
      var content = paragraphs
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join("");
      article = {
        title: "<h2>" + title + "</h2>",
        excerpt: "<p class >" + excerpt + "</p>",
        content: content,
      };
      allArticles.push(article);
      counter++;
      if (counter == 1 || counter == 10 || counter == 50) {
        console.log("Scraped " + counter + " articles");
      }
    }

    // Save the JSON data to a file
    fs.writeFileSync(
      "CitySelfStorageArticles.txt",
      JSON.stringify(allArticles, null, 2)
    );
  }

  async convertToJsonL() {
    // Read the input file and parse the data
    const data = JSON.parse(
      fs.readFileSync("CitySelfStorageArticles.txt", "utf8")
    );

    // Prepare the system message
    const systemMessage = {
      role: "system",
      content:
        "Du er en skribent, der er ekspert i depotrum og opbevaringsrum. Opfør dig som en skribent, der er meget dygtig til SEO-skrivning og taler flydende dansk. Skriv altid 100% unik, SEO-optimeret, menneskeskrevne artikler på dansk med præcis 3 overskrifter og underoverskrifter, der dækker det emne, der er angivet i prompten. Markér ikke overskrifterne med H-tags. Nummerér ikke overskrifterne. Skriv alle ord i titlen og overskrifterne med små bogstaver. Skriv artiklen med dine egne ord i stedet for at kopiere og indsætte fra andre kilder. Overvej kompleksitet og varians, når du skaber indhold, idet du sikrer høje niveauer af begge dele uden at miste specificitet eller kontekst. Artiklen skal være ca. 700 ord lang. Brug fuldt detaljerede afsnit, der engagerer læseren. Skriv i en samtalestil, som om det var skrevet af et menneske (brug en uformel tone, brug personlige pronominer, hold det simpelt, engager læseren, brug aktiv stemme, hold det kort, brug retoriske spørgsmål og inkorporer analogier og metaforer). ",
    };

    // Transform the data
    const transformedData = data.map((article: any) => {
      const articleContent = ` ${article.title} ${article.excerpt} ${article.content}`;
      return {
        messages: [
          systemMessage,
          { role: "user", content: `Skriv artiklen: ${article.title}` },
          { role: "assistant", content: articleContent },
        ],
      };
    });

    // Write the transformed data to a new file in JSONL format
    const writeStream = fs.createWriteStream(
      "TransformedCitySelfStorageArticles.jsonl"
    );
    transformedData.forEach((item: any) => {
      writeStream.write(JSON.stringify(item) + os.EOL);
    });
    writeStream.end();
  }

  async getArticleUrls(page: Page) {
    var articleUrls = await page.$$eval(".location h2 a", (links: Element[]) =>
      links.map((link: Element) => link.getAttribute("href") as string)
    );
    return articleUrls;
  }

  // Function to extract data from the room list
  async extractRoomData(page: Page) {
    // Get all 'div' elements with the class 'booking-room__container'
    const rooms = await page.$$(".booking-room__container");

    // Create an empty array to store the extracted data
    const roomData = [];

    for (const room of rooms) {
      // Extract the room number
      const roomNumber = await room.$eval(
        ".booking-room__number .text-value",
        (span: Element) => (span as HTMLElement).innerText
      );

      // Extract the price
      const price = await room.$eval(
        ".booking-room__price .text-value",
        (span: Element) => (span as HTMLElement).innerText
      );

      // Extract the size in cubic meters
      const cubicMeters = await room.$eval(
        "#cubic_meters",
        (span: Element) => (span as HTMLElement).innerText
      );

      // Extract the size in square meters
      const squareMeters = await room.$eval(
        "#square_meters",
        (span: Element) => (span as HTMLElement).innerText
      );

      // Extract the 'ledig' status
      const availability = await room.$eval(
        ".booking-room__availability .booking-room__badge span",
        (span: Element) => (span as HTMLElement).innerText
      );
      // Extract the 'Book rum' button URL
      const bookUrl = await room.$eval(
        ".booking-room__actions a.booking-btn__primary",
        (a: Element) => (a as HTMLAnchorElement).href
      );

      // Add the extracted data to the roomData array
      roomData.push({
        roomNumber,
        price,
        cubicMeters,
        squareMeters,
        availability,
        bookUrl,
      });
    }
    return roomData;
  }
}
