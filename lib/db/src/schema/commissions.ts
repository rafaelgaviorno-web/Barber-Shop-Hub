import { pgTable, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { barbersTable } from "./barbers";
import { salesTable } from "./sales";

export const commissionsTable = pgTable("commissions", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbersTable.id),
  saleId: integer("sale_id").notNull().references(() => salesTable.id),
  amount: real("amount").notNull(),
  rate: real("rate").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommissionSchema = createInsertSchema(commissionsTable).omit({ id: true, createdAt: true });
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissionsTable.$inferSelect;
