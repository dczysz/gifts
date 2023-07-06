import type { SerializeFrom } from "@remix-run/node";
import { createContext, useContext } from "react";

import type { Attendee, Event } from "@prisma/client";

interface EventContextData {
  userId: string;
  event: SerializeFrom<
    Event & {
      attendees: Attendee[];
    }
  >;
  attendee: Attendee;
  creatorAttendee: Attendee;
  isPastEvent: boolean;
}

const EventContext = createContext<EventContextData>({
  userId: null!,
  event: null!,
  attendee: null!,
  creatorAttendee: null!,
  isPastEvent: false,
});

export const useEventContext = () => {
  return useContext(EventContext);
};

export const EventContextProvider = EventContext.Provider;
