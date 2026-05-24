import { Router } from "express";
import { db } from "@workspace/db";
import { barbersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router({ mergeParams: true });

router.get("/barbershops/:barbershopId/barbers", async (req, res) => {
  const barbershopId = parseInt(String(req.params.barbershopId));
  const barbers = await db.select().from(barbersTable).where(eq(barbersTable.barbershopId, barbershopId));
  res.json(barbers);
});

router.post("/barbershops/:barbershopId/barbers", requireAuth, requireAdmin, async (req, res) => {
  const barbershopId = parseInt(String(req.params.barbershopId));
  const { name, phone, specialties, commissionRate } = req.body as {
    name: string; phone?: string; specialties?: string; commissionRate?: number;
  };

  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [barber] = await db.insert(barbersTable).values({
    name, phone, specialties, commissionRate: commissionRate ?? 0, barbershopId,
  }).returning();
  res.status(201).json(barber);
});

router.get("/barbers/:id", async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, id)).limit(1);
  if (!barber) { res.status(404).json({ error: "Not found" }); return; }
  res.json(barber);
});

router.patch("/barbers/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { name, phone, specialties, commissionRate } = req.body as {
    name?: string; phone?: string; specialties?: string; commissionRate?: number;
  };

  const [barber] = await db.update(barbersTable)
    .set({ ...(name && { name }), ...(phone !== undefined && { phone }), ...(specialties !== undefined && { specialties }), ...(commissionRate !== undefined && { commissionRate }) })
    .where(eq(barbersTable.id, id)).returning();
  if (!barber) { res.status(404).json({ error: "Not found" }); return; }
  res.json(barber);
});

router.delete("/barbers/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(barbersTable).where(eq(barbersTable.id, id));
  res.status(204).send();
});

export default router;
