import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { processImage } from "../src/lib/image.js";

async function photo(width, height, format = "jpeg") {
  // Noisy gradient ≈ a real photo (flat colours compress unrealistically well)
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 7 + ((i * 2654435761) % 97)) & 0xff;
  return sharp(raw, { raw: { width, height, channels: 3 } })[format]({ quality: 92 }).withMetadata({ exif: { IFD0: { Make: "TestCam" } } }).toBuffer();
}

test("converts a JPEG to WebP with responsive sizes and strips metadata", async () => {
  const input = await photo(1800, 1200);
  const out = await processImage(input);
  const meta = await sharp(out.main.buffer).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(out.main.width, 1800);
  assert.equal(meta.exif, undefined, "EXIF must be stripped");
  assert.deepEqual(out.variants.map((v) => v.width), [320, 640, 1024, 1600]);
  assert.ok(out.placeholder.startsWith("data:image/webp;base64,"));
});

test("caps very large images and never upscales small ones", async () => {
  const big = await processImage(await photo(4000, 1000));
  assert.equal(big.main.width, 2560);
  const small = await processImage(await photo(300, 200, "png"));
  assert.equal(small.main.width, 300);
  assert.equal(small.variants.length, 0);
});

test("rejects non-images and SVG", async () => {
  await assert.rejects(processImage(Buffer.from("not an image")), /not a readable image/);
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>');
  await assert.rejects(processImage(svg), /Unsupported image type \(svg\)/);
});
