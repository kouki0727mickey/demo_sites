// Identity values must come from the Sites dispatcher, never from request JSON.
export function isSiteOwner(user: { userId: string; email: string } | null, ownerEmail: string | undefined): boolean {
  const expected = ownerEmail?.trim().toLowerCase();
  return Boolean(expected && user?.userId && user.email.trim().toLowerCase() === expected);
}
