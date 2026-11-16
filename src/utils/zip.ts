/**
 * A ZIP writer, storing entries uncompressed.
 *
 * Team export hands back one file per person, which has to arrive as a single
 * download. A library would do it, but this app ships three runtime
 * dependencies on purpose, and the archive it needs is the simple case: a
 * handful of small text files, no compression, no encryption, no spanning.
 * That is about a hundred lines of the format, written here, rather than a
 * dependency and its transitive tree in the bundle.
 *
 * Storing rather than deflating costs size on an archive nobody keeps, and
 * buys a property the tests use: the file content appears verbatim in the
 * bytes, so a test (and a person with an editor) can confirm what is inside.
 *
 * Format: PKWARE APPNOTE 6.3.3, sections 4.3.7 (local header), 4.3.12
 * (central directory) and 4.3.16 (end of central directory).
 */

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;

/** Store (no compression). */
const METHOD_STORE = 0;
/** 2.0: the floor for a ZIP a modern tool will open without complaint. */
const VERSION = 20;
/** Bit 11: names and comments are UTF-8. Without it, a non-ASCII name is mojibake. */
const FLAG_UTF8 = 0x0800;

export interface ZipEntry {
  /** Path inside the archive. Forward slashes, no leading slash. */
  name: string;
  content: string;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) {
      // The reversed CRC-32 polynomial, as ZIP (and PNG, and gzip) use it.
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

/** CRC-32 of `bytes`, which every ZIP entry carries twice. */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * MS-DOS time and date, which is what ZIP records. Seconds have two-second
 * resolution and the year counts from 1980; a date before that cannot be
 * represented, so it is clamped rather than wrapped into a wrong year.
 */
function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/** A fixed-size record, written little-endian as the format requires. */
class Record {
  private readonly view: DataView;
  private offset = 0;
  // Backed by an ArrayBuffer rather than the generic ArrayBufferLike, since
  // that is what a Blob accepts.
  readonly bytes: Uint8Array<ArrayBuffer>;

  constructor(size: number) {
    const buffer = new ArrayBuffer(size);
    this.bytes = new Uint8Array(buffer);
    this.view = new DataView(buffer);
  }

  u16(value: number): this {
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
    return this;
  }

  u32(value: number): this {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
    return this;
  }
}

/**
 * Build a ZIP archive holding `entries`, stored uncompressed.
 *
 * `date` is the modification time written into every entry; it defaults to
 * now and is passed explicitly by tests so the bytes are reproducible.
 */
export function createZip(entries: ZipEntry[], date = new Date()): Blob {
  const encoder = new TextEncoder();
  const { time, date: dosDate } = dosDateTime(date);
  const parts: Uint8Array<ArrayBuffer>[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const content = encoder.encode(entry.content);
    const crc = crc32(content);

    const local = new Record(30)
      .u32(LOCAL_HEADER_SIGNATURE)
      .u16(VERSION)
      .u16(FLAG_UTF8)
      .u16(METHOD_STORE)
      .u16(time)
      .u16(dosDate)
      .u32(crc)
      .u32(content.length) // compressed size: the same, since it is stored
      .u32(content.length)
      .u16(name.length)
      .u16(0); // no extra field
    parts.push(local.bytes, name, content);

    central.push(
      new Record(46)
        .u32(CENTRAL_HEADER_SIGNATURE)
        .u16(VERSION) // version made by
        .u16(VERSION) // version needed
        .u16(FLAG_UTF8)
        .u16(METHOD_STORE)
        .u16(time)
        .u16(dosDate)
        .u32(crc)
        .u32(content.length)
        .u32(content.length)
        .u16(name.length)
        .u16(0) // extra field
        .u16(0) // comment
        .u16(0) // disk number
        .u16(0) // internal attributes
        .u32(0) // external attributes
        .u32(offset).bytes,
      name,
    );

    offset += local.bytes.length + name.length + content.length;
  }

  const centralSize = central.reduce((total, part) => total + part.length, 0);
  const end = new Record(22)
    .u32(END_OF_CENTRAL_DIR_SIGNATURE)
    .u16(0) // this disk
    .u16(0) // disk holding the central directory
    .u16(entries.length)
    .u16(entries.length)
    .u32(centralSize)
    .u32(offset)
    .u16(0); // no archive comment

  return new Blob([...parts, ...central, end.bytes], { type: 'application/zip' });
}
