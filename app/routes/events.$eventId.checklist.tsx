import type { LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { BackButton } from "~/components/navigation";
import stylesUrl from "~/styles/checklist.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const eventId = params.eventId;

  const items = await db.listItem.findMany({
    where: {
      eventId: eventId,
      givers: { some: { userId: userId } },
    },
    include: { owner: { select: { nickname: true, userId: true } } },
    orderBy: { owner: { nickname: "asc" } },
  });

  const byOwner = items.reduce<{
    [userId: string]: (typeof items)[0][] | undefined;
  }>((prev, curr) => {
    if (!prev[curr.owner.userId]) {
      prev[curr.owner.userId] = [];
    }
    prev[curr.owner.userId]?.push(curr);

    return prev;
  }, {});

  return json({ items: byOwner });
};

export default function ManageEventRoute() {
  const { items } = useLoaderData<typeof loader>();

  return (
    <div className="checklist container">
      <BackButton />

      <h2>Your Shopping List</h2>

      {Object.keys(items).length ? (
        <ul className="owner-list">
          {Object.keys(items).map((userId) => (
            <li key={userId}>
              <h3>{items[userId][0].owner.nickname}</h3>

              <ul className="item-list">
                {items[userId].map((item) => (
                  <li key={item.id} className="list-item">
                    <p className="item-label">
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noreferrer">
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </p>
                    {item.description ? (
                      <p className="item-description">{item.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Once you select an item to get for someone it will appear on this
          list.
        </p>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return <div className="error-container">Something went wrong</div>;
}
