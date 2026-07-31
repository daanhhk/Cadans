/**
 * workouts/vo2max.ts — de VO2max-VARIANTPOOLS (port of Workouts/Vo2max.gs).
 *
 * ROADMAP punt 7: VO2max is geen DOEL meer, dus de doel-bibliotheek `workoutForVo2max` is weg.
 * Wat blijft is dit: de pools die het TYPE "vo2max" voeden. VO2max blijft een MIDDEL
 * (DOELEN-SPEC §3.6) en `klim_kort` leunt er zwaar op. De vier watt/bpm-helpers werden alleen
 * door de verwijderde bibliotheek gebruikt; de pools dragen hun eigen structuur.
 */

export function vo2Pools_(): any {
  return {
    vo2max: [
      {
        id: "vo2_5x4",
        naam: "VO2 5×4min",
        zone: "anaerobic",
        warmup: 15,
        cooldown: 12,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "VO2",
            reps: 5,
            onMin: 4,
            onPct: a(110),
            offMin: 4,
            offPct: 50,
          },
        ],
        tip: "Klassieke VO2max build — 20 min cumulatief in zone.",
      },
      {
        id: "vo2_4x5",
        naam: "VO2 4×5min",
        zone: "anaerobic",
        warmup: 15,
        cooldown: 12,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "VO2",
            reps: 4,
            onMin: 5,
            onPct: a(108),
            offMin: 4,
            offPct: 50,
          },
        ],
      },
      {
        id: "vo2_6x3",
        naam: "VO2 6×3min",
        zone: "anaerobic",
        warmup: 15,
        cooldown: 12,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "VO2",
            reps: 6,
            onMin: 3,
            onPct: a(112),
            offMin: 3,
            offPct: 50,
          },
        ],
      },
      {
        id: "vo2_8x2",
        naam: "VO2 8×2min",
        zone: "anaerobic",
        warmup: 15,
        cooldown: 12,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "VO2",
            reps: 8,
            onMin: 2,
            onPct: a(115),
            offMin: 2,
            offPct: 50,
          },
        ],
      },
      {
        id: "vo2_3030",
        naam: "VO2 30/30 — 2×10",
        zone: "anaerobic",
        warmup: 15,
        cooldown: 12,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "30/30 blok 1",
            reps: 10,
            onSec: 30,
            onPct: a(118),
            offSec: 30,
            offPct: 50,
          },
          { kind: "steady", label: "rust", durMin: 5, pct: a(50), zone: "low" },
          {
            kind: "int",
            label: "30/30 blok 2",
            reps: 10,
            onSec: 30,
            onPct: a(118),
            offSec: 30,
            offPct: 50,
          },
        ],
        tip: "30/30s pakt VO2-zone met minder lactaat dan continue intervallen.",
      },
      {
        id: "vo2_4020",
        naam: "VO2 40/20 — 2×9",
        zone: "anaerobic",
        warmup: 15,
        cooldown: 12,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "40/20 blok 1",
            reps: 9,
            onSec: 40,
            onPct: a(115),
            offSec: 20,
            offPct: 50,
          },
          { kind: "steady", label: "rust", durMin: 5, pct: a(50), zone: "low" },
          {
            kind: "int",
            label: "40/20 blok 2",
            reps: 9,
            onSec: 40,
            onPct: a(115),
            offSec: 20,
            offPct: 50,
          },
        ],
      },
    ],
  };
}
