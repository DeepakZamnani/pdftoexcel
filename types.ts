
export interface ExtractedTable {
  tableName: string;
  headers: string[];
  rows: string[][];
}

export interface ExtractedField {
  label: string;
  value: string;
}

export interface PageResult {
  pageNumber: number;
  fields: ExtractedField[];
  tables: ExtractedTable[];
}

export interface ExtractionResult {
  pages: PageResult[];
}

export interface AppState {
  file: File | null;
  filePreview: string | null;
  isReading: boolean;
  isProcessing: boolean;
  result: ExtractionResult | null;
  error: string | null;
}
