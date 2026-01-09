
// import * as XLSX from 'xlsx';
// import { ExtractionResult } from '../types';

// export function exportToExcel(data: ExtractionResult, fileName: string = 'extracted_invoice_data.xlsx') {
//   const wb = XLSX.utils.book_new();

//   // Combined Fields Sheet
//   const allFields: any[] = [];
//   data.pages.forEach(page => {
//     page.fields.forEach(f => {
//       allFields.push({
//         Page: page.pageNumber,
//         Label: f.label,
//         Value: f.value
//       });
//     });
//   });

//   if (allFields.length > 0) {
//     const wsFields = XLSX.utils.json_to_sheet(allFields);
//     XLSX.utils.book_append_sheet(wb, wsFields, "Summary All Pages");
//   }

//   // Individual Table Sheets
//   data.pages.forEach(page => {
//     page.tables.forEach((table, tIdx) => {
//       // Create a unique sheet name: P{Num} - {Name}
//       let sheetName = `P${page.pageNumber}-${table.tableName || 'Table'}`.substring(0, 31);
      
//       // Handle potential duplicate names across tables on same page
//       let counter = 1;
//       while (wb.SheetNames.includes(sheetName)) {
//         sheetName = `P${page.pageNumber}-${table.tableName || 'Table'}`.substring(0, 28) + ` (${counter++})`;
//       }

//       const fullData = [table.headers, ...table.rows];
//       const wsTable = XLSX.utils.aoa_to_sheet(fullData);
//       XLSX.utils.book_append_sheet(wb, wsTable, sheetName);
//     });
//   });

//   if (wb.SheetNames.length === 0) {
//     const ws = XLSX.utils.aoa_to_sheet([["No data found"]]);
//     XLSX.utils.book_append_sheet(wb, ws, "Empty");
//   }

//   XLSX.writeFile(wb, fileName);
// }
import * as XLSX from 'xlsx';
import { ExtractionResult } from '../types';

export function exportToExcel(data: ExtractionResult, fileName: string = 'extracted_invoice_data.xlsx') {
  const wb = XLSX.utils.book_new();

  wb.Props = {
    Title: "Invoice Data Extraction",
    Author: "Invoice Extractor",
    CreatedDate: new Date()
  };

  createSummarySheet(wb, data);
  createTableSheets(wb, data);

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["No data found in document"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Info");
  }

  XLSX.writeFile(wb, fileName, { 
    bookType: 'xlsx',
    compression: true,
    type: 'buffer',
    cellStyles: true
  });
}

// ========== SUMMARY SHEET ==========
function createSummarySheet(wb: XLSX.WorkBook, data: ExtractionResult): void {
  const summaryData: any[][] = [
    ['Page', 'Field Name', 'Value']
  ];

  data.pages.forEach(page => {
    page.fields.forEach(field => {
      summaryData.push([
        page.pageNumber,
        sanitizeText(field.label),
        formatValuePreserveDecimals(sanitizeText(field.value))  // ✅ FIXED
      ]);
    });
  });

  if (summaryData.length > 1) {
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws['!cols'] = calculateColumnWidths(summaryData, {
      minWidths: [8, 25, 40],
      maxWidths: [10, 60, 80]
    });
    applyProfessionalStyling(ws, summaryData);
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
  }
}

// ========== TABLE SHEETS ==========
function createTableSheets(wb: XLSX.WorkBook, data: ExtractionResult): void {
  const seenNames = new Set<string>();
  
  data.pages.forEach(page => {
    page.tables.forEach((table, idx) => {
      const tableData: any[][] = [];
      
      const headers = table.headers.map(h => sanitizeText(h));
      tableData.push(headers);
      
      table.rows.forEach(row => {
        const formattedRow = row.map(cell => 
          formatValuePreserveDecimals(sanitizeText(cell))  // ✅ FIXED
        );
        tableData.push(formattedRow);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(tableData);
      ws['!cols'] = calculateColumnWidths(tableData);
      applyProfessionalStyling(ws, tableData);
      
      const tableName = sanitizeText(table.tableName || `Table ${idx + 1}`);
      const sheetName = getUniqueSheetName(
        `P${page.pageNumber}_${tableName}`,
        seenNames
      );
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
  });
}

// ========== COLUMN WIDTH CALCULATION ==========
interface ColumnWidthOptions {
  minWidths?: number[];
  maxWidths?: number[];
  defaultMin?: number;
  defaultMax?: number;
}

function calculateColumnWidths(
  data: any[][], 
  options: ColumnWidthOptions = {}
): any[] {
  const {
    minWidths = [],
    maxWidths = [],
    defaultMin = 12,
    defaultMax = 100
  } = options;

  const numCols = data[0]?.length || 0;
  const colWidths: number[] = new Array(numCols).fill(0);

  data.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      const cellStr = String(cell || '');
      const lines = cellStr.split('\n');
      const maxLineLength = Math.max(...lines.map(line => line.length));
      const padding = rowIdx === 0 ? 6 : 3;
      const cellWidth = maxLineLength + padding;
      colWidths[colIdx] = Math.max(colWidths[colIdx], cellWidth);
    });
  });

  return colWidths.map((width, idx) => {
    const minWidth = minWidths[idx] || defaultMin;
    const maxWidth = maxWidths[idx] || defaultMax;
    const finalWidth = Math.max(minWidth, Math.min(width, maxWidth));
    return { wch: finalWidth };
  });
}

