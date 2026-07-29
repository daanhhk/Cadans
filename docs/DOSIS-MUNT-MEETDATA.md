# DOSIS-MUNT — MEETDATA

**GEMETEN 29-07-2026, VOLLEDIG READ-ONLY (juli 2026).** Vier `SELECT`-queries op de REMOTE D1 `cadans` (`npx wrangler d1 execute cadans --remote --json --command`, gedraaid vanuit `workers/api`; de databasenaam komt uit `wrangler.jsonc`) plus drie `GET`-calls op intervals.icu. Geen enkele schrijf-actie: ELKE D1-response draagt `rows_written: 0` en `changed_db: false`. Geen code, geen engine, geen migratie, geen deploy. Dit document is RUWE MEETDATA — niets gevouwen, niets geaggregeerd, niets afgerond; de vouwing doet de chat met de functies van de app zelf.

- **Q1** — welke zone-ids draagt de data. `rows_written: 0`, `changed_db: false`, `rows_read: 3514`. 8 resultaatrijen. Q1 is TWEE keer gedraaid: één keer om te lezen, één keer met directe redirect naar bestand. Beide responses identiek, beide `rows_written: 0` / `changed_db: false`.
- **Q2** — de rauwe vorm van drie recente blobs. `rows_written: 0`, `changed_db: false`, `rows_read: 454`. 3 resultaatrijen.
- **Q3** — additief of overlay, 25 recente ritten. `rows_written: 0`, `changed_db: false`, `rows_read: 879`. 25 resultaatrijen.
- **Q4** — de volledige dump vanaf 2025-09-01. `rows_written: 0`, `changed_db: false`, `rows_read: 467`. **217 resultaatrijen**, waarvan 173 met een geldige, niet-lege `zone_times_json`.
- **B1** — `GET https://intervals.icu/api/v1/athlete/<ATHLETE_ID>/activities?oldest=2026-07-23&newest=2026-07-29` → HTTP 200.
- **B2** — `GET /athlete/<ATHLETE_ID>` → HTTP 200; dit endpoint gaf het antwoord, in het veld `sportSettings`. Ter bevestiging ook `GET /athlete/<ATHLETE_ID>/sport-settings` → HTTP 200, identieke waarden. Het activiteit-object uit B1 draagt de zone-DEFINITIES niet, alleen `icu_power_zones` (de bovengrenzen) — zie hieronder.
- **AUTH EN SECRETS.** HTTP Basic, username `API_KEY`, wachtwoord = `INTERVALS_API_KEY` uit `workers/api/.dev.vars`. De sleutel staat NERGENS in dit document; de athlete-id is overal vervangen door `<ATHLETE_ID>`. Van locatie-, GPS-, start- en naamvelden staat alleen de NAAM in dit document, nooit de waarde.
- **QUOTING.** De vier queries zijn verbatim uitgevoerd zoals hieronder; alleen de shell-quoting is aangepast (bash-dubbele quotes met `\$` voor de JSON-paden `$.id` en `$.secs`, zodat de shell ze niet als variabele leest). De SQL zelf is ongewijzigd.

## De vier queries, verbatim

Q1 — welke zone-ids draagt de data:

```sql
SELECT json_extract(je.value,'$.id') AS zone_id, COUNT(DISTINCT a.id) AS ritten, SUM(CAST(json_extract(je.value,'$.secs') AS INTEGER)) AS secs FROM (SELECT id, zone_times_json FROM activities WHERE zone_times_json IS NOT NULL AND zone_times_json <> '' AND json_valid(zone_times_json)) a, json_each(a.zone_times_json) je GROUP BY 1 ORDER BY 1;
```

Q2 — de rauwe vorm van drie recente blobs:

```sql
SELECT datum, type, duur_min, tss, zone_times_json FROM activities WHERE zone_times_json IS NOT NULL AND zone_times_json <> '' AND json_valid(zone_times_json) ORDER BY datum DESC LIMIT 3;
```

Q3 — additief of overlay, 25 recente ritten:

```sql
SELECT a.datum, a.duur_min * 60 AS moving_secs, SUM(CASE WHEN json_extract(je.value,'$.id') LIKE 'Z%' THEN CAST(json_extract(je.value,'$.secs') AS INTEGER) ELSE 0 END) AS z_secs, SUM(CASE WHEN json_extract(je.value,'$.id') LIKE 'Z%' THEN 0 ELSE CAST(json_extract(je.value,'$.secs') AS INTEGER) END) AS overig_secs FROM (SELECT id, datum, duur_min, zone_times_json FROM activities WHERE zone_times_json IS NOT NULL AND zone_times_json <> '' AND json_valid(zone_times_json) ORDER BY datum DESC LIMIT 25) a, json_each(a.zone_times_json) je GROUP BY a.id ORDER BY a.datum DESC;
```

Q4 — de volledige dump:

```sql
SELECT datum, type, duur_min, tss, if_pct, zone_times_json FROM activities WHERE datum >= '2025-09-01' ORDER BY datum;
```

## Q1 — welke zone-ids draagt de data

```json
[
  {
    "results": [
      {
        "zone_id": "SS",
        "ritten": 204,
        "secs": 73459
      },
      {
        "zone_id": "Z1",
        "ritten": 204,
        "secs": 180436
      },
      {
        "zone_id": "Z2",
        "ritten": 204,
        "secs": 509996
      },
      {
        "zone_id": "Z3",
        "ritten": 204,
        "secs": 140692
      },
      {
        "zone_id": "Z4",
        "ritten": 204,
        "secs": 68075
      },
      {
        "zone_id": "Z5",
        "ritten": 204,
        "secs": 35151
      },
      {
        "zone_id": "Z6",
        "ritten": 204,
        "secs": 15766
      },
      {
        "zone_id": "Z7",
        "ritten": 204,
        "secs": 7157
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WEUR",
      "served_by_colo": "AMS",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 2.9211
      },
      "duration": 2.9211,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 290816,
      "rows_read": 3514,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
```

## Q2 — de rauwe vorm van drie recente blobs

```json
[
  {
    "results": [
      {
        "datum": "2026-07-25T19:24:22",
        "type": "Ride",
        "duur_min": 106,
        "tss": 103,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":703},{\"id\":\"Z2\",\"secs\":3072},{\"id\":\"Z3\",\"secs\":1603},{\"id\":\"Z4\",\"secs\":887},{\"id\":\"Z5\",\"secs\":42},{\"id\":\"Z6\",\"secs\":20},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":1318}]"
      },
      {
        "datum": "2026-07-23T16:13:58",
        "type": "Ride",
        "duur_min": 57,
        "tss": 36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":725},{\"id\":\"Z2\",\"secs\":2463},{\"id\":\"Z3\",\"secs\":223},{\"id\":\"Z4\",\"secs\":9},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":32}]"
      },
      {
        "datum": "2026-07-21T16:05:18",
        "type": "Ride",
        "duur_min": 65,
        "tss": 70,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":415},{\"id\":\"Z2\",\"secs\":1717},{\"id\":\"Z3\",\"secs\":498},{\"id\":\"Z4\",\"secs\":1230},{\"id\":\"Z5\",\"secs\":47},{\"id\":\"Z6\",\"secs\":3},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1178}]"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WEUR",
      "served_by_colo": "AMS",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.5759
      },
      "duration": 0.5759,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 290816,
      "rows_read": 454,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
```

## Q3 — additief of overlay, 25 recente ritten

```json
[
  {
    "results": [
      {
        "datum": "2026-07-25T19:24:22",
        "moving_secs": 6360,
        "z_secs": 6333,
        "overig_secs": 1318
      },
      {
        "datum": "2026-07-23T16:13:58",
        "moving_secs": 3420,
        "z_secs": 3420,
        "overig_secs": 32
      },
      {
        "datum": "2026-07-21T16:05:18",
        "moving_secs": 3900,
        "z_secs": 3910,
        "overig_secs": 1178
      },
      {
        "datum": "2026-07-20T16:08:50",
        "moving_secs": 3780,
        "z_secs": 3769,
        "overig_secs": 57
      },
      {
        "datum": "2026-07-18T13:03:16",
        "moving_secs": 7620,
        "z_secs": 7633,
        "overig_secs": 1319
      },
      {
        "datum": "2026-07-16T12:57:53",
        "moving_secs": 4260,
        "z_secs": 4284,
        "overig_secs": 140
      },
      {
        "datum": "2026-07-15T19:23:48",
        "moving_secs": 2880,
        "z_secs": 2858,
        "overig_secs": 450
      },
      {
        "datum": "2026-07-13T14:15:10",
        "moving_secs": 3000,
        "z_secs": 2994,
        "overig_secs": 91
      },
      {
        "datum": "2026-07-12T07:26:57",
        "moving_secs": 3720,
        "z_secs": 3747,
        "overig_secs": 21
      },
      {
        "datum": "2026-07-10T19:14:13",
        "moving_secs": 4320,
        "z_secs": 4303,
        "overig_secs": 67
      },
      {
        "datum": "2026-07-08T13:01:29",
        "moving_secs": 3660,
        "z_secs": 3640,
        "overig_secs": 777
      },
      {
        "datum": "2026-07-06T19:23:15",
        "moving_secs": 7500,
        "z_secs": 7510,
        "overig_secs": 632
      },
      {
        "datum": "2026-07-04T06:50:35",
        "moving_secs": 3720,
        "z_secs": 3702,
        "overig_secs": 1620
      },
      {
        "datum": "2026-07-02T19:21:16",
        "moving_secs": 6300,
        "z_secs": 6283,
        "overig_secs": 336
      },
      {
        "datum": "2026-06-29T16:20:01",
        "moving_secs": 4500,
        "z_secs": 4514,
        "overig_secs": 136
      },
      {
        "datum": "2026-06-29T07:37:46",
        "moving_secs": 4500,
        "z_secs": 4485,
        "overig_secs": 84
      },
      {
        "datum": "2026-06-27T19:18:31",
        "moving_secs": 3900,
        "z_secs": 3928,
        "overig_secs": 928
      },
      {
        "datum": "2026-06-25T19:40:30",
        "moving_secs": 6360,
        "z_secs": 6347,
        "overig_secs": 243
      },
      {
        "datum": "2026-06-22T19:30:28",
        "moving_secs": 3600,
        "z_secs": 3612,
        "overig_secs": 741
      },
      {
        "datum": "2026-06-19T08:54:31",
        "moving_secs": 7200,
        "z_secs": 7192,
        "overig_secs": 1648
      },
      {
        "datum": "2026-06-17T07:54:34",
        "moving_secs": 4740,
        "z_secs": 4762,
        "overig_secs": 424
      },
      {
        "datum": "2026-06-16T07:22:33",
        "moving_secs": 15960,
        "z_secs": 15955,
        "overig_secs": 1897
      },
      {
        "datum": "2026-06-15T08:33:18",
        "moving_secs": 9780,
        "z_secs": 9768,
        "overig_secs": 1778
      },
      {
        "datum": "2026-06-14T10:08:02",
        "moving_secs": 10860,
        "z_secs": 10888,
        "overig_secs": 1567
      },
      {
        "datum": "2026-06-12T07:01:05",
        "moving_secs": 3480,
        "z_secs": 3456,
        "overig_secs": 11
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WEUR",
      "served_by_colo": "AMS",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 1.177
      },
      "duration": 1.177,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 290816,
      "rows_read": 879,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
```

## B1 en B2 — intervals.icu, read-only

