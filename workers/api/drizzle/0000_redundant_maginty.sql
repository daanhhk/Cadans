CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`datum` text NOT NULL,
	`type` text,
	`naam` text,
	`duur_min` integer,
	`afstand_km` real,
	`gem_w` integer,
	`norm_w` integer,
	`if_pct` real,
	`tss` integer,
	`gem_hr` integer,
	`max_hr` integer,
	`pi` real,
	`ftp` integer,
	`gewicht` real,
	`rolling_ftp` integer,
	`zone_times_json` text,
	`activity_id_ext` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_user_actid_unq` ON `activities` (`user_id`,`activity_id_ext`);--> statement-breakpoint
CREATE INDEX `activities_user_datum_idx` ON `activities` (`user_id`,`datum`);--> statement-breakpoint
CREATE TABLE `checkins` (
	`user_id` integer NOT NULL,
	`datum` text NOT NULL,
	`slaap` text,
	`benen` text,
	`stress` text,
	`ts` text,
	PRIMARY KEY(`user_id`, `datum`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `day_state` (
	`user_id` integer NOT NULL,
	`datum` text NOT NULL,
	`override_json` text,
	`disposition` text,
	PRIMARY KEY(`user_id`, `datum`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`datum` text NOT NULL,
	`naam` text,
	`type` text,
	`prioriteit` text,
	`afstand_km` real,
	`hoogtemeters` integer,
	`klim_type` text,
	`notitie` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_user_datum_idx` ON `events` (`user_id`,`datum`);--> statement-breakpoint
CREATE TABLE `planner_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`datum` text NOT NULL,
	`train` integer,
	`dag` text,
	`minuten` integer,
	`dagtype` text,
	`toelichting` text,
	`voorgesteld_type` text,
	`gedaan` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `planner_days_user_datum_unq` ON `planner_days` (`user_id`,`datum`);--> statement-breakpoint
CREATE TABLE `rpe` (
	`user_id` integer NOT NULL,
	`datum` text NOT NULL,
	`rpe` integer,
	PRIMARY KEY(`user_id`, `datum`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`ftp` integer,
	`hr_max` integer,
	`hr_rest` integer,
	`lthr` integer,
	`threshold_pace` text,
	`doel` text,
	`doel_start` text,
	`doel_duur` integer,
	`fase` text,
	`gewicht` real,
	`profiel_preset` text,
	`pendel_duur_min` integer,
	`pendel_aantal` integer,
	`ftp_auto_update` integer,
	`weight_auto_update` integer,
	`email_digest` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`last_sync` text,
	`meso_week` integer,
	`load_carry` real,
	`ftp_last_sync` text,
	`weight_last_sync` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text,
	`intervals_athlete_id` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `weekplans` (
	`user_id` integer NOT NULL,
	`week_monday` text NOT NULL,
	`entries_json` text,
	PRIMARY KEY(`user_id`, `week_monday`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wellness` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`datum` text NOT NULL,
	`rhr` integer,
	`hrv` real,
	`slaap_u` real,
	`slaap_score` integer,
	`readiness` integer,
	`mood` text,
	`weight_kg` real,
	`ctl` real,
	`atl` real,
	`vorm` real,
	`ramp` real,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wellness_user_datum_unq` ON `wellness` (`user_id`,`datum`);