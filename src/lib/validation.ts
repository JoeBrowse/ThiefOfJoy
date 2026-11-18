export const USERNAME_HINT = "3–20 characters: lowercase letters, numbers and underscores.";

export function normaliseUsername(raw: string) {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function validateUsername(u: string): string | null {
  if (!/^[a-z0-9_]{3,20}$/.test(u)) return `Username must be ${USERNAME_HINT.toLowerCase()}`;
  return null;
}
