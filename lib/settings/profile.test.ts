import { describe, expect, it } from "vitest";
import {
  householdFormSchema,
  MAX_TOPICS,
  parseTopics,
  profileFormSchema,
} from "./profile";

describe("parseTopics", () => {
  it("trims, drops blanks and removes repeats ignoring case", () => {
    expect(parseTopics(" food, Travel ,, FOOD,")).toEqual(["food", "Travel"]);
  });

  it("keeps at most the topic limit", () => {
    const many = Array.from({ length: 12 }, (_, i) => `t${i}`).join(",");
    expect(parseTopics(many)).toHaveLength(MAX_TOPICS);
  });
});

describe("profileFormSchema", () => {
  it("trims the name and parses the topics", () => {
    expect(
      profileFormSchema.parse({ displayName: " Chetu ", topics: "tech, food" }),
    ).toEqual({ displayName: "Chetu", topics: ["tech", "food"] });
  });

  it("rejects a blank name", () => {
    const result = profileFormSchema.safeParse({
      displayName: " ",
      topics: "",
    });
    expect(result.error?.issues[0]?.message).toBe("Enter a name.");
  });
});

describe("householdFormSchema", () => {
  it("trims the name and reads the level from the form", () => {
    expect(
      householdFormSchema.parse({ name: " Home Team ", difficulty: "4" }),
    ).toEqual({ name: "Home Team", difficulty: 4 });
  });

  it("rejects a level outside 1 to 5", () => {
    const result = householdFormSchema.safeParse({
      name: "Home",
      difficulty: "6",
    });
    expect(result.error?.issues[0]?.message).toBe("Pick a level from 1 to 5.");
  });
});
