CREATE TABLE `editors` (
	`email` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
