import type { SignatureData } from '../types';
import { socialPlatforms } from '../data/socialPlatforms';
import { getSocialIconSvg } from '../utils/socialIcons';
import ImageUploader from './ImageUploader';
import ColorPicker from './ColorPicker';

interface Props {
  data: SignatureData;
  onChange: (data: SignatureData) => void;
}

const FONTS = ['Inter', 'Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Courier New', 'Times New Roman'];

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
      />
    </div>
  );
}

export default function SignatureForm({ data, onChange }: Props) {
  function update(partial: Partial<SignatureData>) {
    onChange({ ...data, ...partial });
  }

  function updateSocial(platformId: string, value: string) {
    onChange({ ...data, socials: { ...data.socials, [platformId]: value } });
  }

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Personal Info</h3>
        <div className="space-y-3">
          <InputField label="Full Name" value={data.fullName} onChange={(v) => update({ fullName: v })} placeholder="John Doe" />
          <InputField label="Job Title" value={data.jobTitle} onChange={(v) => update({ jobTitle: v })} placeholder="CEO / Designer" />
          <InputField label="Company" value={data.company} onChange={(v) => update({ company: v })} placeholder="Acme Inc." />
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
        <div className="space-y-3">
          <InputField label="Phone" value={data.phone} onChange={(v) => update({ phone: v })} placeholder="(555) 123-4567" type="tel" />
          <InputField label="Email" value={data.email} onChange={(v) => update({ email: v })} placeholder="you@example.com" type="email" />
          <InputField label="Website" value={data.website} onChange={(v) => update({ website: v })} placeholder="www.example.com" type="url" />
        </div>
      </section>

      {/* Social Links */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
        <div className="space-y-3">
          {socialPlatforms.map((platform) => (
            <div key={platform.id} className="flex items-center gap-2">
              <span
                className="w-5 h-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: getSocialIconSvg(platform.id, 'currentColor') }}
              />
              <label className="text-sm text-gray-600 dark:text-gray-300 min-w-20">{platform.name}</label>
              <input
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

      {/* Branding */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Branding</h3>
        <div className="space-y-4">
          <ImageUploader value={data.logoUrl} onChange={(v) => update({ logoUrl: v })} />
          <ColorPicker label="Primary Color" value={data.primaryColor} onChange={(v) => update({ primaryColor: v })} />
          <ColorPicker label="Secondary Color" value={data.secondaryColor} onChange={(v) => update({ secondaryColor: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font</label>
            <select
              value={data.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
