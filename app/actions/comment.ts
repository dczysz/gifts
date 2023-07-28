import type { Params } from "@remix-run/react";

import { MAX_COMMENT_COUNT } from "~/config/comment";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request";
import { requireUserId } from "~/utils/session.server";

export async function submitComment(request: Request, params: Params) {
  const form = await request.formData();
  const userId = await requireUserId(request);
  const text = form.get("text");
  const { eventId, attendeeId: listOwnerId } = params;

  if (
    typeof text !== "string" ||
    typeof eventId !== "string" ||
    (typeof listOwnerId !== "string" && typeof listOwnerId !== "undefined")
  ) {
    throw new Response("Form not submitted correctly", {
      status: 400,
    });
  }

  if (!text.length) {
    return badRequest({ error: "Please enter a comment" });
  }

  const attendee = await db.attendee.findFirst({ where: { userId, eventId } });

  if (!attendee) {
    throw new Response("You must be attending this event to leave a comment", {
      status: 400,
    });
  }

  const numComments = await db.comment.count({
    where: {
      eventId,
      listOwnerId: listOwnerId || null,
    },
  });

  if (numComments >= MAX_COMMENT_COUNT) {
    return badRequest({
      error: `Comment limit of ${MAX_COMMENT_COUNT} reached for this discussion`,
    });
  }

  return await db.comment.create({
    data: {
      text,
      eventId,
      listOwnerId,
      ownerId: attendee.id,
    },
  });
}

export async function deleteComment(request: Request, params: Params) {
  const form = await request.formData();
  const userId = await requireUserId(request);
  const commentId = form.get("id");
  const { eventId, userId: listOwnerId } = params;

  if (
    typeof commentId !== "string" ||
    typeof eventId !== "string" ||
    (typeof listOwnerId !== "string" && typeof listOwnerId !== "undefined")
  ) {
    throw new Response("Form not submitted correctly", {
      status: 400,
    });
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { attendees: true },
  });

  if (!event) {
    throw new Response("Invalid event ID", { status: 400 });
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Response("Invalid comment ID", { status: 400 });
  }

  const attendee = event.attendees.find((att) => att.userId === userId);

  if (!attendee) {
    throw new Response("You aren't attending this event", { status: 400 });
  }

  // Must be event creator, or the user that submitted the comment
  if (event.creatorId !== userId && comment.ownerId !== attendee.id) {
    throw new Response("You are not allowed to delete this comment", {
      status: 403,
    });
  }

  return await db.comment.delete({ where: { id: commentId } });
}

export async function updateViewedComments(
  userId: string,
  eventId: string,
  attendeeId = ""
) {
  await db.viewedComment.upsert({
    where: { userId_eventId_attendeeId: { userId, eventId, attendeeId } },
    create: { userId, eventId, attendeeId, timestamp: new Date() },
    update: { timestamp: new Date() },
  });
}
