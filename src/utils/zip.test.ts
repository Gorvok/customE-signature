import { describe, expect, it } from 'vitest';
import { createZip, crc32, type ZipEntry } from './zip';

/**
 * Read an archive back through its central directory, the way a real
 * extractor does: find the end record, walk the directory, and take each
 * entry's bytes from the offset it points at. Nothing here shares code with
 * the writer, so a mistake in one is not blessed by the other.
 */
async function readZip(blob: Blob): Promise<{ name: string; content: string; crcOk: boolean }[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const decoder = new TextDecoder();

  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error('no end-of-central-directory record');

  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const entries: { name: string; content: string; crcOk: boolean }[] = [];

  for (let i = 0; i < count; i++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('bad central directory header');
    const crc = view.getUint32(cursor + 16, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));

    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('bad local header');
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const content = bytes.subarray(start, start + size);

    entries.push({ name, content: decoder.decode(content), crcOk: crc32(content) === crc });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const fixed = new Date('2026-03-04T05:06:08Z');
const sample: ZipEntry[] = [
  { name: 'README.txt', content: 'hello' },
  { name: 'signatures/jane-doe.html', content: '<table><tr><td>Jane</td></tr></table>' },
];

describe('crc32', () => {
  it('matches the known check value for "123456789"', () => {
    // The CRC-32 check value every implementation is tested against.
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('is zero for no bytes', () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe('createZip', () => {
  it('writes an archive that reads back entry for entry', async () => {
    const entries = await readZip(createZip(sample, fixed));
    expect(entries.map((entry) => entry.name)).toEqual(['README.txt', 'signatures/jane-doe.html']);
    expect(entries[0]!.content).toBe('hello');
    expect(entries[1]!.content).toBe('<table><tr><td>Jane</td></tr></table>');
  });

  it('records a CRC that matches the content of every entry', async () => {
    for (const entry of await readZip(createZip(sample, fixed))) {
      expect(entry.crcOk, entry.name).toBe(true);
    }
  });

  it('starts with the local file header signature', async () => {
    const bytes = new Uint8Array(await createZip(sample, fixed).arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it('stores rather than compresses, so the content is readable in the bytes', async () => {
    const text = await createZip(sample, fixed).text();
    expect(text).toContain('<td>Jane</td>');
  });

  it('keeps names and content that are not ASCII', async () => {
    const entries = await readZip(
      createZip([{ name: 'signatures/ليلى-منصور.html', content: 'ليلى منصور — مديرة' }], fixed),
    );
    expect(entries[0]!.name).toBe('signatures/ليلى-منصور.html');
    expect(entries[0]!.content).toBe('ليلى منصور — مديرة');
    expect(entries[0]!.crcOk).toBe(true);
  });

  it('flags its names as UTF-8, without which they arrive as mojibake', async () => {
    const bytes = new Uint8Array(await createZip(sample, fixed).arrayBuffer());
    const flags = new DataView(bytes.buffer).getUint16(6, true);
    expect(flags & 0x0800).toBe(0x0800);
  });

  it('writes a valid archive for no entries at all', async () => {
    const blob = createZip([], fixed);
    expect(await readZip(blob)).toEqual([]);
    expect(blob.size).toBe(22); // just the end-of-central-directory record
  });

  it('is reproducible for the same entries and timestamp', async () => {
    const first = await createZip(sample, fixed).text();
    const second = await createZip(sample, fixed).text();
    expect(first).toBe(second);
  });

  it('clamps a timestamp older than the format can express', async () => {
    // MS-DOS dates start at 1980; a wrapped year would be worse than a clamp.
    const bytes = new Uint8Array(await createZip(sample, new Date('1970-01-01T00:00:00Z')).arrayBuffer());
    const dosDate = new DataView(bytes.buffer).getUint16(12, true);
    expect(dosDate >> 9).toBe(0); // 1980
  });

  it('declares the archive as a zip, so the browser names the download right', () => {
    expect(createZip(sample, fixed).type).toBe('application/zip');
  });
});
