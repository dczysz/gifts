// Use this to delete a user by their email
// Simply call this with:
// npx ts-node --require tsconfig-paths/register ./cypress/support/create-event.ts
// and that user will get deleted

import { faker } from "@faker-js/faker";
// import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { installGlobals } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { register } from "~/utils/session.server";
// import { formatDatetimeLocalString } from "~/utils/time";

installGlobals();

async function createEvent() {
  // const now = new Date();

  try {
    const user = await register({
      username: faker.internet.userName(),
      password: "cypress",
    });

    // const event = await db.event.create({
    //   data: {
    //     name: faker.lorem.words(3),
    //     date: formatDatetimeLocalString(
    //       new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 16)
    //     ),
    //     location: faker.location.streetAddress(),
    //     code: faker.lorem.words(1),
    //     description: "Cypress test event",
    //     creator: { connect: { id: user.id } },
    //   },
    // });

    console.log(
      JSON.stringify({
        username: user.username,
        // eventId: event.id,
        // code: event.code,
      })
    );
  } catch (error) {
    console.error(error);
    // if (
    //   error instanceof PrismaClientKnownRequestError &&
    //   error.code === "P2025"
    // ) {
    //   console.log("User not found, so no need to delete");
    // } else {
    throw error;
    // }
  } finally {
    await db.$disconnect();
  }
}

createEvent();
