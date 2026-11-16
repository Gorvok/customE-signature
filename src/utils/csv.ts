/**
 * A CSV reader, to the rules RFC 4180 actually states.
 *
 * Rosters come out of a spreadsheet, so they carry the things spreadsheets
 * emit: a UTF-8 BOM from Excel, CRLF line endings, quoted fields holding
 * commas, newlines inside a quoted field (an address), and doubled quotes
 * standing for one. A `split(',')` gets all of those wrong, and the failure is
 * silent — a mangled name in someone's signature — so this is a real parser.
 */

/** Characters a spreadsheet may use to separate fields. */
export type Delimiter = ',' | ';' | '\t';

const BOM = '﻿';

/**
 * Guess the delimiter from the first line. A semicolon is what a spreadsheet
 * in a comma-decimal locale writes, and a tab is what copying out of one
 * gives. Ties go to the comma.
 */
export function detectDelimiter(text: string): Delimiter {
  const firstLine = text.replace(BOM, '').split(/\r?\n/, 1)[0] ?? '';
  // Only count separators outside quotes: "Doe, Jane";x has one real one.
  let inQuotes = false;
  const counts: Record<Delimiter, number> = { ',': 0, ';': 0, '\t': 0 };
  for (const char of firstLine) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === ',' || char === ';' || char === '\t')) counts[char]++;
  }
  if (counts[';'] > counts[','] && counts[';'] >= counts['\t']) return ';';
  if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) return '\t';
  return ',';
}

/**
 * Split CSV text into rows of fields. Never throws: unbalanced quotes are
 * read to the end of the text rather than rejected, because half a roster is
 * more useful than an error, and the caller shows what was understood.
 *
 * Blank lines are dropped, and so is a line of nothing but empty fields: a
 * spreadsheet pads its export with those, and they are not people.
 */
export function parseCsv(text: string, delimiter: Delimiter = detectDelimiter(text)): string[][] {
  const source = text.startsWith(BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldWasQuoted = false;

  const endField = () => {
    // An unquoted field is trimmed: spreadsheets pad after a separator, and a
    // quoted field is taken verbatim because the quotes are the author saying
    // where it starts and ends.
    row.push(fieldWasQuoted ? field : field.trim());
    field = '';
    fieldWasQuoted = false;
  };
  const endRow = () => {
    endField();
    if (row.some((value) => value !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;

    if (inQuotes) {
      if (char !== '"') {
        field += char;
      } else if (source[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = false;
      }
      continue;
    }

    if (char === '"' && field.trim() === '') {
      // A quote only opens a field at its start; one in the middle is data.
      field = '';
      inQuotes = true;
      fieldWasQuoted = true;
    } else if (char === delimiter) {
      endField();
    } else if (char === '\n') {
      endRow();
    } else if (char === '\r') {
      // CRLF: the \n that follows ends the row.
      if (source[i + 1] !== '\n') endRow();
    } else {
      field += char;
    }
  }

  // Whatever is left is the last row, unless the text ended on a newline.
  if (field !== '' || row.length) endRow();
  return rows;
}

export interface CsvTable {
  /** Header names, lower-cased and trimmed, in the order they appeared. */
  headers: string[];
  /** One record per row, keyed by header. Short rows give '' for the rest. */
  records: Record<string, string>[];
}

/**
 * Read CSV text as records keyed by its header row. A column with no name is
 * dropped, and a repeated name keeps the first column, so a stray trailing
 * separator cannot overwrite a real field.
 */
export function parseCsvTable(text: string, delimiter?: Delimiter): CsvTable {
  const rows = parseCsv(text, delimiter ?? detectDelimiter(text));
  const headerRow = rows[0];
  if (!headerRow) return { headers: [], records: [] };

  const headers: string[] = [];
  const seen = new Set<string>();
  const columns: { index: number; name: string }[] = [];
  headerRow.forEach((raw, index) => {
    const name = raw.trim().toLowerCase();
    if (!name || seen.has(name)) return;
    seen.add(name);
    headers.push(name);
    columns.push({ index, name });
  });

  const records = rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    for (const { index, name } of columns) record[name] = (row[index] ?? '').trim();
    return record;
  });

  return { headers, records };
}

/** Quote a value for CSV output, if it needs it. */
export function csvEscape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Build CSV text (CRLF-terminated, as RFC 4180 specifies) from rows. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n') + '\r\n';
}
