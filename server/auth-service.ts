import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const DEFAULT_PRINCIPAL_PASSWORD = process.env.PRINCIPAL_PASSWORD?.trim() || "Principal@123";

let currentPrincipalPassword = DEFAULT_PRINCIPAL_PASSWORD;

export function getPrincipalPassword() {
  return currentPrincipalPassword;
}

export function setPrincipalPassword(nextPassword: string) {
  currentPrincipalPassword = nextPassword.trim();
  return currentPrincipalPassword;
}

export function verifyPrincipalPassword(candidate: string) {
  const expected = Buffer.from(currentPrincipalPassword.trim());
  const actual = Buffer.from(candidate.trim());
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function generateAccessCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
