import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { StepStoneAdapter } from "./stepstone-adapter.js";

const START_URL = process.env.START_URL || "https://www.stepstone.de/jobs/in-deutschland";
const OUTPUT_JSON = path.join("output", "jobs.json");
const OUTPUT_CSV = path.join("output", "jobs.csv");
const MAX_PAGES = parseInt(process.env.MAX_PAGES || "5");
const SCROLL_DELAY = parseInt(process.env.SCROLL_DELAY || "500");

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    if (!fs.existsSync("output")) fs.mkdirSync("output");

    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 800 } });
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
                const jobData = await StepStoneAdapter.extractJobData(await browser.newPage(), link);
                if (jobData && !seenJobIds.has(jobData.jobId)) {
                    jobs.push(jobData);
                    seenJobIds.add(jobData.jobId);
                    console.log(`Saved job: ${jobData.jobTitle}`);
                }
            } catch (err) {
                console.warn("Failed to extract job:", link, err.message);
            }
            await delay(500); // polite delay between jobs
        }

        url = await StepStoneAdapter.getNextPageUrl(page);
        if (url) console.log(`Next page detected: ${url}`);
        else console.log("No more pages, finishing crawl.");
        await delay(1000); // polite delay between pages
    }

    console.log(`Done. Closing browser. Saved ${jobs.length} jobs.`);

    await browser.close();

    // Save JSON
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jobs, null, 2));
    console.log(`Saved ${jobs.length} jobs to ${OUTPUT_JSON}`);

    // Save CSV
    if (jobs.length > 0) {
        const headers = Object.keys(jobs[0]);
        const csv = [
            headers.join(","),
            ...jobs.map(j => headers.map(h => `"${(j[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))
        ].join("\n");
        fs.writeFileSync(OUTPUT_CSV, csv);
        console.log(`Saved ${jobs.length} jobs to ${OUTPUT_CSV}`);
    }
})();
