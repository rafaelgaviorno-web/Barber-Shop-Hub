import { Router } from "express";
import { db } from "@workspace/db";
import { salesTable, expensesTable, commissionsTable, appointmentsTable, barbersTable } from "@workspace/db";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/financial-summary", requireAuth, requireAdmin, async (req, res) => {
  const { barbershopId, startDate, endDate } = req.query as {
    barbershopId?: string; startDate?: string; endDate?: string;
  };

  const saleConditions = [];
  const expenseConditions = [];
  const apptConditions = [];

  if (barbershopId) {
    saleConditions.push(eq(salesTable.barbershopId, parseInt(barbershopId)));
    expenseConditions.push(eq(expensesTable.barbershopId, parseInt(barbershopId)));
    apptConditions.push(eq(appointmentsTable.barbershopId, parseInt(barbershopId)));
  }
  if (startDate) {
    saleConditions.push(gte(salesTable.createdAt, new Date(startDate)));
    expenseConditions.push(gte(expensesTable.createdAt, new Date(startDate)));
    apptConditions.push(gte(appointmentsTable.scheduledAt, new Date(startDate)));
  }
  if (endDate) {
    const end = new Date(endDate + "T23:59:59Z");
    saleConditions.push(lte(salesTable.createdAt, end));
    expenseConditions.push(lte(expensesTable.createdAt, end));
    apptConditions.push(lte(appointmentsTable.scheduledAt, end));
  }

  const [{ totalRevenue }] = await db.select({ totalRevenue: sql<number>`coalesce(sum(${salesTable.amount}),0)` })
    .from(salesTable).where(saleConditions.length > 0 ? and(...saleConditions) : undefined);

  const [{ totalExpenses }] = await db.select({ totalExpenses: sql<number>`coalesce(sum(${expensesTable.amount}),0)` })
    .from(expensesTable).where(expenseConditions.length > 0 ? and(...expenseConditions) : undefined);

  const [{ totalCommissions }] = await db.select({ totalCommissions: sql<number>`coalesce(sum(${commissionsTable.amount}),0)` })
    .from(commissionsTable);

  const completedConditions = [...apptConditions, eq(appointmentsTable.status, "completed")];
  const [{ appointmentsCompleted }] = await db.select({ appointmentsCompleted: count() })
    .from(appointmentsTable).where(and(...completedConditions));

  res.json({
    totalRevenue: Number(totalRevenue),
    totalExpenses: Number(totalExpenses),
    netProfit: Number(totalRevenue) - Number(totalExpenses),
    totalCommissions: Number(totalCommissions),
    appointmentsCompleted: Number(appointmentsCompleted),
  });
});

