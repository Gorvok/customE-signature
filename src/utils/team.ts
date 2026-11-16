/**
 * Team mode: one roster in, a signature per person out.
 *
 * The brand side of a signature — template, colors, font, company, logo,
 * disclaimer, social links — is the same for everyone, and only a handful of
 * fields differ per person. So the signature being edited is the template,
 * and the roster supplies the differences. Everything happens in the browser:
 * there is no account to upload a staff list to, and a staff list is not
 * something to upload to a stranger's server anyway.
 */

import type { SignatureData } from '../types';
import { socialPlatforms } from '../data/socialPlatforms';
import { parseCsvTable, toCsv } from './csv';
import { encodeConfig, forShareLink } from './shareConfig';

/**
 * How many people one roster may carry. Every signature is rendered to build
 * the archive, so this is about keeping the tab responsive, not about storage.
 */
export const MAX_TEAM_ROWS = 200;

/**
 * Column names the roster understands, and the field each one fills. The
 * aliases are what a spreadsheet exported from an HR system tends to call
 * them; matching is case-insensitive and ignores surrounding space.
 */
const COLUMN_ALIASES: Record<string, keyof SignatureData> = {
  name: 'fullName',
  'full name': 'fullName',
  fullname: 'fullName',
  email: 'email',
  'email address': 'email',
  'e-mail': 'email',
  title: 'jobTitle',
  'job title': 'jobTitle',
  role: 'jobTitle',
  position: 'jobTitle',
  phone: 'phone',
  'phone number': 'phone',
  telephone: 'phone',
  mobile: 'phone',
  department: 'department',
  team: 'department',
  pronouns: 'pronouns',
  company: 'company',
  organisation: 'company',
  organization: 'company',
  website: 'website',
  address: 'address',
  'office address': 'address',
  booking: 'bookingLink',
  'booking link': 'bookingLink',
  calendar: 'bookingLink',
  initials: 'monogramText',
  monogram: 'monogramText',
};

/** Columns the UI lists as supported, in a sensible reading order. */
export const TEAM_COLUMNS = [
  'name',
  'email',
  'title',
  'department',
  'phone',
  'pronouns',
  'booking',
  'initials',
] as const;

const PLATFORM_IDS = new Set(socialPlatforms.map((platform) => platform.id));

export interface TeamMember {
  /** The person's name, as the roster spelled it. */
  name: string;
  email: string;
  /** Their signature: the brand template with their own details over it. */
  data: SignatureData;
  /** Where their file sits inside the archive. Unique within one roster. */
  filename: string;
}

export interface TeamRoster {
  people: TeamMember[];
  /** Header names that matched no field, so the UI can say they were ignored. */
  unknownColumns: string[];
  /** Rows dropped for having no name at all. */
  skippedRows: number;
  /** True when the roster was longer than MAX_TEAM_ROWS and the rest was left. */
  truncated: boolean;
}

/**
 * A filename for a person: their name, reduced to something every filesystem
 * accepts. Accents are folded rather than dropped ("José" is jose), and a
 * name in a script with no ASCII form falls back to the email, then to a
 * number — the file still has to be identifiable.
 */
function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function filenameFor(member: { name: string; email: string }, index: number, taken: Set<string>): string {
  const base = slugify(member.name) || slugify(member.email.split('@')[0] ?? '') || `signature-${index + 1}`;
  let candidate = `${base}.html`;
  let suffix = 2;
  while (taken.has(candidate)) candidate = `${base}-${suffix++}.html`;
  taken.add(candidate);
  return candidate;
}

/**
 * Read a roster against a base signature.
 *
 * A column the roster does not have is inherited from the template, which is
 * the point: company, colors, logo and disclaimer are written once. A column
 * it does have is taken as the truth for every row, so an empty cell clears
 * that field rather than inheriting it — otherwise a roster with a blank
 * email cell would hand one person's address to another.
 *
 * Unknown columns are reported rather than rejected (a staff export carries
 * plenty that are none of our business), and a row with no name is skipped,
 * since a signature without one is not worth generating.
 */
export function buildRoster(csv: string, base: SignatureData): TeamRoster {
  const { headers, records } = parseCsvTable(csv);
  const unknownColumns = headers.filter((header) => !COLUMN_ALIASES[header] && !PLATFORM_IDS.has(header));

  const taken = new Set<string>();
  const people: TeamMember[] = [];
  let skippedRows = 0;

  for (const record of records) {
    if (people.length >= MAX_TEAM_ROWS) break;

    const data: SignatureData = { ...base, socials: { ...base.socials } };
    let hasName = false;

    for (const [column, value] of Object.entries(record)) {
      const field = COLUMN_ALIASES[column];
      if (field) {
        // Only the string fields are addressable from a roster; the enums and
        // flags stay as the brand template set them.
        if (typeof data[field] === 'string') {
          // An empty cell in a column the roster declares means "none" — not
          // "keep the template's". Otherwise a blank email column would put
          // the person who built the template into everyone else's signature.
          (data as unknown as Record<string, string>)[field] = value;
          if (field === 'fullName' && value) hasName = true;
        }
      } else if (PLATFORM_IDS.has(column)) {
        data.socials[column] = value;
      }
    }

    if (!hasName) {
      skippedRows++;
      continue;
    }

    people.push({
      name: data.fullName,
      email: data.email,
      data,
      filename: filenameFor({ name: data.fullName, email: data.email }, people.length, taken),
    });
  }

  return {
    people,
    unknownColumns,
    skippedRows,
    truncated: records.length > MAX_TEAM_ROWS,
  };
}

/** The share link that restores one person's signature in the app. */
export function shareLinkFor(member: TeamMember, templateId: string, baseUrl: string): string {
  const { config } = forShareLink({ data: member.data, templateId });
  return `${baseUrl}#cfg=${encodeConfig(config)}`;
}

/**
 * The share-links sheet that ships with the archive: how each person opens
 * their own signature in the app, to check it or carry it to another device.
 */
export function shareLinksCsv(people: TeamMember[], templateId: string, baseUrl: string): string {
  return toCsv([
    ['name', 'email', 'file', 'edit link'],
    ...people.map((member) => [
      member.name,
      member.email,
      `signatures/${member.filename}`,
      shareLinkFor(member, templateId, baseUrl),
    ]),
  ]);
}

/** The note that explains the archive to whoever opens it. */
export function readmeText(people: TeamMember[], templateId: string): string {
  return [
    `${people.length} email signature${people.length === 1 ? '' : 's'}, generated from one roster.`,
    '',
    'signatures/    one HTML file per person, named after them',
    'share-links.csv   each person, their file, and a link that opens their',
    '                  signature in the generator to edit or re-copy',
    '',
    'To install one: open the HTML file in a browser, select all, copy, and',
    'paste into your mail client\'s signature editor. Thunderbird and Outlook',
    'can use the file directly instead.',
    '',
    `Template: ${templateId}. Generated by Envoi,`,
    'https://gorvok.github.io/customE-signature/ — everything above was made',
    'in the browser; the roster was never uploaded anywhere.',
    '',
  ].join('\n');
}
