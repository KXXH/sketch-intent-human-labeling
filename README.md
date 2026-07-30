# Sketch Intent Human Annotation

Independent static WebUI for collecting human interpretations of sketch-defined chart animations.

## Run locally

```bash
npm install
npm run prepare:data
npm run dev
```

The generated dataset is intentionally blinded. Each case contains only an ID, a hidden pair ID used for ordering, and four relative image paths. Ground-truth effects, task descriptions, and target classes are not bundled into the application.

## Configuration

Edit `src/experiment/config.ts` for the dataset identity, instructions, and effect definitions. `scripts/prepare-dataset.mjs` converts the repository keyframe manifest into `src/experiment/cases.generated.json` and copies images to `public/datasets/sketch-intent-40-pairs/`.

Before every production build, `npm run validate:data` verifies:

- exactly 80 unique case IDs;
- exactly four keyframes per case;
- all image files exist;
- no answer-bearing fields are present.

## Data safety

Answers auto-save in namespaced browser localStorage with a staging write, read-back check, and five rolling recovery snapshots. A second tab is read-only unless the user explicitly takes over. Draft JSON can be exported at any time. Final export is enabled only after all 80 cases are complete.

Local browser storage cannot survive deliberate site-data clearing or device loss. The downloaded final JSON is the official durable copy.

Duration and looping descriptions are stored verbatim as `{ kind: "text", text: "…" }`, or as `{ kind: "not_shown" }`. Older local drafts that used numeric values remain readable and are converted to text when edited.

## Test and build

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

Vite uses a relative base path, so `dist/` works from a GitHub Pages repository subpath or any ordinary static file host.
