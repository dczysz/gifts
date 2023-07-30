import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { joinEvent } from "~/actions/event";
import { badRequest } from "~/utils/request";
import { getUser, requireUserId } from "~/utils/session.server";
import { TextInput } from "~/components/input";

export const meta: V2_MetaFunction = () => [
  {
    title: "Join Event | Simple Wish",
  },
  { name: "description", content: "Join an existing event" },
];

export const loader = async ({ request }: LoaderArgs) => {
  await requireUserId(request);

  const query = new URL(request.url).searchParams;
  const code = query.get("code");

  if (code) {
    const user = await getUser(request, true);
    const event = await db.event.findUnique({ where: { code } });

    if (event) {
      try {
        await joinEvent(request, { eventId: event.id }, user.id);
        return redirect(`/events/${event.id}`);
      } catch {}
    }
  }

  return null;
};

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const code = form.get("code");

  if (typeof code !== "string") {
    throw new Response("Form not submitted correctly");
  }

  const event = await db.event.findUnique({
    where: {
      code,
    },
  });

  if (!event) {
    return badRequest({ message: "Invalid event code" });
  }

  await joinEvent(request, { eventId: event.id }, userId);

  return redirect(`/events/${event.id}/profile`);
};

export default function JoinEventPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="join-event">
      <Form method="post">
        <h2>Join an event</h2>
        <TextInput
          label="Code"
          name="code"
          error={actionData?.message}
          placeholder="abc-123"
          autoCapitalize="none"
          autoComplete="off"
          disabled={navigation.state === "submitting"}
        />
        <button className="button" disabled={navigation.state === "submitting"}>
          Join
        </button>
      </Form>
    </div>
  );
}
