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
  { id: 'threads', name: 'Threads', placeholder: 'username', urlPrefix: 'https://www.threads.com/@' },
  { id: 'bluesky', name: 'Bluesky', placeholder: 'you.bsky.social', urlPrefix: 'https://bsky.app/profile/' },
  // Mastodon, Discord and Substack live on per-user hosts, so there is no
  // prefix to add: the whole URL is pasted and normalized like the website.
  { id: 'mastodon', name: 'Mastodon', placeholder: 'https://mastodon.social/@you', urlPrefix: '' },
  { id: 'discord', name: 'Discord', placeholder: 'https://discord.gg/your-invite', urlPrefix: '' },
  { id: 'substack', name: 'Substack', placeholder: 'https://you.substack.com', urlPrefix: '' },
  { id: 'medium', name: 'Medium', placeholder: 'username', urlPrefix: 'https://medium.com/@' },
  { id: 'telegram', name: 'Telegram', placeholder: 'username', urlPrefix: 'https://t.me/' },
  // wa.me takes the number in full, digits only.
  { id: 'whatsapp', name: 'WhatsApp', placeholder: '15551234567', urlPrefix: 'https://wa.me/' },
];
