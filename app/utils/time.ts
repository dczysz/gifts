export function formatDatetimeLocalString(date: Date) {
  function addLeadingZero(num: number) {
    const str = num.toString();
    if (str.length < 2) return "0" + str;
    return str;
  }

  return `${date.getFullYear()}-${addLeadingZero(
    date.getMonth() + 1
  )}-${addLeadingZero(date.getDate())}T${addLeadingZero(
    date.getHours()
  )}:${addLeadingZero(date.getMinutes())}`;
}

export function hasDatePassed(date: Date, bufferHours = 0) {
  // Only show as past if it has been 24 hours since the event started
  const cutoff = new Date().setHours(new Date().getHours() - bufferHours);

  return date.getTime() < cutoff;
}

export function formatDateTime(
  date: Date,
  locale = Intl.DateTimeFormat().resolvedOptions().locale,
  dateStyle: "medium" | "full" | "long" | "short" = "medium",
  timeStyle: "medium" | "full" | "long" | "short" = "short"
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
  }).format(date);
}
