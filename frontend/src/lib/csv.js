/** Escapes a value for CSV and neutralises spreadsheet formula injection. */
function cell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text)))
    text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns, rows) {
  const header = columns.map((c) => cell(c.header)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => cell(c.value(row))).join(',')
  );
  return [header, ...body].join('\r\n');
}

export function downloadFile(
  filename,
  content,
  type = 'text/csv;charset=utf-8'
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: filename,
  });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
