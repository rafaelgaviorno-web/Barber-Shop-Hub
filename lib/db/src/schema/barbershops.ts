import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const barbershopsTable = pgTable("barbershops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  description: text("description"),
  openTime: text("open_time"),
  closeTime: text("close_time"),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBarbershopSchema = createInsertSchema(barbershopsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBarbershop = z.infer<typeof insertBarbershopSchema>;
export type Barbershop = typeof barbershopsTable.$inferSelect;
