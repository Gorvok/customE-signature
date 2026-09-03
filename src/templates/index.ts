import type { SignatureTemplate } from '../types';
import { classicDark } from './classic-dark';
import { modernLight } from './modern-light';
import { minimal } from './minimal';
import { boldBanner } from './bold-banner';
import { corporate } from './corporate';
import { elegant } from './elegant';
import { compactCard } from './compact-card';

/** Every template, in display order. The first is the default. */
export const templates = [classicDark, modernLight, minimal, boldBanner, corporate, elegant, compactCard] as const satisfies readonly SignatureTemplate[];

/** The literal id of a known template, e.g. 'classic-dark'. */
export type TemplateId = (typeof templates)[number]['id'];

export const DEFAULT_TEMPLATE: SignatureTemplate = classicDark;

export function isTemplateId(id: unknown): id is TemplateId {
  return typeof id === 'string' && templates.some((t) => t.id === id);
}

/** The template with this id, or the default when the id is unknown. */
export function getTemplate(id: string): SignatureTemplate {
  return templates.find((t) => t.id === id) ?? DEFAULT_TEMPLATE;
}
