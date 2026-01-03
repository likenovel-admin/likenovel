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
  sheetKey: string;
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

    headers.forEach((header, index) => {
      const cellAddress = { r: 0, c: index };
      const cell = { v: header, t: "s" };
      ws[XLSX.utils.encode_cell(cellAddress)] = cell;
    });

    const rowCount = data.length + 1;
    const colCount = headers.length;
    const lastColumn = XLSX.utils.encode_col(colCount - 1);
    ws["!ref"] = `A1:${lastColumn}${rowCount}`;

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
    const list: any = res;

    const wb = XLSX.utils.book_new();

    for (const sheet of sheets) {
      const { sheetName, sheetKey, headers, fields, transformItem } = sheet;

      const data = ((list?.[sheetKey] || []) as any[]).map((item) => {
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
