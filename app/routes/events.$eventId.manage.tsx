import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import type { Attendee } from "@prisma/client";
import { redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useNavigation,
} from "@remix-run/react";
import { Role } from "@prisma/client";

import { db } from "~/utils/db.server";
import { leaveEvent } from "~/actions/event";
import { requireUserId } from "~/utils/session.server";
import {
  validateEventName,
  validateEventDescription,
  validateEventDate,
  validateEventCode,
} from "~/utils/validators";
import { useEventContext } from "~/context/event";
import {
  TextInput,
  TextAreaInput,
  SelectInput,
  SelectOption,
} from "~/components/input";
import { badRequest } from "~/utils/request";
import { confirmSubmit } from "~/utils/confirm";
import { formatDatetimeLocalString } from "~/utils/time";
import { useDateSubmit } from "~/hooks/date";
import { ClientOnly } from "~/components/client";
import { BackButton } from "~/components/navigation";

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await requireUserId(request);

  const currentUserAttendee = await db.attendee.findFirst({
    where: { userId, eventId: params.eventId },
    select: { role: true },
  });

  if (
    currentUserAttendee?.role !== Role.Admin &&
    currentUserAttendee?.role !== Role.Organizer
  ) {
    return redirect(`/events/${params.eventId}`);
  }

  return null;
};

export const action = async ({ request, params }: ActionArgs) => {
  const currentUserId = await requireUserId(request);
  const form = await request.formData();
  const _action = form.get("_action");

  switch (_action) {
    case "kick": {
      const userId = form.get("userId");

      if (typeof userId === "string") {
        await leaveEvent(params, userId);
      }

      return redirect(".");
    }

    case "edit": {
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
        return badRequest({
          formError: "Form not submitted correctly",
          fields: null,
          fieldErrors: null,
        });
      }

      const fieldErrors = {
        name: validateEventName(name),
        description: validateEventDescription(description),
        date: validateEventDate(date),
        code: validateEventCode(code),
      };

      const fields = { name, description, date, code, location };

      if (Object.values(fieldErrors).some(Boolean)) {
        return badRequest({ fieldErrors, fields, formError: null });
      }

      const event = await db.event.findUnique({
        where: { id: params.eventId },
        select: {
          code: true,
          attendees: { select: { role: true, userId: true } },
        },
      });

      if (!event) {
        throw new Response("Event not found", { status: 404 });
      }

      const currentUserAttendee = event.attendees.find(
        (att) => att.userId === currentUserId
      );

      if (
        currentUserAttendee?.role !== Role.Admin &&
        currentUserAttendee?.role !== Role.Organizer
      ) {
        throw new Response("You are not allowed to do that", { status: 403 });
      }

      // If attempting to change the invite code, make sure it's available
      if (event.code !== code) {
        const existingEventWithCode = await db.event.findUnique({
          where: { code },
        });
        if (existingEventWithCode) {
          return badRequest({
            fieldErrors: {
              ...fieldErrors,
              code: "That invite code is already taken",
            },
            fields,
            formError: null,
          });
        }
      }

      await db.event.update({
        where: { id: params.eventId },
        data: {
          ...fields,
          location: location || null,
          date: new Date(date),
        },
      });

      return redirect(".");
    }

    case "role": {
      const attendeeId = form.get("attendeeId");
      const role = form.get("role");

      if (typeof attendeeId !== "string" || typeof role !== "string") {
        throw new Response("Form not submitted correctly", { status: 400 });
      }

      if (!(role in Role) || role === Role.Admin) {
        throw new Response("Invalid role selected", { status: 400 });
      }

      const event = await db.event.findUnique({
        where: { id: params.eventId },
        select: { attendees: { select: { role: true, userId: true } } },
      });

      if (!event) {
        throw new Response("Event not found", { status: 404 });
      }

      const currentUserAttendee = event.attendees.find(
        (att) => att.userId === currentUserId
      );

      if (
        currentUserAttendee?.role !== Role.Admin &&
        currentUserAttendee?.role !== Role.Organizer
      ) {
        throw new Response("You are not allowed to do that", { status: 403 });
      }

      await db.attendee.update({
        where: { id: attendeeId },
        data: { role: role as Role },
      });

      return redirect(".");
    }
  }

  throw new Response("Form action not supported");
};

