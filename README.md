Job Portal Crawler – StepStone
1.Overview
This project is a Node.js crawler built with Apify/Crawlee to extract job postings from StepStone. It demonstrates practical skills in web scraping, data extraction, and integration, while following best practices such as respecting rate limits, validating data, and avoiding duplicates.
During development, multiple job portals were explored:
1.Profesia.sk – initial exploration
2.Indeed – experimental
3.StepStone – final choice due to clean, consistent data
The crawler gathers key information such as:
- Job title, company, and location
- Salary details (min, max, currency, period)
- Employment type, seniority, and skill tags
- Posting date (converted to ISO format)
- Stable identifiers like jobId and jobUrl (for de-duplication)
- Concise, plain-text job descriptions
This setup simulates a real-world job aggregation pipeline.

2.Features
- Modular adapters – Separate scrapers for StepStone, Profesia, and Indeed (easy to extend to other portals)
- Utility functions – Parsing salaries, dates, and validating records before saving
- De-duplication – Prevents storing the same job twice using jobId or jobUrl
- Polite crawling – Configurable concurrency, retry logic, and backoff to avoid overwhelming servers
- Logging – Tracks successes, failures, and overall progress
- Environment variables – Customize parameters like START_URL, CONCURRENCY, and MAX_PAGES

3. Requirements
- Node.js v22+
- npm
- Internet connection
- (Optional) Chrome/Chromium installed if not using the bundled Puppeteer browser

4.Project Structure

├── src/
│   ├── main.js               # Entry point (StepStone by default)
│   ├── stepstone-adapter.js  # StepStone crawler adapter
│   ├── profesia-adapter.js   # Profesia crawler adapter (exploratory)
│   ├── indeed-adapter.js     # Indeed crawler adapter (exploratory)
│   ├── utils/
│   │   ├── date-parser.js
│   │   ├── salary-parser.js
│   │   ├── validation.js
│   │   └── logger.js
│   └── tests/
│       └── parsers.test.js
├── output/                   # Exported job data
│   ├── sample-jobs.json
│   └── sample-jobs.csv
├── package.json
├── package-lock.json
├── .gitignore
└── README.md

5. Installation
 5.1 Clone the repository
 ''bash
 git clone https://github.com/AnjanaSuresh01/stepstone-crawler
 cd stepstone-crawler

 5.2 Install dependencies
 ''bash
 npm install

 5.3 Run the crawler
 ''bash
 npm start

By default, the crawler uses the StepStone adapter.If you’d like to experiment with Profesia or Indeed, you can switch adapters in src/main.js

6.Configuration
Customize the crawler using environment variables:
- START_URL → The URL of the job portal page to start crawling
- MAX_PAGES → Maximum number of pages to scrape
- SCROLL_DELAY → Delay in milliseconds for scrolling to load content
- CONCURRENCY → Number of pages to scrape in parallel

"Example:
 ''bash
 set START_URL=https://www.stepstone.de/jobs/software-developer/in-germany
 set MAX_PAGES=5
 set SCROLL_DELAY=500
 npm start"

7. Output
After running, the crawler exports job data to the output/ folder:
> output/sample-jobs.json → JSON format
> output/sample-jobs.csv → CSV format
Each entry contains information like job title, company, location, salary, employment type, posting date, and description.

8.Notes
> Initially tested on Profesia and Indeed, but StepStone was chosen for the final version
> Respects robots.txt and site Terms of Service
> Demonstrates a scalable, modular architecture for job aggregation





