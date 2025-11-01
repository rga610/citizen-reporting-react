export function periodId(startTs: Date, now = new Date()): number {
  const diffSec = Math.floor((now.getTime() - startTs.getTime()) / 1000);
  return Math.floor(diffSec / 900); // 15 minutes
}