/**
 * Readable device names for the "Signed-in devices" lists, from the User-Agent
 * stored on each auth_sessions row. Deliberately simple — no UA database.
 *   "Mozilla/5.0 (Macintosh; …) Chrome/131…" → { browser: "Chrome", os: "macOS", type: "desktop" }
 */

const BROWSERS = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/CriOS\/|Chrome\//, "Chrome"],
  [/Version\/[\d.]+.*Safari\//, "Safari"],
  [/PostmanRuntime/, "Postman"],
  [/curl\//, "curl"],
  [/node|undici|axios|python-requests|okhttp/i, "API client"],
];

const SYSTEMS = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
];

export function describeDevice(userAgent) {
  const ua = userAgent || "";
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1] || "Unknown browser";
  const os = SYSTEMS.find(([re]) => re.test(ua))?.[1] || "Unknown system";
  const type = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))
    ? "tablet"
    : /Mobi|iPhone|Android/.test(ua)
      ? "mobile"
      : "desktop";
  return { browser, os, type, label: `${browser} on ${os}` };
}
