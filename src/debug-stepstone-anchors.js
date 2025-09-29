import puppeteer from "puppeteer";
import { StepStoneAdapter } from "./stepstone-adapter.js";

const START_URL = "https://www.stepstone.de/jobs/in-deutschland";

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 800 } });
    const page = await browser.newPage();

    let url = START_URL;
    let pageCount = 0;

    while (url) {
        pageCount++;
        console.log(`Opening page ${pageCount}: ${url}`);
        await page.goto(url, { waitUntil: "networkidle2" });

        console.log("Scrolling to load content...");
        await StepStoneAdapter.autoScroll(page, 500, 30);
        await delay(1000);

        const links = await StepStoneAdapter.extractJobLinks(page);
        console.log(`Found ${links.length} job links on page ${pageCount}:`);
        links.slice(0, 10).forEach(h => console.log(h)); // first 10 links

        url = await StepStoneAdapter.getNextPageUrl(page);
        if (url) console.log(`Next page detected: ${url}`);
        else console.log("No more pages, finishing crawl.");
    }

    console.log("Done. Closing browser.");
    await browser.close();
})();
