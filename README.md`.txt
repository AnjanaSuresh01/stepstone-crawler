 Job Portal Crawler – StepStone

  1.Overview
This project is a web crawler built using Node.js and Apify/Crawlee that extracts job postings from StepStone.  
It demonstrates web scraping, data extraction, and integration skills.

The crawler collects key job information such as:
- Job title, company, location
- Salary details (min, max, currency, period)
- Employment type, seniority, and skills/tags
- Posting date, job ID, and URLs
- Job description (concise, plain text)

2.Features
- Clean separation of portal adapters (StepStone, Profesia, Indeed)
- Utility functions for parsing dates, salaries, and validating data
- De-duplication by job ID or job URL
- Polite crawling with rate-limits and retry/backoff
- Logging of key events
- Optional environment variables for customization (START_URL, CONCURRENCY, MAX_PAGES)

3.Installation
  3.1 Clone the repository:
       ```bash
       git clone https://github.com/anjanasuresh/job-crawler.git
       cd job-crawler
  3.2 Install dependencies:
       ```bash
       npm install
  3.3 Usage
       Run the crawler with:
       ```bash
       npm start
4.Output
  The crawler exports job data to:
 - output/sample-jobs.json – sample JSON output
 - output/sample-jobs.csv – sample CSV output (if included)

Notes
- Initially tested on Profesia and Indeed; final implementation uses StepStone.
- The crawler respects robots.txt and the portal's Terms of Service.
- Only publicly accessible pages are scraped; no login or captcha bypassing.
