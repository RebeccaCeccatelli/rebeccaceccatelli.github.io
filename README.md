# rebeccaceccatelli.github.io

Personal website — built with [Astro](https://astro.build), deployed to GitHub Pages.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
```

## Where things live

| What | File |
|---|---|
| Profile, CV entries, music videos, Tonic links, passions & stories | `src/data/site.ts` |
| Portrait on the home page | `src/assets/portrait.jpg` (replace with a ≥600×600 original) |
| Photos with friends (Life page) | drop images into `src/assets/photos/` — file name = caption |
| Newsletter “Thoughts & Cues” | `src/content/cues/YYYY-MM.yaml` (Markdown text) |
| Full articles (the future blog) | `src/content/notes/<slug>.md`, see `_example.md` |
| Colours, type, glass styles | `src/styles/global.css` |
| Liquid mouse effect (WebGL fluid) | `src/scripts/fluid.ts` · per-page strength via `fluid="full|soft|subtle"` on `<Base>` |

### Adding to the newsletter

Add a day to the current month’s YAML (or create `2026-11.yaml`):

```yaml
  - date: 2026-11-18
    label: "Nov 18"
    items:
      - tag: "Music"
        text: "Something worth sharing: [a link](https://…)"
        sub:
          - text: "an optional sub-point"
```

When a cue grows into an article, write `src/content/notes/my-article.md` and add `note: my-article` to that cue.
`npm run import-cues` re-imports everything from the Google Doc (overwrites the YAML files).

## Deploying

The repository must be named **`rebeccaceccatelli.github.io`**. In the repo’s *Settings → Pages*, set *Source* to **GitHub Actions**.
Every push to `main` then rebuilds and publishes the site. Existing project sites (`/tonic`, `/music_EBT`, …) keep working.
