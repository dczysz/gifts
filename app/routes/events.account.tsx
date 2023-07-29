import type { V2_MetaFunction } from "@remix-run/react";
import { type ActionArgs, json } from "@remix-run/server-runtime";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useEffect, useRef } from "react";
import bcrypt from "bcryptjs";

import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request";
import { validatePassword } from "~/utils/validators";
import { hashPassword, requireUserId } from "~/utils/session.server";
import { TextInput } from "~/components/input";

export const meta: V2_MetaFunction = () => [
  {
    title: "Account | Simple Wish",
  },
  { name: "description", content: "Manage your account details" },
];

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const oldPassword = form.get("old-password");
  const newPassword = form.get("new-password");
  const newPasswordConfirm = form.get("new-password-confirm");

  if (
    typeof oldPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof newPasswordConfirm !== "string"
  ) {
    throw new Response("Form not submitted correctly");
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Response("User not found!", { status: 404 });
  }

  const fields = {
    oldPassword,
    newPassword,
    newPasswordConfirm,
  };

  const fieldErrors = {
    oldPassword: (await bcrypt.compare(oldPassword, user.passwordHash))
      ? undefined
      : "Current password is incorrect",
    newPassword:
      validatePassword(newPassword) ||
      (oldPassword === newPassword
        ? "New password must be different than your old password"
        : undefined),
    newPasswordConfirm:
      newPassword === newPasswordConfirm
        ? undefined
        : "New passwords do not match",
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      message: undefined,
    });
  }

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return json({
    fields: {
      oldPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
    fieldErrors: {
      oldPassword: undefined,
      newPassword: undefined,
      newPasswordConfirm: undefined,
    },
    message: "Password updated successfully",
  });
};

export default function AccountSettingsRoute() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.message) {
      formRef.current?.reset();
    }
  }, [actionData?.message]);

  return (
    <div className="account-settings">
      <h1>Account Settings</h1>

      <Form method="POST" ref={formRef}>
        <h2>Change Password</h2>
        <fieldset disabled={navigation.state !== "idle"}>
          <TextInput
            name="old-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            defaultValue={actionData?.fields.oldPassword}
            error={actionData?.fieldErrors.oldPassword}
            required
          />
          <TextInput
            name="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            defaultValue={actionData?.fields.newPassword}
            error={actionData?.fieldErrors.newPassword}
            required
          />
          <TextInput
            name="new-password-confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            defaultValue={actionData?.fields.newPasswordConfirm}
            error={actionData?.fieldErrors.newPasswordConfirm}
            required
          />

          <p>
            <b>{actionData?.message}</b>
          </p>

          <button
            type="submit"
            className="button"
            disabled={navigation.state !== "idle"}
          >
            Update password
          </button>
        </fieldset>
      </Form>
    </div>
  );
}
