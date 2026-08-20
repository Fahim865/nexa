CREATE TABLE `aiCreditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`toolId` varchar(64) NOT NULL,
	`credits` int NOT NULL,
	`status` enum('RESERVED','SUCCEEDED','REFUNDED','REJECTED') NOT NULL,
	`provider` varchar(64),
	`model` varchar(255),
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`finalizedAt` timestamp,
	CONSTRAINT `aiCreditTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `aiCreditTransactions_requestId_unique` UNIQUE(`requestId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyCreditAllowance` int DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `remainingCredits` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastCreditResetDate` timestamp;--> statement-breakpoint
ALTER TABLE `aiCreditTransactions` ADD CONSTRAINT `aiCreditTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_credit_transactions_user_created_idx` ON `aiCreditTransactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_credit_transactions_request_status_idx` ON `aiCreditTransactions` (`requestId`,`status`);