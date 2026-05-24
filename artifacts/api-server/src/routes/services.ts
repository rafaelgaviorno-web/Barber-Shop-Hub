import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/barbershops/:barbershopId/services", async (req, res) => {
  const barbershopId = parseInt(String(req.params.barbershopId));
  const services = await db.select().from(servicesTable).where(eq(servicesTable.barbershopId, barbershopId));
  res.json(services);
});

router.post("/barbershops/:barbershopId/services", requireAuth, requireAdmin, async (req, res) => {
  const barbershopId = parseInt(String(req.params.barbershopId));
  const { name, description, price, durationMinutes } = req.body as {
    name: string; description?: string; price: number; durationMinutes: number;
  };

  if (!name || price === undefined || !durationMinutes) {
    res.status(400).json({ error: "name, price, durationMinutes are required" });
    return;
  }

  const [service] = await db.insert(servicesTable).values({ name, description, price, durationMinutes, barbershopId }).returning();
  res.status(201).json(service);
});

router.patch("/services/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { name, description, price, durationMinutes } = req.body as {
    name?: string; description?: string; price?: number; durationMinutes?: number;
  };

  const [service] = await db.update(servicesTable)
    .set({ ...(name && { name }), ...(description !== undefined && { description }), ...(price !== undefined && { price }), ...(durationMinutes !== undefined && { durationMinutes }) })
    .where(eq(servicesTable.id, id)).returning();
  if (!service) { res.status(404).json({ error: "Not found" }); return; }
  res.json(service);
});

router.delete("/services/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.status(204).send();
});

export default router;
