import type { SerializeFrom } from "@remix-run/node";
import { useFetcher, useParams } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "boring-avatars";

import type { Attendee, Comment } from "@prisma/client";
import { useClientOnly } from "~/hooks/client";
import { avatarProps } from "~/config/avatar";
import { useEventContext } from "~/context/event";

interface CommentSectionProps
  extends CommentsDisplayProps,
    Omit<CommentInputProps, "fetcherDataChanged"> {}

export function CommentSection({ listOwnerId, ...props }: CommentSectionProps) {
  const { attendeeId } = useParams();
  const { attendee, event } = useEventContext();
  const [sendingComment, setSendingComment] =
    useState<CommentsDisplayProps["sendingComment"]>();

  const handleFetcherDataChanged = useMemo(
    () => (state: "idle" | "loading" | "submitting", form?: FormData) => {
      if (state === "idle" || !form) {
        return setSendingComment(undefined);
      }

      switch (form.get("_action")) {
        case "comment": {
          const text = form.get("text");

          if (typeof text === "string" && text.length) {
            setSendingComment({
              id: "1",
              createdAt: new Date().toISOString(),
              eventId: event.id,
              listOwnerId: attendeeId!,
              owner: attendee,
              ownerId: attendee.id,
              text,
              updatedAt: new Date().toISOString(),
              viewed: true,
            });
          }
          break;
        }
      }
    },
    [attendee, attendeeId, event.id]
  );

  return (
    <>
      <CommentsDisplay sendingComment={sendingComment} {...props} />
      <CommentInput
        listOwnerId={listOwnerId}
        fetcherDataChanged={handleFetcherDataChanged}
      />
    </>
  );
}

interface CommentInputProps {
  listOwnerId?: string;
  fetcherDataChanged: (
    state: "idle" | "loading" | "submitting",
    formData?: FormData
  ) => void;
}

function CommentInput({ listOwnerId, fetcherDataChanged }: CommentInputProps) {
  const fetcher = useFetcher<{ error?: string }>();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle") {
      formRef.current?.reset();
    }

    fetcherDataChanged(fetcher.state, fetcher.formData);
  }, [fetcher, fetcherDataChanged]);

  // When fetcher error is received, show it briefly
  useEffect(() => {
    setShowError(!!fetcher.data?.error);

    if (!fetcher.data?.error) return;

    const timeout = setTimeout(() => {
      setShowError(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, [fetcher.data]);

  const handleCtrlEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
      e.preventDefault();

      if (inputRef.current?.value.trim().length) {
        fetcher.submit(formRef.current);
      }
    }
  };

  return (
    <div className="comment-input">
      <fetcher.Form method="post" ref={formRef}>
        <div className="comment-form">
          <input type="hidden" name="_action" value="comment" />
          {listOwnerId ? (
            <input type="hidden" name="listOwnerId" value={listOwnerId} />
          ) : null}

          <textarea
            name="text"
            rows={2}
            ref={inputRef}
            required
            onKeyDown={handleCtrlEnter}
            disabled={fetcher.state !== "idle"}
            data-test="comment-input"
          ></textarea>

          <button
            type="submit"
            className="button"
            disabled={fetcher.state !== "idle"}
            data-test="comment-submit"
          >
            Send
          </button>
        </div>
      </fetcher.Form>

      <div className={`comment-error ${showError ? "show" : ""}`}>
        {fetcher.data?.error}{" "}
      </div>
    </div>
  );
}

interface CommentsDisplayProps {
  currentUserId?: string | null;
  isEventCreator: boolean;
  comments: CommentProps["comment"][];
  sendingComment?: CommentProps["comment"];
}

function CommentsDisplay({
  comments,
  currentUserId,
  isEventCreator,
  sendingComment,
}: CommentsDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const firstUnreadComment = container.querySelector(".comment.new");

    if (firstUnreadComment) {
      // If any unread comments exist, scroll to first one
      container.scrollTo({
        top:
          container.scrollTop +
          firstUnreadComment.getBoundingClientRect().top -
          firstUnreadComment.clientHeight * 2,
        behavior: "smooth",
      });
    } else {
      // otherwise scroll to bottom to show most recent comments
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current?.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [comments, sendingComment]);

  return (
    <div ref={scrollContainerRef} className="comments">
      {!comments.length && !sendingComment ? (
        <p className="no-comments">No messages to display</p>
      ) : null}

      {comments.map((comment) => (
        <CommentDisplay
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          canDelete={isEventCreator || currentUserId === comment.owner.userId}
        />
      ))}

      {sendingComment ? (
        <CommentDisplay
          comment={sendingComment}
          currentUserId={currentUserId}
          canDelete={false}
          isLoading={true}
        />
      ) : null}
    </div>
  );
}

interface CommentProps {
  comment: SerializeFrom<Comment & { owner: Attendee; viewed: boolean }>;
  currentUserId?: string | null;
  canDelete: boolean;
  isLoading?: boolean;
}

function CommentDisplay({ comment, isLoading, canDelete }: CommentProps) {
  const fetcher = useFetcher();

  const commentTime = useClientOnly(() => {
    const commentDate = new Date(comment.createdAt);
    const currentDate = new Date();

    if (
      commentDate.getFullYear() !== currentDate.getFullYear() ||
      commentDate.getMonth() !== currentDate.getMonth() ||
      commentDate.getDate() !== currentDate.getDate()
    ) {
      return commentDate.toLocaleDateString();
    }

    return commentDate.toLocaleTimeString();
  }, "");

  return (
    <div
      key={comment.id}
      className={`comment ${comment.viewed ? "" : "new"} ${
        isLoading || fetcher.state !== "idle" ? "loading" : ""
      }`}
    >
      <div>
        <Avatar
          size={40}
          name={comment.owner.avatar || comment.owner.userId}
          {...avatarProps}
        />
      </div>

      <div className="comment-body">
        <div className="comment-header">
          <div>
            <span className="comment-owner">{comment.owner.nickname}</span>
            <span className="comment-date">{commentTime || ""}</span>
          </div>

          {canDelete ? (
            <fetcher.Form method="post">
              <input type="hidden" name="_action" value="delete_comment" />
              <button
                name="id"
                value={comment.id}
                aria-label="delete"
                data-test="delete-comment"
              >
                &times;
              </button>
            </fetcher.Form>
          ) : null}
        </div>

        <div className="comment-text">
          {comment.text.split("\n").map((line, i) => (
            <p key={`${comment.id}_${i}`}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
