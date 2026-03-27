Design Critique: Goldfinch
Anti-Patterns Verdict
Pass. This does NOT look AI-generated. Strong signals of intentional, human design:

System font stack (not Inter/Space Grotesk/generic AI choices)
Custom purple brand color with proper HSL token system, not the cliche purple-gradient-on-white
Custom-built components (no shadcn, no generic component library)
No glassmorphism, no gradient text, no glowing dark mode accents
Functional layout driven by domain needs, not template aesthetics
The "Today" divider concept on the dashboard is genuinely inventive
The design reads as "engineer-built with care" — which is honest and solid, but also where the biggest improvement opportunities lie.

Design Health Score
#	Heuristic	Score	Key Issue
1	Visibility of System Status	2	Inconsistent loading states (text vs skeleton vs nothing); toasts appear/disappear instantly with no animation
2	Match System / Real World	3	Good i18n, domain-appropriate terms; some hardcoded strings and unexplained financial jargon
3	User Control and Freedom	2	Delete confirmation exists, navigation works; no undo, no autosave, no draft recovery
4	Consistency and Standards	2	Loading/error/empty patterns vary per component; settings inputs fixed-width vs full-width elsewhere
5	Error Prevention	2	ConfirmDeleteDialog, NumberInput validation; settings rate errors have state but no UI display
6	Recognition Rather Than Recall	3	Labeled sidebar (expanded), good status badges; collapsed sidebar is icon-only, scenarios unexplained
7	Flexibility and Efficiency	1	No keyboard shortcuts, no bulk actions, no power-user paths
8	Aesthetic and Minimalist Design	3	Clean hierarchy, purposeful layout; dashboard is dense but organized
9	Error Recovery	2	Errors displayed but generic; no suggested fixes, no guidance on next steps
10	Help and Documentation	1	ExplanationAlert exists but no contextual help system, no tooltips, no onboarding
Total		21/40	Acceptable
Overall Impression
Goldfinch has strong bones: a well-structured token system, clean layout grid, proper dark mode, solid i18n infrastructure, and a genuinely thoughtful information architecture (the past/today/future dashboard split is clever). The engineering is sound.

What's missing is the feeling. For an app targeting young professionals who reference Apple and Stripe, the experience feels static and utilitarian. There are zero transitions. Toasts pop in like system alerts. Cards sit flat without any sense of depth or life. The typography, while clean, is generic. The biggest single opportunity: add motion and polish to transform "functional" into "premium."

What's Working
The dashboard's temporal architecture — Splitting the view into "Current Position | Today | Future Projections" with a vertical divider is an excellent conceptual model. It immediately communicates the app's mental model: where you are vs where you're going. This is genuinely good information architecture.

The design token system — Proper CSS custom properties, Tailwind theme integration, semantic color names, sidebar-specific tokens, chart palette, dark mode. This is a well-engineered foundation that most apps don't have. Every improvement built on this will be consistent.

Status communication — The retirement status badge (green/yellow/red pill with dot), the progress bar, the scenario comparison — these are dense but readable. The tabular-nums on financial figures is a small detail that shows craft.

Priority Issues
[P1] No motion or transitions anywhere
What: Toasts appear/disappear instantly. Dialogs snap open. Page changes are abrupt. The sidebar collapses without animation (only the chevron icon rotates). No hover micro-interactions beyond color changes.

Why it matters: For users who reference Apple and Stripe, motion IS the experience. Static interfaces feel broken or cheap. The .impeccable.md design principle "Polished interactions — subtle transitions, responsive feedback, smooth state changes" is completely unmet.

Fix: Add enter/exit transitions on toasts (slide + fade), dialog open/close animation, subtle scale on card hover, staggered fade-in on dashboard card mount. CSS transition + @starting-style or Svelte transitions.

Suggested command: /animate

[P1] Inconsistent state handling across components
What: Loading states are different everywhere:

Household/Pension pages: plain text "Loading..."
Dashboard cards: animated pulse skeletons
ScenarioProjectionChart: skeleton matching chart height
Settings: content simply hidden until loaded
RetirementGapChartCard: "..." in a centered div
Error states are similarly inconsistent. Empty states are bare <p class="text-muted-foreground"> with no guidance.

Why it matters: Inconsistency erodes trust. Users learn patterns; when the same action (loading data) produces different visual responses, it feels unfinished. Empty states that say "no data" without explaining what to do next are dead ends.

Fix: Create shared LoadingSkeleton, ErrorState, and EmptyState components. Define the pattern once, use everywhere. Empty states should include an icon, message, and CTA.

Suggested command: /normalize

[P2] No keyboard navigation or accessibility for interactive components
What: ThemeToggle dropdown has no keyboard support (no arrow keys, Enter, Escape). ConfirmDeleteDialog has an a11y-ignore comment. Toasts have no ARIA role="status" or aria-live="polite". Collapsed sidebar is icon-only with only title attributes (no aria-label). Status colors (green/yellow/red) carry meaning without sufficient non-color indicators for all contexts.

Why it matters: WCAG AA compliance is the stated goal. These gaps aren't edge cases — keyboard navigation and screen reader support are foundational. The ThemeToggle is a custom dropdown that breaks standard platform patterns.

