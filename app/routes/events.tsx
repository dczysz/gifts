import type {
  LinksFunction,
  LoaderFunction,
  V2_MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { json, redirect } from "@remix-run/node";

import type { Event, User } from "@prisma/client";
import { getUser } from "~/utils/session.server";
import { hasDatePassed } from "~/utils/time";
import { db } from "~/utils/db.server";
import stylesUrl from "~/styles/events.css";
import mobileStylesUrl from "~/styles/events-mobile.css";
import { SidebarContextProvider } from "~/context/sidebar";
import { MenuIcon } from "~/icons/menu";
import { BackButton } from "~/components/navigation";

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

export const meta: V2_MetaFunction = () => [
  { title: "Events | Simple Wish" },
  { name: "description", content: "View your events" },
];

type LoaderData = {
  user: Pick<User, "id" | "username">;
  currentEvents: Pick<Event, "id" | "name">[];
  pastEvents: Pick<Event, "id" | "name">[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  if (!user) {
    return redirect("/login");
  }

  const events = await db.event.findMany({
    where: {
      OR: [
        { attendees: { some: { userId: user.id } } },
        { creatorId: user.id }, // TODO: not needed?
      ],
    },
    orderBy: { date: "asc" },
    select: { id: true, name: true, date: true },
  });

  const currentEvents: LoaderData["currentEvents"] = [];
  const pastEvents: LoaderData["pastEvents"] = [];

  // Only show as past if it has been 24+ hours since the event started
  for (const event of events) {
    if (hasDatePassed(event.date, 24)) {
      pastEvents.push(event);
    } else {
      currentEvents.push(event);
    }
  }

  const data: LoaderData = {
    user,
    currentEvents,
    pastEvents,
  };

  return json(data);
};

export default function EventsRoute() {
  const data = useLoaderData<LoaderData>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "idle") {
      setIsSidebarOpen(false);
    }
  }, [navigation.state]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
  }, [isSidebarOpen]);

  return (
    <SidebarContextProvider value={[isSidebarOpen, setIsSidebarOpen]}>
      <div className="events-page">
        <header>
          <button onClick={() => setIsSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <h1>Gifts!</h1>
        </header>

        <div className="events">
          <aside className="left-sidebar">
            <div className="mobile-only">
              <BackButton
                className="sidebar"
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>

            {data.user ? (
              <div className="user-info">
                <div className="top">
                  <span>{`Hi, ${data.user.username}`}</span>
                  <Form action="/logout" method="post">
                    <button type="submit" className="button">
                      Logout
                    </button>
                  </Form>
                </div>
                <Link to="/events/account">Account Settings</Link>
              </div>
            ) : (
              <Link to="/login">Login</Link>
            )}

            <div className="events-list">
              {data.user ? (
                <div>
                  <ul>
                    <li>
                      <NavLink to="new">Create an event</NavLink>
                    </li>
                    <li>
                      <NavLink to="join">Join an event</NavLink>
                    </li>
                  </ul>

                  <h2 className="mt-1">Your Events</h2>

                  {data.currentEvents.length ? (
                    <ul>
                      {data.currentEvents.map((event) => (
                        <li key={event.id}>
                          <NavLink
                            to={event.id}
                            title={event.name}
                            className={({ isActive }) =>
                              isActive ? "active" : ""
                            }
                          >
                            {event.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No events</p>
                  )}

                  <h2>Past Events</h2>

                  {data.pastEvents.length ? (
                    <ul>
                      {data.pastEvents.map((event) => (
                        <li key={event.id}>
                          <Link to={event.id}>{event.name}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No past events</p>
                  )}
                </div>
              ) : null}
            </div>
          </aside>

          <main>
            <Outlet />
            <div
              className="sidebar-overlay"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          </main>
        </div>
      </div>
    </SidebarContextProvider>
  );
}
