import type { LinksFunction } from "@remix-run/node";
import type { V2_MetaFunction } from "@remix-run/react";
import { Link } from "@remix-run/react";

import stylesUrl from "~/styles/index.css";
import mobileStylesUrl from "~/styles/index-mobile.css";
import { InviteIllustration } from "~/icons/invite";
import { ListIllustration } from "~/icons/list";
import { CommunicationIllustration } from "~/icons/communication";
import { GiftIllustration } from "~/icons/gift";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: stylesUrl },
    {
      rel: "stylesheet",
      href: mobileStylesUrl,
      media: "screen and (max-width: 639px)",
    },
  ];
};

export const meta: V2_MetaFunction = () => [
  {
    title: "Simple Wish",
  },
  { name: "description", content: "Simple gifting, endless smiles" },
];

export default function IndexRoute() {
  return (
    <div>
      <nav>
        <h1>Simple Wish</h1>
        <Link to="/events">Signup / Login</Link>
      </nav>

      <header>
        <h2>
          Simple gifting,
          <br />
          endless smiles
        </h2>
        <p>
          Say goodbye to endless email threads and group texts. Embrace
          simplicity and ease with Simple Wish, the ultimate solution for
          stress-free gift coordination.
        </p>
        <Link to="/events" className="button">
          Join the fun
        </Link>
      </header>

      <div className="row">
        <ListIllustration height={300} />
        <div>
          <h3>Everything in one place</h3>
          <p>
            No more juggling multiple threads and messages! Simple Wish puts all
            the gift wish lists and communication in one convenient location,
            making coordination a breeze. Say hello to simplicity and goodbye to
            gift-giving chaos!
          </p>
        </div>
      </div>

      <div className="row">
        <CommunicationIllustration height={300} />
        <div>
          <h3>Effortless Communication</h3>
          <p>
            Stay connected and on the same page with our built-in comment
            feature. Share ideas, make plans, and discuss event details in the
            main event chat. Additionally, you can hold separate discussions for
            each person's list, visible only to everyone else, to maintain the
            element of surprise.
          </p>
        </div>
      </div>

      <div className="row">
        <InviteIllustration height={300} />
        <div>
          <h3>Share the love</h3>
          <p>
            Inviting friends and family is a snap! With just a few clicks, you
            can bring everyone together to collaborate and ensure the perfect
            gifts for every occasion.
          </p>
        </div>
      </div>

      <div className="row">
        <GiftIllustration height={300} />
        <div>
          <h3>Join us and embrace the joy of gift-giving!</h3>
          <p>
            Make gift coordination a delightful experience for everyone
            involved. Join Simple Wish today and bring the joy back into
            gifting. Whether it's a special birthday or a heartwarming holiday,
            let's create wonderful memories together.
          </p>
          <Link to="/events" className="button">
            Join the fun
          </Link>
        </div>
      </div>

      <footer>
        <span>&copy; {new Date().getFullYear()} Simple Wish</span>
      </footer>
    </div>
  );
}
