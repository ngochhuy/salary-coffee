/**
 * Regenerate schedule.json with the fixed combineSchedules function
 * Run this script to fetch fresh data from Google Sheets and save to schedule.json
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1-7JC65YHglJdYVzg5THM4OHsr8l3JaFLXbF6ThsfC_s/edit';
// Use port 3002 if dev server is running on that port
const API_URL = process.env.API_URL || 'http://localhost:3002/api/sheets';
const OUTPUT_FILE = path.join(__dirname, '../public/data/schedule.json');

function makeRequest(url, data) {
  const urlObj = new URL(url);
  const protocol = urlObj.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (protocol === https ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function regenerateSchedule() {
  console.log('🔄 Regenerating schedule.json with fixed combineSchedules function...');

  try {
    // Start dev server first (if not running)
    console.log('📡 Calling API to fetch fresh data from Google Sheets...');

    const result = await makeRequest(API_URL, { url: SHEET_URL });

    if (!result.success) {
      throw new Error(result.error || 'API returned failure');
    }

    console.log('✅ API call successful');
    console.log('   - Sheets fetched:', result.data.sheetCount);
    console.log('   - Positions:', result.data.combinedSchedule.positions.length);
    console.log('   - Days:', result.data.combinedSchedule.days.length);
    console.log('   - Cells:', result.data.combinedSchedule.cells.length);

    // Verify Trúc 15/4 is in the new data
    let foundTrucApril = false;
    for (let rowIdx = 0; rowIdx < result.data.combinedSchedule.cells.length; rowIdx++) {
      for (let colIdx = 0; colIdx < result.data.combinedSchedule.cells[rowIdx].length; colIdx++) {
        const cell = result.data.combinedSchedule.cells[rowIdx][colIdx];
        if (cell.employee === 'Trúc' && cell.date === '15/4') {
          foundTrucApril = true;
          console.log('\n✅ VERIFIED: Trúc 15/4 found in new combinedSchedule!');
          console.log('   Shift:', cell.shiftType, 'Offset:', cell.columnOffset);
        }
      }
    }

    if (!foundTrucApril) {
      console.warn('\n⚠️ WARNING: Trúc 15/4 still not found in combinedSchedule!');
    }

    // Save to file
    console.log('\n💾 Saving to', OUTPUT_FILE);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result.data, null, 2), 'utf-8');
    console.log('✅ Saved successfully!');

    // Verify saved file
    const saved = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    console.log('\n📊 Verification:');
    console.log('   - File size:', (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2), 'KB');
    console.log('   - Has sheets:', !!saved.sheets);
    console.log('   - Has combinedSchedule:', !!saved.combinedSchedule);

    // Check Trúc 15/4 in saved file
    let foundInSaved = false;
    for (let rowIdx = 0; rowIdx < saved.combinedSchedule.cells.length; rowIdx++) {
      for (let colIdx = 0; colIdx < saved.combinedSchedule.cells[rowIdx].length; colIdx++) {
        const cell = saved.combinedSchedule.cells[rowIdx][colIdx];
        if (cell.employee === 'Trúc' && cell.date === '15/4') {
          foundInSaved = true;
          console.log('\n✅ VERIFIED: Trúc 15/4 found in saved file!');
          break;
        }
      }
      if (foundInSaved) break;
    }

    if (!foundInSaved) {
      console.error('\n❌ ERROR: Trúc 15/4 NOT found in saved file!');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure the dev server is running:');
    console.error('   npm run dev');
    process.exit(1);
  }
}

regenerateSchedule();
