import { describe, expect, it } from 'vitest';
import { MAX_TEAM_ROWS, buildRoster, readmeText, shareLinkFor, shareLinksCsv } from './team';
import { parseCsv } from './csv';
import { decodeConfig } from './shareConfig';
import { sampleData } from '../data/sampleData';
import { templates } from '../templates';
import { findEmailSafetyIssues } from './emailSafety';
import { findDarkModeIssues } from './darkMode';

const base = { ...sampleData, company: 'Northwind Labs' };
const roster = `name,email,title,department,phone
Alex Rivera,alex@northwind.io,Head of Product,Product,+1 (415) 555-0123
Sam Okafor,sam@northwind.io,Staff Engineer,Engineering,+1 (415) 555-0144`;

describe('buildRoster', () => {
  it('gives each person their own details over the shared brand', () => {
    const { people } = buildRoster(roster, base);
    expect(people).toHaveLength(2);
    expect(people[1]!.data.fullName).toBe('Sam Okafor');
    expect(people[1]!.data.jobTitle).toBe('Staff Engineer');
    expect(people[1]!.data.email).toBe('sam@northwind.io');
    // The brand side is inherited, not repeated per row.
    expect(people[1]!.data.company).toBe('Northwind Labs');
    expect(people[1]!.data.primaryColor).toBe(base.primaryColor);
    expect(people[1]!.data.disclaimer).toBe(base.disclaimer);
  });

  it('does not let one person’s details leak into another’s', () => {
    // The roster declares a title column, so an empty cell means this person
    // has no title — not that they inherit the template owner's.
    const { people } = buildRoster('name,title,email\nJane Doe,Designer,j@x.com\nSam Okafor,,', base);
    expect(people[0]!.data.jobTitle).toBe('Designer');
    expect(people[1]!.data.jobTitle).toBe('');
    expect(people[1]!.data.email).toBe('');
    expect(people[0]!.data.socials).not.toBe(people[1]!.data.socials);
  });

  it('inherits a field the roster does not mention at all', () => {
    const { people } = buildRoster('name\nJane Doe', base);
    expect(people[0]!.data.company).toBe('Northwind Labs');
    expect(people[0]!.data.email).toBe(base.email);
  });

  it('accepts the column names a staff export tends to use', () => {
    const { people } = buildRoster('Full Name,Job Title,Mobile,Team,E-Mail\nJane Doe,Designer,555,Brand,j@x.com', base);
    const person = people[0]!.data;
    expect(person.fullName).toBe('Jane Doe');
    expect(person.jobTitle).toBe('Designer');
    expect(person.phone).toBe('555');
    expect(person.department).toBe('Brand');
    expect(person.email).toBe('j@x.com');
  });

  it('lets a social column replace the one in the template for that person', () => {
    const { people } = buildRoster('name,linkedin\nJane Doe,janedoe', base);
    expect(people[0]!.data.socials.linkedin).toBe('janedoe');
    // And the rest of the shared links survive.
    expect(people[0]!.data.socials.github).toBe(base.socials.github);
  });

  it('reports columns it ignored rather than rejecting the file', () => {
    const { people, unknownColumns } = buildRoster('name,employee id,cost centre\nJane Doe,42,X1', base);
    expect(people).toHaveLength(1);
    expect(unknownColumns).toEqual(['employee id', 'cost centre']);
  });

  it('skips a row with no name and says how many', () => {
    const { people, skippedRows } = buildRoster('name,email\n,nobody@x.com\nJane Doe,j@x.com\n,\n', base);
    expect(people.map((person) => person.name)).toEqual(['Jane Doe']);
    expect(skippedRows).toBe(1);
  });

  it('is empty, not broken, when the roster has only a header', () => {
    expect(buildRoster('name,email', base).people).toEqual([]);
  });

  it('names each file after the person, folding accents', () => {
    const { people } = buildRoster('name\nJosé Álvarez\nJane Doe', base);
    expect(people[0]!.filename).toBe('jose-alvarez.html');
    expect(people[1]!.filename).toBe('jane-doe.html');
  });

  it('keeps filenames unique when two people share a name', () => {
    const { people } = buildRoster('name\nJane Doe\nJane Doe\nJane Doe', base);
    expect(people.map((person) => person.filename)).toEqual(['jane-doe.html', 'jane-doe-2.html', 'jane-doe-3.html']);
  });

  it('falls back to the email, then to a number, for a name with no ASCII form', () => {
    const { people } = buildRoster('name,email\nليلى منصور,laila@x.com\n田中太郎,', base);
    expect(people[0]!.filename).toBe('laila.html');
    expect(people[1]!.filename).toBe('signature-2.html');
  });

  it('stops at the cap and says it did', () => {
    const rows = Array.from({ length: MAX_TEAM_ROWS + 5 }, (_, i) => `Person ${i}`).join('\n');
    const result = buildRoster(`name\n${rows}`, base);
    expect(result.people).toHaveLength(MAX_TEAM_ROWS);
    expect(result.truncated).toBe(true);
  });

  it('leaves the template’s own choices alone, whatever a column is called', () => {
    // Only the text fields are addressable; a roster cannot switch fonts.
    const { people } = buildRoster('name,fontfamily,brandmark\nJane Doe,Comic Sans,photo', base);
    expect(people[0]!.data.fontFamily).toBe(base.fontFamily);
    expect(people[0]!.data.brandMark).toBe(base.brandMark);
  });

  it('produces signatures that are email-safe and survive dark mode', () => {
    const { people } = buildRoster(roster, base);
    for (const template of templates) {
      for (const person of people) {
        const html = template.render(person.data);
        expect(findEmailSafetyIssues(html), `${template.id} / ${person.name}`).toEqual([]);
        expect(findDarkModeIssues(html), `${template.id} / ${person.name}`).toEqual([]);
      }
    }
  });
});

