/**
 * Password strength scoring + breach checking.
 *
 * Scoring is local and deterministic. Breach checking uses the Have I Been
 * Pwned range API with k-anonymity: only the first 5 characters of the SHA-1
 * hash ever leave the browser, never the password itself.
 */

export type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hints: string[];
};

const COMMON = new Set([
  "password", "password1", "passw0rd", "123456", "12345678", "123456789", "1234567890",
  "qwerty", "qwerty123", "abc123", "letmein", "welcome", "admin", "admin123", "iloveyou",
  "monkey", "dragon", "football", "baseball", "sunshine", "princess", "login", "starwars",
  "master", "hello", "freedom", "whatever", "trustno1", "changeme", "secret", "summer",
  "test1234", "root", "toor", "azerty", "1q2w3e4r", "zaq12wsx", "superman", "batman",
]);

const SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

function hasSequence(lower: string): boolean {
  for (const seq of SEQUENCES) {
    for (let i = 0; i + 4 <= seq.length; i += 1) {
      const run = seq.slice(i, i + 4);
      if (lower.includes(run) || lower.includes([...run].reverse().join(""))) return true;
    }
  }
  return false;
}

export function scorePassword(password: string): Strength {
  const hints: string[] = [];
  if (!password) return { score: 0, label: "Empty", hints: ["Enter a password."] };

  const lower = password.toLowerCase();
  const classes =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/[0-9]/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password));

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;
  points += Math.max(0, classes - 1);

  const uniqueRatio = new Set(password).size / password.length;
  if (uniqueRatio < 0.5) {
    points -= 1;
    hints.push("Too many repeated characters.");
  }
  if (hasSequence(lower)) {
    points -= 1;
    hints.push("Avoid keyboard or alphabet runs like “abcd” or “qwer”.");
  }
  if (COMMON.has(lower) || [...COMMON].some((c) => c.length >= 6 && lower.includes(c))) {
    points = Math.min(points, 1);
    hints.push("Contains a very common password.");
  }

  if (password.length < 8) hints.push("Use at least 8 characters — 12 or more is much safer.");
  if (classes < 3) hints.push("Mix upper case, lower case, numbers and symbols.");

  const score = Math.max(0, Math.min(4, points)) as Strength["score"];
  const label = ["Very weak", "Weak", "Fair", "Strong", "Very strong"][score]!;
  return { score, label, hints };
}

/** Minimum acceptable local score for a new password. */
export const MIN_SCORE = 2;

async function sha1Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Returns how many times the password appears in known breaches.
 * Returns null when the breach service is unreachable (fail open).
 */
export async function breachCount(password: string): Promise<number | null> {
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return null;
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix) return Number(count ?? 0);
    }
    return 0;
  } catch {
    return null;
  }
}
