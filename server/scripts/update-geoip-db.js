/**
 * Script to download/update GeoLite2 database
 * Run: npm run update-geoip
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = 'https://cdn.jsdelivr.net/npm/@ip-location-db/geolite2-city-mmdb/geolite2-city-ipv4.mmdb';
const DB_PATH = path.join(__dirname, '../data/GeoLite2-City.mmdb');

console.log('📥 Downloading GeoLite2 database...');
console.log(`   From: ${DB_URL}`);
console.log(`   To: ${DB_PATH}`);

// Create data directory if it doesn't exist
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Created directory: ${dataDir}`);
}

const file = fs.createWriteStream(DB_PATH);

https.get(DB_URL, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Error: HTTP ${response.statusCode}`);
        process.exit(1);
    }

    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloaded = 0;

    response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r   Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)} MB)`);
    });

    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('\n✅ GeoLite2 database downloaded successfully!');
        console.log(`   File size: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB`);
        console.log('\n📊 Database Info:');
        console.log('   - Provider: MaxMind GeoLite2');
        console.log('   - License: CC BY-SA 4.0');
        console.log('   - Update frequency: Twice weekly');
        console.log('   - Data: Country, State/Region, City, Postal Code, Coordinates');
    });
}).on('error', (err) => {
    fs.unlink(DB_PATH, () => { });
    console.error('\n❌ Error downloading database:', err.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify the URL is accessible');
    console.error('   3. Check firewall settings');
    process.exit(1);
});
