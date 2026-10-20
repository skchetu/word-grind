// Curly quotes and the modifier-letter apostrophe that phone keyboards
// insert automatically.
const APOSTROPHES = /[‘’ʼ]/g;

// Puts an answer into the form it's graded in, so "  Don’t " and "don't"
// compare equal. Case, surrounding space and apostrophe style never count
// as spelling mistakes.
export function normalize(input: string): string {
  return input
    .normalize("NFC")
    .replace(APOSTROPHES, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
