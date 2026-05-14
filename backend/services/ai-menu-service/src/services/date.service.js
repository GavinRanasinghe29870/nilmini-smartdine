const TIME_ZONE = "Asia/Colombo";

function getColomboDateString(offsetDays = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function isAfterFivePmColombo() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);

  return hour > 17 || (hour === 17 && minute >= 0);
}

function normalizeYesNo(value) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return value !== 0 ? "Yes" : "No";
  }

  const text = String(value || "").trim().toLowerCase();

  if (["yes", "y", "true", "1", "holiday"].includes(text)) {
    return "Yes";
  }

  return "No";
}

function getMonthPeriod(dateString) {
  const day = Number(String(dateString).split("-")[2]);

  if (day <= 10) return "start";
  if (day <= 20) return "middle";
  return "end";
}

module.exports = {
  TIME_ZONE,
  getColomboDateString,
  addDays,
  isAfterFivePmColombo,
  normalizeYesNo,
  getMonthPeriod,
};