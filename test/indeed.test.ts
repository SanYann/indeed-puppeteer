import { handler } from "../src/indeed/indeed";

describe("Indeed Scraper", () => {
  it("should scrape job details", async () => {
    const response = await handler({});
    expect(response.statusCode).toBe(200);
    const jobDetails = JSON.parse(response.body);
    expect(jobDetails).toBeInstanceOf(Array);
    expect(jobDetails.length).toBeGreaterThan(0);
  });
});
