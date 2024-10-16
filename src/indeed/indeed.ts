import chromium from "@sparticuz/chromium";
import wait from "promisify-wait";
import puppeteerExtra from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import Anonymize from "puppeteer-extra-plugin-anonymize-ua";
import createPuppeteerStealth from "puppeteer-extra-plugin-stealth";

const puppeteerStealth = createPuppeteerStealth();
puppeteerStealth.enabledEvasions.delete("user-agent-override");

puppeteerExtra.use(AdblockerPlugin()).use(puppeteerStealth).use(Anonymize());

const normalizeUserAgent = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let browser = await puppeteerExtra.launch({
        defaultViewport: chromium.defaultViewport,
        executablePath: (await chromium.executablePath()) || undefined,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
        ],
      });
      let userAgent = await browser.userAgent();
      let normalized = userAgent.replace("Headless", "");
      normalized = normalized.replace("Chromium", "Chrome");
      await browser.close();
      resolve(normalized);
    } catch (e) {
      resolve(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      );
    }
  });
};
async function scrapeIndeedJobDetails(): Promise<any> {
  let browser = null;
  const initialUserAgent = await normalizeUserAgent();

  try {
    browser = await puppeteerExtra.launch({
      defaultViewport: chromium.defaultViewport,
      executablePath: (await chromium.executablePath()) || undefined,
      headless: true,
      protocolTimeout: 60000,
      args: [
        `--user-agent=${initialUserAgent}`,
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
      ],
    });
    let page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.setJavaScriptEnabled(true);
    let hasNextPage = true;
    const allJobDetails: any[] = [];
    const indeedUrl =
      "https://fr.indeed.com/jobs?q=title%3A%28data%29&l=Bouches-du-Rh%C3%B4ne&fromage=14&radius=0&sort=date&filter=0&start=0";

    const wb = browser.wsEndpoint();
    console.log(wb);
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false }); // Remove `webdriver` property
    });
    await page.evaluateOnNewDocument(() => {
      // Fake plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Fake mimeTypes
      Object.defineProperty(navigator, "mimeTypes", {
        get: () => [{ type: "application/pdf" }],
      });
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
      Object.defineProperty(navigator, "platform", { get: () => "Win32" });
    });
    await page.evaluateOnNewDocument(() => {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // Spoof vendor and renderer to fake a real GPU
        if (parameter === 37445) return "Intel Inc.";
        if (parameter === 37446) return "Intel Iris OpenGL Engine";
        return getParameter(parameter);
      };
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    );
    // await page.setViewport({ width: 1280, height: 800 });

    await page.goto(indeedUrl);

    browser.disconnect();

    console.log("WAIT");
    await wait(60000);
    browser = await puppeteerExtra.connect({
      browserWSEndpoint: wb,
      protocolTimeout: 60000,
    });
    console.log("Reconnect");
    const pageList = await browser.pages();
    const pages = await Promise.all(pageList.map((p) => p.title()));
    page = pageList[pages.findIndex((p) => p)];
    await page?.bringToFront();

    await page.screenshot({
      path: "screen2.png",
    });
    const frame = page
      .frames()
      .find((f) =>
        f.url().startsWith("https://challenges.cloudflare.com/cdn-cgi")
      );

    console.log({ frames: frame?.url() });
    if (frame) {
      const boudingbox = await (await page.$("#rXOa8"))?.boundingBox()!;

      console.log(boudingbox);
      if (boudingbox)
        await page.mouse.click(
          boudingbox.x + boudingbox.width / 2,
          boudingbox.y + boudingbox.height / 2
        );
      if (boudingbox)
        await page.mouse.click(
          boudingbox.x + boudingbox.width / 9,
          boudingbox.y + boudingbox.height / 2
        );
      browser.disconnect();

      console.log("WAIT");
      await wait(30000);
      browser = await puppeteerExtra.connect({
        browserWSEndpoint: wb,
      });
      console.log("Reconnect");
      const pageList = await browser.pages();
      const pages = await Promise.all(pageList.map((p) => p.title()));
      page = pageList[pages.findIndex((p) => p)];
      await page?.bringToFront();
      console.log("Cloudflare CAPTCHA detected.");
    }
    while (hasNextPage) {
      await page.screenshot({
        path: "screen3.png",
      });
      await page.waitForSelector(
        ".mosaic-provider-jobcards > ul > li:not(:has(div.mosaic-empty-zone))"
      );
      const jobDetails = await page.evaluate(() => {
        const jobCards = document.querySelectorAll(
          ".mosaic-provider-jobcards > ul > li:not(:has(div.mosaic-empty-zone))"
        );
        const jobs = Array.from(jobCards).map((jobCard) => {
          const titleElement = jobCard.querySelector("h2.jobTitle a");
          const companyElement = jobCard.querySelector(
            '[data-testid="company-name"]'
          );
          const locationElement = jobCard.querySelector(
            '[data-testid="text-location"]'
          );
          const jobTypeElement = jobCard.querySelector(
            '[data-testid="attribute_snippet_testid"]'
          );
          const postedDateElement = jobCard.querySelector(
            '[data-testid="myJobsStateDate"]'
          );

          const jobLink = titleElement
            ? (titleElement as HTMLAnchorElement).href
            : null;
          const jobId = titleElement
            ? (titleElement as HTMLAnchorElement).getAttribute("data-jk")
            : null;

          return {
            title: titleElement
              ? (titleElement as HTMLElement).innerText.trim()
              : null,
            company: companyElement
              ? (companyElement as HTMLElement).innerText.trim()
              : null,
            location: locationElement
              ? (locationElement as HTMLElement).innerText.trim()
              : null,
            jobType: jobTypeElement
              ? (jobTypeElement as HTMLElement).innerText.trim()
              : null,
            postedDate: postedDateElement
              ? (postedDateElement as HTMLElement).innerText.trim()
              : null,
            jobLink,
            jobId,
          };
        });

        return jobs;
      });

      allJobDetails.push(...jobDetails);

      const nextPageUrl = await page.evaluate(() => {
        const nextPageLink = document.querySelector(
          'a[data-testid="pagination-page-next"]'
        );
        return nextPageLink ? (nextPageLink as HTMLAnchorElement).href : null;
      });

      if (nextPageUrl) {
        await page.goto(nextPageUrl, { waitUntil: "networkidle2" });
      } else {
        hasNextPage = false;
        console.log("No more pages.");
      }
    }

    console.log("Scraped Job Details:", allJobDetails);
    console.log("Yes you scrapped", allJobDetails?.length);

    return {
      statusCode: 200,
      body: JSON.stringify(allJobDetails),
    };
  } catch (error) {
    console.error("Error during scraping:", error);
    if (error instanceof Error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error during scraping",
          error: error.message,
        }),
      };
    }
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

export const handler = async (event: any) => {
  return await scrapeIndeedJobDetails();
};
