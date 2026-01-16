
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
  file: null | File;
  filePreview: null | string;
  isReading: boolean;
  isProcessing: boolean;
  result: null | ExtractionResult;
  error: null | string;
  showPasswordDialog: boolean;
  password: string;
}


