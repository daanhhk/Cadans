CREATE TABLE `power_curve_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`window` text NOT NULL,
	`fetched_on` text NOT NULL,
	`raw_json` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `power_curve_cache_user_window_unq` ON `power_curve_cache` (`user_id`,`window`);