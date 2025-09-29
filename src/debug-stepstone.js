import puppeteer from "puppeteer";
import { StepStoneAdapter } from "./stepstone-adapter.js";

const START_URL = "https://www.stepstone.de/jobs/in-deutschland";
const MAX_PAGES = 3;      // limit pages for testing
const SCROLL_DELAY = 500;
const JOB_DELAY = 500;
const PAGE_DELAY = 1000;

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1200, height: 800 },
    });

    const page = await browser.newPage();
    let url = START_URL;
    let pageCount = 0;
    const jobs = [];
    const seenJobIds = new Set();

    while (url && pageCount < MAX_PAGES) {
        pageCount++;
        console.log(`Opening page ${pageCount}: ${url}`);
        await page.goto(url, { waitUntil: "networkidle2" });

        console.log("Scrolling to load content...");
        await StepStoneAdapter.autoScroll(page, SCROLL_DELAY);

        console.log("Extracting job links...");
        const links = await StepStoneAdapter.extractJobLinks(page);
        console.log(`Found ${links.length} job links on page ${pageCount}`);

        for (const link of links) {
            try {
                const jobPage = await browser.newPage();
                const jobData = await StepStoneAdapter.extractJobData(jobPage, link);
                await jobPage.close();

                if (jobData && !seenJobIds.has(jobData.jobId)) {
                    jobs.push(jobData);
                    seenJobIds.add(jobData.jobId);
                    console.log(`Saved job: ${jobData.jobTitle}`);
                }
            } catch (err) {
                console.warn("Failed to extract job:", link, err.message);
            }
            await delay(JOB_DELAY);
        }

        url = await StepStoneAdapter.getNextPageUrl(page);
        if (url) console.log(`Next page detected: ${url}`);
        else console.log("No more pages, finishing crawl.");

        await delay(PAGE_DELAY);
    }

    console.log(`Crawl finished. Total jobs collected: ${jobs.length}`);
    jobs.slice(0, 5).forEach((j, idx) => console.log(`Sample ${idx + 1}: ${j.jobTitle} | ${j.location}`));

    await browser.close();
})();
