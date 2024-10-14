"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postHandler = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const promisify_wait_1 = __importDefault(require("promisify-wait"));
const chromium = require("chrome-aws-lambda");
// Use stealth plugin to avoid detection
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
const postHandler = async (event) => {
    await (0, promisify_wait_1.default)(2000);
    let browser = null;
    try {
        browser = await puppeteer_extra_1.default.launch({
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            ignoreDefaultArgs: ["--enable-automation"],
            timeout: 80000,
            headless: chromium.headless,
            args: [
                ...chromium.args,
                "--no-sandbox",
                "--disable-notifications",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
            ],
        });
        const page = await browser.newPage();
        let hasNextPage = true;
        const allJobDetails = [];
        // Navigate to the Indeed job search page
        const indeedUrl = "https://ch-fr.indeed.com/jobs?q=vendeuse&l=Lausanne,%20VD";
        await page.goto(indeedUrl, { waitUntil: "networkidle2" });
        while (hasNextPage) {
            // Wait for the Turnstile iframe if present (Cloudflare protection)
            const turnstileIframe = await page.$('iframe[src*="turnstile"]');
            if (turnstileIframe) {
                console.log("Detected Turnstile CAPTCHA, trying to solve...");
                const checkboxFrame = await page
                    .frames()
                    .find((frame) => frame.url().includes("turnstile"));
                if (checkboxFrame) {
                    await checkboxFrame.waitForSelector('input[type="checkbox"]');
                    await checkboxFrame.click('input[type="checkbox"]'); // Click the CAPTCHA checkbox
                    console.log("Checkbox clicked! Waiting for CAPTCHA to complete...");
                    // Wait for the CAPTCHA to be solved
                    await new Promise((resolve) => setTimeout(resolve, 5000)); // Equivalent to page.waitForTimeout
                }
            }
            // Wait for the job listings to load
            await page.waitForSelector("li.css-5lfssm"); // The class that contains the job card
            // Scrape job details
            const jobDetails = await page.evaluate(() => {
                const jobCards = document.querySelectorAll("li.css-5lfssm");
                // Extract details from each job card
                const jobs = Array.from(jobCards).map((jobCard) => {
                    const titleElement = jobCard.querySelector("h2.jobTitle a");
                    const companyElement = jobCard.querySelector('[data-testid="company-name"]');
                    const locationElement = jobCard.querySelector('[data-testid="text-location"]');
                    const jobTypeElement = jobCard.querySelector('[data-testid="attribute_snippet_testid"]');
                    const postedDateElement = jobCard.querySelector('[data-testid="myJobsStateDate"]');
                    // Extract the job link and ID
                    const jobLink = titleElement
                        ? titleElement.href
                        : null;
                    const jobId = titleElement
                        ? titleElement.getAttribute("data-jk")
                        : null;
                    return {
                        title: titleElement
                            ? titleElement.innerText.trim()
                            : null,
                        company: companyElement
                            ? companyElement.innerText.trim()
                            : null,
                        location: locationElement
                            ? locationElement.innerText.trim()
                            : null,
                        jobType: jobTypeElement
                            ? jobTypeElement.innerText.trim()
                            : null,
                        postedDate: postedDateElement
                            ? postedDateElement.innerText.trim()
                            : null,
                        jobLink,
                        jobId,
                    };
                });
                return jobs;
            });
            allJobDetails.push(...jobDetails);
            const nextPageUrl = await page.evaluate(() => {
                const nextPageLink = document.querySelector('a[data-testid="pagination-page-next"]');
                return nextPageLink ? nextPageLink.href : null;
            });
            if (nextPageUrl) {
                // Navigate to the next page if "Next Page" button exists
                await page.goto(nextPageUrl, { waitUntil: "networkidle2" });
            }
            else {
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
    }
    catch (error) {
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
    }
    finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
exports.postHandler = postHandler;
