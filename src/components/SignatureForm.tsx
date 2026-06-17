import { useId, useState } from 'react';
import type { IconStyle, SignatureData, SocialPlatform } from '../types';
import { socialPlatforms } from '../data/socialPlatforms';
import { getSocialIconSvg } from '../utils/socialIcons';
import { isValidEmail, isLikelyUrl } from '../utils/validators';
import ImageUploader from './ImageUploader';
import ColorPicker from './ColorPicker';

interface Props {
  data: SignatureData;
  onChange: (data: SignatureData) => void;
}

const FONTS = ['Inter', 'Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Courier New', 'Times New Roman'];

const ICON_STYLES: { value: IconStyle; label: string }[] = [
  { value: 'brand', label: 'Brand colors' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light (for dark backgrounds)' },
  { value: 'gray', label: 'Gray' },
];

function InputField({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:outline-none transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
        }`}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function SignatureForm({ data, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(partial: Partial<SignatureData>) {
    onChange({ ...data, ...partial });
  }

  function updateSocial(platformId: string, value: string) {
    onChange({ ...data, socials: { ...data.socials, [platformId]: value } });
  }

  // Platforms in the user's chosen order, with any not-yet-ordered ones appended.
  const orderedPlatforms: SocialPlatform[] = [
    ...data.socialOrder,
    ...socialPlatforms.map((p) => p.id).filter((id) => !data.socialOrder.includes(id)),
  ]
    .map((id) => socialPlatforms.find((p) => p.id === id))
    .filter((p): p is SocialPlatform => Boolean(p));

  function moveSocial(from: number, to: number) {
    if (from === to) return;
    const ids = orderedPlatforms.map((p) => p.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    update({ socialOrder: ids });
  }

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Personal Info</h3>
        <div className="space-y-3">
          <InputField label="Full Name" value={data.fullName} onChange={(v) => update({ fullName: v })} placeholder="John Doe" />
          <InputField label="Pronouns" value={data.pronouns} onChange={(v) => update({ pronouns: v })} placeholder="she/her" />
          <InputField label="Job Title" value={data.jobTitle} onChange={(v) => update({ jobTitle: v })} placeholder="CEO / Designer" />
          <InputField label="Department" value={data.department} onChange={(v) => update({ department: v })} placeholder="Engineering" />
          <InputField label="Company" value={data.company} onChange={(v) => update({ company: v })} placeholder="Acme Inc." />
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
        <div className="space-y-3">
          <InputField label="Phone" value={data.phone} onChange={(v) => update({ phone: v })} placeholder="(555) 123-4567" type="tel" />
          <InputField label="Email" value={data.email} onChange={(v) => update({ email: v })} placeholder="you@example.com" type="email" error={data.email && !isValidEmail(data.email) ? 'Enter a valid email address.' : undefined} />
          <InputField label="Website" value={data.website} onChange={(v) => update({ website: v })} placeholder="www.example.com" type="url" error={data.website && !isLikelyUrl(data.website) ? 'Enter a valid URL.' : undefined} />
          <InputField label="Office Address" value={data.address} onChange={(v) => update({ address: v })} placeholder="123 Main St, City" />
          <InputField label="Booking Link" value={data.bookingLink} onChange={(v) => update({ bookingLink: v })} placeholder="calendly.com/you" type="url" error={data.bookingLink && !isLikelyUrl(data.bookingLink) ? 'Enter a valid URL.' : undefined} />
        </div>
      </section>

      {/* Social Links */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Social Links</h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">Drag the handle to reorder how icons appear.</p>
        <div className="space-y-3">
          {orderedPlatforms.map((platform, index) => (
            <div
              key={platform.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveSocial(dragIndex, index);
                setDragIndex(null);
              }}
              className={`flex items-center gap-2 rounded-lg transition-colors ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
            >
              <span
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                aria-label={`Reorder ${platform.name}`}
                title="Drag to reorder"
                className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 select-none px-0.5"
              >
                <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="9" cy="8" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="9" cy="13" r="1.5"/></svg>
              </span>
              <span
                aria-hidden="true"
                className="w-5 h-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: getSocialIconSvg(platform.id, 'currentColor') }}
              />
              <label htmlFor={`social-${platform.id}`} className="text-sm text-gray-600 dark:text-gray-300 min-w-20">{platform.name}</label>
              <input
                id={`social-${platform.id}`}
                type="text"
                value={data.socials[platform.id] || ''}
                onChange={(e) => updateSocial(platform.id, e.target.value)}
                placeholder={platform.placeholder}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Call to Action</h3>
        <div className="space-y-3">
          <InputField label="Button Text" value={data.ctaLabel} onChange={(v) => update({ ctaLabel: v })} placeholder="Book a demo" />
          <InputField label="Button Link" value={data.ctaUrl} onChange={(v) => update({ ctaUrl: v })} placeholder="https://example.com/demo" type="url" error={data.ctaUrl && !isLikelyUrl(data.ctaUrl) ? 'Enter a valid URL.' : undefined} />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Legal Disclaimer</h3>
        <textarea
          value={data.disclaimer}
          onChange={(e) => update({ disclaimer: e.target.value })}
          placeholder="This email and any attachments are confidential…"
          rows={3}
          aria-label="Legal disclaimer"
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
        />
      </section>

      {/* Branding */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Branding</h3>
        <div className="space-y-4">
          <ImageUploader value={data.logoUrl} onChange={(v) => update({ logoUrl: v })} />
          <ColorPicker label="Primary Color" value={data.primaryColor} onChange={(v) => update({ primaryColor: v })} />
          <ColorPicker label="Secondary Color" value={data.secondaryColor} onChange={(v) => update({ secondaryColor: v })} />
          <div>
            <label htmlFor="font-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font</label>
            <select
              id="font-select"
              value={data.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="icon-style-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Social Icon Style</label>
            <select
              id="icon-style-select"
              value={data.iconStyle}
              onChange={(e) => update({ iconStyle: e.target.value as IconStyle })}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              {ICON_STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Icons are hosted as images so they display in Gmail &amp; Outlook.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
