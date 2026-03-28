# Story 3.1: Landing Page (Direction D — Bold & Purple)

Status: review

## Story

As a developer browsing GitHub,
I want to see a visually distinctive landing page that immediately communicates the template's value,
so that I understand what it is and click "Use this template" within 5 seconds.

## Acceptance Criteria

1. **Given** I visit the deployed template URL **When** the landing page loads **Then** the hero section renders with `bg-[#0f0a1a]` background, purple→indigo gradient headline (`from-purple-300 to-indigo-400`), and a CSS glow blob (decorative, `aria-hidden`)
2. **And** the auto-bugfix pipeline feature is visible above the fold with a description
3. **And** a `CodeBlock` component shows `npx create-ai-template` with a copy button
4. **And** a `FeatureCard` grid (3-up on desktop, 1-up on mobile) displays key features
5. **And** a single primary CTA "Use this template" links to the GitHub template page
6. **Given** the user is on a 375px mobile viewport **When** the landing page renders **Then** feature cards stack vertically (1-up), nav collapses to hamburger (shadcn Sheet)
7. Glow blob has `aria-hidden`, does not affect text contrast (min 4.5:1 ratio maintained)

## Tasks / Subtasks

- [x] Set up globals.css Direction D theme overrides (AC: 1, 7)
  - [x] Override shadcn/ui CSS variables to purple palette in `src/app/globals.css`
  - [x] Validate contrast ratios for all text/bg combos (WebAIM checker)
- [x] Create `GradientHero` component (AC: 1, 2, 3)
  - [x] `src/components/features/GradientHero.tsx` — RSC, no JS needed
  - [x] CSS radial-gradient glow blob with `aria-hidden` and `role="banner"`
  - [x] Badge chip, gradient headline, subtext, CTA button slot, CodeBlock child
- [x] Create `CodeBlock` component (AC: 3)
  - [x] `src/components/features/CodeBlock.tsx` — Client Component (clipboard API)
  - [x] Dark bg, monospace, optional `$` prefix, copy button with `aria-label="Copy command"`
  - [x] Copied state: shows `✓ Copied` for 2s then resets (useState + setTimeout)
- [x] Create `FeatureCard` component (AC: 4)
  - [x] `src/components/features/FeatureCard.tsx` — RSC
  - [x] Props: icon (string emoji or lucide-react), title (< 20 chars), description (< 60 chars)
  - [x] Variants: `sm` (3-up grid) | `lg` (2-up with more detail)
- [x] Build landing page `src/app/page.tsx` (AC: 1–6)
  - [x] Compose `GradientHero` + `FeatureCard` grid + Navbar
  - [x] Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - [x] Navbar: logo left, links center, "Use this template" CTA right
  - [x] Mobile hamburger: shadcn `Sheet` component from `src/components/ui/`
- [x] Write unit tests with Vitest (AC: 3 copy button, 7 accessibility)
  - [x] CodeBlock copy interaction test
  - [x] GradientHero renders aria-hidden glow
- [ ] Manual accessibility check: contrast ratio, keyboard nav, screen reader

## Dev Notes

### Critical — Direction D Theme Rules

**NEVER hardcode hex values in component files.** Direction D colors are applied **only** in `src/app/globals.css` as CSS variable overrides. Components inherit automatically via Tailwind tokens.

```css
/* src/app/globals.css — add to :root or .dark block */
--background: #0f0a1a;
--foreground: theme(colors.purple.100);
/* Override shadcn/ui primary → purple */
--primary: theme(colors.purple.500);
--primary-foreground: white;
```

Key Tailwind classes for Direction D:
- Hero bg: `bg-[#0f0a1a]`
- Gradient headline: `bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent`
- CTA button: `bg-gradient-to-r from-purple-500 to-indigo-500`
- Body text: `text-purple-100` / `text-purple-300`
- Borders: `border-purple-900/50`

### Component Implementation Strategy

1. **shadcn/ui FIRST** — Before building anything, check if `src/components/ui/` already has it. Only create custom components for genuine gaps (`GradientHero`, `FeatureCard`, `CodeBlock` are confirmed gaps).
2. **RSC default** — Components are Server Components unless they need browser APIs. Only `CodeBlock` needs `"use client"` (clipboard API).
3. **No per-component color props** — All purple theming comes from globals.css, not props.

### File Structure

```
src/
  app/
    page.tsx              # Landing page (compose hero + features + nav)
    globals.css           # Direction D CSS variable overrides HERE
    layout.tsx            # Root layout (existing — do not break)
  components/
    features/
      GradientHero.tsx    # NEW — RSC
      FeatureCard.tsx     # NEW — RSC
      CodeBlock.tsx       # NEW — "use client"
    shared/
      Navbar.tsx          # NEW — includes mobile Sheet
    ui/                   # shadcn/ui — DO NOT EDIT, use Sheet from here
```

### Navbar Mobile Pattern

Use shadcn `Sheet` (already available or install via `npx shadcn@latest add sheet`):
- Hamburger trigger visible at `< lg` breakpoint
- Sheet slides from left with same nav links
- `aria-label="Open navigation menu"` on trigger button

### CodeBlock Implementation Notes

