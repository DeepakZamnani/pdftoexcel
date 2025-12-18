
import * as XLSX from 'xlsx';
import { ExtractionResult } from '../types';

export function exportToExcel(data: ExtractionResult, fileName: string = 'extracted_invoice_data.xlsx') {
  const wb = XLSX.utils.book_new();

  // Combined Fields Sheet
  const allFields: any[] = [];
  data.pages.forEach(page => {
    page.fields.forEach(f => {
      allFields.push({
        Page: page.pageNumber,
        Label: f.label,
        Value: f.value
      });
    });
  });

  if (allFields.length > 0) {
    const wsFields = XLSX.utils.json_to_sheet(allFields);
    XLSX.utils.book_append_sheet(wb, wsFields, "Summary All Pages");
  }

  // Individual Table Sheets
  data.pages.forEach(page => {
    page.tables.forEach((table, tIdx) => {
      // Create a unique sheet name: P{Num} - {Name}
      let sheetName = `P${page.pageNumber}-${table.tableName || 'Table'}`.substring(0, 31);
      
      // Handle potential duplicate names across tables on same page
      let counter = 1;
      while (wb.SheetNames.includes(sheetName)) {
        sheetName = `P${page.pageNumber}-${table.tableName || 'Table'}`.substring(0, 28) + ` (${counter++})`;
      }

      const fullData = [table.headers, ...table.rows];
      const wsTable = XLSX.utils.aoa_to_sheet(fullData);
      XLSX.utils.book_append_sheet(wb, wsTable, sheetName);
    });
  });

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["No data found"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Empty");
  }

  XLSX.writeFile(wb, fileName);
}
