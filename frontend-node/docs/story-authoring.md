# Adding a landing-page story

Create one folder under `public/stories/<slug>/` for each story:

```text
public/stories/my-new-story/
  story.docx
  images/
    01-cover.jpg
    02-detail.jpg
    03-autumn.jpg
```

The Word document must use this order:

1. First paragraph: story title
2. Second paragraph: author/byline
3. Remaining paragraphs: story text

Put two or three high-resolution JPG, PNG, SVG, WebP, GIF, or AVIF images in the adjacent `images` folder. They are displayed in filename order. Run `npm run build-stories` to refresh the generated landing data; `npm run dev` and `npm run build` run this step automatically.
