const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG with gradient #7C3AED to #4F46E5, top-left to bottom-right
// Bold "AE" text centered
const baseSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="102.4" fill="url(#grad)" />
  <text x="256" y="270" font-family="system-ui, sans-serif" font-weight="bold" font-size="200" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">AE</text>
</svg>
`;

async function generateIcons() {
  const svgBuffer = Buffer.from(baseSvg);
  
  for (const size of sizes) {
    const fileName = `icon-${size}.png`;
    const outputPath = path.join(iconsDir, fileName);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
      
    console.log(`Created ${fileName}`);
  }
  console.log("Successfully generated all PWA icons!");
}

generateIcons().catch(err => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
