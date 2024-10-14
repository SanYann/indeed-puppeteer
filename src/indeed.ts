import puppeteerExtra from "puppeteer-extra";
import chromium from "@sparticuz/chromium"
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import Anonymize from "puppeteer-extra-plugin-anonymize-ua";
import createPuppeteerStealth from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import wait from "promisify-wait";

const puppeteerStealth = createPuppeteerStealth();
puppeteerStealth.enabledEvasions.delete("user-agent-override");

// Use stealth plugin to avoid detection
puppeteerExtra.use(AdblockerPlugin()).use(puppeteerStealth).use(Anonymize());


declare global {
  interface Window {
    _cf_chl_opt?: {
      __cf_chl_rt_tk?: string;
      cRay?: string;
      cHash?: string;
    };
  }
}

export const postHandler = async (
  event: any
) => {
  const IS_LOCAL = true 
  console.log("test")
  let browser = null;
  console.log(await chromium.executablePath())
  try {
    browser = await puppeteerExtra.launch({
      args:  IS_LOCAL ? puppeteerExtra.defaultArgs() : chromium.args,
      defaultViewport: chromium.defaultViewport,
      ...(IS_LOCAL ? {}: {executablePath:  await chromium.executablePath()}),
      headless: "shell"
      
    });
    console.log("browser")
    let page = await browser.newPage();
    console.log("page")

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://fr.indeed.com/",
    });
    let hasNextPage = true;
    const allJobDetails: any[] = [];

    // Navigate to the Indeed job search page
    const indeedUrl =
      "https://fr.indeed.com/jobs?q=title%3A%28data%29&l=Bouches-du-Rh%C3%B4ne&fromage=14&radius=0&filter=0&sort=date&start=0";

    await page.goto(indeedUrl, { waitUntil: "networkidle2" });

    const wb = browser.wsEndpoint();
    console.log(wb);
    await page.goto(indeedUrl);
    browser.disconnect();
    await wait(10_000);
    browser = await puppeteerExtra.connect({
      browserWSEndpoint: wb,
    });
    console.log("TOTO");
    const pageList = await browser.pages();
    console.log({ pageList });
    const pages = await Promise.all(pageList.map((p) => p.title()));
    page = pageList[pages.findIndex((p) => p)];
    console.log(await Promise.all(pageList.map((p) => p.title())));
    await page?.bringToFront();


    while (hasNextPage) {
      const turnstileIframe = await page.$('iframe[src*="turnstile"]');
      fs.writeFileSync("test.html", await page.content(), "utf8");
      if (turnstileIframe) {
        console.log("Detected Turnstile CAPTCHA, trying to solve...");

        const checkboxFrame = await page
          .frames()
          .find((frame: any) => frame.url().includes("turnstile"));
        if (checkboxFrame) {
          await checkboxFrame.waitForSelector('input[type="checkbox"]');
          await checkboxFrame.click('input[type="checkbox"]'); // Click the CAPTCHA checkbox
          console.log("Checkbox clicked! Waiting for CAPTCHA to complete...");

          // Wait for the CAPTCHA to be solved
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Equivalent to page.waitForTimeout
        }
      }

      await page.screenshot({
        path: 'screenshot.jpg'
      })

      // Wait for the job listings to load
      await page.waitForSelector(".mosaic-provider-jobcards > ul > li:not(:has(div.mosaic-empty-zone))", {timeout:60_000}); // The class that contains the job card

      // Scrape job details
      const jobDetails = await page.evaluate(() => {
        const jobCards = document.querySelectorAll(".mosaic-provider-jobcards > ul > li:not(:has(div.mosaic-empty-zone))");

        // Extract details from each job card
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

          // Extract the job link and ID
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
      console.log(jobDetails)

      allJobDetails.push(...jobDetails);

      const nextPageUrl = await page.evaluate(() => {
        const nextPageLink = document.querySelector(
          'a[data-testid="pagination-page-next"]'
        );
        return nextPageLink ? (nextPageLink as HTMLAnchorElement).href : null;
      });

      if (nextPageUrl) {
        // Navigate to the next page if "Next Page" button exists
        await page.goto(nextPageUrl, { waitUntil: "networkidle2" });
      } else {
        hasNextPage = false;
        console.log("No more pages.");
      }
    }

    // Output the scraped job details
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