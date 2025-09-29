export function parseSalary(salaryText) {
  if (!salaryText || typeof salaryText !== "string") return null;
  const raw = salaryText.trim();
  const lower = raw.toLowerCase();

  if (!lower || lower.includes("dohodou") || lower.includes("dohoda") || lower === "n/a") {
    return null;
  }

  const numTokens = raw.match(/(?:\d{1,3}[.\s]\d{3}(?:[.,]\d+)?|\d+[.,]?\d*)/g) || [];

  const tokenToNumber = (tok) => {
    let t = tok.trim();
    if (t.includes(".") && t.includes(",")) {
      const afterComma = t.split(",").pop();
      if (afterComma.length === 2) {
        t = t.replace(/\./g, "").replace(",", ".");
      } else {
        t = t.replace(/,/g, "");
      }
    } else if (t.includes(",")) {
      const after = t.split(",").pop();
      if (after.length === 2) {
        t = t.replace(/\./g, "").replace(",", ".");
      } else {
        t = t.replace(/[, ]/g, "");
      }
    } else {
      t = t.replace(/[.\s]/g, "");
    }
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  };

  const numbers = numTokens.map(tokenToNumber).filter(n => n !== null);

  if (numbers.length === 0) {
    return { raw, min: null, max: null, currency: null, period: null };
  }

  let min = null, max = null;
  if (/-|–|—/.test(raw) && numbers.length >= 2) {
    const sorted = [...numbers].sort((a,b) => a-b);
    min = sorted[0];
    max = sorted[sorted.length - 1];
  } else if (numbers.length === 1) {
    min = numbers[0];
  } else {
    const sorted = [...numbers].sort((a,b) => a-b);
    min = sorted[0];
    max = sorted[sorted.length - 1];
  }

  let currency = null;
  const currencyMap = [
    { pat: /eur|€/, val: "EUR" },
    { pat: /usd|\$/, val: "USD" },
    { pat: /czk|kč|kc/, val: "CZK" },
    { pat: /gbp|£/, val: "GBP" }
  ];
  for (const {pat, val} of currencyMap) {
    if (pat.test(lower)) { currency = val; break; }
  }
  if (!currency && (min || max)) currency = "EUR";

  let period = null;
  if (/(mesiac|mesačne|monthly|per month|\/m)/i.test(lower)) period = "month";
  else if (/(rok|ročne|yearly|per year|annually|\/r)/i.test(lower)) period = "year";
  else if (/(hodin|\/h|hourly|per hour)/i.test(lower)) period = "hour";
  else if (/(deň|denne|daily|per day)/i.test(lower)) period = "day";
  else if (/(týždeň|týždenne|week|weekly)/i.test(lower)) period = "week";

  if (!period && min) {
    if (min >= 500) period = "month";
    else if (min < 50) period = "hour";
  }

  return {
    raw,
    min: (typeof min === "number" ? min : null),
    max: (typeof max === "number" ? max : null),
    currency,
    period
  };
}
