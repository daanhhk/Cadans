# STAP 7 — ijk-meting: zonetijd tegen gemeten TSS

Ruwe meting van 27-07-2026, opgehaald met een READ-ONLY SELECT op remote D1. Dit is de
ijkbasis voor twee punten die bewust OPEN staan: de TSS-weging
(`docs/STAP7-BOUW12-RECON.md` §6) en de nog niet vastgelegde dosis- en selectieregel voor een
lange dag (§9 punt 4). De query staat als `docs/STAP7-IJKING.sql` in de repo; dit document
draagt uitsluitend de UITVOER.

GEEN duiding, GEEN conclusie, GEEN afgeleid getal — alles hieronder komt letterlijk uit de
uitvoer. De interpretatie gebeurt in de chat.

## Commando

Gedraaid vanuit `workers/api` met de gepinde wrangler 4.106.0, per statement:

    npx wrangler d1 execute cadans --remote --command "<statement uit docs/STAP7-IJKING.sql>" --json

Elke response meldde `rows_written` 0 en `changed_db` false.

## 1. A_dekking — 1 rij

Kolommen: q, n_alles, n_fiets, n_zonejson, n_tss, n_kandidaat, datum_min, datum_max

    q=A_dekking | n_alles=250 | n_fiets=210 | n_zonejson=204 | n_tss=250 | n_kandidaat=204 | datum_min=2025-07-17T07:25:32 | datum_max=2026-07-25T19:24:22

## 2. B_zone_ids — 8 rijen

Kolommen: q, zone_id, n_ritten, min_totaal

    q=B_zone_ids | zone_id=SS | n_ritten=204 | min_totaal=1224.3
    q=B_zone_ids | zone_id=Z1 | n_ritten=204 | min_totaal=3007.3
    q=B_zone_ids | zone_id=Z2 | n_ritten=204 | min_totaal=8499.9
    q=B_zone_ids | zone_id=Z3 | n_ritten=204 | min_totaal=2344.9
    q=B_zone_ids | zone_id=Z4 | n_ritten=204 | min_totaal=1134.6
    q=B_zone_ids | zone_id=Z5 | n_ritten=204 | min_totaal=585.9
    q=B_zone_ids | zone_id=Z6 | n_ritten=204 | min_totaal=262.8
    q=B_zone_ids | zone_id=Z7 | n_ritten=204 | min_totaal=119.3

## 3. C_kruisproducten — 1 rij

Kolommen: q, n, s11, s12, s13, s14, s15, s22, s23, s24, s25, s33, s34, s35, s44, s45, s55, t1, t2, t3, t4, t5, tyy, sy, q1, q2, q3, q4, q5, sdm, sxs

    q=C_kruisproducten | n=204 | s11=92866.509 | s12=138200.331 | s13=49871.92 | s14=26610.388 | s15=23198.997 | s22=425180.383 | s23=107721.904 | s24=40283.542 | s25=35087.991 | s33=56845.317 | s34=22025.974 | s35=13456.655 | s44=21881.932 | s45=9968.491 | s55=12337.874 | t1=321116.1 | t2=679806.533 | t3=244870.867 | t4=130818.65 | t5=106384.767 | tyy=1488023 | sy=15345 | q1=3007.27 | q2=8499.93 | q3=2344.87 | q4=1134.58 | q5=967.9 | sdm=15959 | sxs=15954.5

## 4. D_duurband + E_intensiteitsband — 11 rijen

Kolommen: q, band, n, sdm, sxs, sy, q1, q2, q3, q4, q5, kwal_max, kwal_gem

    q=D_duurband | band=d1_lt60 | n=45 | sdm=2181 | sxs=2179.8 | sy=2356 | q1=348.4 | q2=1173.4 | q3=315.9 | q4=151.6 | q5=190.5 | kwal_max=38.7 | kwal_gem=14.6
    q=D_duurband | band=d2_60_89 | n=125 | sdm=9112 | sxs=9110 | sy=8583 | q1=1678.1 | q2=5243.4 | q3=1057.7 | q4=586.6 | q5=544 | kwal_max=54.1 | kwal_gem=17.5
    q=D_duurband | band=d3_90_119 | n=18 | sdm=1838 | sxs=1835.9 | sy=1669 | q1=261.4 | q2=993.4 | q3=380.5 | q4=132.9 | q5=67.8 | kwal_max=72.4 | kwal_gem=32.3
    q=D_duurband | band=d4_120_179 | n=11 | sdm=1521 | sxs=1521.4 | sy=1416 | q1=293.1 | q2=727.1 | q3=323.3 | q4=114.4 | q5=63.4 | kwal_max=95.2 | kwal_gem=45.6
    q=D_duurband | band=d5_180_239 | n=2 | sdm=385 | sxs=385.1 | sy=353 | q1=92.9 | q2=159.8 | q3=88.5 | q4=26.3 | q5=17.6 | kwal_max=70.9 | kwal_gem=66.2
    q=D_duurband | band=d6_240plus | n=3 | sdm=922 | sxs=922.3 | sy=968 | q1=333.4 | q2=202.8 | q3=178.8 | q4=122.7 | q5=84.6 | kwal_max=171.8 | kwal_gem=128.7
    q=E_intensiteitsband | band=e0_geen | n=1 | sdm=49 | sxs=49.2 | sy=34 | q1=0.9 | q2=48.3 | q3=0 | q4=0 | q5=0 | kwal_max=0 | kwal_gem=0
    q=E_intensiteitsband | band=e1_lt5pct | n=12 | sdm=808 | sxs=805.9 | sy=527 | q1=263.3 | q2=516.3 | q3=17.3 | q4=3.2 | q5=5.8 | kwal_max=3.8 | kwal_gem=2.2
    q=E_intensiteitsband | band=e2_5_15pct | n=47 | sdm=3615 | sxs=3612.5 | sy=2792 | q1=687.1 | q2=2576 | q3=256.3 | q4=35.8 | q5=57.4 | kwal_max=18.4 | kwal_gem=7.4
    q=E_intensiteitsband | band=e3_15_30pct | n=60 | sdm=4568 | sxs=4566.5 | sy=4452 | q1=766.8 | q2=2780.8 | q3=610.5 | q4=134.2 | q5=274.2 | kwal_max=34.9 | kwal_gem=17
    q=E_intensiteitsband | band=e4_30pct_plus | n=84 | sdm=6919 | sxs=6920.4 | sy=7540 | q1=1289.2 | q2=2578.5 | q3=1460.8 | q4=961.4 | q5=630.6 | kwal_max=171.8 | kwal_gem=36.3
