---
name: story-content-upload
description: "Use when adding, updating, or publishing a story, poem, blog post, or other editorial content from a Word document with an image folder to the Rishi landing page. Covers the public/stories source layout, DOCX extraction, image handling, build validation, and Cloudflare deployment."
---

# Story Content Upload

Use this workflow for every story, poetry piece, blog post, or editorial post that should appear on the public Rishi landing page.

## Writer modes

Choose one mode before preparing the post. The mode controls the writing treatment, image direction, and visual presentation so different kinds of work do not feel like the same template.

### Story Writer

Use for short stories, fiction, memoir, travel writing, and narrative essays.

- Preserve the author's voice, scene order, dialogue, and paragraph breaks.
- Use a clear title and byline, followed by a readable narrative body.
- Choose cinematic or atmospheric images that establish place, weather, objects, or character without competing with the text.
- Present the post as an immersive reading feature: a strong lead image, generous prose measure, and supporting detail images.
- Do not rewrite, summarize, or invent an ending unless the user explicitly asks for editing.

### Poetry Writer

Use for poems, rhyming verse, spoken-word pieces, and children's poetry.

- Preserve every line break, stanza break, repeated chorus, punctuation mark, and intentional capitalization from the source.
- Keep the poem text as verse; never flatten it into prose or insert spacing between every line.
- Choose playful, illustrative, or symbolic images that reflect the poem's characters, mood, and central objects. Cartoon illustrations are appropriate for children's poems.
- Present the post with artwork beside the verse on wide screens and stacked below it on small screens, while keeping the reading column narrow and calm.
- Do not correct unusual wording, spelling, or grammar unless the user explicitly requests editing.

For either mode, keep the title and byline visible, use accessible image alt text, and avoid decorative images that do not relate to the work.

## Source layout

Create one directory per post:

```text
public/stories/<slug>/
  story.docx
  images/
    01-cover.jpg
    02-detail.jpg
    03-gallery.jpg
```

Use a lowercase kebab-case `<slug>`. The Word document must contain:

1. First non-empty paragraph: post title
2. Second non-empty paragraph: author/byline
3. Remaining non-empty paragraphs: post body

Use two or three high-quality JPG, PNG, SVG, WebP, GIF, or AVIF images. Prefix filenames with `01-`, `02-`, and `03-` because images are displayed in filename order. Keep image files in the post's `images` directory; do not use remote image URLs for new posts.

## Publishing procedure

1. Inspect the target story folder and confirm `story.docx` and `images/` exist.
2. Run `npm run build-stories`. This extracts every story DOCX with Mammoth and regenerates `src/generated/stories.ts`.
3. Confirm the generator reports the expected story count and that the generated entry contains the title, author, body, and image paths.
4. Run `npm run build`. This regenerates story data automatically and verifies the TanStack/Vite production bundle.
5. If the user requested publication, run `npm run deploy`. Wrangler publishes the Worker and static assets to the domains configured in `wrangler.jsonc`.
6. Report the live URL(s), Worker version when available, and any non-blocking warnings.

## Updating an existing post

Replace the contents of its `story.docx` or `images/` directory, preserve the slug, and repeat the publishing procedure. Do not edit `src/generated/stories.ts` by hand; it is generated output.

## Adding a new post

No React or route edit is required. Add the new story directory, then run the publishing procedure. The landing page maps over the generated story collection and renders each post with its first three images.

## Failure handling

- If `build-stories` reports a missing `story.docx` or `images/` directory, fix the source folder rather than weakening the generator.
- If the DOCX has fewer than three non-empty paragraphs, add the title, author, and body content.
- If there are fewer than three images, the page reuses the first image for missing gallery slots; add the intended images for a complete presentation.
- If the build fails, fix the reported source or TypeScript issue before deploying.
- Never put credentials, private documents, or secrets under `public/`; everything there is shipped as a public asset.
