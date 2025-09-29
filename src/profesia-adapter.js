import { parseSalary } from "./utils/salary-parser.js";
import { parseDate } from "./utils/date-parser.js";
import { logger } from "./utils/logger.js";

export class ProfesiaAdapter {
    static isListingPage(url) {
        return url.includes("/praca/") && !url.includes("/O");
    }
    static isDetailPage(url) {
        return url.includes("/praca/") && url.includes("/O");
    }

    static async extractJobLinks(page) {
        try {
            return await page.evaluate(() => {
                const links = [];
                const jobElements = document.querySelectorAll("a[href*=\"/praca/\"][href*=\"/O\"]");
                jobElements.forEach(el => {
                    const href = el.getAttribute("href");
                    if (href) {
                        const absolute = href.startsWith("http") ? href : `https://www.profesia.sk${href}`;
                        if (!links.includes(absolute)) links.push(absolute);
                    }
                });
                return links;
            });
        } catch (e) {
            logger.error("extractJobLinks error:", e);
            return [];
        }
    }

    static async getNextPageUrl(page) {
        try {
            return await page.evaluate(() => {
                const el = document.querySelector('a[rel="next"], a:contains("Ďalšia"), a:contains("Next")');
                if (el) {
                    const href = el.getAttribute("href");
                    return href ? (href.startsWith("http") ? href : `https://www.profesia.sk${href}`) : null;
                }
                // fallback: look for numeric next
                const pag = document.querySelector(".pagination a, .pager a");
                if (pag) {
                    const href = pag.getAttribute("href");
                    if (href) return href.startsWith("http") ? href : `https://www.profesia.sk${href}`;
                }
                return null;
            });
        } catch (e) {
            logger.debug("getNextPageUrl error:", e);
            return null;
        }
    }

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

                const jobIdMatch = currentUrl.match(/\/O(\d+)/);
                result.jobId = jobIdMatch ? jobIdMatch[1] : null;

                const title = document.querySelector("h1") || document.querySelector(".title") || document.querySelector(".offer-title");
                if (title && title.textContent) result.jobTitle = title.textContent.trim();

                const comp = document.querySelector(".company-name a, .employer a, .company a");
                if (comp) {
                    result.companyName = comp.textContent.trim();
                    const href = comp.getAttribute("href");
                    if (href) result.companyUrl = href.startsWith("http") ? href : `https://www.profesia.sk${href}`;
                } else {
                    const compText = document.querySelector(".company-name, .employer, .company");
                    if (compText) result.companyName = compText.textContent.trim();
                }

                const loc = document.querySelector(".location, .job-location, .place, .offer-location");
                if (loc) result.location = loc.textContent.trim();

                const sal = document.querySelector(".salary, .wage, .offer-salary");
                if (sal) result.salary = sal.textContent.trim();

                const desc = document.querySelector(".job-description, .description, .offer-description, .content");
                if (desc) {
                    let d = desc.textContent || desc.innerText || "";
                    d = d.replace(/\s+/g, " ").trim();
                    if (d.length > 30) result.description = d.substring(0, 2000);
                }

                const tags = document.querySelectorAll(".tags li, .skills li, .technologies li, .keywords span");
                tags.forEach(t => {
                    const v = t.textContent && t.textContent.trim();
                    if (v && !result.tags.includes(v)) result.tags.push(v);
                });

                const dateEl = document.querySelector(".posted-date, .date, .publish-date");
                if (dateEl) result.postedAt = dateEl.textContent.trim();

                // employment type / seniority heuristic
                const details = document.querySelectorAll(".job-details li, .offer-details li, .job-info li, .details li");
                details.forEach(el => {
                    const txt = el.textContent.toLowerCase();
                    if (!result.employmentType && (txt.includes("full") || txt.includes("part") || txt.includes("type") || txt.includes("úväzok"))) {
                        result.employmentType = el.textContent.trim();
                    }
                    if (!result.seniority && (txt.includes("senior") || txt.includes("junior") || txt.includes("medior") || txt.includes("mid"))) {
                        result.seniority = el.textContent.trim();
                    }
                });

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
