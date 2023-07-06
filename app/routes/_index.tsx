import type { LinksFunction } from "@remix-run/node";
import type { V2_MetaFunction } from "@remix-run/react";
import { Link } from "@remix-run/react";

import stylesUrl from "~/styles/index.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: V2_MetaFunction = () => [
  {
    title: "Remix Gifts",
  },
  { name: "description", content: "Remix gift event app." },
];

export default function IndexRoute() {
  return (
    <div className="container">
      <div className="content">
        <h1>
          Remix <span>Events!</span>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to="events">View Events</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
