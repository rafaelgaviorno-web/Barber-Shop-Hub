import { Router } from "express";
import { db } from "@workspace/db";
import { barbershopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", async (_req, res) => {
  const shops = await db.select().from(barbershopsTable);
  res.json(shops);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, address, phone, description, openTime, closeTime } = req.body as {
    name: string; address?: string; phone?: string; description?: string; openTime?: string; closeTime?: string;
  };

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [shop] = await db.insert(barbershopsTable).values({
    name, address, phone, description, openTime, closeTime, ownerId: req.user!.userId,
  }).returning();
  res.status(201).json(shop);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, id)).limit(1);
  if (!shop) { res.status(404).json({ error: "Not found" }); return; }
  res.json(shop);
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { name, address, phone, description, openTime, closeTime } = req.body as {
    name?: string; address?: string; phone?: string; description?: string; openTime?: string; closeTime?: string;
  };

  const [shop] = await db.update(barbershopsTable)
    .set({ ...(name && { name }), ...(address !== undefined && { address }), ...(phone !== undefined && { phone }), ...(description !== undefined && { description }), ...(openTime !== undefined && { openTime }), ...(closeTime !== undefined && { closeTime }) })
    .where(eq(barbershopsTable.id, id)).returning();
  if (!shop) { res.status(404).json({ error: "Not found" }); return; }
  res.json(shop);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(barbershopsTable).where(eq(barbershopsTable.id, id));
  res.status(204).send();
});

export default router;
