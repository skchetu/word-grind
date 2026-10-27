import type { WordCard } from "@/lib/session/machine";

// A word in the drill. `audioUrl` is its recorded clip, when there is one.
// `sentence` is the example read after the word, with `cloze` shown on screen.
export type DrillWord = WordCard & {
  definition: string;
  audioUrl?: string;
  sentence?: { text: string; cloze: string; audioUrl?: string };
};

// A fixed GRE-style list for trying the drill before Claude generates
// weekly lists.
export const seedWords: DrillWord[] = [
  { id: "seed-1", text: "ubiquitous", definition: "found everywhere" },
  { id: "seed-2", text: "ephemeral", definition: "lasting a very short time" },
  { id: "seed-3", text: "laconic", definition: "using very few words" },
  {
    id: "seed-4",
    text: "obsequious",
    definition: "too eager to please or obey",
  },
  {
    id: "seed-5",
    text: "perfunctory",
    definition: "done with minimal effort or care",
  },
  {
    id: "seed-6",
    text: "pernicious",
    definition: "harmful in a gradual, subtle way",
  },
  { id: "seed-7", text: "garrulous", definition: "excessively talkative" },
  {
    id: "seed-8",
    text: "sycophant",
    definition: "someone who flatters to gain favor",
  },
];
