import { Role } from "@prisma/client";
import type { Params } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

export async function joinEvent(
  request: Request,
  params: Params,
  userId: string
) {
  const user = await getUser(request);

  if (!user) {
    throw new Response("You must be logged in to do that", { status: 403 });
  }

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: { attendees: true },
  });

  if (event?.attendees.some((attendee) => attendee.userId === userId)) {
    throw new Response("You have already joined that event", { status: 400 });
  }

  await db.event.update({
    where: { id: params.eventId },
    data: {
      attendees: {
        create: { userId, nickname: user.username, role: Role.Guest },
      },
    },
  });
}

export async function leaveEvent(params: Params, userId: string) {
  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: { attendees: true },
  });

  if (!event) {
    throw new Response("Event not found", { status: 404 });
  }

  if (event.creatorId === userId) {
    throw new Response("You can't leave an event you created", {
      status: 400,
    });
  }

  const attendeeId = event.attendees.find((att) => att.userId === userId)?.id;

  if (!attendeeId) {
    throw new Response("You can't leave an event you haven't joined", {
      status: 400,
    });
  }

  await db.$transaction([
    // delete all list items created by this user for this event
    db.listItem.deleteMany({
      where: { eventId: event.id, ownerId: attendeeId },
    }),
    // delete comments
    db.comment.deleteMany({ where: { ownerId: attendeeId } }),
    // delete the attendee record
    db.attendee.delete({ where: { id: attendeeId } }),
  ]);

  return null;
}

export async function deleteEvent(params: Params, userId: string) {
  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: { attendees: true },
  });

  if (!event) {
    throw new Response("Event not found", { status: 404 });
  }

  if (userId !== event.creatorId) {
    throw new Response("You can only delete an event you created", {
      status: 400,
    });
  }

  await db.$transaction([
    db.listItem.deleteMany({ where: { eventId: event.id } }),
    db.comment.deleteMany({ where: { eventId: event.id } }),
    db.attendee.deleteMany({ where: { eventId: event.id } }),
    db.event.delete({ where: { id: params.eventId } }),
  ]);
}
