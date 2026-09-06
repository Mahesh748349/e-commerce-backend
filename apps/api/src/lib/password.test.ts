import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password utilities", () => {
  it("hashes passwords with a one-way verifier", async () => {
    const hash = await hashPassword("StrongPassword123!");

    expect(hash).not.toBe("StrongPassword123!");
    await expect(verifyPassword(hash, "StrongPassword123!")).resolves.toBe(true);
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });
});
