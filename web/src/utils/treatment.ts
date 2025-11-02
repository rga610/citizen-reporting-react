// Treatment to group letter mapping
// A=control, B=competitive, C=cooperative, D=individual
export const TREATMENT_TO_GROUP: Record<string, string> = {
  control: 'A',
  competitive: 'B',
  cooperative: 'C',
  individual: 'D',
}

export const GROUP_TO_TREATMENT: Record<string, string> = {
  A: 'control',
  B: 'competitive',
  C: 'cooperative',
  D: 'individual',
}

export function getGroupLetter(treatment: string): string {
  return TREATMENT_TO_GROUP[treatment] || '?'
}

export function getTreatmentFromGroup(group: string): string {
  return GROUP_TO_TREATMENT[group] || ''
}

