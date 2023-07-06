export function confirmSubmit(
  e: React.FormEvent<HTMLFormElement>,
  confirmText: string
) {
  if (!confirm(confirmText)) {
    e.preventDefault();
  }
}
