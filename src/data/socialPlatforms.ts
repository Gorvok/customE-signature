import type { SocialPlatform } from '../types';

export const socialPlatforms: SocialPlatform[] = [
  { id: 'website', name: 'Website', placeholder: 'https://yoursite.com', urlPrefix: '' },
  { id: 'instagram', name: 'Instagram', placeholder: 'username', urlPrefix: 'https://www.instagram.com/' },
  { id: 'linkedin', name: 'LinkedIn', placeholder: 'username', urlPrefix: 'https://www.linkedin.com/in/' },
  { id: 'facebook', name: 'Facebook', placeholder: 'username', urlPrefix: 'https://www.facebook.com/' },
  { id: 'twitter', name: 'Twitter / X', placeholder: 'username', urlPrefix: 'https://www.x.com/' },
  { id: 'github', name: 'GitHub', placeholder: 'username', urlPrefix: 'https://github.com/' },
  { id: 'youtube', name: 'YouTube', placeholder: 'channel-name', urlPrefix: 'https://www.youtube.com/@' },
  { id: 'tiktok', name: 'TikTok', placeholder: 'username', urlPrefix: 'https://www.tiktok.com/@' },
];