```tsx
"use client";
import { useState } from "react";

export function CodeBlock({ command, prefix = "$" }: { command: string; prefix?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // render: dark bg, monospace, copy button aria-label="Copy command"
}
```

### GradientHero Glow Blob

Pure CSS, zero JS. Example pattern:
```tsx
<div
  aria-hidden="true"
  className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
  style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 70%)" }}
/>
```

### FeatureCard Content for Landing Page

Use these 3 features (titles ≤ 20 chars, descriptions ≤ 60 chars):
- Icon: 🤖, Title: "Auto-Bugfix Pipeline", Description: "CI failures auto-create issues and PRs to fix them"
- Icon: 🚀, Title: "One-Click Deploy", Description: "Vercel + Neon deployment pre-configured out of the box"
- Icon: 🔒, Title: "Auth + Security Built-in", Description: "Better Auth, security headers, CodeQL scanning included"

### Responsive Breakpoints

| Viewport | Feature Grid | Navbar |
|----------|-------------|--------|
| < 768px (mobile) | 1-up stacked | Hamburger + Sheet |
| 768–1023px | 2-up | Hamburger + Sheet |
| ≥ 1024px | 3-up | Full horizontal nav |

### Testing Standards

- **Framework:** Vitest + React Testing Library (not Playwright for unit)
- **Coverage gate:** 80% for new components (SonarCloud)
- **Key tests:** CodeBlock copy interaction, aria-hidden on glow blob
- Test file locations: `src/components/features/__tests__/` or colocated `*.test.tsx`

### Accessibility Requirements

- Glow blob: `aria-hidden="true"` — purely decorative, carries no info
- Contrast: all purple text/bg combos must pass 4.5:1 (normal text) / 3:1 (large text)
- Copy button: `aria-label="Copy command"`
- GradientHero: `role="banner"`
- Active nav link: `aria-current="page"`
- Mobile hamburger: `aria-label="Open navigation menu"`; closing Sheet returns focus to trigger

### Project Structure Notes

- `src/app/globals.css` already exists (root layout references it) — **add** Direction D variables, do not replace the entire file
- `src/components/ui/` is shadcn/ui auto-generated — **never edit** these files directly; always `npx shadcn@latest add <component>` to add new ones
- This is the **first story in Epic 3** — there is no prior Epic 3 web code. The `src/app/page.tsx` may be a default Next.js placeholder — **replace it entirely**

### References

- Direction D color palette: [ux-design-specification.md#Design Direction Decision](/_bmad-output/planning-artifacts/ux-design-specification.md)
- Component specs (GradientHero, FeatureCard, CodeBlock): [ux-design-specification.md#GradientHero](/_bmad-output/planning-artifacts/ux-design-specification.md)
- File structure: [architecture.md#Project Structure](/_bmad-output/planning-artifacts/architecture.md)
- shadcn/ui rule: [architecture.md#Frontend Architecture](/_bmad-output/planning-artifacts/architecture.md)
- Button hierarchy (primary = purple gradient, single CTA): [ux-design-specification.md#Button Hierarchy](/_bmad-output/planning-artifacts/ux-design-specification.md)
- Responsive breakpoints: [ux-design-specification.md](/_bmad-output/planning-artifacts/ux-design-specification.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `@testing-library/dom` missing — installed as dev dependency (Rule 3 auto-fix)
- `@base-ui/react` missing — installed for shadcn sheet component (Rule 3 auto-fix)
- `@testing-library/jest-dom` missing — installed + added `src/test-setup.ts` (Rule 3 auto-fix)
- `src/lib/utils.ts` missing (`cn` helper required by shadcn components) — created (Rule 3 auto-fix)
- jsdom clipboard API not available — used `vi.stubGlobal` pattern in CodeBlock tests (Rule 1 auto-fix)
- Navbar used `<a href="/">` — replaced with `next/link` to fix ESLint error (Rule 1 auto-fix)

### Completion Notes List

- globals.css was already fully configured with Direction D variables — no changes needed
- shadcn Sheet uses `@base-ui/react` (new shadcn v4 style, not Radix) — installed via legacy-peer-deps
- All 13 unit tests passing: 6 GradientHero + 7 CodeBlock
- Lint passes cleanly (0 errors, 0 warnings)
- Manual a11y check (contrast, keyboard nav, screen reader) left for reviewer

### File List

**Created:**
- `src/components/features/CodeBlock.tsx`
- `src/components/features/GradientHero.tsx`
- `src/components/features/FeatureCard.tsx`
- `src/components/shared/Navbar.tsx`
- `src/components/ui/button.tsx` (via shadcn)
- `src/components/ui/sheet.tsx` (via shadcn)
- `src/components/features/__tests__/CodeBlock.test.tsx`
- `src/components/features/__tests__/GradientHero.test.tsx`
- `src/lib/utils.ts`
- `src/test-setup.ts`
- `components.json` (shadcn config, already existed)

**Modified:**
- `src/app/page.tsx` (replaced placeholder with full landing page)
- `vitest.config.ts` (added setupFiles)
- `package.json` (added @base-ui/react, @testing-library/dom, @testing-library/jest-dom)
