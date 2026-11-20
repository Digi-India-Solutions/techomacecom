import { test } from "node:test";
import assert from "node:assert/strict";
import { describeDevice } from "../src/lib/device.js";

test("names common browsers and systems", () => {
  const mac = describeDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
  assert.deepEqual([mac.browser, mac.os, mac.type], ["Chrome", "macOS", "desktop"]);
  const iphone = describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1");
  assert.deepEqual([iphone.browser, iphone.os, iphone.type], ["Safari", "iPhone", "mobile"]);
  const edge = describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0");
  assert.equal(edge.label, "Edge on Windows");
  const tab = describeDevice("Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
  assert.deepEqual([tab.os, tab.type], ["Android", "tablet"]);
  assert.equal(describeDevice(null).label, "Unknown browser on Unknown system");
});
