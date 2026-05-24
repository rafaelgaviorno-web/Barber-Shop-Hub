import { Router } from "express";
import { db } from "@workspace/db";
import { commissionsTable, barbersTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { barberId, barbershopId, startDate, endDate } = req.query as {
    barberId?: string; barbershopId?: string; startDate?: string; endDate?: string;
  };

  const conditions = [];
  if (barberId) conditions.push(eq(commissionsTable.barberId, parseInt(barberId)));
  if (startDate) conditions.push(gte(commissionsTable.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(commissionsTable.createdAt, new Date(endDate + "T23:59:59Z")));

  const results = await db.select({
    id: commissionsTable.id,
    barberId: commissionsTable.barberId,
    saleId: commissionsTable.saleId,
    amount: commissionsTable.amount,
    rate: commissionsTable.rate,
    createdAt: commissionsTable.createdAt,
    barberName: barbersTable.name,
  })
    .from(commissionsTable)
    .leftJoin(barbersTable, eq(commissionsTable.barberId, barbersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(results);
});

export default router;
