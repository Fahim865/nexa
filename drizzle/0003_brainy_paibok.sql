ALTER TABLE `users` ADD `googleSubject` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_googleSubject_unique` UNIQUE(`googleSubject`);