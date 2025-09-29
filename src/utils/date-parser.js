export function parseDate(text) {
  if (!text || typeof text !== "string") return text;
  const raw = text.trim();
  const s = raw.toLowerCase();
  const toISO = (d) => d.toISOString().split("T")[0];

  if (/^dnes\b/.test(s)) return toISO(new Date());
  if (/^včera|^vcera\b/.test(s)) { const d=new Date(); d.setDate(d.getDate()-1); return toISO(d); }

  const agoMatch = s.match(/(\d+)\s*(d(?:ni|ní|ňami)?|dni|days?|day|d)/);
  if (agoMatch) {
    const n = parseInt(agoMatch[1], 10);
    if (!Number.isNaN(n)) { const d=new Date(); d.setDate(d.getDate()-n); return toISO(d); }
  }

  const hoursMatch = s.match(/(\d+)\s*(hod|min|h)/);
  if (hoursMatch) {
    const n = parseInt(hoursMatch[1], 10);
    if (!Number.isNaN(n)) { const d=new Date(); d.setHours(d.getHours() - n); return toISO(d); }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const euMatch = s.match(/^(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](\d{2,4})$/);
  if (euMatch) {
    let [, d, m, y] = euMatch;
    if (y.length === 2) y = "20" + y;
    const iso = `${y.padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return iso;
  }

  return raw;
}
