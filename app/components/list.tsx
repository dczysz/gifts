import type { SerializeFrom } from "@remix-run/node";
import { Form, useFetcher } from "@remix-run/react";

import type { Attendee, ListItem } from "@prisma/client";
import { confirmSubmit } from "~/utils/confirm";
import { avatarProps } from "~/config/avatar";
import Avatar from "boring-avatars";

type OwnedListItemProps = {
  attendeeId?: string | null;
  item: SerializeFrom<ListItem & { givers: Attendee[] }>;
  isOwner: boolean;
  inert?: boolean;
  loading?: boolean;
};

export function ListItemDisplay({
  attendeeId,
  item,
  isOwner,
  inert = false,
  loading = false,
}: OwnedListItemProps) {
  const fetcher = useFetcher();

  if (fetcher.formData) {
    loading = true;
  }

  const itemLabel = isOwner
    ? `${item.quantity > 0 ? item.quantity : "∞"} × ${item.name}`
    : `${item.givers.length}/${item.quantity > 0 ? item.quantity : "∞"} × ${
        item.name
      }`;

  const deleteForm = (
    <fetcher.Form
      method="post"
      onSubmit={(e) =>
        confirmSubmit(e, "Are you sure you want to delete this item?")
      }
    >
      <input type="hidden" name="_action" value="delete" />
      <button
        type="submit"
        name="item"
        value={item.id}
        className="button"
        data-test="delete-item"
      >
        Delete
      </button>
    </fetcher.Form>
  );

  const giveForm = (
    <Form method="post">
      <input type="hidden" name="_action" value="give" />
      <button type="submit" name="item" value={item.id} className="button">
        Give this item
      </button>
    </Form>
  );

  const dontGiveForm = (
    <Form
      method="post"
      onSubmit={(e) =>
        confirmSubmit(e, "Are you sure you no longer want to give this item?")
      }
    >
      <input type="hidden" name="_action" value="dontgive" />
      <button type="submit" name="item" value={item.id} className="button">
        Don't give this item
      </button>
    </Form>
  );

  let form: JSX.Element | null = null;

  if (!inert) {
    if (isOwner) {
      form = deleteForm;
    } else if (attendeeId) {
      if (item.givers.some((giver) => giver.id === attendeeId)) {
        form = dontGiveForm;
      } else if (item.quantity === -1 || item.givers.length < item.quantity) {
        form = giveForm;
      }
    }
  }

  return (
    <li className={`list-item ${loading ? "loading" : ""}`}>
      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="item-label"
        >
          {itemLabel}
        </a>
      ) : (
        <span className="item-label">{itemLabel}</span>
      )}

      {item.description ? (
        <p className="item-description">{item.description}</p>
      ) : null}

      {form}

      {!isOwner && item.givers.length ? (
        <div>
          <p className="mb-1 mt-1">
            <b>Givers:</b>
          </p>

          <div className="giver-list">
            {item.givers.map((giver) => (
              <div
                className="giver-avatar"
                key={giver.id}
                title={giver.nickname}
              >
                <Avatar
                  size={30}
                  name={giver.avatar || giver.userId}
                  {...avatarProps}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}
