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
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  render: (data: SignatureData) => string;
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
