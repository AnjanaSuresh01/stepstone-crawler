import { logger } from "./utils/logger.js";
import { parseSalary } from "./utils/salary-parser.js";
import { parseDate } from "./utils/date-parser.js";

export class StepStoneAdapter {
    static isListingPage(url) {
        return url.includes("stepstone") && (url.includes("/stellenangebote") || url.includes("/jobs"));
    }

    static isDetailPage(url) {
        return url.includes("stepstone") && /stellenangebote|jobs|jobId|stellenangebot/i.test(url);
    }

    static async autoScroll(page, delay = 500) {
        try {
            await page.evaluate(async (scrollDelay) => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 300;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, scrollDelay);
                });
            }, delay);
        } catch (err) {
            logger.warn("autoScroll failed:", err.message);
        }
    }

    static async extractJobLinks(page) {
        try {
            await page.waitForSelector("main", { timeout: 15000 }).catch(() => {});
            const links = await page.evaluate(() => {
                const out = new Set();
                const selectors = [
                    'a.job-element__title',
                    'a.job-element__title-link',
                    'a[href*="/stellenangebote/"]',
                    'a[data-gtm*="job"]'
                ];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(a => {
                        const href = a.href || a.getAttribute("href");
                        if (href) out.add(href.startsWith("http") ? href : new URL(href, location.origin).href);
                    });
                });
                // fallback
                document.querySelectorAll("a[href]").forEach(a => {
                    const href = a.href || a.getAttribute("href") || "";
                    if (/\/stellenangebote-|\/stellenangebot\/|\/job\//i.test(href)) out.add(href.startsWith("http") ? href : new URL(href, location.origin).href);
                });
                return Array.from(out).slice(0, 500);
            });
            logger.info(`extractJobLinks: found ${links.length} links`);
            return links;
        } catch (err) {
            logger.error("extractJobLinks error:", err.message);
            return [];
        }
    }

    static async getNextPageUrl(page) {
        try {
            const next = await page.evaluate(() => {
                const selectors = ['a[rel="next"]', '.pagination a[aria-label*="Next"]', 'a.next'];
                for (const s of selectors) {
                    const el = document.querySelector(s);
                    if (el && !el.classList.contains("disabled")) {
                        const href = el.href || el.getAttribute("href");
                        if (href) return href.startsWith("http") ? href : new URL(href, location.origin).href;
                    }
                }
                return null;
            });
            return next;
        } catch (err) {
            logger.warn("getNextPageUrl failed:", err.message);
            return null;
        }
    }

    static async extractJobData(page, url) {
        try {
            await page.goto(url, { waitUntil: "networkidle2" });
            await page.waitForSelector("body", { timeout: 10000 }).catch(() => {});

            const data = await page.evaluate((currentUrl) => {
                const pickText = sel => document.querySelector(sel)?.innerText?.trim() || null;
                const result = {
                    jobUrl: currentUrl,
                    jobId: currentUrl.match(/(?:\/stellenangebote-|\/job\/|jobId=)([A-Za-z0-9\-_]+)/i)?.[1] || null,
                    jobTitle: pickText("h1") || pickText(".job-title") || null,
                    companyName: pickText(".company-name a") || pickText(".employer") || null,
                    location: pickText(".job-location") || null,
                    salary: pickText(".job-salary") || null,
                    employmentType: pickText(".employment-type") || null,
                    seniority: pickText(".seniority") || null,
                    tags: [],
                    postedAt: pickText(".posted") || null,
                    companyUrl: document.querySelector(".company-name a")?.href || null,
                    description: pickText("#jobDescriptionText") || pickText(".job-description") || null
                };

                // extract tags/skills
                ['.job-tags', '.keywords', '.job-attributes', '.techStack'].forEach(sel => {
                    document.querySelectorAll(sel + ' span, ' + sel + ' li, ' + sel).forEach(el => {
                        const v = (el.innerText || "").trim();
                        if (v && !result.tags.includes(v)) result.tags.push(v);
                    });
                });

                return result;
            }, url);

            if (data.salary) data.salary = parseSalary(data.salary);
            if (data.postedAt) data.postedAt = parseDate(data.postedAt);

            return data.jobTitle ? data : null;
        } catch (err) {
            logger.error("extractJobData error", url, err.message);
            return null;
        }
    }
}
