export const sections = [
  { id: 'about', label: 'About', number: '01', color: 'var(--about)', ink: 'var(--about-ink)', contrast: '#07151d' },
  { id: 'projects', label: 'Projects', number: '02', color: 'var(--projects)', ink: 'var(--projects-ink)', contrast: '#1c1400' },
  { id: 'skills', label: 'Skills', number: '03', color: 'var(--skills)', ink: 'var(--skills-ink)', contrast: '#04170f' },
  { id: 'certifications', label: 'Certifications', number: '04', color: 'var(--certifications)', ink: 'var(--certifications-ink)', contrast: '#1f0907' },
  { id: 'education', label: 'Education', number: '05', color: 'var(--education)', ink: 'var(--education-ink)', contrast: '#ffffff' },
  { id: 'contact', label: 'Contact', number: '06', color: 'var(--contact)', ink: 'var(--contact-ink)', contrast: '#20051f' },
] as const;

export type SectionId = (typeof sections)[number]['id'];
export type SectionTheme = (typeof sections)[number];

export const sectionById = Object.fromEntries(
  sections.map((section) => [section.id, section]),
) as Record<SectionId, SectionTheme>;

export function isSectionId(value: string): value is SectionId {
  return sections.some((section) => section.id === value);
}
