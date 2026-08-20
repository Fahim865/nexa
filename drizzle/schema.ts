import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Server-verified product entitlement. Payment activation is added separately. */
  plan: mysqlEnum("plan", ["FREE", "PREMIUM"]).default("FREE").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["INACTIVE", "ACTIVE", "CANCELED", "PAST_DUE", "TRIALING"]).default("INACTIVE").notNull(),
  subscriptionStartDate: timestamp("subscriptionStartDate"),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  paymentProvider: varchar("paymentProvider", { length: 64 }),
  providerCustomerId: varchar("providerCustomerId", { length: 255 }),
  providerSubscriptionId: varchar("providerSubscriptionId", { length: 255 }),
  /** Server-owned allowance copied into each eligible subscription period. */
  monthlyCreditAllowance: int("monthlyCreditAllowance").default(5000).notNull(),
  /** Mutable balance; it is only written through the credit service transaction. */
  remainingCredits: int("remainingCredits").default(0).notNull(),
  /** Start time of the subscription period for which the current balance was issued. */
  lastCreditResetDate: timestamp("lastCreditResetDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Immutable-ish audit ledger for every charged, refunded, or rejected AI request. */
export const aiCreditTransactions = mysqlTable(
  "aiCreditTransactions",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: varchar("requestId", { length: 64 }).notNull().unique(),
    userId: int("userId").notNull().references(() => users.id),
    toolId: varchar("toolId", { length: 64 }).notNull(),
    credits: int("credits").notNull(),
    status: mysqlEnum("status", ["RESERVED", "SUCCEEDED", "REFUNDED", "REJECTED"]).notNull(),
    provider: varchar("provider", { length: 64 }),
    model: varchar("model", { length: 255 }),
    failureReason: text("failureReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    finalizedAt: timestamp("finalizedAt"),
  },
  table => [
    index("ai_credit_transactions_user_created_idx").on(table.userId, table.createdAt),
    index("ai_credit_transactions_request_status_idx").on(table.requestId, table.status),
  ],
);

export type AiCreditTransaction = typeof aiCreditTransactions.$inferSelect;
