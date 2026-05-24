import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { barbershopsTable } from "./barbershops";
import { barbersTable } from "./barbers";
import { appointmentsTable } from "./appointments";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  barbershopId: integer("barbershop_id").notNull().references(() => barbershopsTable.id),
  barberId: integer("barber_id").notNull().references(() => barbersTable.id),
  appointmentId: integer("appointment_id").references(() => appointmentsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