// ========== PROFESSIONAL STYLING ==========
function applyProfessionalStyling(ws: XLSX.WorkSheet, data: any[][]): void {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      
      if (!ws[cellAddress]) continue;
      
      const cellValue = data[R]?.[C];
      
      // Header row
      if (R === 0) {
        ws[cellAddress].s = {
          font: { 
            bold: true, 
            color: { rgb: "FFFFFF" },
            sz: 11,
            name: 'Calibri'
          },
          fill: { 
            fgColor: { rgb: "4472C4" }
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center',
            wrapText: true
          },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      }
      // Data rows
      else {
        const isEvenRow = R % 2 === 0;
        
        ws[cellAddress].s = {
          font: { 
            sz: 10,
            name: 'Calibri'
          },
          fill: { 
            fgColor: { rgb: isEvenRow ? "FFFFFF" : "F2F2F2" }
          },
          alignment: { 
            horizontal: typeof cellValue === 'number' ? 'right' : 'left',
            vertical: 'top',
            wrapText: true
          },
          border: {
            top: { style: 'thin', color: { rgb: "D3D3D3" } },
            bottom: { style: 'thin', color: { rgb: "D3D3D3" } },
            left: { style: 'thin', color: { rgb: "D3D3D3" } },
            right: { style: 'thin', color: { rgb: "D3D3D3" } }
          }
        };
        
        // ✅ FIXED: Preserve exact decimal precision
        if (typeof cellValue === 'number') {
          ws[cellAddress].t = 'n';
          ws[cellAddress].v = cellValue;  // Keep the exact number value
          
          // Detect decimal places from the original data
          const decimalPlaces = countDecimalPlaces(cellValue);
          
          if (decimalPlaces > 0) {
            // Show exact decimal places (up to 10 decimals)
            ws[cellAddress].z = `#,##0.${'0'.repeat(Math.min(decimalPlaces, 10))}`;
          } else {
            // Integer
            ws[cellAddress].z = '#,##0';
          }
        }
      }
    }
  }
  
  // Set row heights
  if (!ws['!rows']) ws['!rows'] = [];
  for (let R = 0; R <= range.e.r; R++) {
    ws['!rows'][R] = { 
      hpt: R === 0 ? 25 : 18,
      hpx: R === 0 ? 25 : 18 
    };
  }
  
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };
}

// ========== VALUE FORMATTING (PRESERVING DECIMALS) ==========
/**
 * ✅ FIXED: Format values while preserving exact decimal precision
 */
function formatValuePreserveDecimals(value: string): string | number {
  if (!value || value === '') return '';
  
  // Don't convert dates, IDs, or other non-numeric text
  if (isDate(value) || isID(value)) {
    return value;
  }
  
  // Try to parse as number
  const cleanNum = value.replace(/[$€£¥₹,\s]/g, '');
  
  // Check if it's a valid number
  if (/^-?\d+\.?\d*$/.test(cleanNum)) {
    const num = parseFloat(cleanNum);
    
    if (!isNaN(num)) {
      // Return the number with full precision
      return num;
    }
  }
  
  return value;
}

/**
 * Count decimal places in a number
 */
function countDecimalPlaces(num: number): number {
  if (Math.floor(num) === num) return 0;
  
  const str = num.toString();
  if (!str.includes('.')) return 0;
  
  const decimalPart = str.split('.')[1];
  return decimalPart ? decimalPart.length : 0;
}

/**
 * Check if value looks like a date
 */
function isDate(value: string): boolean {
  return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(value);
}

/**
 * Check if value looks like an ID (alphanumeric)
 */
function isID(value: string): boolean {
  return /^[A-Z0-9\-]+$/i.test(value) && /[A-Z]/i.test(value);
}

// ========== TEXT SANITIZATION ==========
function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\uFFFD]/g, '')
    .replace(/[^\x20-\x7E\u00A0-\u024F\u0370-\u03FF\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u4E00-\u9FFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '');
}

// ========== SHEET NAME MANAGEMENT ==========
function getUniqueSheetName(baseName: string, existing: Set<string>): string {
  let clean = baseName
    .replace(/[:\\/\?\*\[\]]/g, '_')
    .substring(0, 31);
  
  if (!existing.has(clean)) {
    existing.add(clean);
    return clean;
  }
  
  let counter = 1;
  let unique = clean;
  while (existing.has(unique)) {
    const suffix = `_${counter++}`;
    unique = clean.substring(0, 31 - suffix.length) + suffix;
  }
  
  existing.add(unique);
  return unique;
}
