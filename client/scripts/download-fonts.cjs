const https = require("https");
const fs = require("fs");
const path = require("path");

const fontsDir = path.join(__dirname, "..", "public", "fonts");
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("Fetching Google Fonts CSS...");
  const cssUrl =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap";

  const css = await new Promise((resolve, reject) => {
    https.get(
      cssUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }
    ).on("error", reject);
  });

  // Split into @font-face blocks
  const blocks = css.split("@font-face {").slice(1);
  const localFaceRules = [];
  let fontIdx = 0;

  for (const block of blocks) {
    // Only take latin subset blocks to keep downloads tight and fast
    if (!block.includes("/* latin */") && !block.includes("unicode-range: U+0000-00FF")) {
      continue;
    }

    const familyMatch = block.match(/font-family:\s*'([^']+)'/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^\)]+\.woff2)\)/);

    if (familyMatch && weightMatch && urlMatch) {
      const family = familyMatch[1];
      const style = styleMatch ? styleMatch[1].trim() : "normal";
      const weight = weightMatch[1].trim();
      const remoteUrl = urlMatch[1];

      const cleanFam = family.toLowerCase().replace(/\s+/g, "-");
      const filename = `${cleanFam}-${weight}-${style}.woff2`;
      const localPath = path.join(fontsDir, filename);

      console.log(`Downloading ${filename} from ${remoteUrl}...`);
      await downloadFile(remoteUrl, localPath);

      localFaceRules.push(`
@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${filename}') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}`);
      fontIdx++;
    }
  }

  const fontsCssPath = path.join(__dirname, "..", "src", "styles", "fonts.css");
  fs.writeFileSync(fontsCssPath, localFaceRules.join("\n\n"));
  console.log(`Saved ${fontIdx} local fonts and created ${fontsCssPath}`);
}

run().catch((e) => {
  console.error("Error downloading fonts:", e);
  process.exit(1);
});
