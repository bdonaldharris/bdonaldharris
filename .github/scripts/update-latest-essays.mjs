import fs from "node:fs";

const README_PATH = "README.md";
const ESSAYS_ENDPOINT = "https://bdonaldharris.com/essays.json";
const START_MARKER = "<!-- LATEST-ESSAYS:START -->";
const END_MARKER = "<!-- LATEST-ESSAYS:END -->";
const ESSAY_COUNT = 2;

function escapeMarkdownLinkText(value) {
  return value.replace(/([\\[\]])/g, "\\$1");
}

const response = await fetch(ESSAYS_ENDPOINT, {
  headers: {
    "User-Agent": "bdonaldharris-profile-essay-updater",
    Accept: "application/json",
  },
});

if (!response.ok) {
  throw new Error(
    `Failed to fetch ${ESSAYS_ENDPOINT}: ${response.status} ${response.statusText}`,
  );
}

const essays = await response.json();

if (!Array.isArray(essays)) {
  throw new Error("Expected /essays.json to return an array.");
}

if (essays.length === 0) {
  throw new Error("/essays.json returned no published essays.");
}

const latestEssays = essays.slice(0, ESSAY_COUNT);
const markdown = latestEssays
  .map((essay, index) => {
    if (!essay || typeof essay.title !== "string" || typeof essay.url !== "string") {
      throw new Error(`Essay at index ${index} is missing a valid title or URL.`);
    }

    return `- [${escapeMarkdownLinkText(essay.title)}](${essay.url})`;
  })
  .join("\n");

const readme = fs.readFileSync(README_PATH, "utf8");
const startIndex = readme.indexOf(START_MARKER);
const endIndex = readme.indexOf(END_MARKER);

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  throw new Error("README.md is missing valid latest-essay markers.");
}

const replacement = `${START_MARKER}\n${markdown}\n${END_MARKER}`;
const updated =
  readme.slice(0, startIndex) +
  replacement +
  readme.slice(endIndex + END_MARKER.length);

if (updated === readme) {
  console.log("README already contains the latest essays.");
  process.exit(0);
}

fs.writeFileSync(README_PATH, updated);
console.log(`Updated README with ${latestEssays.length} latest essay(s).`);
