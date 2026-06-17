export type IconStyle = 'brand' | 'dark' | 'light' | 'gray';

export interface SignatureData {
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  socials: Record<string, string>;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  iconStyle: IconStyle;
}

export interface RenderOptions {
  /**
   * Base URL for hosted social-icon PNGs (no trailing slash). Defaults to the
   * absolute production URL so copied/downloaded signatures work in email; the
   * live preview passes a local URL so icons load before deploy.
   */
  iconBaseUrl?: string;
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  render: (data: SignatureData, options?: RenderOptions) => string;
}

export interface EmailProvider {
  id: string;
  name: string;
  exportMethod: 'clipboard' | 'download' | 'both';
  instructions: string[];
}

export type SocialPlatform = {
  id: string;
  name: string;
  placeholder: string;
  urlPrefix: string;
};