describe('share links', () => {
  const baseUrl = 'https://gorvok.github.io/customE-signature/';

  it('restores that person’s signature, not the roster owner’s', () => {
    const { people } = buildRoster(roster, base);
    const link = shareLinkFor(people[1]!, 'minimal', baseUrl);
    const restored = decodeConfig(link.split('#cfg=')[1]!);
    expect(restored?.data.fullName).toBe('Sam Okafor');
    expect(restored?.data.company).toBe('Northwind Labs');
    expect(restored?.templateId).toBe('minimal');
  });

  it('leaves an uploaded logo out, as every share link does', () => {
    const withLogo = { ...base, logoUrl: 'data:image/png;base64,iVBORw0KGgo=' };
    const { people } = buildRoster('name\nJane Doe', withLogo);
    const link = shareLinkFor(people[0]!, 'minimal', baseUrl);
    expect(decodeConfig(link.split('#cfg=')[1]!)?.data.logoUrl).toBe('');
  });

  it('writes a sheet that lists every person, their file and their link', () => {
    const { people } = buildRoster(roster, base);
    const rows = parseCsv(shareLinksCsv(people, 'minimal', baseUrl));
    expect(rows[0]).toEqual(['name', 'email', 'file', 'edit link']);
    expect(rows).toHaveLength(people.length + 1);
    expect(rows[1]![2]).toBe('signatures/alex-rivera.html');
    expect(rows[1]![3]).toContain('#cfg=');
  });

  it('quotes a name holding a comma, so the sheet still parses', () => {
    const { people } = buildRoster('name\n"Doe, Jane"', base);
    const csv = shareLinksCsv(people, 'minimal', baseUrl);
    expect(csv).toContain('"Doe, Jane"');
    expect(parseCsv(csv)[1]![0]).toBe('Doe, Jane');
  });
});

describe('readmeText', () => {
  it('says how many signatures there are and what the files are', () => {
    const { people } = buildRoster(roster, base);
    const text = readmeText(people, 'minimal');
    expect(text).toContain('2 email signatures');
    expect(text).toContain('share-links.csv');
    expect(text).toContain('Template: minimal');
  });

  it('gets the singular right for one person', () => {
    const { people } = buildRoster('name\nJane Doe', base);
    expect(readmeText(people, 'minimal')).toContain('1 email signature,');
  });
});