router.get("/monthly-cashflow", requireAuth, requireAdmin, async (req, res) => {
  const { barbershopId, year } = req.query as { barbershopId?: string; year?: string };
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const result = [];

  for (const month of months) {
    const startDate = new Date(`${targetYear}-${month.toString().padStart(2, "0")}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setMilliseconds(-1);

    const saleConds = [gte(salesTable.createdAt, startDate), lte(salesTable.createdAt, endDate)];
    const expenseConds = [gte(expensesTable.createdAt, startDate), lte(expensesTable.createdAt, endDate)];
    if (barbershopId) {
      saleConds.push(eq(salesTable.barbershopId, parseInt(barbershopId)));
      expenseConds.push(eq(expensesTable.barbershopId, parseInt(barbershopId)));
    }

    const [{ revenue }] = await db.select({ revenue: sql<number>`coalesce(sum(${salesTable.amount}),0)` })
      .from(salesTable).where(and(...saleConds));

    const [{ expenses }] = await db.select({ expenses: sql<number>`coalesce(sum(${expensesTable.amount}),0)` })
      .from(expensesTable).where(and(...expenseConds));

    const rev = Number(revenue);
    const exp = Number(expenses);
    result.push({ month: startDate.toLocaleString("default", { month: "short", timeZone: "UTC" }), revenue: rev, expenses: exp, profit: rev - exp });
  }

  res.json(result);
});

router.get("/dashboard", requireAuth, requireAdmin, async (req, res) => {
  const { barbershopId } = req.query as { barbershopId?: string };
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart); todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
  const weekStart = new Date(todayStart); weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  const weekEnd = new Date(weekStart); weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const bsCond = barbershopId ? eq(appointmentsTable.barbershopId, parseInt(barbershopId)) : sql`true`;
  const bsSaleCond = barbershopId ? eq(salesTable.barbershopId, parseInt(barbershopId)) : sql`true`;

  const [{ appointmentsToday }] = await db.select({ appointmentsToday: count() })
    .from(appointmentsTable).where(and(bsCond, gte(appointmentsTable.scheduledAt, todayStart), lte(appointmentsTable.scheduledAt, todayEnd)));

  const [{ appointmentsThisWeek }] = await db.select({ appointmentsThisWeek: count() })
    .from(appointmentsTable).where(and(bsCond, gte(appointmentsTable.scheduledAt, weekStart), lte(appointmentsTable.scheduledAt, weekEnd)));

  const [{ pendingAppointments }] = await db.select({ pendingAppointments: count() })
    .from(appointmentsTable).where(and(bsCond, eq(appointmentsTable.status, "pending")));

  const [{ revenueToday }] = await db.select({ revenueToday: sql<number>`coalesce(sum(${salesTable.amount}),0)` })
    .from(salesTable).where(and(bsSaleCond, gte(salesTable.createdAt, todayStart), lte(salesTable.createdAt, todayEnd)));

  const [{ revenueThisWeek }] = await db.select({ revenueThisWeek: sql<number>`coalesce(sum(${salesTable.amount}),0)` })
    .from(salesTable).where(and(bsSaleCond, gte(salesTable.createdAt, weekStart), lte(salesTable.createdAt, weekEnd)));

  const topBarbers = await db.select({
    barberId: barbersTable.id,
    name: barbersTable.name,
    appointmentsCount: count(appointmentsTable.id),
    revenue: sql<number>`coalesce(sum(${salesTable.amount}),0)`,
  })
    .from(barbersTable)
    .leftJoin(appointmentsTable, and(eq(appointmentsTable.barberId, barbersTable.id), eq(appointmentsTable.status, "completed")))
    .leftJoin(salesTable, eq(salesTable.barberId, barbersTable.id))
    .groupBy(barbersTable.id, barbersTable.name)
    .orderBy(sql`count(${appointmentsTable.id}) desc`)
    .limit(5);

  res.json({
    appointmentsToday: Number(appointmentsToday),
    appointmentsThisWeek: Number(appointmentsThisWeek),
    revenueToday: Number(revenueToday),
    revenueThisWeek: Number(revenueThisWeek),
    pendingAppointments: Number(pendingAppointments),
    topBarbers: topBarbers.map(b => ({ barberId: b.barberId, name: b.name, appointmentsCount: Number(b.appointmentsCount), revenue: Number(b.revenue) })),
  });
});

router.get("/appointments-by-status", requireAuth, requireAdmin, async (req, res) => {
  const { barbershopId, startDate, endDate } = req.query as {
    barbershopId?: string; startDate?: string; endDate?: string;
  };

  const conditions = [];
  if (barbershopId) conditions.push(eq(appointmentsTable.barbershopId, parseInt(barbershopId)));
  if (startDate) conditions.push(gte(appointmentsTable.scheduledAt, new Date(startDate)));
  if (endDate) conditions.push(lte(appointmentsTable.scheduledAt, new Date(endDate + "T23:59:59Z")));

  const rows = await db.select({ status: appointmentsTable.status, cnt: count() })
    .from(appointmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(appointmentsTable.status);

  const result = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 } as Record<string, number>;
  for (const row of rows) {
    result[row.status] = Number(row.cnt);
  }

  res.json(result);
});

export default router;
