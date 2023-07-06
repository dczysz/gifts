import type { Attendee, Comment } from "@prisma/client";
import { db } from "./db.server";

export async function getComments(
  userId: string,
  eventId: string,
  attendeeId?: string | null
) {
  const comments = await db.comment.findMany({
    where: { eventId, listOwnerId: attendeeId || null },
    include: { owner: true },
    orderBy: { createdAt: "asc" },
  });

  const lastView = await db.viewedComment.findUnique({
    where: {
      userId_eventId_attendeeId: {
        userId,
        eventId,
        attendeeId: attendeeId || "",
      },
    },
  });

  return mapCommentViews(comments, lastView?.timestamp || new Date(0), userId);
}

function mapCommentViews<T extends Comment & { owner: Attendee }>(
  comments: T[],
  lastViewDate: Date,
  userId: string
): (T & { viewed: boolean })[] {
  return comments.map((comment) => {
    const commentDate =
      typeof comment.createdAt === "string"
        ? new Date(comment.createdAt)
        : comment.createdAt;

    return {
      ...comment,
      viewed:
        comment.owner.userId === userId ||
        commentDate.getTime() < lastViewDate.getTime(),
    };
  });
}