Fix: Add keyboard handlers to ThemeToggle (Escape to close, arrow keys, Enter to select). Add ARIA live region to ToastViewport. Remove a11y-ignore from dialog and fix the underlying issue. Ensure all interactive elements have proper focus management.

Suggested command: /harden

[P2] Typography lacks distinction
What: System font stack throughout. No display font for headings. All text uses the same font family — differentiation comes only from weight and size. The text-3xl font-bold tracking-tight pattern for key metrics is the only typographic "moment" in the entire app.

Why it matters: Typography is the #1 driver of perceived quality in fintech. Stripe, Apple, and YNAB all use carefully selected typefaces that signal premium quality. System fonts are invisible — they don't telegraph "modern and confident," they telegraph "default."

Fix: Introduce one display/heading typeface (something with character — DM Sans, Plus Jakarta Sans, Satoshi, or similar) for headings and key metrics. Keep system font for body text. This single change will dramatically elevate perceived quality.

Suggested command: /typeset

[P2] Dashboard cognitive density
What: The dashboard presents 6+ cards simultaneously across two columns, each containing multiple data points. The type breakdown card lists every pension type, then an allocation bar, all in one card. The 3-scenario comparison in RetirementStatusBanner packs pessimistic/realistic/optimistic + progress bar + required/projected values into a single card.

Why it matters: Cognitive load checklist: 2 failures (chunking and working memory). Users must understand what "pessimistic scenario" means (learned in Settings) to interpret dashboard values — a memory bridge violation. Young professionals new to retirement planning will find this overwhelming.

Fix: Consider progressive disclosure: show the realistic scenario prominently, collapse pessimistic/optimistic behind a "Show all scenarios" toggle. Add inline tooltips explaining financial concepts on first encounter.

Suggested command: /clarify

[P3] Empty states are dead ends
What: When data is missing (no pensions configured, no compass setup, no ETF stats), the UI shows plain text like "No data available" or a simple text link. No icons, no illustrations, no contextual explanation of what the user should do.

Why it matters: Empty states are the most common first impression for new users. A bare text message makes the app feel empty and confusing. This directly undermines the "Progress: every visit should reinforce forward momentum" emotional goal.

Fix: Design empty state cards with an icon, explanatory text, and a prominent CTA button. For example: the RetirementGapChartCard empty state could show a simple illustration with "Set up your retirement plan to see projections" and a styled button to /plan.

Suggested command: /onboard

Persona Red Flags
Alex (Power User) — Dashboard/Admin interface
No keyboard shortcuts: Can't navigate between dashboard cards, can't switch household members, can't expand/collapse charts via keyboard. Every interaction requires mouse.
No bulk operations: Managing 5 pension types across 2 household members means 10+ individual edit flows. No batch view or quick-edit mode.
Chart expand is mouse-only: The expand/collapse button on ScenarioProjectionChart (h-8 w-8) has no keyboard shortcut or aria-label.
Sidebar collapse is good but only mouse-triggered — no Cmd+B or similar shortcut.
Sam (Accessibility-Dependent User) — Dashboard/Admin interface
ThemeToggle dropdown: Completely inaccessible by keyboard. Custom dropdown without ARIA combobox/listbox role. Screen reader cannot navigate options.
ToastViewport: No role="status" or aria-live region. Screen reader users will never know a toast appeared.
Color-only status: RetirementStatusBanner's progress bar uses green/yellow/red without text labels on the bar itself. The status badge has text, but the bar is color-only.
ConfirmDeleteDialog: Has svelte-ignore for a11y warnings — indicates known accessibility issues being suppressed rather than fixed.
Collapsed sidebar: Icons without visible text. title attributes help on hover but provide no screen reader landmark.
Lena (Young Professional Planner) — Project-specific persona
Profile: 28, first real job with retirement benefits. Downloaded the app because a friend recommended it. Comfortable with apps but has never thought about retirement math. Feels slightly anxious about "doing it wrong."

Behaviors: Wants to understand what numbers mean, not just see them. Looks for reassurance that she's on the right track. Will compare herself to benchmarks or averages.

Red Flags:

"Pessimistic / Realistic / Optimistic" on RetirementStatusBanner — What do these mean? What rates do they assume? No tooltip, no explanation. Lena doesn't know if "realistic" is conservative or aggressive.
"Required Capital Adjusted" in RetirementGapChartCard — Adjusted for what? Inflation? Taxes? No context.
Dashboard loads with numbers but no narrative — Lena sees "+2.3% vs last month" but doesn't know if that's good or bad for her age/goals. No benchmarking, no "you're doing better than average."
Empty states feel like failure — "No data available" when she hasn't set up pensions yet makes her feel like she's behind, not that she's at the starting line.
Minor Observations
Hardcoded strings: ETF chart title "ETF — Contributions vs Returns" (+page.svelte:281), ThemeToggle "Theme" button label, ScenarioProjectionChart "Expand"/"Collapse" — should use m.*() paraglide messages
Debug logging: Dashboard has console.log('[Dashboard Debug]', ...) left in production code (+page.svelte:119)
Settings select width: Fixed w-[280px] doesn't respond to container — breaks on narrow screens
Allocation bar: Only shows ETF vs Savings split — ignores Insurance, Company, and State pension types in the visual
"/mo" suffix: Hardcoded English abbreviation in FixedIncomeCard and RetirementStatusBanner — not i18n'd