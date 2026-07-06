import type { ProposalWeek, ProposalWorkout } from "./proposal";
import type { ReadinessResult } from "./readiness";

// Handgebouwde fixture op de ECHTE ProposalWeek-shape (typecheck dwingt 'm af), spiegelt
// de geseede week (week-maandag 2026-07-06; 07-07 = pendel met 2 sessies; 07-09 & 07-12 =
// rustdag). SCHONE namen — reproduceert NOOIT de engine-"[object Object]"-naam-lek.
// Stap 3 vervangt deze fixture door een live buildWeekProposal + deriveReadiness.

const wo = (
  naam: string,
  focus: string,
  zones: string[],
  totaalMin: number,
  tss: number,
  structuur: string[][],
  eindopmerking: string,
): ProposalWorkout => ({
  naam,
  focus,
  zones,
  totaalMin,
  tss,
  structuur,
  eindopmerking,
});

const WARM = [
  "Warming-up",
  "12 min",
  "140-190W",
  "<145 bpm",
  "Inrijden, opbouwend",
];
const COOL = ["Cooling-down", "8 min", "126-154W", "—", "Uitrijden"];

export const SCHEMA_FIXTURE_TODAY = "2026-07-06";

export const schemaFixture: {
  proposalWeek: ProposalWeek;
  readiness: ReadinessResult;
  doneTssByDate: Record<string, number>;
  todayISO: string;
} = {
  todayISO: SCHEMA_FIXTURE_TODAY,
  doneTssByDate: {},
  proposalWeek: {
    weekMonday: "2026-07-06",
    days: [
      {
        datum: "2026-07-06",
        dagIdx: 0,
        voorgesteldType: "sweet_spot",
        reden: "Sleutelsessie · FTP — fase Base",
        archetypeId: "ss_3x15",
        sessions: [
          wo(
            "Sweet Spot 3×15",
            "drempel-onderkant",
            ["low", "high"],
            75,
            68,
            [
              WARM,
              [
                "Sweet Spot",
                "3×15 min",
                "246-263W",
                "158-168 bpm",
                "88-93% FTP, soepel",
              ],
              [
                "Herstel",
                "2×5 min",
                "140-168W",
                "—",
                "Rustig tussen de blokken",
              ],
              COOL,
            ],
            "Degelijk sweet-spot-volume — controle houden, niet forceren.",
          ),
        ],
      },
      {
        datum: "2026-07-07",
        dagIdx: 1,
        voorgesteldType: "pendel_ftp_intervals",
        reden: "Pendelrit — vaste woon-werkrit",
        archetypeId: null,
        sessions: [
          wo(
            "Pendel + Z2 (45 min)",
            "aerobic base",
            ["low"],
            45,
            27,
            [
              ["Heen", "22 min", "168-202W", "133-146 bpm", "Rustige Z2"],
              ["Terug", "23 min", "168-202W", "133-146 bpm", "Rustige Z2"],
            ],
            "Rustige pendel — fris op werk aankomen.",
          ),
          wo(
            "Pendel + FTP intervallen (45 min)",
            "pendel + doel-specifiek",
            ["low", "high"],
            45,
            39,
            [
              [
                "Heen Z2",
                "22 min",
                "168-202W",
                "133-146 bpm",
                "Aanrijden, rustig",
              ],
              [
                "Terug-intervallen",
                "3-4× 8 min",
                "246-263W",
                "162-173 bpm",
                "Sweet Spot met 4 min rust",
              ],
              ["Cooldown", "5 min", "126-154W", "—", "Uitrijden"],
            ],
            "Pendel-dag — heen rustig, terug doel-specifieke intensiteit.",
          ),
        ],
      },
      {
        datum: "2026-07-08",
        dagIdx: 2,
        voorgesteldType: "vo2max",
        reden: "Sleutelsessie · FTP — fase Base",
        archetypeId: "vo2_5x4",
        sessions: [
          wo(
            "VO2max 5×4",
            "aerobe capaciteit",
            ["low", "anaerobic"],
            60,
            62,
            [
              WARM,
              [
                "Interval",
                "5×4 min",
                "296-320W",
                "172-182 bpm",
                "108-115% FTP, gelijkmatig",
              ],
              ["Herstel", "5×4 min", "126-154W", "—", "Volledig lossen"],
              COOL,
            ],
            "Vijf harde blokken — de laatste twee moeten zeer doen.",
          ),
        ],
      },
      {
        datum: "2026-07-09",
        dagIdx: 3,
        voorgesteldType: null,
        reden: null,
        archetypeId: null,
        sessions: [],
      },
      {
        datum: "2026-07-10",
        dagIdx: 4,
        voorgesteldType: "threshold",
        reden: "Sleutelsessie · FTP — fase Base",
        archetypeId: "thr_2x20",
        sessions: [
          wo(
            "Drempel 2×20",
            "drempel",
            ["low", "high"],
            75,
            72,
            [
              WARM,
              [
                "Interval",
                "2×20 min",
                "263-277W",
                "165-174 bpm",
                "95-100% FTP",
              ],
              ["Herstel", "1×6 min", "140-168W", "—", "Rustig"],
              COOL,
            ],
            "Twee lange drempelblokken — de basis.",
          ),
        ],
      },
      {
        datum: "2026-07-11",
        dagIdx: 5,
        voorgesteldType: "long_z2",
        reden: "Lange duurrit — weekend",
        archetypeId: null,
        sessions: [
          wo(
            "Lange duurrit Z2",
            "aerobic base",
            ["low"],
            120,
            78,
            [
              ["Warming-up", "10 min", "140-190W", "<145 bpm", "Inrijden"],
              ["Duurblok", "100 min", "185-216W", "133-156 bpm", "Stabiele Z2"],
              ["Uitrijden", "10 min", "126-154W", "—", "Los"],
            ],
            "Rustige lange rit — tempo constant, ademhaling laag houden.",
          ),
        ],
      },
      {
        datum: "2026-07-12",
        dagIdx: 6,
        voorgesteldType: null,
        reden: null,
        archetypeId: null,
        sessions: [],
      },
    ],
  },
  readiness: {
    score: 72,
    band: "ready",
    factors: [
      {
        key: "vormTrend",
        label: "Vorm-trend",
        sub: 78,
        dot: "good",
        valueText: "+5 — fris",
      },
      {
        key: "belasting",
        label: "Belasting",
        sub: 70,
        dot: "good",
        valueText: "in balans",
      },
      {
        key: "hrv",
        label: "HRV",
        sub: 60,
        dot: "warn",
        valueText: "op baseline",
      },
      { key: "slaap", label: "Slaap", sub: 82, dot: "good", valueText: "7u30" },
    ],
    chips: [
      { label: "Vorm +5", tone: "fresh" },
      { label: "HRV 62", tone: "muted" },
    ],
    checkinDone: false,
    checkinDelta: 0,
    checkinSummary: "",
    checkin: null,
  },
};
