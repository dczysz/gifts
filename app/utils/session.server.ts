import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";

import { db } from "./db.server";

type LoginForm = {
  username: string;
  password: string;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function register({ username, password }: LoginForm) {
  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { username, passwordHash },
  });
  return { id: user.id, username: user.username };
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } });

  if (!user) return null;

  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isCorrectPassword) return null;

  return { id: user.id, username };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname +
    new URL(request.url).search
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");

  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }

  return userId;
}

export async function getUser(
  request: Request,
  require: true
): Promise<{ id: string; username: string }>;
export async function getUser(
  request: Request,
  require: false
): Promise<{ id: string; username: string } | null>;
export async function getUser(
  request: Request,
  require?: boolean
): Promise<{ id: string; username: string } | null>;
export async function getUser(request: Request, require = false) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    if (require) {
      throw logout(request);
    }
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
