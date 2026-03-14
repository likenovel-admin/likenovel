"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export interface Column {
  header: string;
  key: string;
  render?: (value: any, row: any, index?: number) => React.ReactNode; // Optional custom render
}

interface CommonTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  rowClick?: (title?: string) => void;
}

export default function CommonTable({
  columns,
  data,
  loading = false,
  emptyMessage = "No data",
  rowClick,
}: CommonTableProps) {
  if (loading) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {!data || data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
                {emptyMessage}
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, rowIndex) => (
            <TableRow key={rowIndex} className={rowClick ? "cursor-pointer" : ""} onClick={() => rowClick && rowClick(row.id)}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.render
                    ? col.render(row[col.key], row, rowIndex)
                    : row[col.key] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export interface HeaderCell {
  header: string;
  key?: string;
  colspan?: number;
  rowspan?: number;
}

interface CommonTable2HeaderProps {
  headerRows: HeaderCell[][];
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}

export function CommonTable2Header({
  headerRows,
  columns,
  data,
  loading = false,
  emptyMessage = "No data",
}: CommonTable2HeaderProps) {
  if (loading) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        {headerRows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <TableHead
                key={cellIndex}
                colSpan={cell.colspan || undefined}
                rowSpan={cell.rowspan || undefined}
              >
                {cell.header}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {!data || data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
                {emptyMessage}
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.render
                    ? col.render(row[col.key], row, rowIndex)
                    : row[col.key] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
