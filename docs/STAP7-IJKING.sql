SELECT 'A_dekking' AS q,
  COUNT(*) AS n_alles,
  SUM(CASE WHEN type IN ('Ride','VirtualRide','GravelRide','MountainBikeRide') THEN 1 ELSE 0 END) AS n_fiets,
  SUM(CASE WHEN zone_times_json IS NOT NULL AND zone_times_json <> '' AND zone_times_json <> '[]' AND json_valid(zone_times_json) THEN 1 ELSE 0 END) AS n_zonejson,
  SUM(CASE WHEN tss IS NOT NULL AND tss > 0 THEN 1 ELSE 0 END) AS n_tss,
  SUM(CASE WHEN type IN ('Ride','VirtualRide','GravelRide','MountainBikeRide') AND tss IS NOT NULL AND tss > 0 AND zone_times_json IS NOT NULL AND zone_times_json <> '' AND zone_times_json <> '[]' AND json_valid(zone_times_json) THEN 1 ELSE 0 END) AS n_kandidaat,
  MIN(datum) AS datum_min, MAX(datum) AS datum_max
FROM activities WHERE user_id = 1;

SELECT 'B_zone_ids' AS q,
  json_extract(j.value,'$.id') AS zone_id,
  COUNT(*) AS n_ritten,
  ROUND(SUM(COALESCE(json_extract(j.value,'$.secs'),0))/60.0,1) AS min_totaal
FROM activities a, json_each(a.zone_times_json) j
WHERE a.user_id = 1 AND a.zone_times_json IS NOT NULL AND json_valid(a.zone_times_json)
GROUP BY zone_id ORDER BY zone_id;

WITH z AS (
  SELECT a.id AS aid, a.duur_min AS dm, a.tss AS ty,
         json_extract(j.value,'$.id') AS zid,
         COALESCE(json_extract(j.value,'$.secs'),0)/60.0 AS m
  FROM activities a, json_each(a.zone_times_json) j
  WHERE a.user_id = 1
    AND a.type IN ('Ride','VirtualRide','GravelRide','MountainBikeRide')
    AND a.tss IS NOT NULL AND a.tss > 0
    AND a.zone_times_json IS NOT NULL AND a.zone_times_json <> '' AND a.zone_times_json <> '[]'
    AND json_valid(a.zone_times_json)
), r AS (
  SELECT aid, MAX(dm) AS dm, MAX(ty) AS ty,
    SUM(CASE WHEN zid='Z1' THEN m ELSE 0 END) AS x1,
    SUM(CASE WHEN zid='Z2' THEN m ELSE 0 END) AS x2,
    SUM(CASE WHEN zid='Z3' THEN m ELSE 0 END) AS x3,
    SUM(CASE WHEN zid='Z4' THEN m ELSE 0 END) AS x4,
    SUM(CASE WHEN zid IN ('Z5','Z6','Z7') THEN m ELSE 0 END) AS x5,
    SUM(CASE WHEN zid IN ('Z1','Z2','Z3','Z4','Z5','Z6','Z7') THEN m ELSE 0 END) AS xs
  FROM z GROUP BY aid
  HAVING SUM(CASE WHEN zid IN ('Z1','Z2','Z3','Z4','Z5','Z6','Z7') THEN m ELSE 0 END) > 0
)
SELECT 'C_kruisproducten' AS q, COUNT(*) AS n,
  ROUND(SUM(x1*x1),3) AS s11, ROUND(SUM(x1*x2),3) AS s12, ROUND(SUM(x1*x3),3) AS s13,
  ROUND(SUM(x1*x4),3) AS s14, ROUND(SUM(x1*x5),3) AS s15, ROUND(SUM(x2*x2),3) AS s22,
  ROUND(SUM(x2*x3),3) AS s23, ROUND(SUM(x2*x4),3) AS s24, ROUND(SUM(x2*x5),3) AS s25,
  ROUND(SUM(x3*x3),3) AS s33, ROUND(SUM(x3*x4),3) AS s34, ROUND(SUM(x3*x5),3) AS s35,
  ROUND(SUM(x4*x4),3) AS s44, ROUND(SUM(x4*x5),3) AS s45, ROUND(SUM(x5*x5),3) AS s55,
  ROUND(SUM(x1*ty),3) AS t1, ROUND(SUM(x2*ty),3) AS t2, ROUND(SUM(x3*ty),3) AS t3,
  ROUND(SUM(x4*ty),3) AS t4, ROUND(SUM(x5*ty),3) AS t5,
  SUM(ty*ty) AS tyy, SUM(ty) AS sy,
  ROUND(SUM(x1),2) AS q1, ROUND(SUM(x2),2) AS q2, ROUND(SUM(x3),2) AS q3,
  ROUND(SUM(x4),2) AS q4, ROUND(SUM(x5),2) AS q5,
  SUM(dm) AS sdm, ROUND(SUM(xs),1) AS sxs
