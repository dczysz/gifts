import type {
  ActionFunction,
  LoaderFunction,
  V2_MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { Role } from "@prisma/client";

import {
  validateEventName,
  validateEventDescription,
  validateEventDate,
  validateEventCode,
} from "~/utils/validators";
import { db } from "~/utils/db.server";
import { getUser, getUserId, requireUserId } from "~/utils/session.server";
import { useDateSubmit } from "~/hooks/date";
import { TextAreaInput, TextInput } from "~/components/input";

export const meta: V2_MetaFunction = () => [
  {
    title: "New Event | Simple Wish",
  },
  { name: "description", content: "Create a new event" },
];

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", "/events/new"]]);
    return redirect(`/login?${searchParams}`);
  }

  return null;
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    description: string | undefined;
    date: string | undefined;
    code: string | undefined;
  };
  fields?: {
    name: string;
    description: string;
    date: string;
    code: string;
    location: string;
  };
};

const badRequest = (data: ActionData) => {
  return json(data, { status: 400 });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const user = await getUser(request, true);
  const form = await request.formData();
  const name = form.get("name");
  const description = form.get("description");
  const date = form.get("date");
  const code = form.get("code");
  const location = form.get("location");

  if (
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof date !== "string" ||
    typeof code !== "string" ||
    typeof location !== "string"
  ) {
    return badRequest({ formError: "Form not submitted correctly" });
  }

  const fieldErrors = {
    name: validateEventName(name),
    description: validateEventDescription(description),
    date: validateEventDate(date),
    code: validateEventCode(code),
  };

  const fields = { name, description, date, code, location };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const event = await db.event.create({
    data: {
      ...fields,
      location: fields.location || null,
      creatorId: userId,
      date: new Date(date),
      attendees: {
        create: { userId, nickname: user.username, role: Role.Admin },
      },
    },
  });

  return redirect(`/events/${event.id}/profile`);
};

export default function NewEventRoute() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const handleSubmit = useDateSubmit();

  return (
    <div className="new-event container">
      <div>
        <h1 className="mt-2">Create a new event</h1>

        <Form method="post" onSubmit={handleSubmit}>
          <fieldset disabled={navigation.state === "submitting"}>
            <TextInput
              name="name"
              label="Name"
              defaultValue={actionData?.fields?.name}
              error={actionData?.fieldErrors?.name}
              required
            />

            <TextAreaInput
              name="description"
              label="Description"
              defaultValue={actionData?.fields?.description}
              error={actionData?.fieldErrors?.description}
              rows={3}
              maxLength={256}
            />

            <TextInput
              name="date"
              label="Date"
              defaultValue={actionData?.fields?.date}
              error={actionData?.fieldErrors?.date}
              type="datetime-local"
              required
            />

            <TextInput
              name="location"
              label="Location"
              defaultValue={actionData?.fields?.location}
            />

            <TextInput
              name="code"
              label="Invite Code"
              defaultValue={actionData?.fields?.code}
              error={actionData?.fieldErrors?.code}
              placeholder="abc-123"
              required
            />

            <div>
              {actionData?.formError ? (
                <p className="form-validation-error" role="alert">
                  {actionData.formError}
                </p>
              ) : null}

              <br />

              <button type="submit" className="button">
                {navigation.state === "submitting" ? "Creating..." : "Create"}
              </button>
            </div>
          </fieldset>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error);
  return <div className="error-container">Something unexpected went wrong</div>;
}
