export type IconStyle = 'brand' | 'dark' | 'light' | 'gray';

/**
 * Which brand mark the signature shows. 'monogram' draws the person's
 * initials with markup, which needs no hosting — unlike an uploaded logo,
 * which most clients strip. See utils/monogram.ts.
 */
export type BrandMark = 'logo' | 'monogram';

/**
 * Which way the signature's text runs. 'rtl' mirrors the layout for Arabic,
 * Hebrew, Persian and Urdu. See finalizeHtml in utils/templateHelpers.ts.
 */
export type TextDirection = 'ltr' | 'rtl';

/** How much breathing room the signature takes. */
export type Density = 'comfortable' | 'compact';

/**
 * Which end of the row the brand mark sits at, in reading order — so it
 * follows the text direction rather than fighting it. Templates that stack
 * the mark above the text ignore it.
 */
export type BrandMarkSide = 'start' | 'end';

export interface SignatureData {
  fullName: string;
  pronouns: string;
  jobTitle: string;
  department: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  bookingLink: string;
  socials: Record<string, string>;
  socialOrder: string[];
  logoUrl: string;
  brandMark: BrandMark;
  /** Letters for the monogram; derived from the name or company when blank. */
  monogramText: string;
  ctaLabel: string;
  ctaUrl: string;
  disclaimer: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  iconStyle: IconStyle;
  textDirection: TextDirection;
  density: Density;
  brandMarkSide: BrandMarkSide;
  /**
   * Campaign tagging for the website, booking and call-to-action links.
   * Off by default; social profiles are never tagged. See utils/utm.ts.
   */
  utmEnabled: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

/** One signature in the library, as stored in this browser. */
export interface SavedSignature {
  id: string;
  name: string;
  data: SignatureData;
  templateId: string;
}

export interface RenderOptions {
  /**
   * Base URL for hosted social-icon PNGs (no trailing slash). Defaults to the
   * absolute production URL so copied/downloaded signatures work in email; the
   * live preview passes a local URL so icons load before deploy.
   */
  iconBaseUrl?: string;
}

/**
 * What a template shows. Most show everything, but a few leave something out
 * on purpose — One Line has no brand mark and no button, because a button is
 * the opposite of what it is for. Declaring it keeps the test suite's
 * guarantees sharp: a template that claims a feature must render it, and one
 * that does not claim it must not.
 */
export interface TemplateFeatures {
  /** Renders the brand mark (logo or monogram) when one is set. */
  brandMark: boolean;
  /** Renders the call-to-action button when one is set. */
  cta: boolean;
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  features: TemplateFeatures;
  render: (data: SignatureData, options?: RenderOptions) => string;
}

export interface EmailProvider {
  id: string;
  name: string;
  exportMethod: 'clipboard' | 'download' | 'both';
  instructions: string[];
  /**
   * Whether this client displays an image embedded as a `data:` URI. Most
   * webmail strips them, which silently drops an uploaded logo — so the
   * export panel warns when one is in use. See compatibility.ts.
   */
  rendersEmbeddedImages: boolean;
  /**
   * Whether this client rewrites the colors of message content in dark mode.
   * Outlook.com and Yahoo Mail recolor light text even when the markup paints
   * its own background, so a dark signature is a risk there. See darkMode.ts.
   */
  recolorsInDarkMode: boolean;
}

export type SocialPlatform = {
  id: string;
  name: string;
  placeholder: string;
  urlPrefix: string;
};
