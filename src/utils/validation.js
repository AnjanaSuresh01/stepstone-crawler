import { logger } from "./logger.js";

export function validateJobData(job) {
  const errors = [];

  if (!job) return false;
  if (!job.jobTitle || typeof job.jobTitle !== "string" || job.jobTitle.trim().length === 0) {
    errors.push("jobTitle is required");
  }
  if (!job.companyName || typeof job.companyName !== "string" || job.companyName.trim().length === 0) {
    errors.push("companyName is required");
  }
  if (!job.jobUrl || typeof job.jobUrl !== "string") {
    errors.push("jobUrl is required");
  }

  // Salary object checks (if present)
  if (job.salary && typeof job.salary === "object") {
    const {min, max} = job.salary;
    if (min !== null && typeof min !== "number") errors.push("salary.min must be number or null");
    if (max !== null && typeof max !== "number") errors.push("salary.max must be number or null");
    if (min !== null && max !== null && min > max) errors.push("salary.min cannot be > salary.max");
  }

  if (errors.length > 0) {
    logger.warn("Validation failed", { jobUrl: job.jobUrl, errors });
    return false;
  }
  return true;
}
