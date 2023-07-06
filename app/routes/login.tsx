import type {
  ActionFunction,
  LinksFunction,
  LoaderFunction,
  V2_MetaFunction,
} from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { useActionData, Link, useSearchParams, Form } from "@remix-run/react";

import { db } from "~/utils/db.server";
import stylesUrl from "~/styles/login.css";
import {
  createUserSession,
  getUser,
  login,
  register,
} from "~/utils/session.server";
import {
  validateRedirectUrl,
  validateUsername,
  validatePassword,
} from "~/utils/validators";
import { TextInput } from "~/components/input";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: V2_MetaFunction = () => {
  return [
    {
      title: "Gifts! | Login",
    },
    {
      name: "description",
      content: "Login to manage your gift giving events!",
    },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const isLoggedIn = await getUser(request);

  if (isLoggedIn) {
    return redirect("/events");
  }

  return null;
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const loginType = form.get("loginType");
  const username = form.get("username");
  const password = form.get("password");
  const redirectTo = validateRedirectUrl(form.get("redirectTo") || "/events");

  if (
    typeof loginType !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fields = { loginType, username, password };
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  switch (loginType) {
    case "login": {
      const user = await login({ username, password });

      if (!user) {
        return badRequest({
          fields,
          formError: "Incorrect username or password",
        });
      }

      return createUserSession(user.id, redirectTo);
    }
    case "register": {
      const userExists = await db.user.findFirst({
        where: { username },
      });
      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        });
      }

      const user = await register({ username, password });
      if (!user) {
        return badRequest({
          fields,
          formError: "Something went wrong creating a new user",
        });
      }

      return createUserSession(user.id, redirectTo);
    }
    default: {
      return badRequest({
        fields,
        formError: "Login type invalid",
      });
    }
  }
};

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();

  return (
    <div className="container">
      <div className="content">
        <h1>Login</h1>
        <Form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />

          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === "register"}
              />{" "}
              Register
            </label>
          </fieldset>

          <TextInput
            label="Username"
            name="username"
            defaultValue={actionData?.fields?.username}
            error={actionData?.fieldErrors?.username}
          />

          <TextInput
            label="Password"
            name="password"
            defaultValue={actionData?.fields?.password}
            error={actionData?.fieldErrors?.password}
            type="password"
          />

          <div id="form-error-message">
            {actionData?.formError ? (
              <p className="form-validation-error" role="alert">
                {actionData.formError}
              </p>
            ) : null}
          </div>

          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>

      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
