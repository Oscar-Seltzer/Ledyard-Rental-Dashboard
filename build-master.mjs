import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const REQUIRED_COLS = ['Items', 'Issued At', 'Completed At', 'Adjusted Rate'];

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function escapeCsvCell(val) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildMasterCsv() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`Directory not found: ${DATA_DIR}. Skipping master.csv generation.`);
    return;
  }

  // Look at all CSVs in public/data except master.csv itself
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith('.csv') && f.toLowerCase() !== 'master.csv');

  if (files.length === 0) {
    console.log('No source CSV files found in public/data (other than master.csv). Keeping existing master.csv.');
    return;
  }

  let newestFile = null;
  let newestTimestamp = -Infinity;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length < 2) continue;

    const headers = parseCsvLine(lines[0]);
    const completedAtIdx = headers.indexOf('Completed At');
    if (completedAtIdx === -1) continue;

    // Check the topline data row (falling back to the first non-empty Completed At if row 1 is blank)
    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const rawDate = row[completedAtIdx];
      if (rawDate) {
        const parsedTime = new Date(rawDate.replace(' ', 'T')).getTime();
        if (!isNaN(parsedTime)) {
          if (parsedTime > newestTimestamp) {
            newestTimestamp = parsedTime;
            newestFile = filePath;
          }
          break;
        }
      }
    }
  }

  if (!newestFile) {
    console.error('Could not find any CSV with a valid "Completed At" date.');
    process.exit(1);
  }

  console.log(`[build-master] Selected most recent file: ${path.basename(newestFile)}`);

  const rawContent = fs.readFileSync(newestFile, 'utf-8');
  const allLines = rawContent.split(/\r?\n/).filter((line) => line.trim() !== '');
  const headers = parseCsvLine(allLines[0]);

  const colIndices = REQUIRED_COLS.map((col) => {
    const idx = headers.indexOf(col);
    if (idx === -1) {
      throw new Error(`Missing required column "${col}" in ${path.basename(newestFile)}`);
    }
    return idx;
  });

  const outputLines = [REQUIRED_COLS.join(',')];
  let droppedRows = 0;

  for (let i = 1; i < allLines.length; i++) {
    const row = parseCsvLine(allLines[i]);
    const extracted = colIndices.map((idx) => (row[idx] !== undefined ? row[idx].trim() : ''));

    // Keep row only if all 4 cells have a non-empty value
    const isComplete = extracted.every((cell) => cell !== '' && cell.toLowerCase() !== 'nan');

    if (isComplete) {
      outputLines.push(extracted.map(escapeCsvCell).join(','));
    } else {
      droppedRows++;
    }
  }

  const masterPath = path.join(DATA_DIR, 'master.csv');
  fs.writeFileSync(masterPath, outputLines.join('\n') + '\n', 'utf-8');

  console.log(
    `[build-master] Generated public/data/master.csv (${outputLines.length - 1} clean rows, ${droppedRows} incomplete rows dropped).`
  );
}

buildMasterCsv();