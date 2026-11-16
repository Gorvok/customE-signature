import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { IconStyle, SignatureData, SocialPlatform } from '../types';
import { socialPlatforms } from '../data/socialPlatforms';
import { palettes } from '../data/palettes';
import {
  BRAND_MARK_OPTIONS,
  BRAND_MARK_SIDE_OPTIONS,
  DENSITY_OPTIONS,
  FONTS,
  ICON_STYLE_OPTIONS,
  LIMITS,
  TEXT_DIRECTION_OPTIONS,
} from '../data/options';
import { monogramLetters } from '../utils/monogram';
import { downloadBlob } from '../utils/exportHelpers';
import { useToast } from '../toast';
import { getSocialIconSvg } from '../utils/socialIcons';
import { isValidEmail, isLikelyUrl } from '../utils/validators';
import ImageUploader from './ImageUploader';
import ColorPicker from './ColorPicker';
import ContrastNote from './ContrastNote';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  data: SignatureData;
  onChange: (data: SignatureData) => void;
}

const icon = (path: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);

const SECTION_ICONS: Record<SectionId, ReactNode> = {
  personal: icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  contact: icon(<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></>),
  social: icon(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>),
  cta: icon(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>),
  disclaimer: icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>),
  branding: icon(<><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.012 17.5 2 12 2z" /></>),
};

