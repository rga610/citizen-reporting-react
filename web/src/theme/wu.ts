export const wuPalette = {
  primary: '#0B80A7',
  primaryDark: '#187090',
  muted: '#D9F0F4',
  mutedStrong: '#E8F7FA',
  background: '#F0F0F0',
  text: '#323232',
  textSecondary: '#9C9C9C',
  danger: '#B4231E',
} as const

export const wuTypography = {
  heading: 'font-serif font-bold text-[var(--wu-text)]',
  headingAccent: 'font-serif font-bold text-[var(--wu-primary)]',
  body: 'font-sans text-[var(--wu-text)]',
  secondary: 'font-sans text-sm text-[var(--wu-text-secondary)]',
  button: 'font-sans font-semibold uppercase tracking-wide',
} as const

export const wuLayout = {
  cardRadius: 'rounded-3xl',
  sectionPadding: 'p-6 sm:p-8',
} as const

export type WuPaletteKey = keyof typeof wuPalette

