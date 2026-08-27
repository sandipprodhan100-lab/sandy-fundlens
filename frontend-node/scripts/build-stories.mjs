import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storiesRoot = path.join(root, "public", "stories");
const outputPath = path.join(root, "src", "generated", "stories.ts");
const storySlugs = (await readdir(storiesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const stories = [];
for (const slug of storySlugs) {
  const storyDirectory = path.join(storiesRoot, slug);
  const documentPath = path.join(storyDirectory, "story.docx");
  const imagesDirectory = path.join(storyDirectory, "images");
  const { value } = await mammoth.extractRawText({ path: documentPath });
  const paragraphs = value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const images = (await readdir(imagesDirectory))
    .filter((name) => /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(name))
    .sort()
    .map((name) => `/stories/${slug}/images/${encodeURIComponent(name)}`);

  if (paragraphs.length < 3) {
    throw new Error(`${slug}/story.docx must contain a title, author, and story text.`);
  }

  stories.push({
    slug,
    title: paragraphs[0],
    author: paragraphs[1],
    body: paragraphs.slice(2).join("\n\n"),
    images,
  });
}

const source = `export type Story = { slug: string; title: string; author: string; body: string; images: string[] };\n\nexport const STORIES: Story[] = ${JSON.stringify(stories, null, 2)};\n`;
await writeFile(outputPath, source, "utf8");
console.log(`Generated ${stories.length} stor${stories.length === 1 ? "y" : "ies"}.`);
