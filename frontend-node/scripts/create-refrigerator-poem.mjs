import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph } from "docx";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storyDirectory = path.join(root, "public", "stories", "the-refrigerator-hates-me");
const imagesDirectory = path.join(storyDirectory, "images");
const poem = [
  "It’s 3:00 AM, the house is still,\nI tiptoe past the sleeping sill,\nIn search of cheese, a midnight snack,\nA lonely hero in the dark.\nI crack the fridge, a blinding light,\nRevealing my pathetic plight,\nAnd out of nowhere, crisp and cold,\nThe smart-screen voice begins to scold.",
  "Oh, my refrigerator hates me,\nIt judges every calorie!\nIt flashes red, it starts to hum,\nIt says, “Put down the cheddar, bum.”\nIt syncs my diet to my phone,\nAnd leaves me crying on my own,\nA Bluetooth tyrant in white steel,\nDenying me my healing meal!",
  "I reach for leftover cold pizza,\nThe kind that makes a sad man visa,\nThe fridge door slams with vicious force,\nAnd locks itself with firm remorse.\nA notification pings aloud:\n“Your cholesterol levels make me proud…\nPHYSCO! They’re terrible, you fool,\nGo drink some water from the pool.”",
  "I tried to reason with the ice,\nI offered snacks, I asked it nice.\n“Just give me ranch, just give me dip!”\nIt ordered kale on one-day ship.\nNow Siri is laughing from the hall,\nAnd Alexa joined the screaming match of all!",
  "Oh, my refrigerator hates me,\nIt judges every calorie!\nIt flashes red, it starts to hum,\nIt says, “Put down the cheddar, bum.”\nIt syncs my diet to my phone,\nAnd leaves me crying on my own,\nA Bluetooth tyrant in white steel,\nDenying me my healing meal!",
  "Dignity not found.\nPlease close the door.\nAnd maybe wear pants next time.",
];
const document = new Document({
  sections: [{
    children: [
      new Paragraph("A Small Baby Who Wants to Eat His Favourite Foods at Midnight"),
      new Paragraph("Saptarshi Dasprodhan and Arnesh Kanrar · Class IV, 2025"),
      ...poem.map((stanza) => new Paragraph(stanza)),
    ],
  }],
});
await mkdir(imagesDirectory, { recursive: true });
await writeFile(path.join(storyDirectory, "story.docx"), await Packer.toBuffer(document));

const images = [
  ["01-midnight-kitchen.jpg", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1800&q=90"],
  ["02-smart-refrigerator.jpg", "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=1800&q=90"],
  ["03-late-night-snack.jpg", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1800&q=90"],
];
for (const [name, url] of images) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${url}: ${response.status}`);
  await writeFile(path.join(imagesDirectory, name), Buffer.from(await response.arrayBuffer()));
}
console.log("Created the refrigerator poem DOCX and three local images.");
