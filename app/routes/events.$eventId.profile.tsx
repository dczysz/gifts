import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { json } from "react-router";
import { useState } from "react";

import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request";
import { getUser, requireUserId } from "~/utils/session.server";
import { validateNickname, validateAvatar } from "~/utils/validators";
import { useEventContext } from "~/context/event";
import { avatarProps } from "~/config/avatar";
import { TextInput } from "~/components/input";
import { BackButton } from "~/components/navigation";
import Avatar from "boring-avatars";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request, true);

  return json({ username: user.username });
};

export const action = async ({ request, params }: ActionArgs) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const nickname = form.get("nickname");
  const avatar = form.get("avatar");
  const { eventId } = params;

  if (typeof nickname !== "string" || typeof avatar !== "string") {
    return badRequest({
      fieldErrors: null,
      formError: "Form not submitted correctly",
      fields: null,
    });
  }

  const attendee = await db.attendee.findFirst({ where: { userId, eventId } });

  if (!attendee) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "You are not an attendee for this event",
    });
  }

  const fields = { nickname, avatar };

  const fieldErrors = {
    nickname: validateNickname(nickname),
    avatar: validateAvatar(avatar),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      formError: null,
      fieldErrors,
      fields,
    });
  }

  await db.attendee.update({
    where: { id: attendee.id },
    data: { nickname, avatar: avatar || null },
  });

  return redirect(`/events/${eventId}`);
};

export default function EditEventProfileRoute() {
  const { username } = useLoaderData<typeof loader>();
  const { attendee } = useEventContext();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [avatar, setAvatar] = useState(attendee.avatar || "");

  const randomizeAvatar = () => {
    setAvatar(Math.random().toString(16).slice(2));
  };

  return (
    <div className="event-profile container">
      <div className="mt-2">
        <BackButton />
      </div>

      <h2>Edit Event Profile</h2>

      <p>
        Customize how you would like to appear to others. The details on this
        page are specific to this event and won't affect your profile for any
        other events.
      </p>

      <Form method="post" className="mb-2">
        <fieldset disabled={navigation.state === "submitting"}>
          <div className="avatar-edit">
            <Avatar
              size={80}
              name={avatar || attendee.avatar || attendee.userId}
              {...avatarProps}
            />
            <input type="hidden" name="avatar" value={avatar} />
            <button type="button" className="button" onClick={randomizeAvatar}>
              Randomize avatar
            </button>
          </div>

          <TextInput
            name="nickname"
            label="Name"
            defaultValue={attendee.nickname || username}
            error={actionData?.fieldErrors?.nickname}
            required
          />
        </fieldset>

        {actionData?.formError ? (
          <p className="form-validation-error" role="alert">
            {actionData.formError}
          </p>
        ) : null}

        <button className="button" disabled={navigation.state === "submitting"}>
          Save
        </button>
        <Link to=".." className="button mobile-only">
          Cancel
        </Link>
      </Form>
    </div>
  );
}
