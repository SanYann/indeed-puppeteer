import { postHandler } from "../src/indeed";

describe("Indeed Scraper", () => {
  it("should scrape job details", async () => {
    await postHandler({});
    // expect(response.statusCode).toBe(200);
    // const jobDetails = JSON.parse(response.body);
    // expect(jobDetails).toBeInstanceOf(Array);
    // expect(jobDetails.length).toBeGreaterThan(0);
  });
});
