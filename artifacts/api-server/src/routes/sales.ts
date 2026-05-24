import { Router } from "express";
import { db } from "@workspace/db";
import { salesTable, barbersTable, commissionsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { barbershopId, startDate, endDate } = req.query as {
    barbershopId?: string; startDate?: string; endDate?: string;
  };

  const conditions = [];
  if (barbershopId) conditions.push(eq(salesTable.barbershopId, parseInt(barbershopId)));
  if (startDate) conditions.push(gte(salesTable.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(salesTable.createdAt, new Date(endDate + "T23:59:59Z")));

  const results = await db.select({
    id: salesTable.id,
    amount: salesTable.amount,
    description: salesTable.description,
    barbershopId: salesTable.barbershopId,
    barberId: salesTable.barberId,
    appointmentId: salesTable.appointmentId,
    createdAt: salesTable.createdAt,
    barberName: barbersTable.name,
  })
    .from(salesTable)
    .leftJoin(barbersTable, eq(salesTable.barberId, barbersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(results);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { amount, description, barbershopId, barberId, appointmentId } = req.body as {
    amount: number; description: string; barbershopId: number; barberId: number; appointmentId?: number;
  };

  if (!amount || !description || !barbershopId || !barberId) {
    res.status(400).json({ error: "amount, description, barbershopId, barberId are required" });
    return;
  }

  const [sale] = await db.insert(salesTable).values({ amount, description, barbershopId, barberId, appointmentId }).returning();

  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, barberId)).limit(1);
  if (barber && barber.commissionRate > 0) {
    const commissionAmount = amount * (barber.commissionRate / 100);
    await db.insert(commissionsTable).values({ barberId, saleId: sale.id, amount: commissionAmount, rate: barber.commissionRate });
  }

  const [fullSale] = await db.select({
    id: salesTable.id,
    amount: salesTable.amount,
    description: salesTable.description,
    barbershopId: salesTable.barbershopId,
    barberId: salesTable.barberId,
    appointmentId: salesTable.appointmentId,
    createdAt: salesTable.createdAt,
    barberName: barbersTable.name,
  }).from(salesTable).leftJoin(barbersTable, eq(salesTable.barberId, barbersTable.id)).where(eq(salesTable.id, sale.id));

  res.status(201).json(fullSale);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(commissionsTable).where(eq(commissionsTable.saleId, id));
  await db.delete(salesTable).where(eq(salesTable.id, id));
  res.status(204).send();
});

export default router;
