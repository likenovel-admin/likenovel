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
}

export default function CommonTable({
  columns,
  data,
  loading = false,
  emptyMessage = "No data",
}: CommonTableProps) {
  if (loading) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
        {emptyMessage}
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
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                {col.render
                  ? col.render(row[col.key], row, rowIndex)
                  : (row[col.key] ?? "-")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
