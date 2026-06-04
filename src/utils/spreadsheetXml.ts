export type ExcelCell = string | number | null | undefined;

export type ExcelSheet = {
  name: string;
  rows: ExcelCell[][];
};

export const xmlEscape = (value: ExcelCell) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildExcelWorksheet = (sheet: ExcelSheet) => {
  const rows = sheet.rows.map(row => {
    const cells = row.map(cell => {
      const isNumber = typeof cell === 'number' && Number.isFinite(cell);
      const type = isNumber ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${xmlEscape(cell)}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  return `<Worksheet ss:Name="${xmlEscape(sheet.name).slice(0, 31)}"><Table>${rows}</Table></Worksheet>`;
};

export const buildExcelWorkbook = (sheets: ExcelSheet[]) => `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.map(buildExcelWorksheet).join('')}
</Workbook>`;

export const downloadExcelWorkbook = (filename: string, sheets: ExcelSheet[]) => {
  const workbook = buildExcelWorkbook(sheets);
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
