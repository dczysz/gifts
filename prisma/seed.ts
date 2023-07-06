import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "~/utils/session.server";
const db = new PrismaClient();

async function seed() {
  try {
    await db.user.deleteMany();
  } catch {}

  const user = await db.user.create({
    data: {
      username: "user",
      passwordHash: await hashPassword("password"),
    },
  });

  const event = await db.event.create({
    data: {
      name: "Christmas 2023",
      description: "Christmas at Grandma's house.",
      date: new Date("2023-12-25T12:30"),
      location: "707 Chelsea Ct.",
      code: "code",
      creatorId: user.id,
      attendees: {
        create: { userId: user.id, nickname: "User 1", role: Role.Admin },
      },
    },
    include: { attendees: true },
  });

  await db.listItem.create({
    data: {
      eventId: event.id,
      ownerId: event.attendees[0].id,
      name: "Hotwheels",
      description: "This cool car",
      quantity: 1,
    },
  });

  await db.event.update({
    where: { id: event.id },
    data: {
      attendees: {
        create: {
          nickname: "User 2",
          role: Role.Guest,
          user: {
            create: {
              username: "user2",
              passwordHash: await hashPassword("password"),
            },
          },
        },
      },
    },
  });

  await db.comment.create({
    data: {
      eventId: event.id,
      ownerId: event.attendees[0].id,
      text: "Test top level event comment",
    },
  });
}

seed();
