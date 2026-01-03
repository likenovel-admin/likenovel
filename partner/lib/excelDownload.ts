import * as XLSX from "xlsx";
import { format } from "date-fns";

export interface DownloadExcelOptions<T> {
  apiFn: (params: any) => Promise<any>;
  params?: any;
  headers: string[];
  fields: (keyof T | ((item: T) => any))[];
  filename: string;
  transformItem?: (item: T) => T;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: any) => void;
}

export interface DownloadExcel2Sheet<T> {
  sheetName: string;
  headers: string[];
  fields: (keyof T | ((item: T) => any))[];
  transformItem?: (item: T) => T;
}

export interface DownloadExcel2SheetOptions<T> {
  apiFn: (params: any) => Promise<any>;
  params?: any;
  filename: string;
  sheets: DownloadExcel2Sheet<any>[];
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: any) => void;
}

export async function downloadExcel<T = any>(options: DownloadExcelOptions<T>) {
  const {
    apiFn,
    params,
    headers,
    fields,
    filename,
    transformItem,
    onStart,
    onFinish,
    onError,
  } = options;

  try {
    onStart?.();

    const res = await apiFn(params);
    const list: T[] = Array.isArray(res) ? res : res?.results || [];

    // Check if there's no data
    if (!list || list.length === 0) {
      onFinish?.();
      throw new Error("다운로드할 데이터가 없습니다.");
    }

    const data = list.map((item) => {
      const processed = transformItem ? transformItem(item) : item;

      const row: Record<string, any> = {};

      fields.forEach((field, index) => {
        const key = headers?.[index] ?? `col${index + 1}`;
        row[key] =
          typeof field === "function" ? field(processed) : processed[field];
      });

      return row;
    });

    let ws;
    if (headers.length > 0) {
      ws = XLSX.utils.json_to_sheet(data, { header: headers });
    } else {
      ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename);
    XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyMMdd")}.xlsx`);

    onFinish?.();
  } catch (error) {
    onError?.(error);
    onFinish?.();
  }
}

export async function downloadExcel2Sheet<T = any>(
  options: DownloadExcel2SheetOptions<T>
) {
  const { apiFn, params, filename, sheets, onStart, onFinish, onError } =
    options;

  try {
    onStart?.();

    const res = await apiFn(params);
    const list: T[] = Array.isArray(res) ? res : res?.results || [];

    // Check if there's no data
    if (!list || list.length === 0) {
      onFinish?.();
      throw new Error("다운로드할 데이터가 없습니다.");
    }

    const wb = XLSX.utils.book_new();

    for (const sheet of sheets) {
      const { sheetName, headers, fields, transformItem } = sheet;

      const data = list.map((item) => {
        const processed = transformItem ? transformItem(item) : item;

        const row: Record<string, any> = {};
        fields.forEach((field, index) => {
          const key = headers[index];
          if (typeof field === "function") {
            row[key] = field(processed);
          } else {
            row[key] = processed[field];
          }
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);

      // Set custom header names
      headers.forEach((header, index) => {
        const cellAddress = { r: 0, c: index };
        const cell = { v: header, t: "s" };
        ws[XLSX.utils.encode_cell(cellAddress)] = cell;
      });

      // Fix sheet range
      const rowCount = data.length + 1;
      const colCount = headers.length;
      const lastColumn = XLSX.utils.encode_col(colCount - 1);
      ws["!ref"] = `A1:${lastColumn}${rowCount}`;

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyMMdd")}.xlsx`);
    onFinish?.();
  } catch (error) {
    onError?.(error);
    onFinish?.();
  }
}

interface DownloadExcelWith2HeaderOptions<T> {
  apiFn: (params: any) => Promise<any>;
  params?: any;
  headers: string[][];
  fields: (keyof T | ((item: T) => any))[];
  filename: string;
  transformItem?: (item: T) => T;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: any) => void;
  rowSpanCols?: number; // Number of columns that have rowspan
  colSpanGroups?: number; // Number of groups that have colspan
}

export async function downloadExcelWith2Header<T = any>(
  options: DownloadExcelWith2HeaderOptions<T>
) {
  const {
    apiFn,
    params,
    headers,
    fields,
    filename,
    transformItem,
    onStart,
    onFinish,
    onError,
    rowSpanCols = 9,
    colSpanGroups = 7,
  } = options;

  try {
    onStart?.();

    const res = await apiFn(params);
    const list: T[] = Array.isArray(res) ? res : res?.results || [];

    // Check if there's no data
    if (!list || list.length === 0) {
      onFinish?.();
      throw new Error("다운로드할 데이터가 없습니다.");
    }

    // 1. make data
    const bodyRows: any[][] = list.map((item) => {
      const processed = transformItem ? transformItem(item) : item;
      return fields.map((field) =>
        typeof field === "function" ? field(processed) : processed[field]
      );
    });

    // 2. combine header and body
    const allRows = [...headers, ...bodyRows];

    // 3. Create worksheet from AOA
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // 4. Setup merge for header
    const merges: XLSX.Range[] = [];

    // a. rowspan for 9 first columns
    for (let c = 0; c < rowSpanCols; c++) {
      merges.push({
        s: { r: 0, c },
        e: { r: 1, c },
      });
    }

    // b. colspan for 7 last colums
    for (let g = 0; g < colSpanGroups; g++) {
      const startCol = rowSpanCols + g * 2;
      merges.push({
        s: { r: 0, c: startCol },
        e: { r: 0, c: startCol + 1 },
      });
    }

    ws["!merges"] = merges;

    // 5. Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename);
    XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyMMdd")}.xlsx`);

    onFinish?.();
  } catch (error) {
    onError?.(error);
    onFinish?.();
  }
}