```text
### B1 — GET /athlete/<ATHLETE_ID>/activities?oldest=2026-07-23&newest=2026-07-29
HTTP 200
Activiteiten in venster: 2
Gekozen kwaliteitsrit: 2026-07-25T19:24:22 · type Ride · icu_training_load 103

AANTAL VELDEN: 178

VOLLEDIGE VELDNAMEN (alfabetisch):
  analysis_issues
  analyzed
  athlete_max_hr
  attachments
  average_altitude
  average_cadence
  average_clouds
  average_feels_like
  average_heartrate
  average_speed
  average_stance_time
  average_step_length
  average_stride
  average_temp
  average_vertical_oscillation
  average_vertical_ratio
  average_weather_temp
  average_wind_gust
  average_wind_speed
  avg_lr_balance
  calories
  carbs_ingested
  carbs_used
  coach_tick
  coasting_time
  commute
  compliance
  crank_length
  created
  custom_zones
  decoupling
  description
  device_name
  device_watts
  distance
  elapsed_time
  external_id
  feel
  file_sport_index
  file_type
  gap
  gap_model
  gap_zone_times
  gear
  group
  has_heartrate
  has_segments
  has_weather
  headwind_percent
  hr_load
  hr_load_type
  icu_achievements
  icu_athlete_id
  icu_atl
  icu_average_watts
  icu_cadence_z2
  icu_chat_id
  icu_color
  icu_cooldown_time
  icu_ctl
  icu_distance
  icu_efficiency_factor
  icu_ftp
  icu_hr_zone_times
  icu_hr_zones
  icu_hrr
  icu_ignore_hr
  icu_ignore_power
  icu_ignore_time
  icu_intensity
  icu_intervals_edited
  icu_joules
  icu_joules_above_ftp
  icu_lap_count
  icu_max_wbal_depletion
  icu_median_time_delta
  icu_pm_cp
  icu_pm_ftp
  icu_pm_ftp_secs
  icu_pm_ftp_watts
  icu_pm_p_max
  icu_pm_w_prime
  icu_power_hr
  icu_power_hr_z2
  icu_power_hr_z2_mins
  icu_power_spike_threshold
  icu_power_zones
  icu_recording_time
  icu_resting_hr
  icu_rolling_cp
  icu_rolling_ftp
  icu_rolling_ftp_delta
  icu_rolling_p_max
  icu_rolling_w_prime
  icu_rpe
  icu_sweet_spot_max
  icu_sweet_spot_min
  icu_sync_date
  icu_sync_error
  icu_training_load
  icu_training_load_data
  icu_variability_index
  icu_w_prime
  icu_warmup_time
  icu_weight
  icu_weighted_avg_watts
  icu_zone_times
  id
  ignore_pace
  ignore_parts
  ignore_velocity
  interval_summary
  kg_lifted
  lengths
  lock_intervals
  lthr
  max_altitude
  max_feels_like
  max_heartrate
  max_rain
  max_snow
  max_speed
  max_temp
  max_weather_temp
  min_altitude
  min_feels_like
  min_temp
  min_weather_temp
  moving_time
  name
  oauth_client_id
  oauth_client_name
  p30s_exponent
  p_max
  pace
  pace_load
  pace_load_type
  pace_zone_times
  pace_zones
  paired_event_id
  perceived_exertion
  polarization_index
  pool_length
  power_field
  power_field_names
  power_load
  power_meter
  power_meter_battery
  power_meter_serial
  prevailing_wind_deg
  race
  recording_stops
  route_id
  session_rpe
  skyline_chart_bytes
  source
  ss_cp
  ss_p_max
  ss_w_prime
  start_date
  start_date_local
  strain_score
  strava_id
  stream_types
  sub_type
  tags
  tailwind_percent
  threshold_pace
  timezone
  tiz_order
  total_elevation_gain
  total_elevation_loss
  trainer
  trimp
  type
  use_elevation_correction
  use_gap_zone_times
  workout_shift_secs

WAARDEN van de velden met zone/load/tss/intensity/ftp/pace/hr/watts in de naam:
  athlete_max_hr = 198
  custom_zones = null
  device_watts = <naam-only, privacy-filter>
  gap_zone_times = null
  hr_load = 100
  hr_load_type = "HR_ZONES"
  icu_average_watts = 202
  icu_ftp = 280
  icu_hr_zone_times = [1868,2558,558,1349,0,0,0]
  icu_hr_zones = [143,158,165,177,182,188,198]
  icu_hrr = null
  icu_ignore_hr = false
  icu_intensity = 76.42857
  icu_joules_above_ftp = 9179
  icu_pm_ftp = 242
  icu_pm_ftp_secs = 1680
  icu_pm_ftp_watts = 249
  icu_power_hr = 1.3466667
  icu_power_hr_z2 = 1.3458842
  icu_power_hr_z2_mins = 33
  icu_power_spike_threshold = null
  icu_power_zones = [55,75,90,105,120,150,999]
  icu_resting_hr = 49
  icu_rolling_ftp = 262
  icu_rolling_ftp_delta = 0
  icu_training_load = 103
  icu_training_load_data = 99
  icu_weighted_avg_watts = 214
  icu_zone_times = [{"id":"Z1","secs":703},{"id":"Z2","secs":3072},{"id":"Z3","secs":1603},{"id":"Z4","secs":887},{"id":"Z5","secs":42},{"id":"Z6","secs":20},{"id":"Z7","secs":6},{"id":"SS","secs":1318}]
  ignore_pace = false
  lthr = 178
  pace = 8.378904
  pace_load = null
  pace_load_type = null
  pace_zone_times = null
  pace_zones = null
  power_load = 103
  threshold_pace = null
  timezone = null
  use_gap_zone_times = null

Draagt het activiteit-object zone-DEFINITIES (grenzen)? niet gevonden op veldnaam

### B2 — zone-definities
GET /athlete/<ATHLETE_ID> → HTTP 200
  velden: 161
  zone-achtige velden: sportSettings, timezone
  sportSettings = [{"id":260479,"athlete_id":"<ATHLETE_ID>","types":["Ride","VirtualRide","MountainBikeRide","GravelRide","TrackRide","Cyclocross"],"warmup_time":1200,"cooldown_time":600,"ftp":280,"indoor_ftp":260,"w_prime":null,"p_max":null,"power_zones":[55,75,90,105,120,150,999],"sweet_spot_min":84,"sweet_spot_max":97,"power_spike_threshold":30,"power_zone_names":["Active Recovery","Endurance","Tempo","Threshold","VO2 Max","Anaerobic","Neuromuscular"],"ftp_est_min_secs":300,"use_laps_for_power_intervals":false,"keep_all_laps_for_power_intervals":true,"power_intervals_start_locked":false,"after_kj0":null,"after_kj1":null,"power_field":null,"lthr":178,"max_hr":198,"hr_zones":[143,158,165,177,182,188,198],"hr_zone_names":["Recovery","Aerobic","Tempo","SubThreshold","SuperThreshold","Aerobic Capacity","Anaerobic"],"hr_load_type":"HR_ZONES","hrrc_min_percent":100,"threshold_pace":null,"pace_units":null,"pace_zones":null,"pace_zone_names":null,"pace_load_type":"RUN","gap_model":"NONE","elevation_correction":"NO","use_gap_zone_times":false,"best_effort_distances":[400,800,1500,1609.34,3000,5000,10000,21097.5,42195],"pace_curve_start":100,"load_order":"POWER_HR_PACE","tiz_order":"POWER_HR_PACE","workout_order":"POWER_HR_PACE","interval_display":"POWER_HR_PACE","default_gear_id":null,"default_indoor_gear_id":null,"extract_workouts":false,"show_pauses":600,"ignore_velocity":false,"default_workout_time":null,"update_activity_name_from_workout":true,"created":"2022-01-28T09:43:03.493+00:00","updated":"2026-07-21T07:38:58.448+00:00","mmp_model":{"type":"FFT_CURVES","criticalPower":266,"wPrime":19740,"pMax":1274,"inputPointIndexes":[93],"ftp":272},"display":{"colorScheme":"SOLID","lowIntensity":50,"highIntensity":90,"lowLoad":25,"highLoad":250,"usePairedWorkoutColor":false,"ignoreWorkoutColors":false,"showAverageHR":true,"showNormalizedWatts":true,"showLoad":true,"showWork":false,"showWorkAboveFTP":false,"showWeightLifted":true,"showAveragePower":false,"showRPE":true,"showFeel":true,"showPace":true,"showGAP":false,"showIntensity":true,"showName":true,"showIntervals":false,"showSkylineChart":true,"showPairedWorkoutChart":false,"showDescription":false,"showStartTime":false,"preciseDistance":false,"shrinkWarmup":true,"shrinkCooldown":true,"shrinkCommute":true,"color":"#2CA02C","color2":"#35bf35"},"activity_field_ids":[],"activity_charts":{"home":null,"power":null,"hr":null,"pace":null,"data":null},"custom_field_ids":[],"custom_field_values":{},"custom_zones_ids":[],"calendar_tile_activity_panel_id":null,"other":false,"eFTPSupported":true,"use_distance_for_intervals":false},{"id":260480,"athlete_id":"<ATHLETE_ID>","types":["Run","VirtualRun","TrailRun"],"warmup_time":300,"cooldown_time":300,"ftp":null,"indoor_ftp":null,"w_prime":null,"p_max":null,"power_zones":null,"sweet_spot_min":null,"sweet_spot_max":null,"power_spike_threshold":30,"power_zone_names":null,"ftp_est_min_secs":300,"use_laps_for_power_intervals":false,"keep_all_laps_for_power_intervals":true,"power_intervals_start_locked":false,"after_kj0":null,"after_kj1":null,"power_field":null,"lthr":184,"max_hr":203,"hr_zones":[155,164,173,183,188,194,203],"hr_zone_names":["Recovery","Aerobic","Tempo","SubThreshold","SuperThreshold","Aerobic Capacity","Anaerobic"],"hr_load_type":"HRSS","hrrc_min_percent":100,"threshold_pace":null,"pace_units":"MINS_KM","pace_zones":null,"pace_zone_names":null,"pace_load_type":"RUN","gap_model":"STRAVA_RUN","elevation_correction":"AUTO","use_gap_zone_times":true,"best_effort_distances":[400,800,1500,1609.34,3000,5000,10000,21097.5,42195],"pace_curve_start":1000,"load_order":"POWER_PACE_HR","tiz_order":"POWER_HR_PACE","workout_order":"POWER_HR_PACE","interval_display":"POWER_HR_PACE","default_gear_id":null,"default_indoor_gear_id":null,"extract_workouts":false,"show_pauses":600,"ignore_velocity":false,"default_workout_time":null,"update_activity_name_from_workout":true,"created":"2022-01-28T09:43:03.493+00:00","updated":"2022-01-28T15:17:02.421+00:00","mmp_model":null,"displ
  timezone = "Europe/Amsterdam"

GET /athlete/<ATHLETE_ID>/sport-settings → HTTP 200
  sport-settings-objecten: 4
  --- types: Ride/VirtualRide/MountainBikeRide/GravelRide/TrackRide/Cyclocross ---
    custom_zones_ids = []
    eFTPSupported = true
    ftp = 280
    ftp_est_min_secs = 300
    hr_zones = [143,158,165,177,182,188,198]
    indoor_ftp = 260
    keep_all_laps_for_power_intervals = true
    pace_zones = null
    power_field = null
    power_spike_threshold = 30
    power_zones = [55,75,90,105,120,150,999]
    threshold_pace = null
    types = ["Ride","VirtualRide","MountainBikeRide","GravelRide","TrackRide","Cyclocross"]
    use_gap_zone_times = false
    use_laps_for_power_intervals = false
```

### B2 — de volledige sport-settings-respons, ongekort

```json
[
  {
    "id": 260479,
    "athlete_id": "<ATHLETE_ID>",
    "types": [
      "Ride",
      "VirtualRide",
      "MountainBikeRide",
      "GravelRide",
      "TrackRide",
      "Cyclocross"
    ],
    "warmup_time": 1200,
    "cooldown_time": 600,
    "ftp": 280,
    "indoor_ftp": 260,
    "w_prime": null,
    "p_max": null,
    "power_zones": [
      55,
      75,
      90,
      105,
      120,
      150,
      999
    ],
    "sweet_spot_min": 84,
    "sweet_spot_max": 97,
    "power_spike_threshold": 30,
    "power_zone_names": [
      "Active Recovery",
      "Endurance",
      "Tempo",
      "Threshold",
      "VO2 Max",
      "Anaerobic",
      "Neuromuscular"
    ],
    "ftp_est_min_secs": 300,
    "use_laps_for_power_intervals": false,
    "keep_all_laps_for_power_intervals": true,
    "power_intervals_start_locked": false,
    "after_kj0": null,
    "after_kj1": null,
    "power_field": null,
    "lthr": 178,
    "max_hr": 198,
    "hr_zones": [
      143,
      158,
      165,
      177,
      182,
      188,
      198
    ],
    "hr_zone_names": [
      "Recovery",
      "Aerobic",
      "Tempo",
      "SubThreshold",
      "SuperThreshold",
      "Aerobic Capacity",
      "Anaerobic"
    ],
    "hr_load_type": "HR_ZONES",
    "hrrc_min_percent": 100,
    "threshold_pace": null,
    "pace_units": null,
    "pace_zones": null,
    "pace_zone_names": null,
    "pace_load_type": "RUN",
    "gap_model": "NONE",
    "elevation_correction": "NO",
    "use_gap_zone_times": false,
    "best_effort_distances": [
      400,
      800,
      1500,
      1609.34,
      3000,
      5000,
      10000,
      21097.5,
      42195
    ],
    "pace_curve_start": 100,
    "load_order": "POWER_HR_PACE",
    "tiz_order": "POWER_HR_PACE",
    "workout_order": "POWER_HR_PACE",
    "interval_display": "POWER_HR_PACE",
    "default_gear_id": null,
    "default_indoor_gear_id": null,
    "extract_workouts": false,
    "show_pauses": 600,
    "ignore_velocity": false,
    "default_workout_time": null,
    "update_activity_name_from_workout": true,
    "created": "2022-01-28T09:43:03.493+00:00",
    "updated": "2026-07-21T07:38:58.448+00:00",
    "mmp_model": null,
    "display": {
      "colorScheme": "SOLID",
      "lowIntensity": 50,
      "highIntensity": 90,
      "lowLoad": 25,
      "highLoad": 250,
      "usePairedWorkoutColor": false,
      "ignoreWorkoutColors": false,
      "showAverageHR": true,
      "showNormalizedWatts": true,
      "showLoad": true,
      "showWork": false,
      "showWorkAboveFTP": false,
      "showWeightLifted": true,
      "showAveragePower": false,
      "showRPE": true,
      "showFeel": true,
      "showPace": true,
      "showGAP": false,
      "showIntensity": true,
      "showName": true,
      "showIntervals": false,
      "showSkylineChart": true,
      "showPairedWorkoutChart": false,
      "showDescription": false,
      "showStartTime": false,
      "preciseDistance": false,
      "shrinkWarmup": true,
      "shrinkCooldown": true,
      "shrinkCommute": true,
      "color": "#2CA02C",
      "color2": "#35bf35"
    },
    "activity_field_ids": [],
    "activity_charts": {
      "home": null,
      "power": null,
      "hr": null,
      "pace": null,
      "data": null
    },
    "custom_field_ids": [],
    "custom_field_values": {},
    "custom_zones_ids": [],
    "calendar_tile_activity_panel_id": null,
    "other": false,
    "eFTPSupported": true,
    "use_distance_for_intervals": false
  },
  {
    "id": 260480,
    "athlete_id": "<ATHLETE_ID>",
    "types": [
      "Run",
      "VirtualRun",
      "TrailRun"
    ],
    "warmup_time": 300,
    "cooldown_time": 300,
    "ftp": null,
    "indoor_ftp": null,
    "w_prime": null,
    "p_max": null,
    "power_zones": null,
    "sweet_spot_min": null,
    "sweet_spot_max": null,
    "power_spike_threshold": 30,
    "power_zone_names": null,
    "ftp_est_min_secs": 300,
    "use_laps_for_power_intervals": false,
    "keep_all_laps_for_power_intervals": true,
    "power_intervals_start_locked": false,
    "after_kj0": null,
    "after_kj1": null,
    "power_field": null,
    "lthr": 184,
    "max_hr": 203,
    "hr_zones": [
      155,
      164,
      173,
      183,
      188,
      194,
      203
    ],
    "hr_zone_names": [
      "Recovery",
      "Aerobic",
      "Tempo",
      "SubThreshold",
      "SuperThreshold",
      "Aerobic Capacity",
      "Anaerobic"
    ],
    "hr_load_type": "HRSS",
    "hrrc_min_percent": 100,
    "threshold_pace": null,
    "pace_units": "MINS_KM",
    "pace_zones": null,
    "pace_zone_names": null,
    "pace_load_type": "RUN",
    "gap_model": "STRAVA_RUN",
    "elevation_correction": "AUTO",
    "use_gap_zone_times": true,
    "best_effort_distances": [
      400,
      800,
      1500,
      1609.34,
      3000,
      5000,
      10000,
      21097.5,
      42195
    ],
    "pace_curve_start": 1000,
    "load_order": "POWER_PACE_HR",
    "tiz_order": "POWER_HR_PACE",
    "workout_order": "POWER_HR_PACE",
    "interval_display": "POWER_HR_PACE",
    "default_gear_id": null,
    "default_indoor_gear_id": null,
    "extract_workouts": false,
    "show_pauses": 600,
    "ignore_velocity": false,
    "default_workout_time": null,
    "update_activity_name_from_workout": true,
    "created": "2022-01-28T09:43:03.493+00:00",
    "updated": "2022-01-28T15:17:02.421+00:00",
    "mmp_model": null,
    "display": {
      "colorScheme": "SOLID",
      "lowIntensity": 50,
      "highIntensity": 90,
      "lowLoad": 25,
      "highLoad": 250,
      "usePairedWorkoutColor": false,
      "ignoreWorkoutColors": false,
      "showAverageHR": true,
      "showNormalizedWatts": true,
      "showLoad": true,
      "showWork": false,
      "showWorkAboveFTP": false,
      "showWeightLifted": true,
      "showAveragePower": false,
      "showRPE": true,
      "showFeel": true,
      "showPace": true,
      "showGAP": true,
      "showIntensity": false,
      "showName": true,
      "showIntervals": false,
      "showSkylineChart": true,
      "showPairedWorkoutChart": false,
      "showDescription": false,
      "showStartTime": false,
      "preciseDistance": false,
      "shrinkWarmup": true,
      "shrinkCooldown": true,
      "shrinkCommute": true,
      "color": "#FFCB0E",
      "color2": "#fff311"
    },
    "activity_field_ids": [],
    "activity_charts": {
      "home": null,
      "power": null,
      "hr": null,
      "pace": null,
      "data": null
    },
    "custom_field_ids": [],
    "custom_field_values": {},
    "custom_zones_ids": [],
    "calendar_tile_activity_panel_id": null,
    "other": false,
    "eFTPSupported": false,
    "use_distance_for_intervals": false
  },
  {
    "id": 260481,
    "athlete_id": "<ATHLETE_ID>",
    "types": [
      "Swim",
      "OpenWaterSwim"
    ],
    "warmup_time": 300,
    "cooldown_time": 300,
    "ftp": null,
    "indoor_ftp": null,
    "w_prime": null,
    "p_max": null,
    "power_zones": null,
    "sweet_spot_min": null,
    "sweet_spot_max": null,
    "power_spike_threshold": 30,
    "power_zone_names": null,
    "ftp_est_min_secs": 300,
    "use_laps_for_power_intervals": false,
    "keep_all_laps_for_power_intervals": true,
    "power_intervals_start_locked": false,
    "after_kj0": null,
    "after_kj1": null,
    "power_field": null,
    "lthr": 184,
    "max_hr": 203,
    "hr_zones": [
      155,
      164,
      173,
      183,
      188,
      194,
      203
    ],
    "hr_zone_names": [
      "Recovery",
      "Aerobic",
      "Tempo",
      "SubThreshold",
      "SuperThreshold",
      "Aerobic Capacity",
      "Anaerobic"
    ],
    "hr_load_type": "HRSS",
    "hrrc_min_percent": 100,
    "threshold_pace": 0.8333333,
    "pace_units": "SECS_100M",
    "pace_zones": null,
    "pace_zone_names": null,
    "pace_load_type": "SWIM",
    "gap_model": "NONE",
    "elevation_correction": "NO",
    "use_gap_zone_times": false,
    "best_effort_distances": [
      45.719997,
      50,
      91.439995,
      100,
      200,
      400,
      800,
      1500,
      3800
    ],
    "pace_curve_start": 100,
    "load_order": "POWER_HR_PACE",
    "tiz_order": "POWER_HR_PACE",
    "workout_order": "POWER_HR_PACE",
    "interval_display": "POWER_PACE_HR",
    "default_gear_id": null,
    "default_indoor_gear_id": null,
    "extract_workouts": false,
    "show_pauses": 600,
    "ignore_velocity": false,
    "default_workout_time": null,
    "update_activity_name_from_workout": true,
    "created": "2022-01-28T09:43:03.493+00:00",
    "updated": "2022-01-28T15:17:02.430+00:00",
    "mmp_model": null,
    "display": {
      "colorScheme": "SOLID",
      "lowIntensity": 50,
      "highIntensity": 90,
      "lowLoad": 25,
      "highLoad": 250,
      "usePairedWorkoutColor": false,
      "ignoreWorkoutColors": false,
      "showAverageHR": true,
      "showNormalizedWatts": true,
      "showLoad": true,
      "showWork": false,
      "showWorkAboveFTP": false,
      "showWeightLifted": true,
      "showAveragePower": false,
      "showRPE": true,
      "showFeel": true,
      "showPace": true,
      "showGAP": false,
      "showIntensity": false,
      "showName": true,
      "showIntervals": false,
      "showSkylineChart": true,
      "showPairedWorkoutChart": false,
      "showDescription": false,
      "showStartTime": false,
      "preciseDistance": false,
      "shrinkWarmup": true,
      "shrinkCooldown": true,
      "shrinkCommute": true,
      "color": "#119EB1",
      "color2": "#14bdd4"
    },
    "activity_field_ids": [],
    "activity_charts": {
      "home": null,
      "power": null,
      "hr": null,
      "pace": null,
      "data": null
    },
    "custom_field_ids": [],
    "custom_field_values": {},
    "custom_zones_ids": [],
    "calendar_tile_activity_panel_id": null,
    "other": false,
    "eFTPSupported": false,
    "use_distance_for_intervals": true
  },
  {
    "id": 260482,
    "athlete_id": "<ATHLETE_ID>",
    "types": [
      "Other"
    ],
    "warmup_time": 1200,
    "cooldown_time": 600,
    "ftp": null,
    "indoor_ftp": null,
    "w_prime": null,
    "p_max": null,
    "power_zones": null,
    "sweet_spot_min": null,
    "sweet_spot_max": null,
    "power_spike_threshold": 30,
    "power_zone_names": null,
    "ftp_est_min_secs": 300,
    "use_laps_for_power_intervals": false,
    "keep_all_laps_for_power_intervals": true,
    "power_intervals_start_locked": false,
    "after_kj0": null,
    "after_kj1": null,
    "power_field": null,
    "lthr": 184,
    "max_hr": 203,
    "hr_zones": [
      155,
      164,
      173,
      183,
      188,
      194,
      203
    ],
    "hr_zone_names": [
      "Recovery",
      "Aerobic",
      "Tempo",
      "SubThreshold",
      "SuperThreshold",
      "Aerobic Capacity",
      "Anaerobic"
    ],
    "hr_load_type": "HRSS",
    "hrrc_min_percent": 100,
    "threshold_pace": null,
    "pace_units": null,
    "pace_zones": null,
    "pace_zone_names": null,
    "pace_load_type": "RUN",
    "gap_model": "NONE",
    "elevation_correction": "NO",
    "use_gap_zone_times": false,
    "best_effort_distances": [
      400,
      800,
      1500,
      1609.34,
      3000,
      5000,
      10000,
      21097.5,
      42195
    ],
    "pace_curve_start": 1000,
    "load_order": "POWER_HR_PACE",
    "tiz_order": "POWER_HR_PACE",
    "workout_order": "POWER_HR_PACE",
    "interval_display": "POWER_HR_PACE",
    "default_gear_id": null,
    "default_indoor_gear_id": null,
    "extract_workouts": false,
    "show_pauses": 600,
    "ignore_velocity": false,
    "default_workout_time": null,
    "update_activity_name_from_workout": true,
    "created": "2022-01-28T09:43:03.493+00:00",
    "updated": "2022-01-28T15:17:02.439+00:00",
    "mmp_model": null,
    "display": {
      "colorScheme": "SOLID",
      "lowIntensity": 50,
      "highIntensity": 90,
      "lowLoad": 25,
      "highLoad": 250,
      "usePairedWorkoutColor": false,
      "ignoreWorkoutColors": false,
      "showAverageHR": true,
      "showNormalizedWatts": true,
      "showLoad": true,
      "showWork": false,
      "showWorkAboveFTP": false,
      "showWeightLifted": true,
      "showAveragePower": false,
      "showRPE": true,
      "showFeel": true,
      "showPace": true,
      "showGAP": false,
      "showIntensity": false,
      "showName": true,
      "showIntervals": false,
      "showSkylineChart": true,
      "showPairedWorkoutChart": false,
      "showDescription": false,
      "showStartTime": false,
      "preciseDistance": false,
      "shrinkWarmup": true,
      "shrinkCooldown": true,
      "shrinkCommute": true,
      "color": "#666666",
      "color2": "#7a7a7a"
    },
    "activity_field_ids": [],
    "activity_charts": {
      "home": null,
      "power": null,
      "hr": null,
      "pace": null,
      "data": null
    },
    "custom_field_ids": [],
    "custom_field_values": {},
    "custom_zones_ids": [],
    "calendar_tile_activity_panel_id": null,
    "other": true,
    "eFTPSupported": false,
    "use_distance_for_intervals": false
  }
]
```

