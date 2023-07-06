import { Link } from "@remix-run/react";

export default function EventsIndexRoute() {
  return (
    <div className="events-index">
      <div>
        <div className="links">
          <Link to="/events/new">Create an event</Link>
          <Link to="/events/join">Join an event</Link>
        </div>
      </div>
    </div>
  );
}
