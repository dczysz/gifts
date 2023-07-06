// Use this to delete a user by their email
// Simply call this with:
// npx ts-node --require tsconfig-paths/register ./cypress/support/delete-user.ts username@example.com
// and that user will get deleted

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { installGlobals } from "@remix-run/node";

import { db } from "~/utils/db.server";

installGlobals();

async function deleteUser(username: string) {
  if (!username) {
    throw new Error("username required to delete user");
  }

  try {
    await db.user.delete({
      where: { username },
      include: { createdEvents: true, attendee: true },
    });
  } catch (error) {
    // if (error instanceof PrismaClientKnownRequestError) {
    //   console.error(
    //     "prisma error code and message:",
    //     error.code,
    //     error.message
    //   );
    // }
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      console.log("User not found, so no need to delete");
    } else {
      throw error;
    }
  } finally {
    await db.$disconnect();
  }
}

deleteUser(process.argv[2]);