## Q4 — de volledige dump vanaf 2025-09-01 (217 rijen)

```json
[
  {
    "results": [
      {
        "datum": "2025-09-02T07:38:15",
        "type": "Ride",
        "duur_min": 77,
        "tss": 57,
        "if_pct": 66.3,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1146},{\"id\":\"Z2\",\"secs\":2771},{\"id\":\"Z3\",\"secs\":514},{\"id\":\"Z4\",\"secs\":76},{\"id\":\"Z5\",\"secs\":57},{\"id\":\"Z6\",\"secs\":44},{\"id\":\"Z7\",\"secs\":24},{\"id\":\"SS\",\"secs\":115}]"
      },
      {
        "datum": "2025-09-02T16:23:39",
        "type": "Ride",
        "duur_min": 67,
        "tss": 97,
        "if_pct": 93.7,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":738},{\"id\":\"Z2\",\"secs\":1275},{\"id\":\"Z3\",\"secs\":362},{\"id\":\"Z4\",\"secs\":150},{\"id\":\"Z5\",\"secs\":1108},{\"id\":\"Z6\",\"secs\":331},{\"id\":\"Z7\",\"secs\":31},{\"id\":\"SS\",\"secs\":115}]"
      },
      {
        "datum": "2025-09-06T10:43:10",
        "type": "Ride",
        "duur_min": 157,
        "tss": 168,
        "if_pct": 80,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1133},{\"id\":\"Z2\",\"secs\":2602},{\"id\":\"Z3\",\"secs\":4309},{\"id\":\"Z4\",\"secs\":835},{\"id\":\"Z5\",\"secs\":283},{\"id\":\"Z6\",\"secs\":214},{\"id\":\"Z7\",\"secs\":68},{\"id\":\"SS\",\"secs\":1875}]"
      },
      {
        "datum": "2025-09-08T07:43:46",
        "type": "Ride",
        "duur_min": 76,
        "tss": 54,
        "if_pct": 65.56,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":765},{\"id\":\"Z2\",\"secs\":3415},{\"id\":\"Z3\",\"secs\":289},{\"id\":\"Z4\",\"secs\":42},{\"id\":\"Z5\",\"secs\":24},{\"id\":\"Z6\",\"secs\":7},{\"id\":\"Z7\",\"secs\":1},{\"id\":\"SS\",\"secs\":57}]"
      },
      {
        "datum": "2025-09-08T15:52:15",
        "type": "Ride",
        "duur_min": 77,
        "tss": 69,
        "if_pct": 73.7,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":892},{\"id\":\"Z2\",\"secs\":3060},{\"id\":\"Z3\",\"secs\":489},{\"id\":\"Z4\",\"secs\":58},{\"id\":\"Z5\",\"secs\":27},{\"id\":\"Z6\",\"secs\":10},{\"id\":\"Z7\",\"secs\":60},{\"id\":\"SS\",\"secs\":93}]"
      },
      {
        "datum": "2025-09-09T07:40:01",
        "type": "Ride",
        "duur_min": 80,
        "tss": 52,
        "if_pct": 62.59,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":966},{\"id\":\"Z2\",\"secs\":3481},{\"id\":\"Z3\",\"secs\":262},{\"id\":\"Z4\",\"secs\":55},{\"id\":\"Z5\",\"secs\":27},{\"id\":\"Z6\",\"secs\":10},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":77}]"
      },
      {
        "datum": "2025-09-09T15:51:02",
        "type": "Ride",
        "duur_min": 78,
        "tss": 53,
        "if_pct": 64.07,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1037},{\"id\":\"Z2\",\"secs\":3224},{\"id\":\"Z3\",\"secs\":309},{\"id\":\"Z4\",\"secs\":52},{\"id\":\"Z5\",\"secs\":28},{\"id\":\"Z6\",\"secs\":4},{\"id\":\"Z7\",\"secs\":8},{\"id\":\"SS\",\"secs\":79}]"
      },
      {
        "datum": "2025-09-11T18:58:05",
        "type": "Ride",
        "duur_min": 52,
        "tss": 61,
        "if_pct": 84.07,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":837},{\"id\":\"Z2\",\"secs\":1510},{\"id\":\"Z3\",\"secs\":227},{\"id\":\"Z4\",\"secs\":99},{\"id\":\"Z5\",\"secs\":250},{\"id\":\"Z6\",\"secs\":60},{\"id\":\"Z7\",\"secs\":109},{\"id\":\"SS\",\"secs\":47}]"
      },
      {
        "datum": "2025-09-13T19:03:09",
        "type": "Ride",
        "duur_min": 51,
        "tss": 62,
        "if_pct": 85.56,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":364},{\"id\":\"Z2\",\"secs\":1408},{\"id\":\"Z3\",\"secs\":234},{\"id\":\"Z4\",\"secs\":343},{\"id\":\"Z5\",\"secs\":632},{\"id\":\"Z6\",\"secs\":45},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":108}]"
      },
      {
        "datum": "2025-09-14T12:48:44",
        "type": "Ride",
        "duur_min": 60,
        "tss": 65,
        "if_pct": 80.37,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1010},{\"id\":\"Z2\",\"secs\":1109},{\"id\":\"Z3\",\"secs\":1012},{\"id\":\"Z4\",\"secs\":212},{\"id\":\"Z5\",\"secs\":73},{\"id\":\"Z6\",\"secs\":84},{\"id\":\"Z7\",\"secs\":107},{\"id\":\"SS\",\"secs\":372}]"
      },
      {
        "datum": "2025-09-17T19:47:22",
        "type": "WeightTraining",
        "duur_min": 15,
        "tss": 6,
        "if_pct": 48.4,
        "zone_times_json": null
      },
      {
        "datum": "2025-09-18T18:23:29",
        "type": "Ride",
        "duur_min": 53,
        "tss": 67,
        "if_pct": 87.41,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":762},{\"id\":\"Z2\",\"secs\":1611},{\"id\":\"Z3\",\"secs\":220},{\"id\":\"Z4\",\"secs\":157},{\"id\":\"Z5\",\"secs\":254},{\"id\":\"Z6\",\"secs\":45},{\"id\":\"Z7\",\"secs\":117},{\"id\":\"SS\",\"secs\":91}]"
      },
      {
        "datum": "2025-09-21T12:34:16",
        "type": "Ride",
        "duur_min": 82,
        "tss": 54,
        "if_pct": 62.96,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1086},{\"id\":\"Z2\",\"secs\":3328},{\"id\":\"Z3\",\"secs\":380},{\"id\":\"Z4\",\"secs\":66},{\"id\":\"Z5\",\"secs\":22},{\"id\":\"Z6\",\"secs\":17},{\"id\":\"Z7\",\"secs\":1},{\"id\":\"SS\",\"secs\":112}]"
      },
      {
        "datum": "2025-09-23T07:41:37",
        "type": "Ride",
        "duur_min": 79,
        "tss": 56,
        "if_pct": 65.19,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":876},{\"id\":\"Z2\",\"secs\":3452},{\"id\":\"Z3\",\"secs\":272},{\"id\":\"Z4\",\"secs\":54},{\"id\":\"Z5\",\"secs\":28},{\"id\":\"Z6\",\"secs\":17},{\"id\":\"Z7\",\"secs\":11},{\"id\":\"SS\",\"secs\":97}]"
      },
      {
        "datum": "2025-09-23T16:15:36",
        "type": "Ride",
        "duur_min": 69,
        "tss": 99,
        "if_pct": 92.59,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":531},{\"id\":\"Z2\",\"secs\":1189},{\"id\":\"Z3\",\"secs\":435},{\"id\":\"Z4\",\"secs\":1006},{\"id\":\"Z5\",\"secs\":816},{\"id\":\"Z6\",\"secs\":129},{\"id\":\"Z7\",\"secs\":45},{\"id\":\"SS\",\"secs\":296}]"
      },
      {
        "datum": "2025-09-24T18:54:03",
        "type": "Ride",
        "duur_min": 50,
        "tss": 66,
        "if_pct": 88.89,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":635},{\"id\":\"Z2\",\"secs\":1833},{\"id\":\"Z3\",\"secs\":311},{\"id\":\"Z4\",\"secs\":43},{\"id\":\"Z5\",\"secs\":14},{\"id\":\"Z6\",\"secs\":23},{\"id\":\"Z7\",\"secs\":147},{\"id\":\"SS\",\"secs\":103}]"
      },
      {
        "datum": "2025-09-26T07:43:28",
        "type": "Ride",
        "duur_min": 85,
        "tss": 64,
        "if_pct": 67.41,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":647},{\"id\":\"Z2\",\"secs\":3733},{\"id\":\"Z3\",\"secs\":630},{\"id\":\"Z4\",\"secs\":50},{\"id\":\"Z5\",\"secs\":15},{\"id\":\"Z6\",\"secs\":21},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":116}]"
      },
      {
        "datum": "2025-09-26T16:39:58",
        "type": "Ride",
        "duur_min": 70,
        "tss": 75,
        "if_pct": 80.37,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":760},{\"id\":\"Z2\",\"secs\":2261},{\"id\":\"Z3\",\"secs\":930},{\"id\":\"Z4\",\"secs\":98},{\"id\":\"Z5\",\"secs\":41},{\"id\":\"Z6\",\"secs\":42},{\"id\":\"Z7\",\"secs\":56},{\"id\":\"SS\",\"secs\":172}]"
      },
      {
        "datum": "2025-09-29T19:18:07",
        "type": "WeightTraining",
        "duur_min": 11,
        "tss": 3,
        "if_pct": 39.85,
        "zone_times_json": null
      },
      {
        "datum": "2025-09-30T07:38:28",
        "type": "Ride",
        "duur_min": 75,
        "tss": 58,
        "if_pct": 68.52,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":963},{\"id\":\"Z2\",\"secs\":2923},{\"id\":\"Z3\",\"secs\":408},{\"id\":\"Z4\",\"secs\":84},{\"id\":\"Z5\",\"secs\":35},{\"id\":\"Z6\",\"secs\":39},{\"id\":\"Z7\",\"secs\":24},{\"id\":\"SS\",\"secs\":128}]"
      },
      {
        "datum": "2025-09-30T15:31:52",
        "type": "Ride",
        "duur_min": 4,
        "tss": "",
        "if_pct": "",
        "zone_times_json": null
      },
      {
        "datum": "2025-09-30T15:37:19",
        "type": "Ride",
        "duur_min": 68,
        "tss": 91,
        "if_pct": 89.26,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":671},{\"id\":\"Z2\",\"secs\":781},{\"id\":\"Z3\",\"secs\":663},{\"id\":\"Z4\",\"secs\":1203},{\"id\":\"Z5\",\"secs\":693},{\"id\":\"Z6\",\"secs\":76},{\"id\":\"Z7\",\"secs\":7},{\"id\":\"SS\",\"secs\":277}]"
      },
      {
        "datum": "2025-10-01T17:29:05",
        "type": "Ride",
        "duur_min": 61,
        "tss": 78,
        "if_pct": 87.41,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":732},{\"id\":\"Z2\",\"secs\":2053},{\"id\":\"Z3\",\"secs\":598},{\"id\":\"Z4\",\"secs\":84},{\"id\":\"Z5\",\"secs\":39},{\"id\":\"Z6\",\"secs\":50},{\"id\":\"Z7\",\"secs\":114},{\"id\":\"SS\",\"secs\":175}]"
      },
      {
        "datum": "2025-10-04T18:57:51",
        "type": "VirtualRide",
        "duur_min": 29,
        "tss": 22,
        "if_pct": 67.31,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":12},{\"id\":\"Z2\",\"secs\":1663},{\"id\":\"Z3\",\"secs\":57},{\"id\":\"Z4\",\"secs\":0},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":9}]"
      },
      {
        "datum": "2025-10-05T15:48:39",
        "type": "Ride",
        "duur_min": 46,
        "tss": 64,
        "if_pct": 91.85,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":233},{\"id\":\"Z2\",\"secs\":1198},{\"id\":\"Z3\",\"secs\":220},{\"id\":\"Z4\",\"secs\":186},{\"id\":\"Z5\",\"secs\":849},{\"id\":\"Z6\",\"secs\":50},{\"id\":\"Z7\",\"secs\":14},{\"id\":\"SS\",\"secs\":53}]"
      },
      {
        "datum": "2025-10-07T07:25:06",
        "type": "Ride",
        "duur_min": 80,
        "tss": 52,
        "if_pct": 62.59,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":841},{\"id\":\"Z2\",\"secs\":3605},{\"id\":\"Z3\",\"secs\":297},{\"id\":\"Z4\",\"secs\":53},{\"id\":\"Z5\",\"secs\":10},{\"id\":\"Z6\",\"secs\":8},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":90}]"
      },
      {
        "datum": "2025-10-07T16:13:18",
        "type": "Ride",
        "duur_min": 70,
        "tss": 98,
        "if_pct": 91.85,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":532},{\"id\":\"Z2\",\"secs\":860},{\"id\":\"Z3\",\"secs\":277},{\"id\":\"Z4\",\"secs\":1709},{\"id\":\"Z5\",\"secs\":791},{\"id\":\"Z6\",\"secs\":30},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":534}]"
      },
      {
        "datum": "2025-10-09T07:25:52",
        "type": "Ride",
        "duur_min": 73,
        "tss": 54,
        "if_pct": 66.67,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":829},{\"id\":\"Z2\",\"secs\":2788},{\"id\":\"Z3\",\"secs\":505},{\"id\":\"Z4\",\"secs\":138},{\"id\":\"Z5\",\"secs\":63},{\"id\":\"Z6\",\"secs\":39},{\"id\":\"Z7\",\"secs\":8},{\"id\":\"SS\",\"secs\":203}]"
      },
      {
        "datum": "2025-10-09T16:02:09",
        "type": "Ride",
        "duur_min": 75,
        "tss": 74,
        "if_pct": 76.67,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":719},{\"id\":\"Z2\",\"secs\":2751},{\"id\":\"Z3\",\"secs\":746},{\"id\":\"Z4\",\"secs\":149},{\"id\":\"Z5\",\"secs\":52},{\"id\":\"Z6\",\"secs\":59},{\"id\":\"Z7\",\"secs\":51},{\"id\":\"SS\",\"secs\":251}]"
      },
      {
        "datum": "2025-10-12T12:19:48",
        "type": "Ride",
        "duur_min": 61,
        "tss": 74,
        "if_pct": 85.56,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":882},{\"id\":\"Z2\",\"secs\":1573},{\"id\":\"Z3\",\"secs\":453},{\"id\":\"Z4\",\"secs\":109},{\"id\":\"Z5\",\"secs\":374},{\"id\":\"Z6\",\"secs\":169},{\"id\":\"Z7\",\"secs\":73},{\"id\":\"SS\",\"secs\":137}]"
      },
      {
        "datum": "2025-10-13T07:37:46",
        "type": "Ride",
        "duur_min": 76,
        "tss": 53,
        "if_pct": 64.81,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1205},{\"id\":\"Z2\",\"secs\":2698},{\"id\":\"Z3\",\"secs\":525},{\"id\":\"Z4\",\"secs\":75},{\"id\":\"Z5\",\"secs\":33},{\"id\":\"Z6\",\"secs\":34},{\"id\":\"Z7\",\"secs\":13},{\"id\":\"SS\",\"secs\":142}]"
      },
      {
        "datum": "2025-10-13T16:32:47",
        "type": "Ride",
        "duur_min": 74,
        "tss": 98,
        "if_pct": 88.89,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":688},{\"id\":\"Z2\",\"secs\":2692},{\"id\":\"Z3\",\"secs\":812},{\"id\":\"Z4\",\"secs\":91},{\"id\":\"Z5\",\"secs\":40},{\"id\":\"Z6\",\"secs\":24},{\"id\":\"Z7\",\"secs\":104},{\"id\":\"SS\",\"secs\":169}]"
      },
      {
        "datum": "2025-10-15T18:46:33",
        "type": "Run",
        "duur_min": 21,
        "tss": 16,
        "if_pct": 61.56,
        "zone_times_json": null
      },
      {
        "datum": "2025-10-16T16:18:52",
        "type": "Ride",
        "duur_min": 57,
        "tss": 50,
        "if_pct": 72.22,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":321},{\"id\":\"Z2\",\"secs\":1676},{\"id\":\"Z3\",\"secs\":1329},{\"id\":\"Z4\",\"secs\":67},{\"id\":\"Z5\",\"secs\":20},{\"id\":\"Z6\",\"secs\":7},{\"id\":\"Z7\",\"secs\":5},{\"id\":\"SS\",\"secs\":164}]"
      },
      {
        "datum": "2025-10-18T11:12:02",
        "type": "Ride",
        "duur_min": 128,
        "tss": 132,
        "if_pct": 78.52,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1925},{\"id\":\"Z2\",\"secs\":3681},{\"id\":\"Z3\",\"secs\":1199},{\"id\":\"Z4\",\"secs\":350},{\"id\":\"Z5\",\"secs\":243},{\"id\":\"Z6\",\"secs\":182},{\"id\":\"Z7\",\"secs\":120},{\"id\":\"SS\",\"secs\":470}]"
      },
      {
        "datum": "2025-10-20T11:19:14",
        "type": "Ride",
        "duur_min": 61,
        "tss": 83,
        "if_pct": 90.37,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":496},{\"id\":\"Z2\",\"secs\":1875},{\"id\":\"Z3\",\"secs\":296},{\"id\":\"Z4\",\"secs\":35},{\"id\":\"Z5\",\"secs\":531},{\"id\":\"Z6\",\"secs\":431},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":56}]"
      },
      {
        "datum": "2025-10-22T11:24:25",
        "type": "Run",
        "duur_min": 22,
        "tss": 16,
        "if_pct": 65.98,
        "zone_times_json": null
      },
      {
        "datum": "2025-10-24T08:13:59",
        "type": "Ride",
        "duur_min": 316,
        "tss": 337,
        "if_pct": 80,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":4143},{\"id\":\"Z2\",\"secs\":4511},{\"id\":\"Z3\",\"secs\":5543},{\"id\":\"Z4\",\"secs\":3721},{\"id\":\"Z5\",\"secs\":872},{\"id\":\"Z6\",\"secs\":161},{\"id\":\"Z7\",\"secs\":12},{\"id\":\"SS\",\"secs\":4628}]"
      },
      {
        "datum": "2025-10-25T13:03:12",
        "type": "Tennis",
        "duur_min": 40,
        "tss": 25,
        "if_pct": 50.52,
        "zone_times_json": null
      },
      {
        "datum": "2025-10-29T19:12:37",
        "type": "Run",
        "duur_min": 28,
        "tss": 19,
        "if_pct": 62.13,
        "zone_times_json": null
      },
      {
        "datum": "2025-10-29T19:43:32",
        "type": "WeightTraining",
        "duur_min": 12,
        "tss": 6,
        "if_pct": 55,
        "zone_times_json": null
      },
      {
        "datum": "2025-10-31T07:38:16",
        "type": "Ride",
        "duur_min": 81,
        "tss": 66,
        "if_pct": 70.37,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":512},{\"id\":\"Z2\",\"secs\":3048},{\"id\":\"Z3\",\"secs\":1127},{\"id\":\"Z4\",\"secs\":84},{\"id\":\"Z5\",\"secs\":28},{\"id\":\"Z6\",\"secs\":35},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":169}]"
      },
      {
        "datum": "2025-10-31T16:08:59",
        "type": "Ride",
        "duur_min": 72,
        "tss": 65,
        "if_pct": 73.7,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":909},{\"id\":\"Z2\",\"secs\":2262},{\"id\":\"Z3\",\"secs\":739},{\"id\":\"Z4\",\"secs\":205},{\"id\":\"Z5\",\"secs\":90},{\"id\":\"Z6\",\"secs\":60},{\"id\":\"Z7\",\"secs\":53},{\"id\":\"SS\",\"secs\":260}]"
      },
      {
        "datum": "2025-11-02T09:45:12",
        "type": "Ride",
        "duur_min": 105,
        "tss": 99,
        "if_pct": 75.19,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":663},{\"id\":\"Z2\",\"secs\":2239},{\"id\":\"Z3\",\"secs\":3061},{\"id\":\"Z4\",\"secs\":230},{\"id\":\"Z5\",\"secs\":62},{\"id\":\"Z6\",\"secs\":44},{\"id\":\"Z7\",\"secs\":28},{\"id\":\"SS\",\"secs\":862}]"
      },
      {
        "datum": "2025-11-04T07:09:26",
        "type": "Ride",
        "duur_min": 78,
        "tss": 67,
        "if_pct": 72.22,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":781},{\"id\":\"Z2\",\"secs\":2211},{\"id\":\"Z3\",\"secs\":1333},{\"id\":\"Z4\",\"secs\":242},{\"id\":\"Z5\",\"secs\":55},{\"id\":\"Z6\",\"secs\":28},{\"id\":\"Z7\",\"secs\":3},{\"id\":\"SS\",\"secs\":585}]"
      },
      {
        "datum": "2025-11-04T16:19:40",
        "type": "Ride",
        "duur_min": 65,
        "tss": 91,
        "if_pct": 91.48,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":561},{\"id\":\"Z2\",\"secs\":686},{\"id\":\"Z3\",\"secs\":521},{\"id\":\"Z4\",\"secs\":1724},{\"id\":\"Z5\",\"secs\":325},{\"id\":\"Z6\",\"secs\":43},{\"id\":\"Z7\",\"secs\":42},{\"id\":\"SS\",\"secs\":686}]"
      },
      {
        "datum": "2025-11-06T15:57:16",
        "type": "Ride",
        "duur_min": 44,
        "tss": 56,
        "if_pct": 86.67,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":501},{\"id\":\"Z2\",\"secs\":1700},{\"id\":\"Z3\",\"secs\":181},{\"id\":\"Z4\",\"secs\":59},{\"id\":\"Z5\",\"secs\":17},{\"id\":\"Z6\",\"secs\":34},{\"id\":\"Z7\",\"secs\":171},{\"id\":\"SS\",\"secs\":74}]"
      },
      {
        "datum": "2025-11-07T07:29:47",
        "type": "Ride",
        "duur_min": 80,
        "tss": 58,
        "if_pct": 65.93,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":726},{\"id\":\"Z2\",\"secs\":3665},{\"id\":\"Z3\",\"secs\":354},{\"id\":\"Z4\",\"secs\":42},{\"id\":\"Z5\",\"secs\":16},{\"id\":\"Z6\",\"secs\":5},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":88}]"
      },
      {
        "datum": "2025-11-07T16:20:28",
        "type": "Ride",
        "duur_min": 73,
        "tss": 72,
        "if_pct": 77.04,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":839},{\"id\":\"Z2\",\"secs\":2735},{\"id\":\"Z3\",\"secs\":635},{\"id\":\"Z4\",\"secs\":50},{\"id\":\"Z5\",\"secs\":19},{\"id\":\"Z6\",\"secs\":29},{\"id\":\"Z7\",\"secs\":48},{\"id\":\"SS\",\"secs\":112}]"
      },
      {
        "datum": "2025-11-08T11:01:28",
        "type": "Ride",
        "duur_min": 95,
        "tss": 105,
        "if_pct": 81.48,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1011},{\"id\":\"Z2\",\"secs\":2045},{\"id\":\"Z3\",\"secs\":2119},{\"id\":\"Z4\",\"secs\":227},{\"id\":\"Z5\",\"secs\":118},{\"id\":\"Z6\",\"secs\":64},{\"id\":\"Z7\",\"secs\":91},{\"id\":\"SS\",\"secs\":575}]"
      },
      {
        "datum": "2025-11-11T07:24:32",
        "type": "Ride",
        "duur_min": 77,
        "tss": 67,
        "if_pct": 72.22,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":761},{\"id\":\"Z2\",\"secs\":2548},{\"id\":\"Z3\",\"secs\":925},{\"id\":\"Z4\",\"secs\":246},{\"id\":\"Z5\",\"secs\":79},{\"id\":\"Z6\",\"secs\":39},{\"id\":\"Z7\",\"secs\":33},{\"id\":\"SS\",\"secs\":483}]"
      },
      {
        "datum": "2025-11-11T15:35:58",
        "type": "Ride",
        "duur_min": 65,
        "tss": 82,
        "if_pct": 87.04,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":571},{\"id\":\"Z2\",\"secs\":1169},{\"id\":\"Z3\",\"secs\":261},{\"id\":\"Z4\",\"secs\":1421},{\"id\":\"Z5\",\"secs\":417},{\"id\":\"Z6\",\"secs\":31},{\"id\":\"Z7\",\"secs\":11},{\"id\":\"SS\",\"secs\":601}]"
      },
      {
        "datum": "2025-11-13T16:10:15",
        "type": "Ride",
        "duur_min": 55,
        "tss": 39,
        "if_pct": 64.81,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":641},{\"id\":\"Z2\",\"secs\":2221},{\"id\":\"Z3\",\"secs\":419},{\"id\":\"Z4\",\"secs\":28},{\"id\":\"Z5\",\"secs\":5},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":83}]"
      },
      {
        "datum": "2025-11-15T12:42:51",
        "type": "Ride",
        "duur_min": 67,
        "tss": 73,
        "if_pct": 80.74,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1221},{\"id\":\"Z2\",\"secs\":2295},{\"id\":\"Z3\",\"secs\":120},{\"id\":\"Z4\",\"secs\":39},{\"id\":\"Z5\",\"secs\":38},{\"id\":\"Z6\",\"secs\":93},{\"id\":\"Z7\",\"secs\":207},{\"id\":\"SS\",\"secs\":49}]"
      },
      {
        "datum": "2025-11-16T09:58:18",
        "type": "Ride",
        "duur_min": 110,
        "tss": 109,
        "if_pct": 77.04,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1000},{\"id\":\"Z2\",\"secs\":2915},{\"id\":\"Z3\",\"secs\":2252},{\"id\":\"Z4\",\"secs\":269},{\"id\":\"Z5\",\"secs\":54},{\"id\":\"Z6\",\"secs\":59},{\"id\":\"Z7\",\"secs\":57},{\"id\":\"SS\",\"secs\":742}]"
      },
      {
        "datum": "2025-11-18T07:25:45",
        "type": "Ride",
        "duur_min": 79,
        "tss": 67,
        "if_pct": 70.81,
        "zone_times_json": null
      },
      {
        "datum": "2025-11-18T16:49:53",
        "type": "Ride",
        "duur_min": 77,
        "tss": 108,
        "if_pct": 91.85,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":784},{\"id\":\"Z2\",\"secs\":2729},{\"id\":\"Z3\",\"secs\":674},{\"id\":\"Z4\",\"secs\":60},{\"id\":\"Z5\",\"secs\":29},{\"id\":\"Z6\",\"secs\":37},{\"id\":\"Z7\",\"secs\":306},{\"id\":\"SS\",\"secs\":101}]"
      },
      {
        "datum": "2025-11-20T16:14:28",
        "type": "VirtualRide",
        "duur_min": 50,
        "tss": 59,
        "if_pct": 84.23,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":56},{\"id\":\"Z2\",\"secs\":1648},{\"id\":\"Z3\",\"secs\":71},{\"id\":\"Z4\",\"secs\":1169},{\"id\":\"Z5\",\"secs\":34},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":195}]"
      },
      {
        "datum": "2025-11-25T19:12:18",
        "type": "VirtualRide",
        "duur_min": 49,
        "tss": 34,
        "if_pct": 64.23,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":57},{\"id\":\"Z2\",\"secs\":2896},{\"id\":\"Z3\",\"secs\":0},{\"id\":\"Z4\",\"secs\":0},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":0}]"
      },
      {
        "datum": "2025-11-27T07:55:07",
        "type": "VirtualRide",
        "duur_min": 50,
        "tss": 42,
        "if_pct": 71.54,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":515},{\"id\":\"Z2\",\"secs\":1356},{\"id\":\"Z3\",\"secs\":941},{\"id\":\"Z4\",\"secs\":82},{\"id\":\"Z5\",\"secs\":36},{\"id\":\"Z6\",\"secs\":27},{\"id\":\"Z7\",\"secs\":14},{\"id\":\"SS\",\"secs\":155}]"
      },
      {
        "datum": "2025-11-27T14:20:25",
        "type": "Ride",
        "duur_min": 47,
        "tss": 42,
        "if_pct": 72.96,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":469},{\"id\":\"Z2\",\"secs\":691},{\"id\":\"Z3\",\"secs\":1562},{\"id\":\"Z4\",\"secs\":61},{\"id\":\"Z5\",\"secs\":18},{\"id\":\"Z6\",\"secs\":5},{\"id\":\"Z7\",\"secs\":1},{\"id\":\"SS\",\"secs\":412}]"
      },
      {
        "datum": "2025-11-28T19:16:07",
        "type": "VirtualRide",
        "duur_min": 50,
        "tss": 52,
        "if_pct": 78.85,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":44},{\"id\":\"Z2\",\"secs\":1646},{\"id\":\"Z3\",\"secs\":1220},{\"id\":\"Z4\",\"secs\":118},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1294}]"
      },
      {
        "datum": "2025-11-30T11:43:01",
        "type": "Ride",
        "duur_min": 51,
        "tss": 81,
        "if_pct": 97.04,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":679},{\"id\":\"Z2\",\"secs\":1145},{\"id\":\"Z3\",\"secs\":485},{\"id\":\"Z4\",\"secs\":126},{\"id\":\"Z5\",\"secs\":293},{\"id\":\"Z6\",\"secs\":151},{\"id\":\"Z7\",\"secs\":204},{\"id\":\"SS\",\"secs\":192}]"
      },
      {
        "datum": "2025-12-02T07:49:46",
        "type": "Ride",
        "duur_min": 86,
        "tss": 64,
        "if_pct": 66.67,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":847},{\"id\":\"Z2\",\"secs\":3656},{\"id\":\"Z3\",\"secs\":575},{\"id\":\"Z4\",\"secs\":45},{\"id\":\"Z5\",\"secs\":14},{\"id\":\"Z6\",\"secs\":18},{\"id\":\"Z7\",\"secs\":8},{\"id\":\"SS\",\"secs\":89}]"
      },
      {
        "datum": "2025-12-02T16:35:39",
        "type": "Ride",
        "duur_min": 73,
        "tss": 82,
        "if_pct": 82.22,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":695},{\"id\":\"Z2\",\"secs\":2898},{\"id\":\"Z3\",\"secs\":231},{\"id\":\"Z4\",\"secs\":58},{\"id\":\"Z5\",\"secs\":37},{\"id\":\"Z6\",\"secs\":361},{\"id\":\"Z7\",\"secs\":70},{\"id\":\"SS\",\"secs\":82}]"
      },
      {
        "datum": "2025-12-03T19:18:46",
        "type": "Run",
        "duur_min": 19,
        "tss": 15,
        "if_pct": 69.56,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-05T07:35:08",
        "type": "Ride",
        "duur_min": 83,
        "tss": 70,
        "if_pct": 70.92,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-05T16:04:41",
        "type": "Ride",
        "duur_min": 70,
        "tss": 104,
        "if_pct": 93.84,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-07T07:54:59",
        "type": "Ride",
        "duur_min": 72,
        "tss": 83,
        "if_pct": 83.33,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":490},{\"id\":\"Z2\",\"secs\":2587},{\"id\":\"Z3\",\"secs\":122},{\"id\":\"Z4\",\"secs\":99},{\"id\":\"Z5\",\"secs\":584},{\"id\":\"Z6\",\"secs\":406},{\"id\":\"Z7\",\"secs\":18},{\"id\":\"SS\",\"secs\":91}]"
      },
      {
        "datum": "2025-12-08T19:02:40",
        "type": "Run",
        "duur_min": 19,
        "tss": 16,
        "if_pct": 70.96,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-08T19:23:03",
        "type": "WeightTraining",
        "duur_min": 4,
        "tss": 3,
        "if_pct": "",
        "zone_times_json": null
      },
      {
        "datum": "2025-12-09T18:54:10",
        "type": "VirtualRide",
        "duur_min": 67,
        "tss": 61,
        "if_pct": 73.85,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":41},{\"id\":\"Z2\",\"secs\":1902},{\"id\":\"Z3\",\"secs\":2075},{\"id\":\"Z4\",\"secs\":0},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":6}]"
      },
      {
        "datum": "2025-12-11T16:20:45",
        "type": "Ride",
        "duur_min": 67,
        "tss": 51,
        "if_pct": 67.41,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":425},{\"id\":\"Z2\",\"secs\":3292},{\"id\":\"Z3\",\"secs\":277},{\"id\":\"Z4\",\"secs\":25},{\"id\":\"Z5\",\"secs\":8},{\"id\":\"Z6\",\"secs\":8},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":27}]"
      },
      {
        "datum": "2025-12-12T07:35:56",
        "type": "Ride",
        "duur_min": 79,
        "tss": 60,
        "if_pct": 67.41,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":737},{\"id\":\"Z2\",\"secs\":3327},{\"id\":\"Z3\",\"secs\":443},{\"id\":\"Z4\",\"secs\":81},{\"id\":\"Z5\",\"secs\":49},{\"id\":\"Z6\",\"secs\":57},{\"id\":\"Z7\",\"secs\":22},{\"id\":\"SS\",\"secs\":122}]"
      },
      {
        "datum": "2025-12-12T16:02:39",
        "type": "Ride",
        "duur_min": 73,
        "tss": 79,
        "if_pct": 80.74,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":705},{\"id\":\"Z2\",\"secs\":2778},{\"id\":\"Z3\",\"secs\":159},{\"id\":\"Z4\",\"secs\":242},{\"id\":\"Z5\",\"secs\":153},{\"id\":\"Z6\",\"secs\":298},{\"id\":\"Z7\",\"secs\":31},{\"id\":\"SS\",\"secs\":88}]"
      },
      {
        "datum": "2025-12-14T13:21:57",
        "type": "Ride",
        "duur_min": 108,
        "tss": 146,
        "if_pct": 89.77,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-16T07:27:00",
        "type": "Ride",
        "duur_min": 82,
        "tss": 63,
        "if_pct": 67.78,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":557},{\"id\":\"Z2\",\"secs\":3696},{\"id\":\"Z3\",\"secs\":567},{\"id\":\"Z4\",\"secs\":65},{\"id\":\"Z5\",\"secs\":36},{\"id\":\"Z6\",\"secs\":12},{\"id\":\"Z7\",\"secs\":8},{\"id\":\"SS\",\"secs\":127}]"
      },
      {
        "datum": "2025-12-16T16:23:54",
        "type": "Ride",
        "duur_min": 71,
        "tss": 67,
        "if_pct": 74.81,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":482},{\"id\":\"Z2\",\"secs\":2318},{\"id\":\"Z3\",\"secs\":995},{\"id\":\"Z4\",\"secs\":421},{\"id\":\"Z5\",\"secs\":47},{\"id\":\"Z6\",\"secs\":14},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":637}]"
      },
      {
        "datum": "2025-12-17T19:30:59",
        "type": "Run",
        "duur_min": 23,
        "tss": 11,
        "if_pct": 53.74,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-17T19:56:08",
        "type": "WeightTraining",
        "duur_min": 6,
        "tss": 2,
        "if_pct": "",
        "zone_times_json": null
      },
      {
        "datum": "2025-12-19T07:36:17",
        "type": "Ride",
        "duur_min": 80,
        "tss": 55,
        "if_pct": 64.44,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":721},{\"id\":\"Z2\",\"secs\":3708},{\"id\":\"Z3\",\"secs\":273},{\"id\":\"Z4\",\"secs\":29},{\"id\":\"Z5\",\"secs\":20},{\"id\":\"Z6\",\"secs\":14},{\"id\":\"Z7\",\"secs\":10},{\"id\":\"SS\",\"secs\":57}]"
      },
      {
        "datum": "2025-12-19T16:47:55",
        "type": "Ride",
        "duur_min": 74,
        "tss": 82,
        "if_pct": 81.85,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":642},{\"id\":\"Z2\",\"secs\":2689},{\"id\":\"Z3\",\"secs\":246},{\"id\":\"Z4\",\"secs\":88},{\"id\":\"Z5\",\"secs\":236},{\"id\":\"Z6\",\"secs\":490},{\"id\":\"Z7\",\"secs\":28},{\"id\":\"SS\",\"secs\":96}]"
      },
      {
        "datum": "2025-12-21T09:13:37",
        "type": "Ride",
        "duur_min": 106,
        "tss": 88,
        "if_pct": 70.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":486},{\"id\":\"Z2\",\"secs\":4366},{\"id\":\"Z3\",\"secs\":1307},{\"id\":\"Z4\",\"secs\":135},{\"id\":\"Z5\",\"secs\":35},{\"id\":\"Z6\",\"secs\":14},{\"id\":\"Z7\",\"secs\":7},{\"id\":\"SS\",\"secs\":248}]"
      },
      {
        "datum": "2025-12-23T19:38:28",
        "type": "Run",
        "duur_min": 25,
        "tss": 22,
        "if_pct": 71.95,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-27T19:21:01",
        "type": "Run",
        "duur_min": 23,
        "tss": 17,
        "if_pct": 66.69,
        "zone_times_json": null
      },
      {
        "datum": "2025-12-28T14:03:22",
        "type": "Ride",
        "duur_min": 92,
        "tss": 65,
        "if_pct": 65.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":803},{\"id\":\"Z2\",\"secs\":4286},{\"id\":\"Z3\",\"secs\":314},{\"id\":\"Z4\",\"secs\":41},{\"id\":\"Z5\",\"secs\":24},{\"id\":\"Z6\",\"secs\":17},{\"id\":\"Z7\",\"secs\":8},{\"id\":\"SS\",\"secs\":53}]"
      },
      {
        "datum": "2025-12-30T07:09:10",
        "type": "Ride",
        "duur_min": 61,
        "tss": 49,
        "if_pct": 69.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1266},{\"id\":\"Z2\",\"secs\":2198},{\"id\":\"Z3\",\"secs\":40},{\"id\":\"Z4\",\"secs\":15},{\"id\":\"Z5\",\"secs\":16},{\"id\":\"Z6\",\"secs\":13},{\"id\":\"Z7\",\"secs\":93},{\"id\":\"SS\",\"secs\":18}]"
      },
      {
        "datum": "2025-12-31T14:52:28",
        "type": "Run",
        "duur_min": 28,
        "tss": 20,
        "if_pct": 63.48,
        "zone_times_json": null
      },
      {
        "datum": "2026-01-04T10:07:39",
        "type": "Run",
        "duur_min": 79,
        "tss": 77,
        "if_pct": 76.13,
        "zone_times_json": null
      },
      {
        "datum": "2026-01-06T19:16:52",
        "type": "VirtualRide",
        "duur_min": 52,
        "tss": 51,
        "if_pct": 76.92,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":118},{\"id\":\"Z2\",\"secs\":1795},{\"id\":\"Z3\",\"secs\":1187},{\"id\":\"Z4\",\"secs\":3},{\"id\":\"Z5\",\"secs\":1},{\"id\":\"Z6\",\"secs\":4},{\"id\":\"Z7\",\"secs\":17},{\"id\":\"SS\",\"secs\":1169}]"
      },
      {
        "datum": "2026-01-07T19:33:05",
        "type": "IceSkate",
        "duur_min": 79,
        "tss": 44,
        "if_pct": 56.21,
        "zone_times_json": null
      },
      {
        "datum": "2026-01-09T19:16:49",
        "type": "VirtualRide",
        "duur_min": 53,
        "tss": 44,
        "if_pct": 70.38,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":94},{\"id\":\"Z2\",\"secs\":1909},{\"id\":\"Z3\",\"secs\":1164},{\"id\":\"Z4\",\"secs\":0},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":0}]"
      },
      {
        "datum": "2026-01-11T19:05:04",
        "type": "VirtualRide",
        "duur_min": 74,
        "tss": 61,
        "if_pct": 70.38,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":33},{\"id\":\"Z2\",\"secs\":3927},{\"id\":\"Z3\",\"secs\":485},{\"id\":\"Z4\",\"secs\":0},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":473}]"
      },
      {
        "datum": "2026-01-13T16:50:33",
        "type": "VirtualRide",
        "duur_min": 20,
        "tss": 34,
        "if_pct": 100.77,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":201},{\"id\":\"Z2\",\"secs\":321},{\"id\":\"Z3\",\"secs\":188},{\"id\":\"Z4\",\"secs\":127},{\"id\":\"Z5\",\"secs\":126},{\"id\":\"Z6\",\"secs\":250},{\"id\":\"Z7\",\"secs\":5},{\"id\":\"SS\",\"secs\":130}]"
      },
      {
        "datum": "2026-01-15T19:46:04",
        "type": "IceSkate",
        "duur_min": 69,
        "tss": 42,
        "if_pct": 58.49,
        "zone_times_json": null
      },
      {
        "datum": "2026-01-17T13:12:45",
        "type": "Ride",
        "duur_min": 88,
        "tss": 98,
        "if_pct": 81.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1163},{\"id\":\"Z2\",\"secs\":2776},{\"id\":\"Z3\",\"secs\":655},{\"id\":\"Z4\",\"secs\":286},{\"id\":\"Z5\",\"secs\":182},{\"id\":\"Z6\",\"secs\":51},{\"id\":\"Z7\",\"secs\":148},{\"id\":\"SS\",\"secs\":168}]"
      },
      {
        "datum": "2026-01-19T07:31:10",
        "type": "Ride",
        "duur_min": 86,
        "tss": 62,
        "if_pct": 65.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":740},{\"id\":\"Z2\",\"secs\":3765},{\"id\":\"Z3\",\"secs\":584},{\"id\":\"Z4\",\"secs\":36},{\"id\":\"Z5\",\"secs\":17},{\"id\":\"Z6\",\"secs\":7},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":75}]"
      },
      {
        "datum": "2026-01-19T16:44:43",
        "type": "Ride",
        "duur_min": 72,
        "tss": 91,
        "if_pct": 86.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":943},{\"id\":\"Z2\",\"secs\":1808},{\"id\":\"Z3\",\"secs\":273},{\"id\":\"Z4\",\"secs\":253},{\"id\":\"Z5\",\"secs\":751},{\"id\":\"Z6\",\"secs\":295},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":82}]"
      },
      {
        "datum": "2026-01-21T19:31:17",
        "type": "IceSkate",
        "duur_min": 84,
        "tss": 46,
        "if_pct": 55.58,
        "zone_times_json": null
      },
      {
        "datum": "2026-01-22T19:08:16",
        "type": "VirtualRide",
        "duur_min": 56,
        "tss": 63,
        "if_pct": 81.92,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":28},{\"id\":\"Z2\",\"secs\":1886},{\"id\":\"Z3\",\"secs\":628},{\"id\":\"Z4\",\"secs\":824},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":491}]"
      },
      {
        "datum": "2026-01-24T10:41:38",
        "type": "Ride",
        "duur_min": 89,
        "tss": 105,
        "if_pct": 84,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":796},{\"id\":\"Z2\",\"secs\":3312},{\"id\":\"Z3\",\"secs\":58},{\"id\":\"Z4\",\"secs\":183},{\"id\":\"Z5\",\"secs\":495},{\"id\":\"Z6\",\"secs\":488},{\"id\":\"Z7\",\"secs\":14},{\"id\":\"SS\",\"secs\":52}]"
      },
      {
        "datum": "2026-01-25T12:35:39",
        "type": "Ride",
        "duur_min": 51,
        "tss": 62,
        "if_pct": 85.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":426},{\"id\":\"Z2\",\"secs\":1315},{\"id\":\"Z3\",\"secs\":248},{\"id\":\"Z4\",\"secs\":484},{\"id\":\"Z5\",\"secs\":561},{\"id\":\"Z6\",\"secs\":50},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":181}]"
      },
      {
        "datum": "2026-01-26T16:20:00",
        "type": "Ride",
        "duur_min": 75,
        "tss": 77,
        "if_pct": 78.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":580},{\"id\":\"Z2\",\"secs\":2064},{\"id\":\"Z3\",\"secs\":423},{\"id\":\"Z4\",\"secs\":1376},{\"id\":\"Z5\",\"secs\":44},{\"id\":\"Z6\",\"secs\":8},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":1028}]"
      },
      {
        "datum": "2026-01-28T19:30:50",
        "type": "IceSkate",
        "duur_min": 61,
        "tss": 21,
        "if_pct": 45.28,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-01T08:47:58",
        "type": "AlpineSki",
        "duur_min": 281,
        "tss": 102,
        "if_pct": 44.82,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-02T08:55:53",
        "type": "AlpineSki",
        "duur_min": 333,
        "tss": 83,
        "if_pct": 37.09,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-03T08:54:30",
        "type": "AlpineSki",
        "duur_min": 308,
        "tss": 67,
        "if_pct": 35.04,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-03T15:57:44",
        "type": "AlpineSki",
        "duur_min": 27,
        "tss": 5,
        "if_pct": 31.47,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-04T08:57:38",
        "type": "AlpineSki",
        "duur_min": 399,
        "tss": 89,
        "if_pct": 36.12,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-05T08:52:06",
        "type": "AlpineSki",
        "duur_min": 429,
        "tss": 85,
        "if_pct": 33.87,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-06T08:52:51",
        "type": "AlpineSki",
        "duur_min": 352,
        "tss": 106,
        "if_pct": 41.49,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-10T07:33:17",
        "type": "Ride",
        "duur_min": 84,
        "tss": 59,
        "if_pct": 64.73,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":931},{\"id\":\"Z2\",\"secs\":3656},{\"id\":\"Z3\",\"secs\":310},{\"id\":\"Z4\",\"secs\":79},{\"id\":\"Z5\",\"secs\":33},{\"id\":\"Z6\",\"secs\":23},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":84}]"
      },
      {
        "datum": "2026-02-10T16:56:09",
        "type": "Ride",
        "duur_min": 73,
        "tss": 79,
        "if_pct": 80.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":620},{\"id\":\"Z2\",\"secs\":3002},{\"id\":\"Z3\",\"secs\":222},{\"id\":\"Z4\",\"secs\":43},{\"id\":\"Z5\",\"secs\":82},{\"id\":\"Z6\",\"secs\":430},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":76}]"
      },
      {
        "datum": "2026-02-11T19:18:18",
        "type": "VirtualRide",
        "duur_min": 49,
        "tss": 51,
        "if_pct": 78.46,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":31},{\"id\":\"Z2\",\"secs\":1848},{\"id\":\"Z3\",\"secs\":455},{\"id\":\"Z4\",\"secs\":625},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":955}]"
      },
      {
        "datum": "2026-02-13T11:17:46",
        "type": "Run",
        "duur_min": 17,
        "tss": 8,
        "if_pct": 52.8,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-16T19:15:06",
        "type": "VirtualRide",
        "duur_min": 30,
        "tss": 42,
        "if_pct": 90.77,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":77},{\"id\":\"Z2\",\"secs\":1519},{\"id\":\"Z3\",\"secs\":2},{\"id\":\"Z4\",\"secs\":5},{\"id\":\"Z5\",\"secs\":3},{\"id\":\"Z6\",\"secs\":174},{\"id\":\"Z7\",\"secs\":45},{\"id\":\"SS\",\"secs\":2}]"
      },
      {
        "datum": "2026-02-17T16:34:49",
        "type": "Run",
        "duur_min": 26,
        "tss": 19,
        "if_pct": 66.58,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-18T18:58:19",
        "type": "VirtualRide",
        "duur_min": 8,
        "tss": 5,
        "if_pct": 63.46,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":162},{\"id\":\"Z2\",\"secs\":149},{\"id\":\"Z3\",\"secs\":150},{\"id\":\"Z4\",\"secs\":3},{\"id\":\"Z5\",\"secs\":3},{\"id\":\"Z6\",\"secs\":4},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":20}]"
      },
      {
        "datum": "2026-02-20T18:54:51",
        "type": "Run",
        "duur_min": 18,
        "tss": 10,
        "if_pct": 55.88,
        "zone_times_json": null
      },
      {
        "datum": "2026-02-21T11:05:36",
        "type": "Ride",
        "duur_min": 68,
        "tss": 89,
        "if_pct": 88.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1173},{\"id\":\"Z2\",\"secs\":1848},{\"id\":\"Z3\",\"secs\":312},{\"id\":\"Z4\",\"secs\":259},{\"id\":\"Z5\",\"secs\":208},{\"id\":\"Z6\",\"secs\":92},{\"id\":\"Z7\",\"secs\":208},{\"id\":\"SS\",\"secs\":142}]"
      },
      {
        "datum": "2026-02-25T12:26:59",
        "type": "Ride",
        "duur_min": 66,
        "tss": 67,
        "if_pct": 77.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":256},{\"id\":\"Z2\",\"secs\":2164},{\"id\":\"Z3\",\"secs\":471},{\"id\":\"Z4\",\"secs\":1063},{\"id\":\"Z5\",\"secs\":18},{\"id\":\"Z6\",\"secs\":2},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1214}]"
      },
      {
        "datum": "2026-02-26T16:48:47",
        "type": "Ride",
        "duur_min": 79,
        "tss": 90,
        "if_pct": 82.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1300},{\"id\":\"Z2\",\"secs\":3109},{\"id\":\"Z3\",\"secs\":93},{\"id\":\"Z4\",\"secs\":23},{\"id\":\"Z5\",\"secs\":18},{\"id\":\"Z6\",\"secs\":17},{\"id\":\"Z7\",\"secs\":207},{\"id\":\"SS\",\"secs\":22}]"
      },
      {
        "datum": "2026-02-27T07:42:37",
        "type": "Ride",
        "duur_min": 79,
        "tss": 68,
        "if_pct": 72,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":612},{\"id\":\"Z2\",\"secs\":2420},{\"id\":\"Z3\",\"secs\":1516},{\"id\":\"Z4\",\"secs\":131},{\"id\":\"Z5\",\"secs\":16},{\"id\":\"Z6\",\"secs\":11},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":1076}]"
      },
      {
        "datum": "2026-02-28T10:51:10",
        "type": "Ride",
        "duur_min": 162,
        "tss": 124,
        "if_pct": 67.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1348},{\"id\":\"Z2\",\"secs\":6547},{\"id\":\"Z3\",\"secs\":1666},{\"id\":\"Z4\",\"secs\":119},{\"id\":\"Z5\",\"secs\":31},{\"id\":\"Z6\",\"secs\":8},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":256}]"
      },
      {
        "datum": "2026-03-02T16:02:14",
        "type": "Ride",
        "duur_min": 94,
        "tss": 86,
        "if_pct": 74.18,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1068},{\"id\":\"Z2\",\"secs\":3117},{\"id\":\"Z3\",\"secs\":530},{\"id\":\"Z4\",\"secs\":459},{\"id\":\"Z5\",\"secs\":394},{\"id\":\"Z6\",\"secs\":44},{\"id\":\"Z7\",\"secs\":10},{\"id\":\"SS\",\"secs\":333}]"
      },
      {
        "datum": "2026-03-03T07:41:50",
        "type": "Ride",
        "duur_min": 83,
        "tss": 45,
        "if_pct": 57.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1841},{\"id\":\"Z2\",\"secs\":2910},{\"id\":\"Z3\",\"secs\":129},{\"id\":\"Z4\",\"secs\":44},{\"id\":\"Z5\",\"secs\":16},{\"id\":\"Z6\",\"secs\":9},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":42}]"
      },
      {
        "datum": "2026-03-05T15:44:07",
        "type": "Ride",
        "duur_min": 115,
        "tss": 74,
        "if_pct": 62.18,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1400},{\"id\":\"Z2\",\"secs\":4995},{\"id\":\"Z3\",\"secs\":345},{\"id\":\"Z4\",\"secs\":90},{\"id\":\"Z5\",\"secs\":39},{\"id\":\"Z6\",\"secs\":11},{\"id\":\"Z7\",\"secs\":12},{\"id\":\"SS\",\"secs\":111}]"
      },
      {
        "datum": "2026-03-06T07:38:48",
        "type": "Ride",
        "duur_min": 77,
        "tss": 54,
        "if_pct": 65.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":612},{\"id\":\"Z2\",\"secs\":3597},{\"id\":\"Z3\",\"secs\":302},{\"id\":\"Z4\",\"secs\":57},{\"id\":\"Z5\",\"secs\":29},{\"id\":\"Z6\",\"secs\":20},{\"id\":\"Z7\",\"secs\":9},{\"id\":\"SS\",\"secs\":77}]"
      },
      {
        "datum": "2026-03-09T16:09:14",
        "type": "Ride",
        "duur_min": 63,
        "tss": 50,
        "if_pct": 69.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":371},{\"id\":\"Z2\",\"secs\":2822},{\"id\":\"Z3\",\"secs\":503},{\"id\":\"Z4\",\"secs\":31},{\"id\":\"Z5\",\"secs\":25},{\"id\":\"Z6\",\"secs\":8},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":58}]"
      },
      {
        "datum": "2026-03-10T16:25:48",
        "type": "Ride",
        "duur_min": 57,
        "tss": 55,
        "if_pct": 76,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":984},{\"id\":\"Z2\",\"secs\":2087},{\"id\":\"Z3\",\"secs\":85},{\"id\":\"Z4\",\"secs\":32},{\"id\":\"Z5\",\"secs\":24},{\"id\":\"Z6\",\"secs\":43},{\"id\":\"Z7\",\"secs\":186},{\"id\":\"SS\",\"secs\":44}]"
      },
      {
        "datum": "2026-03-15T18:42:31",
        "type": "Ride",
        "duur_min": 62,
        "tss": 60,
        "if_pct": 76,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":278},{\"id\":\"Z2\",\"secs\":2558},{\"id\":\"Z3\",\"secs\":590},{\"id\":\"Z4\",\"secs\":92},{\"id\":\"Z5\",\"secs\":199},{\"id\":\"Z6\",\"secs\":8},{\"id\":\"Z7\",\"secs\":11},{\"id\":\"SS\",\"secs\":79}]"
      },
      {
        "datum": "2026-03-17T07:31:12",
        "type": "Ride",
        "duur_min": 77,
        "tss": 59,
        "if_pct": 67.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":706},{\"id\":\"Z2\",\"secs\":3042},{\"id\":\"Z3\",\"secs\":708},{\"id\":\"Z4\",\"secs\":99},{\"id\":\"Z5\",\"secs\":37},{\"id\":\"Z6\",\"secs\":21},{\"id\":\"Z7\",\"secs\":7},{\"id\":\"SS\",\"secs\":188}]"
      },
      {
        "datum": "2026-03-17T16:33:49",
        "type": "Ride",
        "duur_min": 64,
        "tss": 60,
        "if_pct": 74.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":747},{\"id\":\"Z2\",\"secs\":2169},{\"id\":\"Z3\",\"secs\":444},{\"id\":\"Z4\",\"secs\":206},{\"id\":\"Z5\",\"secs\":136},{\"id\":\"Z6\",\"secs\":116},{\"id\":\"Z7\",\"secs\":48},{\"id\":\"SS\",\"secs\":244}]"
      },
      {
        "datum": "2026-03-19T17:01:02",
        "type": "Ride",
        "duur_min": 145,
        "tss": 111,
        "if_pct": 67.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1201},{\"id\":\"Z2\",\"secs\":6412},{\"id\":\"Z3\",\"secs\":862},{\"id\":\"Z4\",\"secs\":119},{\"id\":\"Z5\",\"secs\":52},{\"id\":\"Z6\",\"secs\":48},{\"id\":\"Z7\",\"secs\":21},{\"id\":\"SS\",\"secs\":260}]"
      },
      {
        "datum": "2026-03-22T12:41:46",
        "type": "Ride",
        "duur_min": 63,
        "tss": 71,
        "if_pct": 82.18,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":896},{\"id\":\"Z2\",\"secs\":2148},{\"id\":\"Z3\",\"secs\":275},{\"id\":\"Z4\",\"secs\":95},{\"id\":\"Z5\",\"secs\":87},{\"id\":\"Z6\",\"secs\":121},{\"id\":\"Z7\",\"secs\":156},{\"id\":\"SS\",\"secs\":114}]"
      },
      {
        "datum": "2026-03-24T15:56:17",
        "type": "Ride",
        "duur_min": 55,
        "tss": 72,
        "if_pct": 89.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":713},{\"id\":\"Z2\",\"secs\":1657},{\"id\":\"Z3\",\"secs\":204},{\"id\":\"Z4\",\"secs\":98},{\"id\":\"Z5\",\"secs\":254},{\"id\":\"Z6\",\"secs\":249},{\"id\":\"Z7\",\"secs\":102},{\"id\":\"SS\",\"secs\":109}]"
      },
      {
        "datum": "2026-03-25T19:07:29",
        "type": "Run",
        "duur_min": 31,
        "tss": 11,
        "if_pct": 46.14,
        "zone_times_json": null
      },
      {
        "datum": "2026-03-26T16:09:59",
        "type": "Ride",
        "duur_min": 58,
        "tss": 68,
        "if_pct": 83.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":612},{\"id\":\"Z2\",\"secs\":2257},{\"id\":\"Z3\",\"secs\":89},{\"id\":\"Z4\",\"secs\":23},{\"id\":\"Z5\",\"secs\":62},{\"id\":\"Z6\",\"secs\":403},{\"id\":\"Z7\",\"secs\":29},{\"id\":\"SS\",\"secs\":21}]"
      },
      {
        "datum": "2026-03-28T12:40:33",
        "type": "Ride",
        "duur_min": 63,
        "tss": 55,
        "if_pct": 72.73,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":525},{\"id\":\"Z2\",\"secs\":2273},{\"id\":\"Z3\",\"secs\":230},{\"id\":\"Z4\",\"secs\":692},{\"id\":\"Z5\",\"secs\":36},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":688}]"
      },
      {
        "datum": "2026-03-30T19:20:29",
        "type": "Run",
        "duur_min": 38,
        "tss": 23,
        "if_pct": 60.16,
        "zone_times_json": null
      },
      {
        "datum": "2026-03-31T07:36:27",
        "type": "Ride",
        "duur_min": 77,
        "tss": 49,
        "if_pct": 61.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":916},{\"id\":\"Z2\",\"secs\":3374},{\"id\":\"Z3\",\"secs\":242},{\"id\":\"Z4\",\"secs\":42},{\"id\":\"Z5\",\"secs\":30},{\"id\":\"Z6\",\"secs\":17},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":71}]"
      },
      {
        "datum": "2026-03-31T17:00:36",
        "type": "Ride",
        "duur_min": 80,
        "tss": 82,
        "if_pct": 78.18,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":851},{\"id\":\"Z2\",\"secs\":3206},{\"id\":\"Z3\",\"secs\":256},{\"id\":\"Z4\",\"secs\":112},{\"id\":\"Z5\",\"secs\":197},{\"id\":\"Z6\",\"secs\":66},{\"id\":\"Z7\",\"secs\":132},{\"id\":\"SS\",\"secs\":92}]"
      },
      {
        "datum": "2026-04-02T07:41:02",
        "type": "Ride",
        "duur_min": 76,
        "tss": 46,
        "if_pct": 60.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":873},{\"id\":\"Z2\",\"secs\":3478},{\"id\":\"Z3\",\"secs\":145},{\"id\":\"Z4\",\"secs\":24},{\"id\":\"Z5\",\"secs\":8},{\"id\":\"Z6\",\"secs\":7},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":42}]"
      },
      {
        "datum": "2026-04-02T15:51:49",
        "type": "Ride",
        "duur_min": 77,
        "tss": 75,
        "if_pct": 76.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":491},{\"id\":\"Z2\",\"secs\":2392},{\"id\":\"Z3\",\"secs\":523},{\"id\":\"Z4\",\"secs\":1218},{\"id\":\"Z5\",\"secs\":15},{\"id\":\"Z6\",\"secs\":3},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1360}]"
      },
      {
        "datum": "2026-04-04T13:12:30",
        "type": "Run",
        "duur_min": 38,
        "tss": 27,
        "if_pct": 59.65,
        "zone_times_json": null
      },
      {
        "datum": "2026-04-04T14:59:03",
        "type": "Ride",
        "duur_min": 68,
        "tss": 44,
        "if_pct": 62.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":3793},{\"id\":\"Z2\",\"secs\":172},{\"id\":\"Z3\",\"secs\":24},{\"id\":\"Z4\",\"secs\":11},{\"id\":\"Z5\",\"secs\":6},{\"id\":\"Z6\",\"secs\":5},{\"id\":\"Z7\",\"secs\":48},{\"id\":\"SS\",\"secs\":13}]"
      },
      {
        "datum": "2026-04-05T08:42:52",
        "type": "Ride",
        "duur_min": 138,
        "tss": 139,
        "if_pct": 77.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1435},{\"id\":\"Z2\",\"secs\":4784},{\"id\":\"Z3\",\"secs\":1124},{\"id\":\"Z4\",\"secs\":157},{\"id\":\"Z5\",\"secs\":160},{\"id\":\"Z6\",\"secs\":566},{\"id\":\"Z7\",\"secs\":41},{\"id\":\"SS\",\"secs\":284}]"
      },
      {
        "datum": "2026-04-06T08:33:20",
        "type": "Ride",
        "duur_min": 78,
        "tss": 60,
        "if_pct": 67.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":2170},{\"id\":\"Z2\",\"secs\":2422},{\"id\":\"Z3\",\"secs\":63},{\"id\":\"Z4\",\"secs\":13},{\"id\":\"Z5\",\"secs\":2},{\"id\":\"Z6\",\"secs\":1},{\"id\":\"Z7\",\"secs\":23},{\"id\":\"SS\",\"secs\":23}]"
      },
      {
        "datum": "2026-04-07T16:14:49",
        "type": "Ride",
        "duur_min": 70,
        "tss": 73,
        "if_pct": 78.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":895},{\"id\":\"Z2\",\"secs\":2349},{\"id\":\"Z3\",\"secs\":157},{\"id\":\"Z4\",\"secs\":101},{\"id\":\"Z5\",\"secs\":474},{\"id\":\"Z6\",\"secs\":250},{\"id\":\"Z7\",\"secs\":3},{\"id\":\"SS\",\"secs\":80}]"
      },
      {
        "datum": "2026-04-09T07:38:04",
        "type": "Ride",
        "duur_min": 78,
        "tss": 61,
        "if_pct": 68.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":618},{\"id\":\"Z2\",\"secs\":3213},{\"id\":\"Z3\",\"secs\":772},{\"id\":\"Z4\",\"secs\":68},{\"id\":\"Z5\",\"secs\":11},{\"id\":\"Z6\",\"secs\":6},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":324}]"
      },
      {
        "datum": "2026-04-11T09:09:10",
        "type": "Ride",
        "duur_min": 204,
        "tss": 190,
        "if_pct": 74.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1719},{\"id\":\"Z2\",\"secs\":6810},{\"id\":\"Z3\",\"secs\":2655},{\"id\":\"Z4\",\"secs\":527},{\"id\":\"Z5\",\"secs\":194},{\"id\":\"Z6\",\"secs\":210},{\"id\":\"Z7\",\"secs\":104},{\"id\":\"SS\",\"secs\":852}]"
      },
      {
        "datum": "2026-04-13T19:19:03",
        "type": "Ride",
        "duur_min": 54,
        "tss": 62,
        "if_pct": 83.27,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":980},{\"id\":\"Z2\",\"secs\":1699},{\"id\":\"Z3\",\"secs\":115},{\"id\":\"Z4\",\"secs\":39},{\"id\":\"Z5\",\"secs\":213},{\"id\":\"Z6\",\"secs\":130},{\"id\":\"Z7\",\"secs\":65},{\"id\":\"SS\",\"secs\":41}]"
      },
      {
        "datum": "2026-04-15T19:09:17",
        "type": "Ride",
        "duur_min": 76,
        "tss": 62,
        "if_pct": 69.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1553},{\"id\":\"Z2\",\"secs\":2737},{\"id\":\"Z3\",\"secs\":126},{\"id\":\"Z4\",\"secs\":24},{\"id\":\"Z5\",\"secs\":8},{\"id\":\"Z6\",\"secs\":29},{\"id\":\"Z7\",\"secs\":66},{\"id\":\"SS\",\"secs\":39}]"
      },
      {
        "datum": "2026-04-17T15:54:40",
        "type": "Ride",
        "duur_min": 46,
        "tss": 48,
        "if_pct": 79.27,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1407},{\"id\":\"Z2\",\"secs\":936},{\"id\":\"Z3\",\"secs\":203},{\"id\":\"Z4\",\"secs\":26},{\"id\":\"Z5\",\"secs\":19},{\"id\":\"Z6\",\"secs\":33},{\"id\":\"Z7\",\"secs\":112},{\"id\":\"SS\",\"secs\":55}]"
      },
      {
        "datum": "2026-04-18T07:43:38",
        "type": "Ride",
        "duur_min": 340,
        "tss": 373,
        "if_pct": 81.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":9348},{\"id\":\"Z2\",\"secs\":3859},{\"id\":\"Z3\",\"secs\":2756},{\"id\":\"Z4\",\"secs\":1821},{\"id\":\"Z5\",\"secs\":1412},{\"id\":\"Z6\",\"secs\":945},{\"id\":\"Z7\",\"secs\":280},{\"id\":\"SS\",\"secs\":1816}]"
      },
      {
        "datum": "2026-04-22T19:19:14",
        "type": "Ride",
        "duur_min": 62,
        "tss": 58,
        "if_pct": 74.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":658},{\"id\":\"Z2\",\"secs\":1678},{\"id\":\"Z3\",\"secs\":974},{\"id\":\"Z4\",\"secs\":249},{\"id\":\"Z5\",\"secs\":93},{\"id\":\"Z6\",\"secs\":55},{\"id\":\"Z7\",\"secs\":33},{\"id\":\"SS\",\"secs\":353}]"
      },
      {
        "datum": "2026-04-24T07:57:38",
        "type": "Ride",
        "duur_min": 74,
        "tss": 51,
        "if_pct": 64.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":514},{\"id\":\"Z2\",\"secs\":3654},{\"id\":\"Z3\",\"secs\":204},{\"id\":\"Z4\",\"secs\":31},{\"id\":\"Z5\",\"secs\":11},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":53}]"
      },
      {
        "datum": "2026-04-24T16:14:32",
        "type": "Ride",
        "duur_min": 100,
        "tss": 79,
        "if_pct": 68.73,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":764},{\"id\":\"Z2\",\"secs\":3891},{\"id\":\"Z3\",\"secs\":1237},{\"id\":\"Z4\",\"secs\":59},{\"id\":\"Z5\",\"secs\":19},{\"id\":\"Z6\",\"secs\":18},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":143}]"
      },
      {
        "datum": "2026-04-28T07:24:25",
        "type": "Ride",
        "duur_min": 77,
        "tss": 56,
        "if_pct": 65.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":555},{\"id\":\"Z2\",\"secs\":3624},{\"id\":\"Z3\",\"secs\":365},{\"id\":\"Z4\",\"secs\":52},{\"id\":\"Z5\",\"secs\":17},{\"id\":\"Z6\",\"secs\":8},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":79}]"
      },
      {
        "datum": "2026-04-28T17:15:10",
        "type": "Ride",
        "duur_min": 69,
        "tss": 74,
        "if_pct": 80.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":649},{\"id\":\"Z2\",\"secs\":2245},{\"id\":\"Z3\",\"secs\":571},{\"id\":\"Z4\",\"secs\":113},{\"id\":\"Z5\",\"secs\":434},{\"id\":\"Z6\",\"secs\":106},{\"id\":\"Z7\",\"secs\":25},{\"id\":\"SS\",\"secs\":127}]"
      },
      {
        "datum": "2026-04-29T19:46:22",
        "type": "Ride",
        "duur_min": 57,
        "tss": 77,
        "if_pct": 89.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":557},{\"id\":\"Z2\",\"secs\":2577},{\"id\":\"Z3\",\"secs\":110},{\"id\":\"Z4\",\"secs\":19},{\"id\":\"Z5\",\"secs\":10},{\"id\":\"Z6\",\"secs\":10},{\"id\":\"Z7\",\"secs\":133},{\"id\":\"SS\",\"secs\":34}]"
      },
      {
        "datum": "2026-05-01T12:52:08",
        "type": "Ride",
        "duur_min": 129,
        "tss": 115,
        "if_pct": 73.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1017},{\"id\":\"Z2\",\"secs\":4729},{\"id\":\"Z3\",\"secs\":1413},{\"id\":\"Z4\",\"secs\":310},{\"id\":\"Z5\",\"secs\":197},{\"id\":\"Z6\",\"secs\":61},{\"id\":\"Z7\",\"secs\":18},{\"id\":\"SS\",\"secs\":437}]"
      },
      {
        "datum": "2026-05-02T13:17:56",
        "type": "Walk",
        "duur_min": 51,
        "tss": 8,
        "if_pct": 20.75,
        "zone_times_json": null
      },
      {
        "datum": "2026-05-03T08:52:54",
        "type": "Ride",
        "duur_min": 51,
        "tss": 48,
        "if_pct": 75.27,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":157},{\"id\":\"Z2\",\"secs\":2141},{\"id\":\"Z3\",\"secs\":280},{\"id\":\"Z4\",\"secs\":392},{\"id\":\"Z5\",\"secs\":59},{\"id\":\"Z6\",\"secs\":3},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":117}]"
      },
      {
        "datum": "2026-05-04T07:12:33",
        "type": "Ride",
        "duur_min": 78,
        "tss": 51,
        "if_pct": 62.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":911},{\"id\":\"Z2\",\"secs\":3522},{\"id\":\"Z3\",\"secs\":161},{\"id\":\"Z4\",\"secs\":29},{\"id\":\"Z5\",\"secs\":11},{\"id\":\"Z6\",\"secs\":18},{\"id\":\"Z7\",\"secs\":10},{\"id\":\"SS\",\"secs\":59}]"
      },
      {
        "datum": "2026-05-04T16:48:00",
        "type": "Ride",
        "duur_min": 71,
        "tss": 74,
        "if_pct": 78.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":591},{\"id\":\"Z2\",\"secs\":1671},{\"id\":\"Z3\",\"secs\":1028},{\"id\":\"Z4\",\"secs\":798},{\"id\":\"Z5\",\"secs\":86},{\"id\":\"Z6\",\"secs\":34},{\"id\":\"Z7\",\"secs\":51},{\"id\":\"SS\",\"secs\":1366}]"
      },
      {
        "datum": "2026-05-06T19:20:39",
        "type": "Run",
        "duur_min": 17,
        "tss": 13,
        "if_pct": 67.64,
        "zone_times_json": null
      },
      {
        "datum": "2026-05-07T07:29:13",
        "type": "Ride",
        "duur_min": 76,
        "tss": 50,
        "if_pct": 62.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":772},{\"id\":\"Z2\",\"secs\":3437},{\"id\":\"Z3\",\"secs\":264},{\"id\":\"Z4\",\"secs\":46},{\"id\":\"Z5\",\"secs\":5},{\"id\":\"Z6\",\"secs\":4},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":85}]"
      },
      {
        "datum": "2026-05-07T16:42:08",
        "type": "Ride",
        "duur_min": 73,
        "tss": 53,
        "if_pct": 66.18,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":865},{\"id\":\"Z2\",\"secs\":2589},{\"id\":\"Z3\",\"secs\":832},{\"id\":\"Z4\",\"secs\":54},{\"id\":\"Z5\",\"secs\":34},{\"id\":\"Z6\",\"secs\":15},{\"id\":\"Z7\",\"secs\":5},{\"id\":\"SS\",\"secs\":135}]"
      },
      {
        "datum": "2026-05-10T19:21:42",
        "type": "Ride",
        "duur_min": 63,
        "tss": 43,
        "if_pct": 63.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":452},{\"id\":\"Z2\",\"secs\":3215},{\"id\":\"Z3\",\"secs\":105},{\"id\":\"Z4\",\"secs\":9},{\"id\":\"Z5\",\"secs\":13},{\"id\":\"Z6\",\"secs\":3},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":11}]"
      },
      {
        "datum": "2026-05-12T19:17:33",
        "type": "Ride",
        "duur_min": 61,
        "tss": 65,
        "if_pct": 80,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":517},{\"id\":\"Z2\",\"secs\":1480},{\"id\":\"Z3\",\"secs\":414},{\"id\":\"Z4\",\"secs\":1172},{\"id\":\"Z5\",\"secs\":81},{\"id\":\"Z6\",\"secs\":14},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":1115}]"
      },
      {
        "datum": "2026-05-13T07:23:11",
        "type": "Ride",
        "duur_min": 63,
        "tss": 54,
        "if_pct": 71.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":225},{\"id\":\"Z2\",\"secs\":2886},{\"id\":\"Z3\",\"secs\":205},{\"id\":\"Z4\",\"secs\":405},{\"id\":\"Z5\",\"secs\":44},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":179}]"
      },
      {
        "datum": "2026-05-15T10:13:46",
        "type": "Ride",
        "duur_min": 57,
        "tss": 64,
        "if_pct": 82.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":598},{\"id\":\"Z2\",\"secs\":471},{\"id\":\"Z3\",\"secs\":1009},{\"id\":\"Z4\",\"secs\":1314},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1921}]"
      },
      {
        "datum": "2026-05-16T19:13:59",
        "type": "Run",
        "duur_min": 25,
        "tss": 16,
        "if_pct": 61.78,
        "zone_times_json": null
      },
      {
        "datum": "2026-05-17T19:13:24",
        "type": "Run",
        "duur_min": 17,
        "tss": 14,
        "if_pct": 68.99,
        "zone_times_json": null
      },
      {
        "datum": "2026-05-18T19:29:14",
        "type": "Ride",
        "duur_min": 103,
        "tss": 81,
        "if_pct": 68.73,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":671},{\"id\":\"Z2\",\"secs\":4321},{\"id\":\"Z3\",\"secs\":1007},{\"id\":\"Z4\",\"secs\":152},{\"id\":\"Z5\",\"secs\":37},{\"id\":\"Z6\",\"secs\":5},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":217}]"
      },
      {
        "datum": "2026-05-21T07:23:49",
        "type": "Ride",
        "duur_min": 76,
        "tss": 50,
        "if_pct": 62.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":931},{\"id\":\"Z2\",\"secs\":3348},{\"id\":\"Z3\",\"secs\":226},{\"id\":\"Z4\",\"secs\":34},{\"id\":\"Z5\",\"secs\":9},{\"id\":\"Z6\",\"secs\":10},{\"id\":\"Z7\",\"secs\":10},{\"id\":\"SS\",\"secs\":69}]"
      },
      {
        "datum": "2026-05-21T16:23:32",
        "type": "Ride",
        "duur_min": 74,
        "tss": 96,
        "if_pct": 88.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":988},{\"id\":\"Z2\",\"secs\":2091},{\"id\":\"Z3\",\"secs\":154},{\"id\":\"Z4\",\"secs\":49},{\"id\":\"Z5\",\"secs\":810},{\"id\":\"Z6\",\"secs\":290},{\"id\":\"Z7\",\"secs\":46},{\"id\":\"SS\",\"secs\":65}]"
      },
      {
        "datum": "2026-05-22T15:11:16",
        "type": "Ride",
        "duur_min": 62,
        "tss": 75,
        "if_pct": 85.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":528},{\"id\":\"Z2\",\"secs\":908},{\"id\":\"Z3\",\"secs\":1391},{\"id\":\"Z4\",\"secs\":687},{\"id\":\"Z5\",\"secs\":23},{\"id\":\"Z6\",\"secs\":87},{\"id\":\"Z7\",\"secs\":72},{\"id\":\"SS\",\"secs\":1737}]"
      },
      {
        "datum": "2026-05-24T19:11:17",
        "type": "Ride",
        "duur_min": 101,
        "tss": 107,
        "if_pct": 79.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":645},{\"id\":\"Z2\",\"secs\":3381},{\"id\":\"Z3\",\"secs\":1224},{\"id\":\"Z4\",\"secs\":501},{\"id\":\"Z5\",\"secs\":37},{\"id\":\"Z6\",\"secs\":275},{\"id\":\"Z7\",\"secs\":16},{\"id\":\"SS\",\"secs\":1056}]"
      },
      {
        "datum": "2026-05-26T07:35:34",
        "type": "Ride",
        "duur_min": 77,
        "tss": 51,
        "if_pct": 62.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1006},{\"id\":\"Z2\",\"secs\":3206},{\"id\":\"Z3\",\"secs\":331},{\"id\":\"Z4\",\"secs\":39},{\"id\":\"Z5\",\"secs\":11},{\"id\":\"Z6\",\"secs\":9},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":87}]"
      },
      {
        "datum": "2026-05-26T16:12:11",
        "type": "Ride",
        "duur_min": 72,
        "tss": 82,
        "if_pct": 82.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":808},{\"id\":\"Z2\",\"secs\":2458},{\"id\":\"Z3\",\"secs\":151},{\"id\":\"Z4\",\"secs\":70},{\"id\":\"Z5\",\"secs\":526},{\"id\":\"Z6\",\"secs\":287},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":74}]"
      },
      {
        "datum": "2026-05-29T07:38:44",
        "type": "Ride",
        "duur_min": 81,
        "tss": 46,
        "if_pct": 58.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1372},{\"id\":\"Z2\",\"secs\":3401},{\"id\":\"Z3\",\"secs\":92},{\"id\":\"Z4\",\"secs\":14},{\"id\":\"Z5\",\"secs\":3},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":29}]"
      },
      {
        "datum": "2026-05-29T14:34:55",
        "type": "Ride",
        "duur_min": 77,
        "tss": 85,
        "if_pct": 81.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1480},{\"id\":\"Z2\",\"secs\":2722},{\"id\":\"Z3\",\"secs\":196},{\"id\":\"Z4\",\"secs\":31},{\"id\":\"Z5\",\"secs\":19},{\"id\":\"Z6\",\"secs\":15},{\"id\":\"Z7\",\"secs\":152},{\"id\":\"SS\",\"secs\":52}]"
      },
      {
        "datum": "2026-05-30T19:18:05",
        "type": "Ride",
        "duur_min": 103,
        "tss": 90,
        "if_pct": 72.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1155},{\"id\":\"Z2\",\"secs\":2709},{\"id\":\"Z3\",\"secs\":1601},{\"id\":\"Z4\",\"secs\":468},{\"id\":\"Z5\",\"secs\":161},{\"id\":\"Z6\",\"secs\":70},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":664}]"
      },
      {
        "datum": "2026-06-01T19:10:49",
        "type": "Ride",
        "duur_min": 77,
        "tss": 84,
        "if_pct": 81.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":732},{\"id\":\"Z2\",\"secs\":1482},{\"id\":\"Z3\",\"secs\":874},{\"id\":\"Z4\",\"secs\":1414},{\"id\":\"Z5\",\"secs\":93},{\"id\":\"Z6\",\"secs\":18},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1646}]"
      },
      {
        "datum": "2026-06-02T16:08:32",
        "type": "Ride",
        "duur_min": 66,
        "tss": 62,
        "if_pct": 75.27,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":228},{\"id\":\"Z2\",\"secs\":2450},{\"id\":\"Z3\",\"secs\":784},{\"id\":\"Z4\",\"secs\":432},{\"id\":\"Z5\",\"secs\":49},{\"id\":\"Z6\",\"secs\":13},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":310}]"
      },
      {
        "datum": "2026-06-04T19:22:56",
        "type": "Ride",
        "duur_min": 59,
        "tss": 76,
        "if_pct": 88,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":614},{\"id\":\"Z2\",\"secs\":1384},{\"id\":\"Z3\",\"secs\":88},{\"id\":\"Z4\",\"secs\":608},{\"id\":\"Z5\",\"secs\":740},{\"id\":\"Z6\",\"secs\":75},{\"id\":\"Z7\",\"secs\":3},{\"id\":\"SS\",\"secs\":112}]"
      },
      {
        "datum": "2026-06-07T12:49:30",
        "type": "Ride",
        "duur_min": 98,
        "tss": 97,
        "if_pct": 77.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":594},{\"id\":\"Z2\",\"secs\":3231},{\"id\":\"Z3\",\"secs\":809},{\"id\":\"Z4\",\"secs\":1092},{\"id\":\"Z5\",\"secs\":150},{\"id\":\"Z6\",\"secs\":11},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":765}]"
      },
      {
        "datum": "2026-06-09T07:28:09",
        "type": "Ride",
        "duur_min": 57,
        "tss": 34,
        "if_pct": 59.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":797},{\"id\":\"Z2\",\"secs\":2466},{\"id\":\"Z3\",\"secs\":127},{\"id\":\"Z4\",\"secs\":12},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":43}]"
      },
      {
        "datum": "2026-06-12T07:01:05",
        "type": "Ride",
        "duur_min": 58,
        "tss": 49,
        "if_pct": 71.64,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":643},{\"id\":\"Z2\",\"secs\":2740},{\"id\":\"Z3\",\"secs\":44},{\"id\":\"Z4\",\"secs\":4},{\"id\":\"Z5\",\"secs\":5},{\"id\":\"Z6\",\"secs\":1},{\"id\":\"Z7\",\"secs\":19},{\"id\":\"SS\",\"secs\":11}]"
      },
      {
        "datum": "2026-06-14T10:08:02",
        "type": "Ride",
        "duur_min": 181,
        "tss": 163,
        "if_pct": 73.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":3855},{\"id\":\"Z2\",\"secs\":2777},{\"id\":\"Z3\",\"secs\":2657},{\"id\":\"Z4\",\"secs\":1049},{\"id\":\"Z5\",\"secs\":406},{\"id\":\"Z6\",\"secs\":123},{\"id\":\"Z7\",\"secs\":21},{\"id\":\"SS\",\"secs\":1567}]"
      },
      {
        "datum": "2026-06-15T08:33:18",
        "type": "Ride",
        "duur_min": 163,
        "tss": 152,
        "if_pct": 74.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":3655},{\"id\":\"Z2\",\"secs\":2134},{\"id\":\"Z3\",\"secs\":1998},{\"id\":\"Z4\",\"secs\":1468},{\"id\":\"Z5\",\"secs\":405},{\"id\":\"Z6\",\"secs\":97},{\"id\":\"Z7\",\"secs\":11},{\"id\":\"SS\",\"secs\":1778}]"
      },
      {
        "datum": "2026-06-16T07:22:33",
        "type": "Ride",
        "duur_min": 266,
        "tss": 258,
        "if_pct": 76.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":6513},{\"id\":\"Z2\",\"secs\":3798},{\"id\":\"Z3\",\"secs\":2432},{\"id\":\"Z4\",\"secs\":1821},{\"id\":\"Z5\",\"secs\":970},{\"id\":\"Z6\",\"secs\":336},{\"id\":\"Z7\",\"secs\":85},{\"id\":\"SS\",\"secs\":1897}]"
      },
      {
        "datum": "2026-06-17T07:54:34",
        "type": "Ride",
        "duur_min": 79,
        "tss": 97,
        "if_pct": 85.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":2154},{\"id\":\"Z2\",\"secs\":1008},{\"id\":\"Z3\",\"secs\":530},{\"id\":\"Z4\",\"secs\":433},{\"id\":\"Z5\",\"secs\":272},{\"id\":\"Z6\",\"secs\":259},{\"id\":\"Z7\",\"secs\":106},{\"id\":\"SS\",\"secs\":424}]"
      },
      {
        "datum": "2026-06-19T08:54:31",
        "type": "Ride",
        "duur_min": 120,
        "tss": 134,
        "if_pct": 81.82,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":2544},{\"id\":\"Z2\",\"secs\":990},{\"id\":\"Z3\",\"secs\":1264},{\"id\":\"Z4\",\"secs\":1807},{\"id\":\"Z5\",\"secs\":477},{\"id\":\"Z6\",\"secs\":106},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":1648}]"
      },
      {
        "datum": "2026-06-22T19:30:28",
        "type": "Ride",
        "duur_min": 60,
        "tss": 62,
        "if_pct": 78.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":604},{\"id\":\"Z2\",\"secs\":1609},{\"id\":\"Z3\",\"secs\":435},{\"id\":\"Z4\",\"secs\":771},{\"id\":\"Z5\",\"secs\":177},{\"id\":\"Z6\",\"secs\":16},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":741}]"
      },
      {
        "datum": "2026-06-23T12:37:14",
        "type": "Run",
        "duur_min": 6,
        "tss": 5,
        "if_pct": "",
        "zone_times_json": null
      },
      {
        "datum": "2026-06-25T19:40:30",
        "type": "Ride",
        "duur_min": 106,
        "tss": 78,
        "if_pct": 66.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1036},{\"id\":\"Z2\",\"secs\":4305},{\"id\":\"Z3\",\"secs\":814},{\"id\":\"Z4\",\"secs\":141},{\"id\":\"Z5\",\"secs\":34},{\"id\":\"Z6\",\"secs\":13},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":243}]"
      },
      {
        "datum": "2026-06-27T19:18:31",
        "type": "Ride",
        "duur_min": 65,
        "tss": 74,
        "if_pct": 82.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":688},{\"id\":\"Z2\",\"secs\":1344},{\"id\":\"Z3\",\"secs\":345},{\"id\":\"Z4\",\"secs\":1303},{\"id\":\"Z5\",\"secs\":214},{\"id\":\"Z6\",\"secs\":32},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":928}]"
      },
      {
        "datum": "2026-06-29T07:37:46",
        "type": "Ride",
        "duur_min": 75,
        "tss": 53,
        "if_pct": 65.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":667},{\"id\":\"Z2\",\"secs\":3436},{\"id\":\"Z3\",\"secs\":322},{\"id\":\"Z4\",\"secs\":44},{\"id\":\"Z5\",\"secs\":8},{\"id\":\"Z6\",\"secs\":5},{\"id\":\"Z7\",\"secs\":3},{\"id\":\"SS\",\"secs\":84}]"
      },
      {
        "datum": "2026-06-29T16:20:01",
        "type": "Ride",
        "duur_min": 75,
        "tss": 93,
        "if_pct": 86.18,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":733},{\"id\":\"Z2\",\"secs\":1731},{\"id\":\"Z3\",\"secs\":144},{\"id\":\"Z4\",\"secs\":1133},{\"id\":\"Z5\",\"secs\":762},{\"id\":\"Z6\",\"secs\":10},{\"id\":\"Z7\",\"secs\":1},{\"id\":\"SS\",\"secs\":136}]"
      },
      {
        "datum": "2026-07-02T19:21:16",
        "type": "Ride",
        "duur_min": 105,
        "tss": 88,
        "if_pct": 70.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":662},{\"id\":\"Z2\",\"secs\":3621},{\"id\":\"Z3\",\"secs\":1813},{\"id\":\"Z4\",\"secs\":129},{\"id\":\"Z5\",\"secs\":38},{\"id\":\"Z6\",\"secs\":18},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":336}]"
      },
      {
        "datum": "2026-07-04T06:50:35",
        "type": "Ride",
        "duur_min": 62,
        "tss": 66,
        "if_pct": 80.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":364},{\"id\":\"Z2\",\"secs\":1171},{\"id\":\"Z3\",\"secs\":1212},{\"id\":\"Z4\",\"secs\":922},{\"id\":\"Z5\",\"secs\":32},{\"id\":\"Z6\",\"secs\":1},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1620}]"
      },
      {
        "datum": "2026-07-06T19:23:15",
        "type": "Ride",
        "duur_min": 125,
        "tss": 118,
        "if_pct": 75.27,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":673},{\"id\":\"Z2\",\"secs\":3688},{\"id\":\"Z3\",\"secs\":2850},{\"id\":\"Z4\",\"secs\":196},{\"id\":\"Z5\",\"secs\":75},{\"id\":\"Z6\",\"secs\":6},{\"id\":\"Z7\",\"secs\":22},{\"id\":\"SS\",\"secs\":632}]"
      },
      {
        "datum": "2026-07-08T13:01:29",
        "type": "Ride",
        "duur_min": 61,
        "tss": 71,
        "if_pct": 84,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":495},{\"id\":\"Z2\",\"secs\":1173},{\"id\":\"Z3\",\"secs\":631},{\"id\":\"Z4\",\"secs\":984},{\"id\":\"Z5\",\"secs\":291},{\"id\":\"Z6\",\"secs\":64},{\"id\":\"Z7\",\"secs\":2},{\"id\":\"SS\",\"secs\":777}]"
      },
      {
        "datum": "2026-07-10T19:14:13",
        "type": "Ride",
        "duur_min": 72,
        "tss": 52,
        "if_pct": 66.18,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":502},{\"id\":\"Z2\",\"secs\":3303},{\"id\":\"Z3\",\"secs\":441},{\"id\":\"Z4\",\"secs\":45},{\"id\":\"Z5\",\"secs\":10},{\"id\":\"Z6\",\"secs\":2},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":67}]"
      },
      {
        "datum": "2026-07-12T07:26:57",
        "type": "Ride",
        "duur_min": 62,
        "tss": 45,
        "if_pct": 65.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":210},{\"id\":\"Z2\",\"secs\":3329},{\"id\":\"Z3\",\"secs\":186},{\"id\":\"Z4\",\"secs\":21},{\"id\":\"Z5\",\"secs\":1},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":21}]"
      },
      {
        "datum": "2026-07-13T14:15:10",
        "type": "Ride",
        "duur_min": 50,
        "tss": 41,
        "if_pct": 70.55,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":288},{\"id\":\"Z2\",\"secs\":1721},{\"id\":\"Z3\",\"secs\":948},{\"id\":\"Z4\",\"secs\":25},{\"id\":\"Z5\",\"secs\":7},{\"id\":\"Z6\",\"secs\":5},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":91}]"
      },
      {
        "datum": "2026-07-15T19:23:48",
        "type": "Ride",
        "duur_min": 48,
        "tss": 63,
        "if_pct": 89.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":433},{\"id\":\"Z2\",\"secs\":951},{\"id\":\"Z3\",\"secs\":227},{\"id\":\"Z4\",\"secs\":647},{\"id\":\"Z5\",\"secs\":463},{\"id\":\"Z6\",\"secs\":132},{\"id\":\"Z7\",\"secs\":5},{\"id\":\"SS\",\"secs\":450}]"
      },
      {
        "datum": "2026-07-16T12:57:53",
        "type": "Ride",
        "duur_min": 71,
        "tss": 57,
        "if_pct": 69.45,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":786},{\"id\":\"Z2\",\"secs\":2182},{\"id\":\"Z3\",\"secs\":1207},{\"id\":\"Z4\",\"secs\":56},{\"id\":\"Z5\",\"secs\":21},{\"id\":\"Z6\",\"secs\":28},{\"id\":\"Z7\",\"secs\":4},{\"id\":\"SS\",\"secs\":140}]"
      },
      {
        "datum": "2026-07-18T13:03:16",
        "type": "Ride",
        "duur_min": 127,
        "tss": 132,
        "if_pct": 78.91,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":1137},{\"id\":\"Z2\",\"secs\":3223},{\"id\":\"Z3\",\"secs\":1614},{\"id\":\"Z4\",\"secs\":1390},{\"id\":\"Z5\",\"secs\":204},{\"id\":\"Z6\",\"secs\":37},{\"id\":\"Z7\",\"secs\":28},{\"id\":\"SS\",\"secs\":1319}]"
      },
      {
        "datum": "2026-07-19T19:18:21",
        "type": "WeightTraining",
        "duur_min": 12,
        "tss": 3,
        "if_pct": 38.07,
        "zone_times_json": null
      },
      {
        "datum": "2026-07-20T16:08:50",
        "type": "Ride",
        "duur_min": 63,
        "tss": 50,
        "if_pct": 69.09,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":385},{\"id\":\"Z2\",\"secs\":2490},{\"id\":\"Z3\",\"secs\":867},{\"id\":\"Z4\",\"secs\":23},{\"id\":\"Z5\",\"secs\":4},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":57}]"
      },
      {
        "datum": "2026-07-21T16:05:18",
        "type": "Ride",
        "duur_min": 65,
        "tss": 70,
        "if_pct": 80.36,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":415},{\"id\":\"Z2\",\"secs\":1717},{\"id\":\"Z3\",\"secs\":498},{\"id\":\"Z4\",\"secs\":1230},{\"id\":\"Z5\",\"secs\":47},{\"id\":\"Z6\",\"secs\":3},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":1178}]"
      },
      {
        "datum": "2026-07-23T16:13:58",
        "type": "Ride",
        "duur_min": 57,
        "tss": 36,
        "if_pct": 61.43,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":725},{\"id\":\"Z2\",\"secs\":2463},{\"id\":\"Z3\",\"secs\":223},{\"id\":\"Z4\",\"secs\":9},{\"id\":\"Z5\",\"secs\":0},{\"id\":\"Z6\",\"secs\":0},{\"id\":\"Z7\",\"secs\":0},{\"id\":\"SS\",\"secs\":32}]"
      },
      {
        "datum": "2026-07-25T19:24:22",
        "type": "Ride",
        "duur_min": 106,
        "tss": 103,
        "if_pct": 76.43,
        "zone_times_json": "[{\"id\":\"Z1\",\"secs\":703},{\"id\":\"Z2\",\"secs\":3072},{\"id\":\"Z3\",\"secs\":1603},{\"id\":\"Z4\",\"secs\":887},{\"id\":\"Z5\",\"secs\":42},{\"id\":\"Z6\",\"secs\":20},{\"id\":\"Z7\",\"secs\":6},{\"id\":\"SS\",\"secs\":1318}]"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WEUR",
      "served_by_colo": "AMS",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.8434
      },
      "duration": 0.8434,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 290816,
      "rows_read": 467,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
```
