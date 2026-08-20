CREATE TABLE `billingEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`userId` int,
	`providerCustomerId` varchar(255),
	`providerSubscriptionId` varchar(255),
	`status` enum('RECEIVED','APPLIED','IGNORED','FAILED') NOT NULL DEFAULT 'RECEIVED',
	`failureReason` text,
	`occurredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_events_provider_event_idx` UNIQUE(`provider`,`eventId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `cancelAtPeriodEnd` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `billingEvents` ADD CONSTRAINT `billingEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `billing_events_user_created_idx` ON `billingEvents` (`userId`,`createdAt`);