FROM r;

WITH z AS (
  SELECT a.id AS aid, a.duur_min AS dm, a.tss AS ty,
         json_extract(j.value,'$.id') AS zid,
         COALESCE(json_extract(j.value,'$.secs'),0)/60.0 AS m
  FROM activities a, json_each(a.zone_times_json) j
  WHERE a.user_id = 1
    AND a.type IN ('Ride','VirtualRide','GravelRide','MountainBikeRide')
    AND a.tss IS NOT NULL AND a.tss > 0
    AND a.zone_times_json IS NOT NULL AND a.zone_times_json <> '' AND a.zone_times_json <> '[]'
    AND json_valid(a.zone_times_json)
), r AS (
  SELECT aid, MAX(dm) AS dm, MAX(ty) AS ty,
    SUM(CASE WHEN zid='Z1' THEN m ELSE 0 END) AS x1,
    SUM(CASE WHEN zid='Z2' THEN m ELSE 0 END) AS x2,
    SUM(CASE WHEN zid='Z3' THEN m ELSE 0 END) AS x3,
    SUM(CASE WHEN zid='Z4' THEN m ELSE 0 END) AS x4,
    SUM(CASE WHEN zid IN ('Z5','Z6','Z7') THEN m ELSE 0 END) AS x5,
    SUM(CASE WHEN zid IN ('Z1','Z2','Z3','Z4','Z5','Z6','Z7') THEN m ELSE 0 END) AS xs
  FROM z GROUP BY aid
  HAVING SUM(CASE WHEN zid IN ('Z1','Z2','Z3','Z4','Z5','Z6','Z7') THEN m ELSE 0 END) > 0
)
SELECT 'D_duurband' AS q,
  CASE WHEN dm < 60 THEN 'd1_lt60' WHEN dm < 90 THEN 'd2_60_89' WHEN dm < 120 THEN 'd3_90_119'
       WHEN dm < 180 THEN 'd4_120_179' WHEN dm < 240 THEN 'd5_180_239' ELSE 'd6_240plus' END AS band,
  COUNT(*) AS n, SUM(dm) AS sdm, ROUND(SUM(xs),1) AS sxs, SUM(ty) AS sy,
  ROUND(SUM(x1),1) AS q1, ROUND(SUM(x2),1) AS q2, ROUND(SUM(x3),1) AS q3,
  ROUND(SUM(x4),1) AS q4, ROUND(SUM(x5),1) AS q5,
  ROUND(MAX(x3+x4+x5),1) AS kwal_max, ROUND(AVG(x3+x4+x5),1) AS kwal_gem
FROM r GROUP BY band
UNION ALL
SELECT 'E_intensiteitsband' AS q,
  CASE WHEN (x3+x4+x5) = 0 THEN 'e0_geen'
       WHEN (x3+x4+x5) < 0.05*xs THEN 'e1_lt5pct'
       WHEN (x3+x4+x5) < 0.15*xs THEN 'e2_5_15pct'
       WHEN (x3+x4+x5) < 0.30*xs THEN 'e3_15_30pct'
       ELSE 'e4_30pct_plus' END AS band,
  COUNT(*) AS n, SUM(dm) AS sdm, ROUND(SUM(xs),1) AS sxs, SUM(ty) AS sy,
  ROUND(SUM(x1),1) AS q1, ROUND(SUM(x2),1) AS q2, ROUND(SUM(x3),1) AS q3,
  ROUND(SUM(x4),1) AS q4, ROUND(SUM(x5),1) AS q5,
  ROUND(MAX(x3+x4+x5),1) AS kwal_max, ROUND(AVG(x3+x4+x5),1) AS kwal_gem
FROM r GROUP BY band
ORDER BY 1, 2;
