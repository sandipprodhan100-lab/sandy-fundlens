import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph } from "docx";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storyDirectory = path.join(root, "public", "stories", "the-coordinate-of-autumn");
const imagesDirectory = path.join(storyDirectory, "images");
const sourcePath = path.join(root, "src", "components", "landing", "RishiLandingPage.tsx");
const source = await readFile(sourcePath, "utf8");
const tick = String.fromCharCode(96);
const match = source.match(new RegExp(`body: ${tick}([\\s\\S]*?)${tick},\\r?\\n};`));
if (!match) throw new Error("Could not find the existing story body.");

const body = match[1];
const paragraphs = [
  new Paragraph("The Coordinate of Autumn"),
  new Paragraph("Sapatarshi Dasprodhan"),
  ...body.split(/\r?\n\r?\n/).filter(Boolean).map((text) => new Paragraph(text.trim())),
];
await mkdir(imagesDirectory, { recursive: true });
const document = new Document({ sections: [{ children: paragraphs }] });
await writeFile(path.join(storyDirectory, "story.docx"), await Packer.toBuffer(document));

const images = [
  ["01-coastline.jpg", "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=90"],
  ["02-rain-window.jpg", "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=90"],
  ["03-autumn-path.jpg", "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1800&q=90"],
];
for (const [name, url] of images) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${url}: ${response.status}`);
  await writeFile(path.join(imagesDirectory, name), Buffer.from(await response.arrayBuffer()));
}
console.log("Created the initial story DOCX and three local images.");
