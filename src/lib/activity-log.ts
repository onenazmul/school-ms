import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ActivityEntry = {
  module: "admission" | "student" | "payment" | "fee" | "exam" | "result" | "system";
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: "admin" | "applicant" | "student" | "system";
  description: string;
  metadata?: Record<string, unknown>;
};

export function logActivity(entry: ActivityEntry): void {
  db.activityLog.create({
    data: {
      module: entry.module,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityLabel: entry.entityLabel ?? null,
      actorId: entry.actorId ?? null,
      actorName: entry.actorName ?? null,
      actorRole: entry.actorRole ?? "system",
      description: entry.description,
      metadata: entry.metadata
        ? JSON.stringify(entry.metadata)
        : undefined,
    },
  }).catch(() => {});
}