export default function ManageEventRoute() {
  const { event, attendee } = useEventContext();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const handleSubmit = useDateSubmit();

  return (
    <div className="manage-event container">
      <BackButton />

      <h2>Manage Event</h2>

      <h3>Event Details</h3>
      <Form method="post" onSubmit={handleSubmit}>
        <fieldset disabled={navigation.state === "submitting"}>
          <input type="hidden" name="_action" value="edit" />

          <TextInput
            name="name"
            label="Name"
            defaultValue={actionData?.fields?.name || event.name}
            error={actionData?.fieldErrors?.name}
            required
          />

          <TextAreaInput
            name="description"
            label="Description"
            defaultValue={actionData?.fields?.description || event.description}
            rows={3}
            maxLength={256}
          />

          {/* SSR dummy input, replace on client to fix timezone issues */}
          <ClientOnly
            fallback={
              <TextInput
                key="1"
                name="date_server_rendered"
                label="Date"
                error={actionData?.fieldErrors?.date}
                type="datetime-local"
                required
                disabled
              />
            }
          >
            <TextInput
              key="2"
              name="date"
              label="Date"
              defaultValue={formatDatetimeLocalString(
                new Date(actionData?.fields?.date ?? event.date)
              )}
              error={actionData?.fieldErrors?.date}
              type="datetime-local"
              required
            />
          </ClientOnly>

          <TextInput
            name="location"
            label="Location"
            defaultValue={actionData?.fields?.location || event.location || ""}
          />

          <TextInput
            name="code"
            label="Invite Code"
            defaultValue={actionData?.fields?.code || event.code}
            error={actionData?.fieldErrors?.code}
            required
            placeholder="abc-123"
          />

          <div>
            {actionData?.formError ? (
              <p className="form-validation-error" role="alert">
                {actionData.formError}
              </p>
            ) : null}
          </div>

          <button type="submit" className="button mt-1">
            Save
          </button>
        </fieldset>
      </Form>

      {attendee.role === Role.Admin ? (
        <>
          <hr />
          <h3>Attendees</h3>
          <ul className="manage-attendees">
            {event?.attendees.map((att) => (
              <ManageAttendee
                key={att.id}
                attendee={att}
                currentAttendeeId={attendee.id}
              />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

interface ManageAttendeeProps {
  attendee: Attendee;
  currentAttendeeId: string;
}

function ManageAttendee({ attendee, currentAttendeeId }: ManageAttendeeProps) {
  const fetcher = useFetcher();

  return (
    <li>
      <div>
        <span>{attendee.nickname}</span>
        {attendee.id !== currentAttendeeId ? (
          <fetcher.Form
            method="post"
            onSubmit={(e) =>
              confirmSubmit(
                e,
                `Are you sure you want to kick ${attendee.nickname} from this event?`
              )
            }
          >
            <input type="hidden" name="userId" value={attendee.userId} />
            <button
              name="_action"
              value="kick"
              className="button"
              disabled={fetcher.state !== "idle"}
            >
              Kick
            </button>
          </fetcher.Form>
        ) : null}
      </div>

      {attendee.id !== currentAttendeeId ? (
        <>
          <hr />
          <details>
            <summary>Edit</summary>
            <fetcher.Form method="post" className="role-form">
              <input type="hidden" name="_action" value="role" />
              <input type="hidden" name="attendeeId" value={attendee.id} />

              <SelectInput
                label="Role"
                name="role"
                containerStyles={{ marginBottom: "0" }}
                defaultValue={attendee.role}
                disabled={fetcher.state !== "idle"}
              >
                {Object.values(Role)
                  .slice(1)
                  .map((role) => (
                    <SelectOption key={role} value={role} label={role} />
                  ))}
              </SelectInput>

              <button className="button" disabled={fetcher.state !== "idle"}>
                Save
              </button>
            </fetcher.Form>
          </details>
        </>
      ) : null}
    </li>
  );
}

export function ErrorBoundary() {
  return <div className="error-container">Something went wrong</div>;
}
