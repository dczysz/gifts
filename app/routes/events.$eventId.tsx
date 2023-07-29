import type {
  ActionFunction,
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  isRouteErrorResponse,
  useLoaderData,
  useParams,
  useRouteError,
} from "@remix-run/react";
import { redirect, json } from "@remix-run/node";
import { Role } from "@prisma/client";

import { db } from "~/utils/db.server";
import { submitComment } from "~/actions/comment";
import { deleteEvent, joinEvent, leaveEvent } from "~/actions/event";
import { EventContextProvider } from "~/context/event";
import { requireUserId } from "~/utils/session.server";
import { UserIcon } from "~/icons/user";
import { ClockIcon } from "~/icons/clock";
import { confirmSubmit } from "~/utils/confirm";
import { LocationIcon } from "~/icons/location";
import { useClientOnly } from "~/hooks/client";
import { formatDateTime } from "~/utils/time";
import stylesUrl from "~/styles/event.css";
import mobileStylesUrl from "~/styles/event-mobile.css";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: stylesUrl },
    {
      rel: "stylesheet",
      href: mobileStylesUrl,
      media: "screen and (max-width: 960px)",
    },
  ];
};

export const meta: V2_MetaFunction = ({
  data,
}: {
  data: Awaited<ReturnType<Awaited<ReturnType<typeof loader>>["json"]>>;
}) => {
  if (!data) {
    return [
      { title: "Event not found" },
      { name: "description", content: "Event not found" },
    ];
  }

  return [
    { title: `${data.event.name} | Simple Wish` },
    { name: "description", content: `Enjoy ${data.event.name}!` },
  ];
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await requireUserId(request);

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      attendees: { orderBy: { nickname: "asc" } },
    },
  });

  if (!event) {
    throw new Response("That event does not exist.", { status: 404 });
  }

  const attendee = event.attendees.find((att) => att.userId === userId);

  if (!attendee) {
    throw new Response("You are not an attendee of this event", {
      status: 403,
    });
  }

  const creatorAttendee = event.attendees.find(
    (att) => att.userId === event.creatorId
  );

  if (!creatorAttendee) {
    throw new Response("Something went very wrong, event has no creator", {
      status: 400,
    });
  }

  // Put the current user as first attendee, so it shows as first list
  event.attendees = event.attendees.sort((att) =>
    att.userId === userId ? -1 : 1
  );

  let hostname =
    request.headers.get("X-Forwarded-Host") || request.headers.get("Host");
  hostname ||= "localhost:3000";
  if (hostname === "localhost:3000") {
    hostname = "http://" + hostname;
  } else {
    hostname = "https://" + hostname;
  }

  const data = {
    userId,
    event,
    attendee,
    creatorAttendee,
    hostname,
  };

  return json(data);
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request, `/events/${params.eventId}`);
  const form = await request.formData();
  const action = form.get("_action");

  switch (action) {
    case "join": {
      await joinEvent(request, params, userId);
      return redirect(".");
    }

    case "leave": {
      await leaveEvent(params, userId);
      return redirect("/events");
    }

    case "delete": {
      await deleteEvent(params, userId);
      return redirect("/events");
    }

    case "comment": {
      await submitComment(request, params);
      return redirect(`/events/${params.eventId}`);
    }

    default: {
      throw new Response("That form action is not supported", { status: 400 });
    }
  }
};

export default function EventRoute() {
  const { event, userId, attendee, creatorAttendee, hostname } =
    useLoaderData<typeof loader>();
  const isEventCreator = userId === event.creatorId;
  const isEventManager =
    attendee.role === Role.Admin || attendee.role === Role.Organizer;

  const eventDate = useClientOnly(
    () => formatDateTime(new Date(event.date)),
    ""
  );

  let actionForm = (
    <>
      {isEventManager ? (
        <Link to="manage" className="button">
          Manage Event
        </Link>
      ) : null}

      {isEventCreator ? (
        <Form
          method="post"
          onSubmit={(e) =>
            confirmSubmit(e, "Are you sure you want to delete this event?")
          }
        >
          <button
            type="submit"
            name="_action"
            value="delete"
            className="button"
          >
            Delete event
          </button>
        </Form>
      ) : (
        <Form
          method="post"
          onSubmit={(e) =>
            confirmSubmit(e, "Are you sure you want to leave this event?")
          }
        >
          <button type="submit" name="_action" value="leave" className="button">
            Leave event
          </button>
        </Form>
      )}
    </>
  );

  return (
    <div className="event">
      <div className="event-details container">
        <h1>
          <Link to=".">{event.name}</Link>
        </h1>
        <div className="icon-row date">
          <ClockIcon />
          <span>{eventDate}</span>
        </div>
        {event.location ? (
          <div className="icon-row" title={event.location}>
            <LocationIcon />
            <span>{event.location}</span>
          </div>
        ) : null}
        <div className="icon-row">
          <UserIcon />
          <span>
            Created by {isEventCreator ? "you" : creatorAttendee.nickname}
          </span>
        </div>

        <div className="description">
          {event.description.split("\n").map((line, i) => (
            <p key={`${event.id}_${i}`}>{line}</p>
          ))}
        </div>

        <div className="event-actions">
          <Link to={`/events/${event.id}`} className="button">
            Event Discussion
          </Link>

          <Link to="profile" className="button">
            Edit profile
          </Link>

          <a
            className="button"
            href={`mailto:?${new URLSearchParams([
              [
                "subject",
                `${attendee.nickname} has invited you to join their ${event.name} event`,
              ],
              [
                "body",
                `Open this link to join the event: ${hostname}/events/join?code=${event.code}`,
              ],
            ])
              .toString()
              .replace(/\+/g, "%20")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Invite a friend
          </a>

          {actionForm}
        </div>

        <hr />

        <h2>Lists</h2>
        <ul className="attendee-list">
          {event.attendees.map((att) => (
            <li key={att.id}>
              <NavLink
                to={`lists/${att.id}`}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {att.id === attendee.id
                  ? "Your list"
                  : `${att.nickname}'s list`}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <EventContextProvider
        value={{
          event,
          userId,
          attendee,
          creatorAttendee,
          isPastEvent: new Date(event.date).getTime() < Date.now(),
        }}
      >
        <Outlet />
      </EventContextProvider>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const params = useParams();
  console.log(error);

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 400: {
        return (
          <div className="error-container">
            What you're trying to do is not allowed
          </div>
        );
      }
      case 404: {
        return (
          <div className="error-container">
            Could not find event with ID of "{params.eventId}"
          </div>
        );
      }
      default: {
        throw new Error(`Unhandled error: ${error.status}`);
      }
    }
  }

  if (error instanceof Error) {
    return <div className="error-container">{error.message}</div>;
  }

  throw new Error("Unhandled error");
}
