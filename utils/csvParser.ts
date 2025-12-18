import { ChartData, DataPoint } from '../types';

export const parseCSV = (csv: string): ChartData => {
  const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { title1: 'Metric 1', title2: 'Metric 2', data: [] };
  }

  // Basic Heuristic: 
  // 1. Look for a line with at least 3 parts as the header.
  // 2. If valid numbers are found in subsequent lines, use them.
  
  let headerIndex = 0;
  // Try to find a header row that has text (not numbers)
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
     const parts = lines[i].split(',');
     // If the second or third column is NOT a number, it's likely a header
     const secondCol = parts[1]?.trim().replace('%','');
     if (parts.length >= 3 && isNaN(parseFloat(secondCol))) {
       headerIndex = i;
       break;
     }
  }

  const headerRow = lines[headerIndex].split(',').map(c => c.trim());
  const title1 = headerRow[1] || 'Metric 1';
  const title2 = headerRow[2] || 'Metric 2';

  const data: DataPoint[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    // Clean up
    const cleanRow = row.map(c => c.trim());
    
    // Strategy: Find the category (first non-empty string that isn't the number value roughly)
    // Or just strictly follow column 0, 1, 2 logic if generic.
    
    // Let's try strict column mapping first, falling back to "find non-empty".
    // Many CSVs pasted might have leading commas if copied from the previous specific format.
    
    let category = cleanRow[0];
    let val1Str = cleanRow[1];
    let val2Str = cleanRow[2];

    // Handle the specific "leading comma" format from the old default
    if (cleanRow[0] === '' && cleanRow.length > 3) {
      category = cleanRow[1];
      val1Str = cleanRow[2];
      val2Str = cleanRow[3];
    }

    if (!category) continue;

    const val1 = parseFloat(val1Str?.replace('%', '') || '0');
    const val2 = parseFloat(val2Str?.replace('%', '') || '0');

    if (!isNaN(val1) && !isNaN(val2)) {
      data.push({
        category: category,
        metric1: val1,
        metric2: val2
      });
    }
  }

  return {
    title1,
    title2,
    data
  };
};