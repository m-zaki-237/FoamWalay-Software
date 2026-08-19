const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, '../client/src/assets/fonts');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap';
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const fontBlocks = data.split('@font-face');
      for (const block of fontBlocks) {
        const familyMatch = block.match(/font-family:\s*['"]([^'"]+)['"]/);
        const weightMatch = block.match(/font-weight:\s*(\d+)/);
        const urlMatch = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
        if (familyMatch && weightMatch && urlMatch) {
          const family = familyMatch[1].toLowerCase().replace(/\s+/g, '');
          const weight = weightMatch[1];
          const fontUrl = urlMatch[1];
          const filename = `${family}-${weight}.woff2`;
          const dest = path.join(dir, filename);
          console.log(`[FONT] Downloading ${filename}...`);
          await downloadFile(fontUrl, dest);
        }
      }
      console.log('[FONT] All WOFF2 font files saved to client/src/assets/fonts');
    });
  });
}

main().catch(console.error);
