# luminara-remotion

Remotion component (`VectorScene`) for the LUMINARA pipeline, plus a Vitest unit test.

## Files

- `src/VectorScene.tsx` — the component + a `getCurrentWord` helper
- `tests/VectorScene.test.tsx` — Vitest + @testing-library/react
- `tests/setup.ts` — jsdom + jest-dom setup
- `vitest.config.ts`, `tsconfig.json`, `package.json`

## Run

```bash
npm install
npm test           # one-shot
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit
```

## What the test asserts

- Root, graphic, and kinetic-text nodes are present
- `<img>` uses the supplied `svgUrl`
- `frame` and `fps` are passed into `spring()`
- The spring value is applied as `transform: scale(n)` on the `<img>`
- The kinetic text shows the word whose `[start, end)` interval contains `frame / fps`
- Empty word list, time past the last word, and boundary cases (start/end inclusivity)
- Different `fps` values are honored
