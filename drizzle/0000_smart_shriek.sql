CREATE TABLE `ai_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`key_encrypted` text NOT NULL,
	`nonce` text NOT NULL,
	`v` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`ticker` text NOT NULL,
	`name` text NOT NULL,
	`company_id` integer,
	`ticker_id` integer,
	`sector` text,
	`segment` text,
	`subsector` text,
	`fii_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_ticker_unique` ON `assets` (`ticker`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dividends` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`ex_date` integer,
	`pay_date` integer,
	`value` real,
	`type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fii_indicators` (
	`asset_id` text PRIMARY KEY NOT NULL,
	`p_vp` real,
	`dividend_yield` real,
	`net_worth` real,
	`vacancy` real,
	`last_12m_dividends` real,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `indicators` (
	`asset_id` text NOT NULL,
	`year` text NOT NULL,
	`p_l` real,
	`p_vp` real,
	`roe` real,
	`net_margin` real,
	`dy_12m` real,
	`dy_5y` real,
	`bazin_price` real,
	`graham_price` real,
	`bazin_upside` real,
	`graham_upside` real,
	`growth_net_profit_5y` real,
	`growth_net_revenue_5y` real,
	`net_worth` real,
	`net_revenue` real,
	`net_profit` real,
	`enterprise_value` real,
	`gross_debt_net_worth` real,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`asset_id`, `year`),
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `indicators_asset_year` ON `indicators` (`asset_id`,`year`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`asset_id` text PRIMARY KEY NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`variation_30d` real,
	`variation_12m` real,
	`variation_5y` real,
	`last_update` integer,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `saved_filters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`filter_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`expiresAt` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `watchlist` (
	`user_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `asset_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
