import { describe, expect, it } from "vitest";
import { slugify } from "./slug.js";

describe("slugify", () => {
  it("normalizes product and category names into URL-safe slugs", () => {
    expect(slugify(" Premium Hoodie / Black - XL ")).toBe("premium-hoodie-black-xl");
  });

  it("trims repeated separators", () => {
    expect(slugify("---Wireless    Earbuds!!!")).toBe("wireless-earbuds");
  });
});
