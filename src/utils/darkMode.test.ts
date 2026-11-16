import { describe, expect, it } from 'vitest';
import { findDarkModeIssues, formatDarkModeIssues, paintedBackgrounds } from './darkMode';
import { DARK_CLIENT_BG } from './color';

const rules = (html: string) => findDarkModeIssues(html).map((i) => i.rule);

describe('findDarkModeIssues', () => {
  it('flags colored text that declares no background of its own', () => {
    const issues = findDarkModeIssues('<div style="color: #6b7280; font-size: 10px;">Small print</div>');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.rule).toBe('text-on-client-background');
    expect(issues[0]!.color).toBe('#6b7280');
    expect(issues[0]!.message).toContain(DARK_CLIENT_BG);
    expect(issues[0]!.sample).toBe('Small print');
  });

  it('clears the same text once something paints a background behind it', () => {
    expect(rules('<div style="background-color: #ffffff;"><span style="color: #6b7280;">Small print</span></div>')).toEqual([]);
  });

  it('accepts a background from the bgcolor attribute, which is how Outlook reads it', () => {
    expect(rules('<td bgcolor="#ffffff" style="color: #6b7280;">Small print</td>')).toEqual([]);
  });

  it('inherits both colors through nested elements', () => {
    const html = '<table bgcolor="#0f172a"><tr><td style="color: #f8fafc;"><strong><em>Deep</em></strong></td></tr></table>';
    expect(rules(html)).toEqual([]);
  });

  it('stops inheriting a background once the element closes', () => {
    const html =
      '<table bgcolor="#ffffff"><tr><td style="color: #6b7280;">Inside</td></tr></table>' +
      '<div style="color: #6b7280;">Outside</div>';
    const issues = findDarkModeIssues(html);
    expect(issues.map((i) => i.rule)).toEqual(['text-on-client-background']);
    expect(issues[0]!.sample).toBe('Outside');
  });

  it('flags an unreadable pair on a painted background', () => {
    const issues = findDarkModeIssues('<td bgcolor="#ffffff" style="color: #cccccc;">Faint</td>');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.rule).toBe('low-contrast');
    expect(issues[0]!.background).toBe('#ffffff');
    expect(issues[0]!.message).toContain('1.61:1');
  });

  it('leaves text that declares no color at all alone', () => {
    // The client picks that pair itself and keeps it readable.
    expect(rules('<div>Plain</div>')).toEqual([]);
    expect(rules('<td bgcolor="#ffffff">Plain</td>')).toEqual([]);
  });

  it('judges large and bold text by the large-text threshold', () => {
    const faint = 'color: #949494;';
    expect(rules(`<td bgcolor="#ffffff" style="${faint} font-size: 12px;">Small</td>`)).toEqual(['low-contrast']);
    expect(rules(`<td bgcolor="#ffffff" style="${faint} font-size: 24px;">Large</td>`)).toEqual([]);
    expect(rules(`<td bgcolor="#ffffff" style="${faint} font-size: 20px; font-weight: bold;">Bold</td>`)).toEqual([]);
    // Bold but not big enough to qualify.
    expect(rules(`<td bgcolor="#ffffff" style="${faint} font-size: 14px; font-weight: bold;">Bold</td>`)).toEqual(['low-contrast']);
  });

  it('does not mistake background-color for a text color', () => {
    expect(rules('<td style="background-color: #0f172a;">Plain</td>')).toEqual([]);
  });

  it('ignores Outlook-only markup and keeps what every other client sees', () => {
    const html =
      '<!--[if mso]><td style="color: #cccccc;">MSO</td><![endif]-->' +
      '<!--[if !mso]><!--><td bgcolor="#ffffff" style="color: #111111;">Everyone</td><!--<![endif]-->';
    expect(rules(html)).toEqual([]);
  });

  it('skips spacer cells and colors it cannot read', () => {
    expect(rules('<td style="color: #6b7280;">&nbsp;</td>')).toEqual([]);
    expect(rules('<td style="color: currentColor;">Unknown</td>')).toEqual([]);
  });

  it('reports each distinct problem once, however often it appears', () => {
    const cell = '<td style="color: #6b7280;">Repeated</td>';
    expect(rules(cell.repeat(5))).toEqual(['text-on-client-background']);
  });

  it('survives a stray closing tag without losing track of the background', () => {
    const html = '<table bgcolor="#ffffff"><tr><td style="color: #6b7280;">Fine</span></td></tr></table>';
    expect(rules(html)).toEqual([]);
  });

  it('does not treat a void or self-closed element as a container', () => {
    const html =
      '<td bgcolor="#ffffff"><img src="x.png" width="10" alt="" style="color: #cccccc;" /><br />' +
      '<span style="color: #111111;">After</span></td>';
    expect(rules(html)).toEqual([]);
  });
});

describe('paintedBackgrounds', () => {
  it('collects every declared background, wherever it sits', () => {
    const html = '<table><tr><td bgcolor="#0f172a">a</td></tr><tr><td style="background-color: #f8f8f8;">b</td></tr></table>';
    expect(paintedBackgrounds(html).sort()).toEqual(['#0f172a', '#f8f8f8']);
  });

  it('is empty when nothing paints', () => {
    expect(paintedBackgrounds('<table><tr><td>a</td></tr></table>')).toEqual([]);
  });

  it('leaves Outlook-only backgrounds out', () => {
    expect(paintedBackgrounds('<!--[if mso]><td bgcolor="#0f172a">a</td><![endif]-->')).toEqual([]);
  });
});

describe('formatDarkModeIssues', () => {
  it('names the rule and quotes the text for a test failure', () => {
    const text = formatDarkModeIssues(findDarkModeIssues('<div style="color: #6b7280;">Small print</div>'));
    expect(text).toContain('[text-on-client-background]');
    expect(text).toContain('at: Small print');
  });
});
