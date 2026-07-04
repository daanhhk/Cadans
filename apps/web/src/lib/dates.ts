// Lokale datum als "yyyy-MM-dd" — bewust NIET toISOString()/UTC: 's avonds in NL
// (UTC+1/+2) zou dat naar morgen schuiven. Spiegelt de dag-keying van de Worker
// (dates.ts toD1Date). Alleen voor de check-in-URL (GET/PUT /api/checkin/:date).
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
