import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { logout } from "~/utils/session.server";

export const loader: LoaderFunction = async () => {
  return redirect("/");
};

export const action: ActionFunction = async ({ request }) => {
  return await logout(request);
};
