import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { barbershopsTable } from "./barbershops";

export const barbersTable = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  specialties: text("specialties"),
  commissionRate: real("commission_rate").notNull().default(0),
  barbershopId: integer("barbershop_id").notNull().references(() => barbershopsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBarberSchema = createInsertSchema(barbersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbersTable.$inferSelect;
