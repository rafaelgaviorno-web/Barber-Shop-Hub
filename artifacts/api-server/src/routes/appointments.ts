import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, barbersTable, servicesTable, usersTable, barbershopsTable, notificationsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/availability", async (req, res) => {
  const barberId = parseInt(req.query.barberId as string);
  const date = req.query.date as string;
  const serviceId = parseInt(req.query.serviceId as string);

  if (!barberId || !date || !serviceId) {
    res.status(400).json({ error: "barberId, date, serviceId são obrigatórios" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1);
  if (!service) { res.status(404).json({ error: "Serviço não encontrado" }); return; }

  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const existing = await db.select({ scheduledAt: appointmentsTable.scheduledAt })
    .from(appointmentsTable)
    .where(and(
      eq(appointmentsTable.barberId, barberId),
      gte(appointmentsTable.scheduledAt, startOfDay),
      lte(appointmentsTable.scheduledAt, endOfDay),
      sql`${appointmentsTable.status} != 'cancelled'`
    ));

  const takenSlots = new Set(existing.map(a => {
    const d = new Date(a.scheduledAt);
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
  }));

  const slots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let min = 0; min < 60; min += service.durationMinutes) {
      const slot = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      if (!takenSlots.has(slot)) slots.push(slot);
    }
  }

  res.json({ date, slots });
});

router.get("/", requireAuth, async (req, res) => {
  const { barbershopId, barberId, date, status } = req.query as {
    barbershopId?: string; barberId?: string; date?: string; status?: string;
  };

  let query = db
    .select({
      id: appointmentsTable.id,
      clientId: appointmentsTable.clientId,
      barberId: appointmentsTable.barberId,
      serviceId: appointmentsTable.serviceId,
      barbershopId: appointmentsTable.barbershopId,
      scheduledAt: appointmentsTable.scheduledAt,
      status: appointmentsTable.status,
      notes: appointmentsTable.notes,
      createdAt: appointmentsTable.createdAt,
      clientName: usersTable.name,
      barberName: barbersTable.name,
      serviceName: servicesTable.name,
      servicePrice: servicesTable.price,
    })
    .from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.clientId, usersTable.id))
    .leftJoin(barbersTable, eq(appointmentsTable.barberId, barbersTable.id))
    .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id));

  const conditions = [];
  if (req.user!.role !== "admin") {
    conditions.push(eq(appointmentsTable.clientId, req.user!.userId));
  }
  if (barbershopId) conditions.push(eq(appointmentsTable.barbershopId, parseInt(barbershopId)));
  if (barberId) conditions.push(eq(appointmentsTable.barberId, parseInt(barberId)));
  if (status) conditions.push(eq(appointmentsTable.status, status));
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    conditions.push(gte(appointmentsTable.scheduledAt, start));
    conditions.push(lte(appointmentsTable.scheduledAt, end));
  }

  const results = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  res.json(results);
});

router.post("/", requireAuth, async (req, res) => {
  const { barberId, serviceId, barbershopId, scheduledAt, notes } = req.body as {
    barberId: number; serviceId: number; barbershopId: number; scheduledAt: string; notes?: string;
  };

  if (!barberId || !serviceId || !barbershopId || !scheduledAt) {
    res.status(400).json({ error: "barberId, serviceId, barbershopId, scheduledAt são obrigatórios" });
    return;
  }

  const [appt] = await db.insert(appointmentsTable).values({
    clientId: req.user!.userId, barberId, serviceId, barbershopId,
    scheduledAt: new Date(scheduledAt), notes, status: "pending",
  }).returning();

  const [full] = await db.select({
    id: appointmentsTable.id,
    clientId: appointmentsTable.clientId,
    barberId: appointmentsTable.barberId,
    serviceId: appointmentsTable.serviceId,
    barbershopId: appointmentsTable.barbershopId,
    scheduledAt: appointmentsTable.scheduledAt,
    status: appointmentsTable.status,
    notes: appointmentsTable.notes,
    createdAt: appointmentsTable.createdAt,
    clientName: usersTable.name,
    barberName: barbersTable.name,
    serviceName: servicesTable.name,
    servicePrice: servicesTable.price,
  }).from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.clientId, usersTable.id))
    .leftJoin(barbersTable, eq(appointmentsTable.barberId, barbersTable.id))
    .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id))
    .where(eq(appointmentsTable.id, appt.id));

  // Notify all admins of the new appointment
  try {
    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, barbershopId));
    if (shop) {
      const date = new Date(scheduledAt);
      const formattedDate = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const formattedTime = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
      await db.insert(notificationsTable).values({
        userId: shop.ownerId,
        title: "Novo agendamento recebido",
        message: `${full.clientName || "Cliente"} agendou ${full.serviceName || "serviço"} com ${full.barberName || "barbeiro"} em ${formattedDate} às ${formattedTime}.`,
        type: "appointment",
      });
    }
  } catch (e) {
    // Notification failure should not block the appointment creation
  }

  res.status(201).json(full);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [appt] = await db.select({
    id: appointmentsTable.id,
    clientId: appointmentsTable.clientId,
    barberId: appointmentsTable.barberId,
    serviceId: appointmentsTable.serviceId,
    barbershopId: appointmentsTable.barbershopId,
    scheduledAt: appointmentsTable.scheduledAt,
    status: appointmentsTable.status,
    notes: appointmentsTable.notes,
    createdAt: appointmentsTable.createdAt,
    clientName: usersTable.name,
    barberName: barbersTable.name,
    serviceName: servicesTable.name,
    servicePrice: servicesTable.price,
  }).from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.clientId, usersTable.id))
    .leftJoin(barbersTable, eq(appointmentsTable.barberId, barbersTable.id))
    .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id))
    .where(eq(appointmentsTable.id, id)).limit(1);

  if (!appt) { res.status(404).json({ error: "Não encontrado" }); return; }
  res.json(appt);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { status } = req.body as { status: string };

  if (!status) { res.status(400).json({ error: "status é obrigatório" }); return; }

  const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `status deve ser um de: ${validStatuses.join(", ")}` });
    return;
  }

  const [appt] = await db.update(appointmentsTable)
    .set({ status })
    .where(eq(appointmentsTable.id, id)).returning();
  if (!appt) { res.status(404).json({ error: "Não encontrado" }); return; }
  res.json(appt);
});

export default router;
