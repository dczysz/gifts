import type {
  ActionFunction,
  LinksFunction,
  LoaderArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useEffect, useRef } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";

import {
  createListItem,
  deleteListItem,
  dontGiveListItem,
  giveListItem,
} from "~/actions/list";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import {
  validateItemName,
  validateItemDescription,
  validateItemLink,
  validateItemQuantity,
} from "~/utils/validators";
import {
  deleteComment,
  submitComment,
  updateViewedComments,
} from "~/actions/comment";
import { getComments } from "~/utils/comment.server";
import { useEventContext } from "~/context/event";
import { CommentSection } from "~/components/comment";
import { ListItemDisplay } from "~/components/list";
import { NumberInput, TextAreaInput, TextInput } from "~/components/input";
import { BackButton } from "~/components/navigation";
import stylesUrl from "~/styles/list.css";
import mobileStylesUrl from "~/styles/list-mobile.css";

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

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await requireUserId(request);

  const { eventId, attendeeId } = params;

  const listOwner = await db.attendee.findUnique({
    where: { id: attendeeId },
  });

  if (!listOwner) {
    throw new Response("That user does not belong to this event", {
      status: 403,
    });
  }

  const items = await db.listItem.findMany({
    where: {
      ownerId: listOwner.id,
      eventId: eventId,
    },
    include: { givers: true },
  });

  const comments = await getComments(userId, eventId!, listOwner.id);

  // User can't view their own list's comments, so no need to update viewed timestamp
  if (listOwner.userId !== userId) {
    updateViewedComments(userId, eventId!, attendeeId);
  }

  const data = {
    listOwner,
    items,
    comments,
  };

  return json(data);
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    description: string | undefined;
    link: string | undefined;
    quantity: string | undefined;
  };
  fields?: {
    name: string;
    description: string;
    link: string;
    quantity: number;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);

  const attendee = await db.attendee.findFirst({
    where: { userId, eventId: params.eventId },
  });

  if (!attendee) {
    throw new Response("You are not an attendee of this event", {
      status: 403,
    });
  }

  const form = await request.clone().formData();
  const _action = form.get("_action");

  switch (_action) {
    case "create": {
      return await createListItem(request, params, attendee);
    }

    case "delete": {
      return await deleteListItem(request, params, attendee);
    }

    case "give": {
      return await giveListItem(request, attendee);
    }

    case "dontgive": {
      return await dontGiveListItem(request, attendee);
    }

    case "comment": {
      return await submitComment(request, params);
    }

    case "delete_comment": {
      return await deleteComment(request, params);
    }
  }

  throw new Response(`The form action "${_action}" is not supported`, {
    status: 400,
  });
};

export default function UserListRoute() {
  const { comments, items, listOwner } = useLoaderData<typeof loader>();
  const { userId, event, attendee, isPastEvent } = useEventContext();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const addItemFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (navigation.state === "idle") {
      addItemFormRef.current?.reset();
    }
  }, [navigation.state]);

  const isListOwner = listOwner.id === attendee?.id;

  let submittingItem: JSX.Element | null = null;

  if (navigation.formData && navigation.formData.get("_action") === "create") {
    const name = navigation.formData.get("name");
    const description = navigation.formData.get("description");
    const link = navigation.formData.get("link");
    const quantity = navigation.formData.get("quantity");

    if (
      typeof name === "string" &&
      !validateItemName(name) &&
      typeof description === "string" &&
      !validateItemDescription(description) &&
      typeof link === "string" &&
      !validateItemLink(link) &&
      typeof quantity === "string" &&
      !validateItemQuantity(parseInt(quantity) || -1)
    ) {
      submittingItem = (
        <ListItemDisplay
          item={{
            id: "new",
            createdAt: new Date().toISOString(),
            eventId: event.id,
            givers: [],
            link: null,
            name,
            description,
            ownerId: listOwner.id,
            quantity: parseInt(quantity) || -1,
            updatedAt: new Date().toISOString(),
          }}
          isOwner={isListOwner}
          attendeeId={attendee?.id}
          loading={true}
        />
      );
    }
  }

  return (
    <div className="list-page">
      <BackButton />
      <h2>{isListOwner ? "Your" : `${listOwner.nickname}'s`} List</h2>

      {isListOwner && !isPastEvent ? (
        <div>
          <h3>Add a new item</h3>
          <Form method="post" ref={addItemFormRef}>
            <input type="hidden" name="_action" value="create" />
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
                rows={2}
                maxLength={128}
              />

              <TextInput
                name="link"
                label="Link"
                type="url"
                defaultValue={actionData?.fields?.link}
                error={actionData?.fieldErrors?.link}
              />

              <NumberInput
                name="quantity"
                label="Quantity"
                defaultValue={actionData?.fields?.quantity}
                error={actionData?.fieldErrors?.quantity}
                placeholder="Leave blank for unlimited"
              />

              <br />

              <button type="submit" className="button">
                Add
              </button>
            </fieldset>
          </Form>
        </div>
      ) : null}

      <ul className={`item-list ${isListOwner ? "full-height" : ""}`}>
        {items.length || submittingItem ? (
          <>
            {items.map((item) => (
              <ListItemDisplay
                key={item.id}
                item={item}
                isOwner={isListOwner}
                attendeeId={attendee?.id}
                inert={isPastEvent}
              />
            ))}
            {submittingItem}
          </>
        ) : (
          <p className="text-center">This list is empty</p>
        )}
      </ul>

      {!isListOwner ? (
        <div className="list-discussion">
          <h3>Discussion</h3>

          <CommentSection
            comments={comments}
            currentUserId={userId}
            listOwnerId={listOwner.id}
            isEventCreator={userId === event?.creatorId}
          />
        </div>
      ) : null}
    </div>
  );
}

// export function ErrorBoundary() {
//   const error = useRouteError();
//   console.log(error);

//   if (isRouteErrorResponse(error)) {
//     return (
//       <div className="error-container">
//         {error.data || "What you're trying to do is not allowed"}
//       </div>
//     );
//   }

//   if (error instanceof Error) {
//     return <div className="error-container">{error.message}</div>;
//   }

//   throw new Error("Unhandled error");
// }
