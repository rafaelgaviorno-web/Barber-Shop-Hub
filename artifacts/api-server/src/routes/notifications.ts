import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(notifications);
});

router.put("/notifications/read-all", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  await db.update(notificationsTable).set({ read: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
  res.json({ ok: true });
});

router.put("/notifications/:id/read", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const userId = (req as any).user.id;
  const [notification] = await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
    .returning();
  if (!notification) return res.status(404).json({ error: "Notificação não encontrada" });
  res.json(notification);
});

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const userId = (req as any).user.id;
  await db.delete(notificationsTable)
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
  res.status(204).end();
});

export default router;
