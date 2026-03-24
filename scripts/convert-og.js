import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "../public/og-image.svg");
const dest = join(__dirname, "../public/og-image.png");

await sharp(src).resize(1200, 630).png().toFile(dest);
console.log("✓ og-image.png generated");
