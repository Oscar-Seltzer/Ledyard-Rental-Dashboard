import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'master.csv');
const REQUIRED_COLS = ['Items', 'Issued At', 'Completed At', 'Adjusted Rate'];

function escapeCsvCell(val) {
  const str = String(val ?? '').trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCell(val) {
  if (val instanceof Date && !isNaN(val)) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())} ${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}`;
  }
  return String(val ?? '').trim();
}

function normalizeRowKeys(row) {
  const cleaned = {};
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = key.replace(/^\uFEFF/, '').trim();
    cleaned[cleanKey] = val;
  }
  return cleaned;
}

function readDataFile(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return rawRows.map(normalizeRowKeys);
}

function buildMasterCsv() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`[build-master] Directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  const validExtensions = ['.csv', '.xlsx', '.xls'];
  const files = fs.readdirSync(DATA_DIR).filter((f) => {
    const lower = f.toLowerCase();
    return (
      lower !== 'master.csv' &&
      !lower.startsWith('~$') &&
      validExtensions.some((ext) => lower.endsWith(ext))
    );
  });

  if (files.length === 0) {
    console.log('[build-master] No source .csv/.xlsx files found in public/data.');
    return;
  }

  let newestFile = null;
  let newestRows = null;
  let newestTimestamp = -Infinity;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    let rows;
    try {
      rows = readDataFile(filePath);
    } catch (err) {
      console.warn(`[build-master] Skipping unreadable file ${file}:`, err.message);
      continue;
    }

    if (!rows || rows.length === 0) continue;

    for (const row of rows) {
      const rawDate = formatCell(row['Completed At']);
      if (rawDate) {
        const parsedTime = new Date(rawDate.replace(' ', 'T')).getTime();
        if (!isNaN(parsedTime)) {
          if (parsedTime > newestTimestamp) {
            newestTimestamp = parsedTime;
            newestFile = filePath;
            newestRows = rows;
          }
          break;
        }
      }
    }
  }

  if (!newestFile || !newestRows) {
    console.error('[build-master] Could not find any file with a valid "Completed At" column.');
    process.exit(1);
  }

  console.log(`[build-master] Selected winner: ${path.basename(newestFile)}`);

  const firstRowKeys = Object.keys(newestRows[0]);
  for (const col of REQUIRED_COLS) {
    if (!firstRowKeys.includes(col)) {
      throw new Error(`Missing required column "${col}" in ${path.basename(newestFile)}`);
    }
  }

  const outputLines = [REQUIRED_COLS.join(',')];
  let droppedRows = 0;

  for (const row of newestRows) {
    const extracted = REQUIRED_COLS.map((col) => formatCell(row[col]));
    const isComplete = extracted.every(
      (cell) => cell !== '' && cell.toLowerCase() !== 'nan' && cell.toLowerCase() !== 'null'
    );

    if (isComplete) {
      outputLines.push(extracted.map(escapeCsvCell).join(','));
    } else {
      droppedRows++;
    }
  }

  fs.writeFileSync(OUTPUT_PATH, outputLines.join('\n') + '\n', 'utf-8');
  console.log(
    `[build-master] Wrote ${OUTPUT_PATH} (${outputLines.length - 1} clean rows, ${droppedRows} incomplete rows dropped).`
  );
}

buildMasterCsv();
