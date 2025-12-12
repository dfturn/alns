# React Component Reference Instructions

Use the components in `references/components` as the canonical guide whenever you implement or update React components in this project. Follow this checklist each time you touch the UI:

## 1. Start from the reference gallery

- Scan the files under `references/components/**` (e.g., `Sidebar.tsx`, `PageComponent.tsx`, `input/`, `navbar/`).
- Prefer copying structure and styling tokens from the closest matching reference instead of inventing new patterns.
- Reuse helper hooks (such as `useTranslator`) and Redux patterns exactly as shown.

## 2. Match architectural patterns

- **Props & Types**: Define explicit prop interfaces and keep prop names consistent with similar reference components.
- **State management**: Mirror how references interact with Redux (`useSelector`, `useDispatch`) and local state (`useState`). If an interaction pattern already exists (e.g., expand/collapse in `Sidebar.tsx`), reuse it.
- **Async flows**: Follow the promise-handling patterns shown in `PageComponent.tsx` and `network-status` modules (loading flags, disabled buttons, etc.).

## 3. Styling & layout

- Keep layout primitives (rows, column spacing, inline styles) aligned with reference files. If a reference uses specific spacing or typography, apply the same classes or SCSS tokens before introducing new styles.
- When responsive behavior is required, check existing breakpoint handling inside `Sidebar.tsx`, `navbar/`, or `input/` components and mirror their approach.

## 4. UX conventions

- Bring over translation wrappers (`useTranslator`, `t('...')`) and icon usage (`@hospitalrun/components`) for any text or icon you add.
- Buttons, lists, and inputs should use the same component library imports and prop combinations as the references (e.g., `outlined`, `color="success"`).
- Respect accessibility patterns (keyboard focus, ARIA labels) already present in the reference set.

## 5. Before submitting a PR

- Re-run through the reference checklist to ensure every new component:
  - References at least one file in `references/components` for structure.
  - Reuses shared hooks, icons, and Redux helpers where possible.
  - Uses consistent naming, translation keys, and styling.
- Document any intentional deviations inside the component file so future work knows why the reference pattern was not followed.

Keeping these instructions visible ensures every UI change remains cohesive with the established reference components.
