// Lokale datum als "yyyy-MM-dd" — bewust NIET toISOString()/UTC: 's avonds in NL
// (UTC+1/+2) zou dat naar morgen schuiven. Spiegelt de dag-keying van de Worker
// (dates.ts toD1Date). Alleen voor de check-in-URL (GET/PUT /api/checkin/:date).
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Maandag van de HUIDIGE week als "yyyy-MM-dd" (lokaal; zo=0 → −6, anders 1−dow).
// Bewust NIET toISOString()/UTC — spiegelt todayIso()/parseLocalDate.
export function weekMondayIso(): string {
  const t = new Date();
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const dow = d.getDay();
  const mon = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + (dow === 0 ? -6 : 1 - dow),
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
}

// ISO-string → Date op LOKALE middernacht (nooit UTC): "yyyy-MM-dd" via de expliciete
// (y, m-1, d)-constructor, anders de native lokale parse (datetime zonder Z). De engine-
// afleidingen verwachten idx0 = een echt Date-object en bucketen op lokale kalendervelden;
// hergebruikt door parseActivityRows (activities.ts) én de readiness-rij-converter.
export function parseLocalDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(iso);
}

// ISO-8601-kalenderweeknummer (1..53) — 1:1 port van GAS `isoWeek_` (Script.html:84).
// Neemt de LOKALE kalenderdatum (y/m/d) en rekent in UTC om TZ-drift te vermijden; de
// donderdag-in-de-week bepaalt het jaar. Voedt de app-header "Week N" (§1).
export function isoWeekNumber(d: Date): number {
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dn = (u.getUTCDay() + 6) % 7; // ma=0..zo=6
  u.setUTCDate(u.getUTCDate() - dn + 3); // naar de donderdag van deze ISO-week
  const firstThu = new Date(Date.UTC(u.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      ((u.getTime() - firstThu.getTime()) / 86400000 -
        3 +
        ((firstThu.getUTCDay() + 6) % 7)) /
        7,
    )
  );
}
