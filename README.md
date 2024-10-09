# Indeed Job Scraper

This project is a **web scraper** built using **Puppeteer**, **Puppeteer Extra**, and **chrome-aws-lambda** to extract job listings from [Indeed](https://www.indeed.com). It can handle **Cloudflare's Turnstile CAPTCHA** and works in **AWS Lambda** or any local environment.

## Features

- Scrapes job listings from Indeed.
- Extracts key details such as job title, company, location, job type, posting date, job URL, and job ID.
- Bypasses Cloudflare's CAPTCHA using Puppeteer and Puppeteer Extra's stealth plugin.
- Configurable for both **AWS Lambda** and local environments.

## Project Structure

```bash
.
├── src
│   └── indeed
│       └── indeed.ts         # Main scraper logic
├── test
│   └── indeed.test.ts        # Test cases
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest configuration for testing
└── README.md                 # Project README
```

## Installation

### Prerequisites

- **Node.js** v14 or higher.
- **npm** or **yarn** for dependency management.

### Install dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

## Usage

You can run the scraper locally or deploy it to AWS Lambda.

### Running Locally

Use the following command to start the scraper locally:

```bash
npm start
```

This will execute the script and scrape job listings from Indeed, handling any Cloudflare CAPTCHA challenges as they appear.

### Running in AWS Lambda

To run this scraper on AWS Lambda, you need to package the project and deploy it to Lambda:

1. **Install dependencies**:
   Ensure all necessary dependencies (e.g., `chrome-aws-lambda`, `puppeteer-core`) are installed.

   ```bash
   npm install
   ```

2. **Deploy to Lambda**:
   Package your project with the required dependencies and upload the package to AWS Lambda.

3. **Run Lambda Function**:
   Invoke the Lambda function, which will execute the scraper.

## Configuration

### Environment Variables

To configure environment-specific settings like API keys or URLs, you can add them using a `.env` file in the root of the project:

```bash
API_KEY=your-api-key-here
```

Ensure you have the `dotenv` library installed if you are managing environment variables:

```bash
npm install dotenv
```

### Puppeteer Configuration

In the `src/indeed/indeed.ts` file, you can adjust the Puppeteer launch settings (headless mode, arguments, etc.) to suit your environment. Example:

```typescript
const browser = await puppeteerExtra.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: (await chromium.executablePath) || undefined,
  headless: true, // Set to false for local debugging
});
```

## Running Tests

The project uses **Jest** for testing. Tests are located in the `test` folder.

To run the tests, use the following command:

```bash
npm test
```

The tests will run and check that the scraper is functioning correctly, including verifying that it can retrieve job listings from Indeed.

## Example Output

When the scraper successfully runs, it outputs an array of job objects with the following structure:

```json
[
  {
    "title": "Front-End Developer",
    "company": "Tech Solutions",
    "location": "New York, NY",
    "jobType": "Full-time",
    "postedDate": "Posted 5 days ago",
    "jobLink": "https://www.indeed.com/viewjob?jk=job_id",
    "jobId": "job_id"
  },
  {
    "title": "Full Stack Developer",
    "company": "Creative Corp",
    "location": "Brooklyn, NY",
    "jobType": "Part-time",
    "postedDate": "Posted 10 days ago",
    "jobLink": "https://www.indeed.com/viewjob?jk=another_job_id",
    "jobId": "another_job_id"
  }
]
```

## Contributing

Feel free to fork this repository and submit pull requests. Please ensure that your code follows best practices and includes tests for new functionality.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add some new feature'`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any issues or questions, please feel free to open an issue in this repository.
