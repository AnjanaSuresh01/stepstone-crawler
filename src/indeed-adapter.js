import { parseSalary } from "./utils/salary-parser.js";
import { parseDate } from "./utils/date-parser.js";
import { logger } from "./utils/logger.js";

export class IndeedAdapter {
    // Listing page URL contains "jobs?q=" but not "/viewjob?"
    static isListingPage(url) {
        return url.includes("/jobs") && !url.includes("/viewjob?");
    }

    // Detail page URL contains "/viewjob?"
    static isDetailPage(url) {
        return url.includes("/viewjob?");
    }

    // Extract job links from a listing page
    static async extractJobLinks(page) {
        try {
            return await page.evaluate(() => {
                const links = [];
                const elements = document.querySelectorAll('a[data-jk]');
                elements.forEach(el => {
                    const jk = el.getAttribute("data-jk");
                    if (jk) {
                        const link = `https://www.indeed.com/viewjob?jk=${jk}`;
                        if (!links.includes(link)) links.push(link);
                    }
                });
                return links;
            });
        } catch (e) {
            logger.error("extractJobLinks error:", e);
            return [];
        }
    }

    // Get next page URL from pagination
    static async getNextPageUrl(page) {
        try {
            return await page.evaluate(() => {
                const nextEl = document.querySelector('a[aria-label="Next"]');
                if (nextEl) {
                    const href = nextEl.getAttribute("href");
                    return href ? `https://www.indeed.com${href}` : null;
                }
                return null;
            });
        } catch (e) {
            logger.debug("getNextPageUrl error:", e);
            return null;
        }
    }

    // Extract job data from a detail page
    static async extractJobData(page, url) {
        try {
            await page.waitForSelector("body", { timeout: 10000 });

            const data = await page.evaluate((currentUrl) => {
                const result = {
                    jobUrl: currentUrl,
                    jobId: null,
                    jobTitle: null,
                    companyName: null,
                    location: null,
                    salary: null,
                    employmentType: null,
                    seniority: null,
                    tags: [],
                    postedAt: null,
                    companyUrl: null,
                    description: null
                };

                // jobId from URL
                const match = currentUrl.match(/jk=([a-zA-Z0-9]+)/);
                result.jobId = match ? match[1] : null;

                const titleEl = document.querySelector(".jobsearch-JobInfoHeader-title");
                if (titleEl) result.jobTitle = titleEl.textContent.trim();

                const companyEl = document.querySelector(".jobsearch-InlineCompanyRating div:first-child");
                if (companyEl) result.companyName = companyEl.textContent.trim();

                const locationEl = document.querySelector(".jobsearch-InlineCompanyRating div:nth-child(2), .jobsearch-JobInfoHeader-subtitle div");
                if (locationEl) result.location = locationEl.textContent.trim();

                const salaryEl = document.querySelector(".salary-snippet-container");
                if (salaryEl) result.salary = salaryEl.textContent.trim();

                const descEl = document.querySelector("#jobDescriptionText");
                if (descEl) {
                    let d = descEl.textContent || "";
                    d = d.replace(/\s+/g, " ").trim();
                    if (d.length > 30) result.description = d.substring(0, 2000);
                }

                const dateEl = document.querySelector(".jobsearch-JobMetadataFooter");
                if (dateEl) result.postedAt = dateEl.textContent.trim();

                return result;
            }, url);

            if (data.salary) data.salary = parseSalary(data.salary);
            if (data.postedAt) data.postedAt = parseDate(data.postedAt);

            if (!data.jobTitle || !data.companyName) {
                logger.warn("Missing essential fields", { url, jobTitle: data.jobTitle, companyName: data.companyName });
                return null;
            }

            return data;

        } catch (error) {
            logger.error("extractJobData error for", url, error);
            return null;
        }
    }
}
