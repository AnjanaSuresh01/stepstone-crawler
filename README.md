Job Portal Crawler – StepStone

1. Overview
This project is a Node.js crawler built with Apify/Crawlee that extracts job postings from StepStone.
The main goal was to demonstrate practical skills in web scraping, data extraction, and integration while following best practices like respecting rate limits, validating data, and avoiding duplicates.

Along the way, I explored multiple job portals to test and refine my approach:
- I started with Profesia.sk (the suggested portal)
- Then experimented with Indeed
- Finally, I settled on StepStone, which provided the cleanest and most consistent data for the final solution
The crawler gathers key information such as:
- Job title, company, and location
- Salary details (min, max, currency, period)
- Employment type, seniority, and skill tags
- Posting date (converted to ISO format)
- Stable identifiers like jobId/jobUrl (for de-duplication)
- Concise, plain-text job descriptions
This setup simulates what a real-world job aggregation pipeline would look like.

2. Features
To make the crawler flexible and maintainable, I implemented:
- Modular adapters → Separate scrapers for StepStone, Profesia, and Indeed (easy to extend to other portals)
- Utility functions → Parsing salaries, dates, and validating records before saving
- De-duplication → Prevents storing the same job twice (based on jobId or jobUrl)
- Polite crawling → Configurable concurrency, retry logic, and backoff to avoid overwhelming servers
- Logging → Keeps track of successes, failures, and overall progress
- Environment variables → Customizable parameters like START_URL, CONCURRENCY, and MAX_PAGES
These features reflect a balance between functionality and best practices when working with public job portals.

3. Installation
   
3.1 Clone the repository
  ``bash
git clone https://github.com/AnjanaSuresh01/stepstone-crawler
cd stepstone-crawler  

3.2 Install dependencies
  ``bash
npm install

3.3 Run the crawler
 ``bash
npm start

By default, the crawler uses the StepStone adapter.
If you’d like to experiment with Profesia or Indeed, you can switch adapters in src/main.js.

4. Output
After running, the crawler exports job data to the output/ folder:
- output/sample-jobs.json → JSON format
- output/sample-jobs.csv → CSV format (optional, included as a sample)
The files contain a small sample dataset so you can quickly check the results.

5.Notes
- The crawler was first tested on Profesia and Indeed, but after iterations, StepStone was chosen for the final version.
- It respects robots.txt and the site’s Terms of Service.
- Only publicly available pages are scraped (no logins, no captcha bypassing).

