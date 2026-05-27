# Repository Guidelines

## Project Structure & Module Organization

CC Switch is a Tauri 2 desktop app with a React/Vite frontend and Rust backend. Frontend source lives in `src/`, with UI in `src/components`, shared hooks in `src/hooks`, context providers in `src/contexts`, configuration data in `src/config`, utilities in `src/utils`, and i18n resources under `src/i18n`. Tauri and Rust code lives in `src-tauri/src`; Rust integration tests are in `src-tauri/tests`. Frontend tests are organized by area in `tests/components`, `tests/hooks`, `tests/config`, `tests/integration`, and `tests/utils`. Packaging and platform metadata live in `flatpak/`, `assets/`, and `src-tauri/icons`.

## Build, Test, and Development Commands

Use `pnpm install` to install dependencies. `pnpm dev` starts the Tauri app with hot reload. `pnpm dev:renderer` runs only the Vite renderer. `pnpm build` creates a production Tauri build, while `pnpm build:renderer` builds only the frontend. Run `pnpm typecheck` for TypeScript checks, `pnpm test:unit` for Vitest, and `pnpm test:unit:watch` during active frontend work. For Rust changes, run `cd src-tauri && cargo test`; use `cargo fmt --check` and `cargo clippy` before submitting backend work.

## Coding Style & Naming Conventions

Frontend code uses TypeScript, React function components, Tailwind CSS, and Prettier. Format with `pnpm format` and verify with `pnpm format:check`. Prefer PascalCase for React components, camelCase for functions and variables, and descriptive hook names such as `useSettingsForm`. Rust uses edition 2021, `rustfmt`, and snake_case module/function names. Tauri command names should remain camelCase when exposed to the frontend.

## Testing Guidelines

Vitest, React Testing Library, jsdom, and MSW support frontend tests. Name frontend tests `*.test.ts` or `*.test.tsx` and place them in the matching `tests/` subdirectory. Rust integration tests live in `src-tauri/tests/*.rs`. Add focused tests for new behavior and regression tests for bug fixes.

## Commit & Pull Request Guidelines

Recent history uses short imperative subjects, and `CONTRIBUTING.md` recommends Conventional Commits. Prefer messages like `feat(provider): add preset` or `fix(tray): update menu state`. Keep PRs focused, link related issues, describe user-visible changes, and include screenshots for UI changes. Before opening a PR, run the relevant checks: `pnpm typecheck`, `pnpm format:check`, `pnpm test:unit`, plus Rust checks when `src-tauri/` changed.

## Security & Configuration Tips

Do not commit secrets, tokens, local config, or generated build output. Report vulnerabilities through `SECURITY.md`, not public issues. When changing user-facing text, update all supported locales.
