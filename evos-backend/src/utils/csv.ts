type CsvValue = string | number | null | undefined;

interface CsvColumn<T> {
  key: keyof T;
  header: string;
}

const escapeCsvField = (value: CsvValue): string => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export function toCsv<T extends Record<string, CsvValue>>(
  rows: T[],
  columns: CsvColumn<T>[]
): string {
  const headerRow = columns.map((col) => escapeCsvField(col.header)).join(',');
  const dataRows = rows.map((row) => columns.map((col) => escapeCsvField(row[col.key])).join(','));
  return [headerRow, ...dataRows].join('\r\n');
}
