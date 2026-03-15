# Parish Cloud - Dashboard

This is the initial dashboard for Parish Cloud, built with Astro.

## 🚀 Commands

All commands can be run from the root of the monorepo, from a terminal:

| Command                             | Action                                           |
| :---------------------------------- | :----------------------------------------------- |
| `pnpm install`                      | Installs dependencies                            |
| `pnpm turbo run dev --filter parish-cloud` | Starts local dev server                          |
| `pnpm turbo run build --filter parish-cloud` | Build your production site to `./dist/`          |
| `pnpm preview`                      | Preview your build locally, before deploying     |
| `pnpm check-types`                  | Run Astro type checking                          |

## 🚀 Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   └── pages/
│       └── index.astro
├── package.json
└── astro.config.mjs
```
