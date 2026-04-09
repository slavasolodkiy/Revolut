import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { MarkNotificationReadParams, ListNotificationsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function toNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    notificationId: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    metadata: n.metadata,
    createdAt: n.createdAt,
  };
}

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const query = ListNotificationsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const unreadOnly = query.success ? query.data.unreadOnly : false;

  const whereClause = unreadOnly
    ? and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false))
    : eq(notificationsTable.userId, user.id);

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(whereClause)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);

  res.json(notifications.map(toNotification));
});

router.patch("/notifications/:notificationId/read", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, params.data.notificationId), eq(notificationsTable.userId, user.id)))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Not found", message: "Notification not found" });
    return;
  }

  res.json(toNotification(notification));
});

router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));
  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
