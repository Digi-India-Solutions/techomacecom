import argon2 from "argon2";

// Document §13.1: staff passwords hashed with argon2.
const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

// Used when the email does not exist, so a failed login takes the same time
// whether or not the account exists (no user enumeration by timing).
let dummyHash;

export async function hashPassword(plain) {
  return argon2.hash(plain, OPTIONS);
}

export async function verifyPassword(hash, plain) {
  if (!hash) {
    dummyHash ??= await argon2.hash("timing-equaliser", OPTIONS);
    await argon2.verify(dummyHash, plain).catch(() => false);
    return false;
  }
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/** At least 8 characters with a letter and a number. */
export const PASSWORD_RULE = {
  regex: /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/,
  message: "Password must be 8–128 characters and include at least one letter and one number",
};
