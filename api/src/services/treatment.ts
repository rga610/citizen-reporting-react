const treatments = ["control","individual","cooperative","competitive"] as const;
export type Treatment = typeof treatments[number];

export function assignTreatment(): Treatment {
  const i = Math.floor(Math.random() * treatments.length);
  return treatments[i];
}