import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { barbershopsTable } from "./barbershops";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  barbershopId: integer("barbershop_id").notNull().references(() => barbershopsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
