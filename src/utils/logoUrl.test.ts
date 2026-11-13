import { describe, expect, it } from 'vitest';
import { adviseLogoUrl } from './logoUrl';

describe('adviseLogoUrl', () => {
  it('says nothing about an empty field or an upload', () => {
    expect(adviseLogoUrl('').level).toBe('ok');
    expect(adviseLogoUrl('   ').level).toBe('ok');
    expect(adviseLogoUrl('data:image/png;base64,AAAA').level).toBe('ok');
  });

  it('accepts a direct https image link', () => {
    for (const url of [
      'https://example.com/logo.png',
      'https://cdn.example.com/a/b/logo.JPEG',
      'https://example.com/logo.webp?v=2',
    ]) {
      expect(adviseLogoUrl(url), url).toEqual({ level: 'ok' });
    }
  });

  it('offers https in place of http, which clients block', () => {
    const advice = adviseLogoUrl('http://example.com/logo.png');
    expect(advice.level).toBe('problem');
    expect(advice.suggestion).toBe('https://example.com/logo.png');
  });

  it('converts a Google Drive share link into a direct link', () => {
    const advice = adviseLogoUrl('https://drive.google.com/file/d/1A2B3C4D5E6F7G8H/view?usp=sharing');
    expect(advice.level).toBe('problem');
    expect(advice.suggestion).toBe('https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F7G8H');
  });

  it('handles the older Drive open?id= form', () => {
    expect(adviseLogoUrl('https://drive.google.com/open?id=1A2B3C4D5E6F7G8H').suggestion).toBe(
      'https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F7G8H',
    );
  });

  it('leaves an already-direct Drive link alone', () => {
    expect(adviseLogoUrl('https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F7G8H').level).toBe('ok');
  });

  it('rewrites a Dropbox share link to raw=1 and drops dl', () => {
    const advice = adviseLogoUrl('https://www.dropbox.com/s/abc123/logo.png?dl=0');
    expect(advice.level).toBe('problem');
    expect(advice.suggestion).toContain('raw=1');
    expect(advice.suggestion).not.toContain('dl=0');
  });

  it('leaves a Dropbox raw link alone', () => {
    expect(adviseLogoUrl('https://www.dropbox.com/s/abc123/logo.png?raw=1').level).toBe('ok');
  });

  it('refuses OneDrive, which has no dependable direct form', () => {
    const advice = adviseLogoUrl('https://1drv.ms/i/s!AabbCcDd');
    expect(advice.level).toBe('problem');
    expect(advice.suggestion).toBeUndefined();
  });

  it('spots a link to an image-host page rather than the image', () => {
    expect(adviseLogoUrl('https://imgur.com/a/AbCdEf').level).toBe('problem');
    expect(adviseLogoUrl('https://i.imgur.com/AbCdEf.png').level).toBe('ok');
  });

  it('cautions on a URL that is not obviously an image', () => {
    expect(adviseLogoUrl('https://example.com/about').level).toBe('caution');
  });

  it('cautions on text that is not a URL at all', () => {
    expect(adviseLogoUrl('my-logo.png').level).toBe('caution');
    expect(adviseLogoUrl('ftp://example.com/logo.png').level).toBe('caution');
  });
});
