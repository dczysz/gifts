import { type LoaderArgs, type ActionArgs, json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";

import {
  deleteComment,
  submitComment,
  updateViewedComments,
} from "~/actions/comment";
import { useEventContext } from "~/context/event";
import { requireUserId } from "~/utils/session.server";
import { getComments } from "~/utils/comment.server";
import { CommentSection } from "~/components/comment";

export const loader = async ({ request, params }: LoaderArgs) => {
  const { eventId } = params;
  const userId = await requireUserId(request);

  const comments = await getComments(userId, eventId!);

  updateViewedComments(userId, eventId!);

  return json({
    comments,
  });
};

export const action = async ({ request, params }: ActionArgs) => {
  const form = await request.clone().formData();
  const _action = form.get("_action");

  switch (_action) {
    case "comment": {
      return await submitComment(request, params);
    }
    case "delete_comment": {
      return await deleteComment(request, params);
    }
  }

  throw new Response("Unhandled action", { status: 400 });
};

export default function EventIndexRoute() {
  const { comments } = useLoaderData<typeof loader>();
  const { userId, event } = useEventContext();

  return (
    <div className="event-discussion">
      <h2>Discussion</h2>
      <CommentSection
        comments={comments}
        currentUserId={userId}
        isEventCreator={userId === event?.creatorId}
      />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
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
      default: {
        throw new Error(`Unhandled error: ${error.status}`);
      }
    }
  }

  if (error instanceof Error) {
    return <div className="error-container">{error.message}</div>;
  }

  return <div className="error-container">Something went wrong :(</div>;
}
