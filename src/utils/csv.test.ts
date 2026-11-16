import { describe, expect, it } from 'vitest';
import { csvEscape, detectDelimiter, parseCsv, parseCsvTable, toCsv } from './csv';

describe('parseCsv', () => {
  it('reads plain rows', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps a comma inside a quoted field', () => {
    expect(parseCsv('name,title\n"Doe, Jane",Designer')).toEqual([
      ['name', 'title'],
      ['Doe, Jane', 'Designer'],
    ]);
  });

  it('reads a doubled quote as one quote', () => {
    expect(parseCsv('a\n"She said ""hi"""')).toEqual([['a'], ['She said "hi"']]);
  });

  it('keeps a newline inside a quoted field', () => {
    // An address pasted out of a spreadsheet arrives like this.
    expect(parseCsv('name,address\nJane,"1 Main St\nLondon"')).toEqual([
      ['name', 'address'],
      ['Jane', '1 Main St\nLondon'],
    ]);
  });

  it('handles CRLF line endings without leaving a stray return', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles a lone CR, which older Mac exports still use', () => {
    expect(parseCsv('a,b\r1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('strips the byte-order mark Excel writes', () => {
    expect(parseCsv('﻿name,email\nJane,j@x.com')[0]).toEqual(['name', 'email']);
  });

  it('trims an unquoted field but takes a quoted one verbatim', () => {
    expect(parseCsv('a, b ,"  c  "')).toEqual([['a', 'b', '  c  ']]);
  });

  it('drops blank lines and the empty rows a spreadsheet pads with', () => {
    expect(parseCsv('a,b\n\n1,2\n\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parseCsv('a,b\n1,2\n,')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('treats a quote in the middle of a field as data', () => {
    expect(parseCsv('a\n5" pipe')).toEqual([['a'], ['5" pipe']]);
  });

  it('reads an unterminated quoted field to the end rather than failing', () => {
    // Half a roster beats an error message; the UI reports what it understood.
    expect(parseCsv('name\n"Jane')).toEqual([['name'], ['Jane']]);
  });

  it('is empty for empty input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('\n\n')).toEqual([]);
  });

  it('takes a delimiter when told to', () => {
    expect(parseCsv('a;b\n1;2', ';')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('detectDelimiter', () => {
  it('finds the separator a spreadsheet used', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
  });

  it('ignores separators inside quotes', () => {
    expect(detectDelimiter('"Doe, Jane";"Smith, Sam"')).toBe(';');
  });

  it('falls back to a comma when there is nothing to go on', () => {
    expect(detectDelimiter('name')).toBe(',');
    expect(detectDelimiter('')).toBe(',');
  });

  it('is applied by parseCsv without being asked', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('parseCsvTable', () => {
  it('keys each row by its header, lower-cased', () => {
    expect(parseCsvTable('Name,Email\nJane,j@x.com')).toEqual({
      headers: ['name', 'email'],
      records: [{ name: 'Jane', email: 'j@x.com' }],
    });
  });

  it('fills a short row with empty values rather than leaving holes', () => {
    expect(parseCsvTable('name,email,title\nJane,j@x.com').records[0]).toEqual({
      name: 'Jane',
      email: 'j@x.com',
      title: '',
    });
  });

  it('drops an unnamed column, so a trailing separator cannot create one', () => {
    expect(parseCsvTable('name,,email\nJane,x,j@x.com').headers).toEqual(['name', 'email']);
  });

  it('keeps the first of two columns with the same name', () => {
    const table = parseCsvTable('name,name\nJane,Imposter');
    expect(table.headers).toEqual(['name']);
    expect(table.records[0]).toEqual({ name: 'Jane' });
  });

  it('is empty when there is no header row', () => {
    expect(parseCsvTable('')).toEqual({ headers: [], records: [] });
  });
});

describe('csvEscape and toCsv', () => {
  it('quotes only what needs quoting', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('Doe, Jane')).toBe('"Doe, Jane"');
    expect(csvEscape('She said "hi"')).toBe('"She said ""hi"""');
    expect(csvEscape('two\nlines')).toBe('"two\nlines"');
  });

  it('writes rows RFC 4180 can read back', () => {
    const rows = [
      ['name', 'note'],
      ['Doe, Jane', 'She said "hi"'],
    ];
    expect(toCsv(rows)).toBe('name,note\r\n"Doe, Jane","She said ""hi"""\r\n');
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
