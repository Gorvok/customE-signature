import { describe, expect, it } from 'vitest';
import { withUtm, type UtmSettings } from './utm';
import { contactLinks } from './templateHelpers';
import { templates } from '../templates';
import { sampleData } from '../data/sampleData';

const on: UtmSettings = {
  utmEnabled: true,
  utmSource: 'email',
  utmMedium: 'signature',
  utmCampaign: 'spring',
};
const off: UtmSettings = { ...on, utmEnabled: false };

describe('withUtm', () => {
  it('does nothing while tagging is off', () => {
    expect(withUtm('https://example.com/', off)).toBe('https://example.com/');
  });

  it('adds the parameters in a stable order', () => {
    expect(withUtm('https://example.com/', on)).toBe(
      'https://example.com/?utm_source=email&utm_medium=signature&utm_campaign=spring',
    );
  });

  it('keeps an existing query and fragment', () => {
    const tagged = withUtm('https://example.com/a?ref=x#top', on);
    expect(tagged).toContain('ref=x');
    expect(tagged).toContain('utm_source=email');
    expect(tagged.endsWith('#top')).toBe(true);
  });

  it('never overwrites a parameter the author already set', () => {
    expect(withUtm('https://example.com/?utm_campaign=mine', on)).toContain('utm_campaign=mine');
    expect(withUtm('https://example.com/?utm_campaign=mine', on)).not.toContain('spring');
  });

  it('skips parameters with no value', () => {
    const tagged = withUtm('https://example.com/', { ...on, utmCampaign: '   ' });
    expect(tagged).toContain('utm_source=email');
    expect(tagged).not.toContain('utm_campaign');
  });

  it('returns the link untouched when every parameter is empty', () => {
    expect(withUtm('https://example.com/', { ...on, utmSource: '', utmMedium: '', utmCampaign: '' })).toBe(
      'https://example.com/',
    );
  });

  it('leaves alone anything without an http(s) scheme', () => {
    for (const url of ['mailto:a@b.com', 'tel:+15551234567', '#', '', '   ', 'ftp://example.com/x']) {
      expect(withUtm(url, on), url).toBe(url);
    }
  });

  it('encodes values rather than letting them break the query', () => {
    const tagged = withUtm('https://example.com/', { ...on, utmCampaign: 'a b&c=d' });
    expect(tagged).toContain('utm_campaign=a+b%26c%3Dd');
    expect(tagged.match(/utm_campaign/g)).toHaveLength(1);
  });

  it('returns an unparseable link untouched instead of mangling it', () => {
    expect(withUtm('https://', on)).toBe('https://');
  });
});

describe('tagging in a rendered signature', () => {
  const data = {
    ...sampleData,
    website: 'northwind.example',
    bookingLink: 'https://cal.example/alex',
    ctaLabel: 'Book a demo',
    ctaUrl: 'https://northwind.example/demo',
    socials: { linkedin: 'https://linkedin.com/in/alex' },
    socialOrder: ['linkedin'],
  };

  it('tags the website and booking links', () => {
    const [website, booking] = contactLinks({ ...data, ...on, phone: '', email: '' }, { color: '#000' });
    expect(website).toContain('utm_source=email');
    expect(booking).toContain('utm_medium=signature');
  });

  it('leaves website and booking untagged while off', () => {
    const [website] = contactLinks({ ...data, ...off, phone: '', email: '' }, { color: '#000' });
    expect(website).not.toContain('utm_');
  });

  it('tags the call-to-action button in every template that has one', () => {
    for (const template of templates.filter((t) => t.features.cta)) {
      const html = template.render({ ...data, ...on });
      expect(html, template.id).toContain('northwind.example/demo?utm_source=email');
    }
  });

  it('never tags social links', () => {
    for (const template of templates) {
      const html = template.render({ ...data, ...on });
      const socialHrefs = [...html.matchAll(/href="([^"]*linkedin[^"]*)"/g)].map((m) => m[1]);
      expect(socialHrefs.length, template.id).toBeGreaterThan(0);
      for (const href of socialHrefs) expect(href, template.id).not.toContain('utm_');
    }
  });

  it('adds nothing anywhere while tagging is off', () => {
    for (const template of templates) {
      expect(template.render({ ...data, ...off }), template.id).not.toContain('utm_');
    }
  });
});
