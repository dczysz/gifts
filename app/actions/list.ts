import type { Attendee } from "@prisma/client";
import type { Params } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request";
import {
  validateItemName,
  validateItemLink,
  validateItemQuantity,
  normalizeUrl,
} from "~/utils/validators";

export async function createListItem(
  request: Request,
  params: Params,
  attendee: Attendee
) {
  if (attendee.id !== params.attendeeId) {
    throw new Response("You are not the owner of this list", {
      status: 401,
    });
  }

  const form = await request.clone().formData();
  const name = form.get("name");
  const description = form.get("description");
  let link = form.get("link");
  const _quantity = form.get("quantity");
  const __quantity = typeof _quantity === "string" ? parseInt(_quantity) : -1;
  const quantity = isNaN(__quantity) ? -1 : __quantity;

  if (
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof link !== "string" ||
    typeof quantity !== "number" ||
    !params.eventId ||
    !params.attendeeId
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fields = { name, link, quantity, description };
  const fieldErrors = {
    name: validateItemName(name),
    link: validateItemLink(link),
    quantity: validateItemQuantity(quantity),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  if (link.length) {
    link = normalizeUrl(link);
  } else {
    link = null;
  }

  return await db.listItem.create({
    data: {
      name,
      description,
      link,
      eventId: params.eventId,
      ownerId: attendee.id,
      quantity,
    },
  });
}

export async function deleteListItem(
  request: Request,
  params: Params,
  attendee: Attendee
) {
  const form = await request.clone().formData();
  const itemId = form.get("item");

  if (typeof itemId !== "string") {
    throw new Response("Delete action not submitted correctly", {
      status: 400,
    });
  }

  const listItem = await db.listItem.findUnique({ where: { id: itemId } });

  if (!listItem) {
    throw new Response("List item not found", { status: 404 });
  }

  if (listItem.ownerId !== attendee.id) {
    throw new Response("You are not the owner of this list item", {
      status: 401,
    });
  }

  return await db.listItem.delete({ where: { id: itemId } });
}

export async function giveListItem(request: Request, attendee: Attendee) {
  const form = await request.clone().formData();
  const itemId = form.get("item");

  if (typeof itemId !== "string") {
    throw new Response("Give action not submitted correctly", {
      status: 400,
    });
  }

  const item = await db.listItem.findUnique({
    where: { id: itemId },
    include: { givers: true },
  });

  if (!item) {
    throw new Response("List item not found", {
      status: 404,
    });
  }

  if (item.quantity > 0 && item.givers.length >= item.quantity) {
    throw new Response(
      item.quantity > 1
        ? "There are already enough people giving this gift"
        : "Someone else is already giving this gift",
      {
        status: 400,
      }
    );
  }

  if (item.ownerId === attendee.id) {
    throw new Response("You can't give yourself a gift", {
      status: 400,
    });
  }

  return await db.listItem.update({
    where: { id: itemId },
    data: {
      givers: { connect: { id: attendee.id } },
    },
  });
}

export async function dontGiveListItem(request: Request, attendee: Attendee) {
  const form = await request.clone().formData();
  const itemId = form.get("item");

  if (typeof itemId !== "string") {
    throw new Response("Don't give action not submitted correctly", {
      status: 400,
    });
  }

  const item = await db.listItem.findUnique({
    where: { id: itemId },
    include: { givers: true },
  });

  if (!item) {
    throw new Response("List item not found", {
      status: 404,
    });
  }

  if (!item.givers.some((giver) => giver.id === attendee.id)) {
    throw new Response("You are already not giving this gift", {
      status: 400,
    });
  }

  if (item.ownerId === attendee.id) {
    throw new Response("You can't give yourself a gift", {
      status: 400,
    });
  }

  return await db.listItem.update({
    where: { id: itemId },
    data: {
      givers: { disconnect: { id: attendee.id } },
    },
  });
}
