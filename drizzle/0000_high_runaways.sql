CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`tags` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
