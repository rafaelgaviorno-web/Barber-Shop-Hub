import { Router } from "express";
import { db } from "@workspace/db";
import { expensesTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { barbershopId, startDate, endDate } = req.query as {
    barbershopId?: string; startDate?: string; endDate?: string;
  };

  const conditions = [];
  if (barbershopId) conditions.push(eq(expensesTable.barbershopId, parseInt(barbershopId)));
  if (startDate) conditions.push(gte(expensesTable.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(expensesTable.createdAt, new Date(endDate + "T23:59:59Z")));

  const results = await db.select().from(expensesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(results);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { amount, description, category, barbershopId } = req.body as {
    amount: number; description: string; category: string; barbershopId: number;
  };

  if (!amount || !description || !category || !barbershopId) {
    res.status(400).json({ error: "amount, description, category, barbershopId are required" });
    return;
  }

  const [expense] = await db.insert(expensesTable).values({ amount, description, category, barbershopId }).returning();
  res.status(201).json(expense);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(expensesTable).where(eq(expensesTable.id, id));
  res.status(204).send();
});

export default router;