const SECTIONS = [
  { id: 'personal', label: 'Personal' },
  { id: 'contact', label: 'Contact' },
  { id: 'social', label: 'Social' },
  { id: 'cta', label: 'CTA' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'branding', label: 'Branding' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function InputField({ label, value, onChange, placeholder, type = 'text', error, maxLength = LIMITS.text }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string; maxLength?: number;
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
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:outline-none transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:border-accent-ring focus:ring-accent-ring'
        }`}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function SignatureForm({ data, onChange }: Props) {
  const { addToast } = useToast();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // After a keyboard move, focus follows the moved row: the same arrow button
  // if it is still enabled, otherwise its sibling (at the top or bottom the
  // pressed button becomes disabled and would drop focus to <body>).
  const focusAfterMove = useRef<{ id: string; dir: 'up' | 'down' } | null>(null);
  useEffect(() => {
    const pending = focusAfterMove.current;
    if (!pending) return;
    focusAfterMove.current = null;
    const same = document.getElementById(`move-${pending.dir}-${pending.id}`);
    const other = document.getElementById(`move-${pending.dir === 'up' ? 'down' : 'up'}-${pending.id}`);
    const target = same instanceof HTMLButtonElement && !same.disabled ? same : other;
    target?.focus();
  }, [data.socialOrder]);
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    personal: true,
    contact: true,
    social: false,
    cta: false,
    disclaimer: false,
    branding: false,
  });

  function toggle(id: SectionId) {
    setOpen((o) => ({ ...o, [id]: !o[id] }));
  }

  function openAndScroll(id: SectionId) {
    setOpen((o) => ({ ...o, [id]: true }));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  async function handleMonogramPng() {
    try {
      const letters = monogramLetters(data);
      const { monogramFilename, monogramPngBlob } = await import('../utils/monogramImage');
      const blob = await monogramPngBlob(letters, { background: data.primaryColor, font: data.fontFamily });
      downloadBlob(blob, monogramFilename(letters));
      addToast('Downloaded the monogram as a PNG');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not draw the monogram.', 'error');
    }
  }

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

  function moveSocial(from: number, to: number, dir?: 'up' | 'down') {
    if (to < 0 || to >= orderedPlatforms.length || from === to) return;
    const ids = orderedPlatforms.map((p) => p.id);
    const [moved] = ids.splice(from, 1);
    if (!moved) return;
    ids.splice(to, 0, moved);
    if (dir) focusAfterMove.current = { id: moved, dir };
    update({ socialOrder: ids });
  }

  const filled = {
    personal: Boolean(data.fullName || data.jobTitle || data.company || data.pronouns || data.department),
    contact: Boolean(data.phone || data.email || data.website || data.address || data.bookingLink),
    social: Object.values(data.socials).some((v) => v.trim()),
    cta: Boolean(data.ctaLabel && data.ctaUrl),
    disclaimer: Boolean(data.disclaimer.trim()),
    branding: Boolean(data.brandMark === 'monogram' ? monogramLetters(data) : data.logoUrl),
  };

  return (
    <div className="space-y-4">
      {/* Quick-jump nav */}
      <nav aria-label="Form sections" className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => openAndScroll(s.id)}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-accent-ring hover:text-accent-text transition-colors"
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Personal Info */}
      <CollapsibleSection id="sec-personal" title="Personal Info" subtitle="Name, role and company" icon={SECTION_ICONS.personal} filled={filled.personal} open={open.personal} onToggle={() => toggle('personal')}>
        <div className="space-y-3">
          <InputField label="Full Name" value={data.fullName} onChange={(v) => update({ fullName: v })} placeholder="John Doe" />
          <InputField label="Pronouns" value={data.pronouns} onChange={(v) => update({ pronouns: v })} placeholder="she/her" />
          <InputField label="Job Title" value={data.jobTitle} onChange={(v) => update({ jobTitle: v })} placeholder="CEO / Designer" />
          <InputField label="Department" value={data.department} onChange={(v) => update({ department: v })} placeholder="Engineering" />
          <InputField label="Company" value={data.company} onChange={(v) => update({ company: v })} placeholder="Acme Inc." />
        </div>
      </CollapsibleSection>

      {/* Contact */}
      <CollapsibleSection id="sec-contact" title="Contact" subtitle="How people reach you" icon={SECTION_ICONS.contact} filled={filled.contact} open={open.contact} onToggle={() => toggle('contact')}>
        <div className="space-y-3">
          <InputField label="Phone" value={data.phone} onChange={(v) => update({ phone: v })} placeholder="(555) 123-4567" type="tel" />
          <InputField label="Email" value={data.email} onChange={(v) => update({ email: v })} placeholder="you@example.com" type="email" error={data.email && !isValidEmail(data.email) ? 'Enter a valid email address.' : undefined} />
          <InputField label="Website" value={data.website} onChange={(v) => update({ website: v })} placeholder="www.example.com" type="url" maxLength={LIMITS.url} error={data.website && !isLikelyUrl(data.website) ? 'Enter a valid URL.' : undefined} />
          <InputField label="Office Address" value={data.address} onChange={(v) => update({ address: v })} placeholder="123 Main St, City" maxLength={LIMITS.address} />
          <InputField label="Booking Link" value={data.bookingLink} onChange={(v) => update({ bookingLink: v })} placeholder="calendly.com/you" type="url" maxLength={LIMITS.url} error={data.bookingLink && !isLikelyUrl(data.bookingLink) ? 'Enter a valid URL.' : undefined} />
        </div>
      </CollapsibleSection>

      {/* Social Links */}
      <CollapsibleSection id="sec-social" title="Social Links" subtitle="Drag or use arrows to reorder" icon={SECTION_ICONS.social} filled={filled.social} open={open.social} onToggle={() => toggle('social')}>
        <div className="space-y-3">
          {orderedPlatforms.map((platform, index) => (
            <div
              key={platform.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveSocial(dragIndex, index);
                setDragIndex(null);
              }}
              className={`flex items-center gap-1.5 rounded-lg transition-opacity ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <span
                draggable
                onDragStart={(e) => {
                  // Firefox refuses to start a drag with no data attached.
                  e.dataTransfer.setData('text/plain', String(index));
                  e.dataTransfer.effectAllowed = 'move';
                  setDragIndex(index);
                }}
                onDragEnd={() => setDragIndex(null)}
                aria-hidden="true"
                title="Drag to reorder"
                className="cursor-grab active:cursor-grabbing text-muted select-none"
              >
                <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor"><circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="9" cy="8" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="9" cy="13" r="1.5"/></svg>
              </span>
              <span
                aria-hidden="true"
                className="w-5 h-5 flex-shrink-0 text-muted"
                dangerouslySetInnerHTML={{ __html: getSocialIconSvg(platform.id, 'currentColor') }}
              />
              <label htmlFor={`social-${platform.id}`} className="text-sm text-gray-600 dark:text-gray-300 min-w-16 sm:min-w-20">{platform.name}</label>
              <input
                id={`social-${platform.id}`}
                type="text"
                value={data.socials[platform.id] || ''}
                onChange={(e) => updateSocial(platform.id, e.target.value)}
                placeholder={platform.placeholder}
                maxLength={LIMITS.url}
                className="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
              />
              <div className="flex flex-col">
                <button type="button" id={`move-up-${platform.id}`} onClick={() => moveSocial(index, index - 1, 'up')} disabled={index === 0} aria-label={`Move ${platform.name} up`} className="text-muted hover:text-accent-text disabled:opacity-30 disabled:hover:text-muted leading-none">
                  <svg width="14" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button type="button" id={`move-down-${platform.id}`} onClick={() => moveSocial(index, index + 1, 'down')} disabled={index === orderedPlatforms.length - 1} aria-label={`Move ${platform.name} down`} className="text-muted hover:text-accent-text disabled:opacity-30 disabled:hover:text-muted leading-none">
                  <svg width="14" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Call to Action */}
      <CollapsibleSection id="sec-cta" title="Call to Action" subtitle="An optional button" icon={SECTION_ICONS.cta} filled={filled.cta} open={open.cta} onToggle={() => toggle('cta')}>
        <div className="space-y-3">
          <InputField label="Button Text" value={data.ctaLabel} onChange={(v) => update({ ctaLabel: v })} placeholder="Book a demo" />
          <InputField label="Button Link" value={data.ctaUrl} onChange={(v) => update({ ctaUrl: v })} placeholder="https://example.com/demo" type="url" maxLength={LIMITS.url} error={data.ctaUrl && !isLikelyUrl(data.ctaUrl) ? 'Enter a valid URL.' : undefined} />
          <p className="text-xs text-hint">
            Shows as a button in most clients. Outlook for Windows keeps the button shape only when you install the downloaded HTML file; when pasted, it shows a styled link.
          </p>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={data.utmEnabled}
                onChange={(e) => update({ utmEnabled: e.target.checked })}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Tag links for analytics
                <span className="block text-xs text-hint">
                  Adds campaign parameters to your website, booking and button links so clicks from
                  the signature can be told apart. Social profiles are left untouched.
                </span>
              </span>
            </label>

            {data.utmEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InputField label="utm_source" value={data.utmSource} onChange={(v) => update({ utmSource: v })} placeholder="email" />
                <InputField label="utm_medium" value={data.utmMedium} onChange={(v) => update({ utmMedium: v })} placeholder="signature" />
                <InputField label="utm_campaign" value={data.utmCampaign} onChange={(v) => update({ utmCampaign: v })} placeholder="spring-launch" />
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Disclaimer */}
      <CollapsibleSection id="sec-disclaimer" title="Legal Disclaimer" subtitle="Confidentiality notice" icon={SECTION_ICONS.disclaimer} filled={filled.disclaimer} open={open.disclaimer} onToggle={() => toggle('disclaimer')}>
        <textarea
          value={data.disclaimer}
          onChange={(e) => update({ disclaimer: e.target.value })}
          placeholder="This email and any attachments are confidential…"
          rows={3}
          maxLength={LIMITS.disclaimer}
          aria-label="Legal disclaimer"
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
        />
        <p className="mt-1 text-right text-xs text-hint">{data.disclaimer.length}/{LIMITS.disclaimer}</p>
      </CollapsibleSection>

      {/* Branding */}
      <CollapsibleSection id="sec-branding" title="Branding" subtitle="Logo, colors, font and icons" icon={SECTION_ICONS.branding} filled={filled.branding} open={open.branding} onToggle={() => toggle('branding')}>
        <div className="space-y-4">
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand mark</legend>
            <div className="space-y-2">
              {BRAND_MARK_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="brand-mark"
                    value={option.value}
                    checked={data.brandMark === option.value}
                    onChange={() => update({ brandMark: option.value })}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option.label}
                    <span className="block text-xs text-hint">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {data.brandMark === 'logo' ? (
            <ImageUploader value={data.logoUrl} onChange={(v) => update({ logoUrl: v })} />
          ) : (
            <div className="space-y-2">
              <InputField
                label="Initials"
                value={data.monogramText}
                onChange={(v) => update({ monogramText: v })}
                placeholder={monogramLetters({ ...data, monogramText: '' }) || 'AB'}
                maxLength={LIMITS.monogramText}
              />
              <p className="text-xs text-hint">
                {monogramLetters(data)
                  ? `Shows as ${monogramLetters(data)} in a circle of your primary color. Leave blank to use your initials.`
                  : 'Add your name above, or type the letters here.'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleMonogramPng()}
                  disabled={!monogramLetters(data)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 text-gray-900 dark:text-white transition-colors"
                >
                  Download as PNG
                </button>
                <span className="text-xs text-hint">
                  For editors that only take an image. The signature itself needs no file.
                </span>
              </div>

            </div>
          )}
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Presets</span>
            <div className="flex flex-wrap gap-2">
              {palettes.map((p) => {
                const active = data.primaryColor.toLowerCase() === p.primary.toLowerCase() && data.secondaryColor.toLowerCase() === p.secondary.toLowerCase();
                return (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    aria-label={`Apply ${p.name} palette`}
                    aria-pressed={active}
                    onClick={() => update({ primaryColor: p.primary, secondaryColor: p.secondary })}
                    className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-transform hover:scale-110 ${active ? 'border-accent-ring ring-2 ring-accent-ring/30' : 'border-white dark:border-gray-700 shadow'}`}
                    style={{ background: `linear-gradient(135deg, ${p.primary} 0 50%, ${p.secondary} 50% 100%)` }}
                  />
                );
              })}
            </div>
          </div>
          <ColorPicker label="Primary Color" value={data.primaryColor} onChange={(v) => update({ primaryColor: v })} />
          <ColorPicker label="Secondary Color" value={data.secondaryColor} onChange={(v) => update({ secondaryColor: v })} />
          <ContrastNote primary={data.primaryColor} secondary={data.secondaryColor} />
          <div>
            <label htmlFor="font-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font</label>
            <select
              id="font-select"
              value={data.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
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
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
            >
              {ICON_STYLE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-hint">Icons are hosted as images so they display in Gmail &amp; Outlook.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="density-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spacing</label>
              <select
                id="density-select"
                value={data.density}
                onChange={(e) => update({ density: e.target.value === 'compact' ? 'compact' : 'comfortable' })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
              >
                {DENSITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-hint">Compact keeps the text size and takes out the air.</p>
            </div>
            <div>
              <label htmlFor="mark-side-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand mark position</label>
              <select
                id="mark-side-select"
                value={data.brandMarkSide}
                onChange={(e) => update({ brandMarkSide: e.target.value === 'end' ? 'end' : 'start' })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
              >
                {BRAND_MARK_SIDE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-hint">For templates that put the mark beside your name.</p>
            </div>
          </div>

          <div>
            <label htmlFor="direction-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text Direction</label>
            <select
              id="direction-select"
              value={data.textDirection}
              onChange={(e) => update({ textDirection: e.target.value === 'rtl' ? 'rtl' : 'ltr' })}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
            >
              {TEXT_DIRECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-hint">Mirrors the whole layout, not just the text.</p>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
