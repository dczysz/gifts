export function normalizeUrl(url: string) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return new URL(url).toString();
}

export function validateItemLink(link: string) {
  if (!link.length) return;

  // TODO: Do better

  try {
    normalizeUrl(link);
  } catch {
    return "Please enter a valid URL, or leave empty";
  }
}

export function validateItemName(name: string) {
  if (name.length < 1) {
    return "Please enter a name for this item";
  }
}

export function validateItemQuantity(quantity: number) {
  if (!Number.isInteger(quantity)) {
    return "Please enter a valid integer quantity";
  }

  if (quantity < -1 || quantity === 0) {
    return "Please enter a quantity greater than zero";
  }
}

export function validateItemDescription(description: string) {
  if (description.length > 128) {
    return "Please enter a shorter description, max 128 characters";
  }
}

export function validateNickname(nickname: string): string | undefined {
  if (!nickname.length) {
    return "Please enter a valid name to use for this event";
  }

  if (nickname.length > 24) {
    return "Name is too long, max 24 characters";
  }
}

export function validateAvatar(avatar: string): string | undefined {
  if (avatar.length > 24) {
    return "Avatar seed too long, max 24 characters";
  }
}

export function validateEventName(name: string) {
  if (name.length < 3) {
    return "That event name is too short, minimum of 3 characters";
  }
}

export function validateEventDescription(description: string) {
  if (description.length > 256) {
    return "Please enter a shorter description, maximum of 256 characters";
  }
}

export function validateEventDate(dateString: string) {
  if (!dateString.length) {
    return "Please enter a valid date";
  }

  const date = new Date(dateString);

  if (date.getTime() < Date.now()) {
    return "That date has already passed";
  }
}

export function validateEventCode(code: string) {
  if (!code.length) {
    return "Please enter a unique code";
  }
}

export function validateUsername(username: string) {
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 16
  ) {
    return `Username must be 3-16 characters long`;
  }
}

export function validatePassword(password: string) {
  if (typeof password !== "string" || password.length < 6) {
    return `Password must be at least 6 characters long`;
  }
}

export function validateRedirectUrl(url: unknown) {
  if (typeof url !== "string") {
    return "/events";
  }
  let urls = ["/", "/events", "/events/new"];
  if (urls.includes(url)) {
    return url;
  }
  if (url.startsWith("/events")) {
    return url;
  }
  return "/events";
}
