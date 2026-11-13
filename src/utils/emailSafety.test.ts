import { describe, expect, it } from 'vitest';
import { findEmailSafetyIssues, formatIssues } from './emailSafety';
import { templates } from '../templates';
import { sampleData } from '../data/sampleData';

const hostedLogo = { ...sampleData, logoUrl: 'https://example.com/logo.png' };
const rules = (html: string) => findEmailSafetyIssues(html).map((i) => i.rule);

describe('generated signatures are email-safe', () => {
  // The guardrail: every template, with every feature switched on, must emit
  // markup a mail client will actually render.
  for (const template of templates) {
    it(`${template.id} emits nothing a mail client would break on`, () => {
      const issues = findEmailSafetyIssues(template.render(hostedLogo));
      expect(issues, `\n${formatIssues(issues)}\n`).toEqual([]);
    });
  }

  it('covers every template, so a new one cannot slip past unchecked', () => {
    expect(templates.length).toBeGreaterThanOrEqual(7);
  });

  it('catches the embedded logo that started all this', () => {
    const embedded = { ...sampleData, logoUrl: 'data:image/png;base64,iVBORw0KGgo=' };
    const withLogo = templates.find((t) => t.render(embedded).includes('data:image/png'));
    expect(withLogo, 'no template rendered the logo at all').toBeDefined();
    expect(rules(withLogo!.render(embedded))).toContain('embedded-image');
  });
});

describe('findEmailSafetyIssues', () => {
  it('ignores Outlook-only VML, which deliberately uses markup no one else sees', () => {
    const html = `<div>
      <!--[if mso]>
      <v:roundrect style="height:34px;v-text-anchor:middle;width:120px;" fillcolor="#000"><w:anchorlock/></v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="https://example.com" style="display: inline-block;">Book</a>
      <!--<![endif]-->
    </div>`;
    expect(findEmailSafetyIssues(html)).toEqual([]);
  });

  it('still inspects the content revealed between downlevel markers', () => {
    const html = `<!--[if !mso]><!--><img src="data:image/png;base64,AAAA" width="10" alt="x" /><!--<![endif]-->`;
    expect(rules(html)).toContain('embedded-image');
  });

  it('flags scripts, style blocks and external stylesheets', () => {
    expect(rules('<script>alert(1)</script>')).toContain('script-tag');
    expect(rules('<style>p{color:red}</style>')).toContain('style-block');
    expect(rules('<link rel="stylesheet" href="x.css">')).toContain('external-stylesheet');
  });

  it('flags classes, which die with the stylesheet', () => {
    expect(rules('<p class="muted">x</p>')).toContain('class-attribute');
  });

  it('flags http images but accepts https', () => {
    expect(rules('<img src="http://e.com/a.png" width="1" alt="a">')).toContain('insecure-image');
    expect(rules('<img src="https://e.com/a.png" width="1" alt="a">')).not.toContain('insecure-image');
  });

  it('requires width and alt on images', () => {
    expect(rules('<img src="https://e.com/a.png">')).toEqual(
      expect.arrayContaining(['image-without-width', 'image-without-alt']),
    );
  });

  it('requires role=presentation on layout tables', () => {
    expect(rules('<table><tr><td>x</td></tr></table>')).toContain('layout-table-without-role');
    expect(rules('<table role="presentation"><tr><td>x</td></tr></table>')).not.toContain(
      'layout-table-without-role',
    );
  });

  it('flags CSS that Outlook drops', () => {
    for (const css of [
      'display: flex',
      'display: grid',
      'position: absolute',
      'transform: rotate(2deg)',
      'animation: spin 1s',
      'transition: all .2s',
      'background-image: url(x.png)',
      'padding: 1rem',
      'height: 50vh',
    ]) {
      expect(rules(`<div style="${css}">x</div>`), css).toContain('unsupported-css');
    }
  });

  it('does not mistake text-transform for transform', () => {
    expect(rules('<div style="text-transform: uppercase;">x</div>')).not.toContain('unsupported-css');
  });

  it('accepts border-radius, which merely degrades to square corners', () => {
    expect(rules('<div style="border-radius: 4px;">x</div>')).toEqual([]);
  });
});
