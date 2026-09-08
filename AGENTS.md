# AGENTS.md — Website Design and Front-End Quality Standard

## Purpose

This repository must produce websites that feel intentionally designed, professionally art-directed, and carefully engineered.

The final result must **never look like a generic “vibe-coded” website** or an unedited AI-generated landing-page template.

These instructions apply to all website planning, design, implementation, revision, and quality-control work in this repository.

---

## Stratium Lab Product Governance

Before performing any material product, curriculum, content, UX, design, feature, monetization, or growth work, read:

1. `STRATIUM_PRODUCT_CONSTITUTION.md`
2. `STRATIUM_DECISION_LOG.md`
3. This `AGENTS.md`

`STRATIUM_PRODUCT_CONSTITUTION.md` is the governing source for the target customer, customer problem, product positioning, learning model, payment logic, feature boundaries, validation requirements, and anti-drift rules.

Do not begin implementation when the requested work conflicts with that constitution or depends on an unresolved product assumption. Identify the conflict or assumption first.

Do not silently convert a working hypothesis into a validated decision. Record material decisions and approved amendments in `STRATIUM_DECISION_LOG.md`.

For every material task, state:

- recommended model: Sol, Luna, or Terra;
- intelligence level: Light, Medium, High, Extra High, or Ultra;
- target user;
- user problem;
- intended outcome;
- product stage;
- evidence required;
- out-of-scope items;
- verification method.

When product strategy and implementation convenience conflict, preserve the product strategy unless Eric explicitly approves an amendment.

---

## Core Priorities

When making decisions, follow this order:

1. User requirements
2. User-provided visual references
3. Brand and business context
4. Usability and accessibility
5. Responsive behavior
6. Visual quality and originality
7. Technical correctness
8. Performance and maintainability

Do not sacrifice usability, readability, or brand fit merely to make a page look visually dramatic.

---

## 1. Avoid the “Vibe-Coded” Look

Do not default to the visual language commonly associated with generic AI-generated websites.

### Avoid by default

- Purple, violet, magenta, blue-purple, or rainbow gradients
- Neon cyan and purple combinations
- Futuristic, cyberpunk, “night-tech,” or gamer-like aesthetics
- Large glowing blobs behind the hero section
- Excessive outer glows, text glows, blur fields, or bloom effects
- Black backgrounds combined with neon accents
- Glassmorphism used across every card, navigation bar, and panel
- Overuse of rounded rectangles, pill buttons, and floating cards
- Generic dark SaaS dashboards
- A centered headline, two buttons, three statistics, and a glowing product mockup as the automatic homepage formula
- Generic startup language such as “Build faster,” “Launch smarter,” or “The future is here” unless it is genuinely supported by the brand
- Random decorative grids, dots, stars, code symbols, particles, or abstract tech graphics
- Gradient-filled words used only to make a heading appear “modern”
- Excessively large hero text with weak supporting content
- Template-like sections that could belong to any company
- Repeating the same card design in every section
- Over-animation or constant motion
- Visual effects that distract from the product, service, information, or business

Purple or futuristic styling may only be used when the user explicitly requests it or when it is clearly required by a supplied brand system or reference.

### Required alternative

Choose a visual direction that is specific to the project. It may be editorial, architectural, industrial, minimal, luxury, playful, academic, warm, technical, or another appropriate direction—but it must be deliberate and connected to the subject.

Every major design decision should have a reason.

---

## 2. Follow User-Provided Design References

When the user provides websites, screenshots, mockups, mood boards, or design examples, treat them as primary design evidence.

### Before implementation

Analyze the references for:

- Overall visual mood
- Layout structure
- Content density
- Grid and alignment
- Typography
- Font proportions
- Spacing rhythm
- Color balance
- Image treatment
- Navigation behavior
- Border radius
- Button styling
- Section transitions
- Use of whitespace
- Motion and interaction style
- Mobile behavior, when visible

### During implementation

- Reproduce the underlying design principles, not merely isolated colors or effects.
- Preserve the user’s requested content and brand identity.
- Do not introduce an unrelated design trend.
- Do not convert a restrained reference into a neon, gradient-heavy, futuristic version.
- Do not copy proprietary wording, logos, illustrations, or protected assets.
- Where multiple references are provided, identify their shared characteristics and form one coherent system.
- If a requested feature conflicts with the references, preserve function while adapting it to the reference style.

The final website should make it obvious that the references were studied carefully.

---

## 3. Typography Must Be Beautiful and Intentional

Typography is a primary design element, not an afterthought.

### Requirements

- Use a high-quality, legible font appropriate to the brand and subject.
- Avoid defaulting to the same generic tech font for every project.
- Select fonts based on the desired tone: editorial, premium, industrial, human, institutional, modern, or technical.
- Use no more than two font families unless the design clearly requires more.
- Establish a complete type scale for:
  - Display headings
  - Section headings
  - Subheadings
  - Body text
  - Labels
  - Captions
  - Buttons
- Use intentional font weights rather than relying only on bold and regular.
- Maintain comfortable line height and readable line length.
- Avoid body text that is too small, too light, too wide, or too low-contrast.
- Avoid excessive letter spacing in normal text.
- Use responsive typography so headings do not overwhelm smaller screens.
- Prevent awkward single-word wrapping and widows where practical.
- Use system fallbacks that preserve the intended character.
- Load only the font files and weights actually needed.

### Typography quality test

The page should still look polished if all decorative effects are removed. If it does not, improve the typography and layout before adding decoration.

---

## 4. Build a Coherent Visual System

Create a visual system before styling individual sections.

Define and use:

- Color tokens
- Text colors
- Background colors
- Border colors
- Spacing scale
- Type scale
- Container widths
- Grid behavior
- Border radii
- Shadows
- Button variants
- Form styles
- Image ratios
- Motion duration and easing
- Breakpoints

Do not style each section independently without shared rules.

### Color

- Use a restrained palette appropriate to the brand.
- Prefer strong neutral foundations with purposeful accent colors.
- Ensure sufficient contrast.
- Do not add gradients simply because the page feels empty.
- Do not use multiple competing accent colors.
- Do not assume dark mode is the correct default.
- Avoid pure black and pure white everywhere when softer tones would create a more refined result.
- Use color to establish hierarchy, not to decorate every element.

### Spacing

- Use consistent spacing tokens.
- Create rhythm through repeated vertical intervals.
- Give important content sufficient breathing room.
- Avoid both cramped layouts and oversized empty sections.
- Do not use enormous padding to simulate premium design.
- Align related elements precisely.

### Borders, radius, and shadows

- Use border radius according to the brand, not as an automatic default.
- Avoid making every element a rounded card.
- Use shadows sparingly.
- Prefer subtle borders, contrast, spacing, and layering over exaggerated shadows.
- Do not apply glass effects unless they have a clear functional or visual purpose.

---

## 5. Avoid Generic Layout Formulas

Do not automatically build every homepage as:

1. Floating pill navigation
2. Centered hero headline
3. Two call-to-action buttons
4. Three numerical metrics
5. Large glowing dashboard image
6. Repeated three-column feature cards
7. Testimonial cards
8. Final gradient call-to-action block

A familiar structure is acceptable only when it genuinely fits the content.

### Required approach

- Begin with the information hierarchy.
- Identify the most important user action.
- Choose section order based on the visitor’s questions.
- Vary composition where appropriate.
- Use asymmetry, editorial layouts, full-width imagery, restrained grids, or other structures when they better serve the project.
- Create meaningful visual transitions between sections.
- Ensure each section adds new information.
- Remove filler sections and decorative statistics.
- Avoid generic copy and placeholder marketing claims.

The page should feel authored for this specific business, product, person, or institution.

---

## 6. Components Must Feel Designed, Not Generated

### Navigation

- Keep navigation clear and easy to scan.
- Use a conventional, reliable mobile navigation pattern.
- Do not make the navigation a floating glass pill unless the reference or brand specifically supports it.
- Ensure active, hover, focus, and mobile states are complete.
- Keep important calls to action visible without making them visually aggressive.

### Buttons

- Use a small, consistent set of button styles.
- Make labels specific and action-oriented.
- Provide hover, active, focus, disabled, and loading states when relevant.
- Maintain accessible touch-target sizes.
- Avoid unnecessary arrows, sparkles, gradients, and glow effects.

### Cards

- Do not place every piece of content inside a card.
- Use cards only when grouping, comparison, or interaction requires them.
- Vary layout through typography, dividers, whitespace, imagery, and grid structure instead of adding more containers.
- Keep card styles consistent and restrained.

### Forms

- Use persistent labels where possible.
- Provide clear validation, error, success, disabled, and focus states.
- Make forms easy to complete on mobile.
- Use correct input types and autocomplete attributes.
- Do not rely on placeholder text as the only label.

### Images and media

- Use imagery that supports the subject and brand.
- Avoid generic AI-looking illustrations unless the user requests them.
- Preserve correct aspect ratios.
- Use responsive image sizing and modern formats where possible.
- Add meaningful alternative text.
- Avoid decorative media that significantly harms performance.

---

## 7. Responsive Design Is Mandatory

The website must be intentionally optimized for:

- Small mobile phones
- Large mobile phones
- Tablets
- iPads in portrait orientation
- iPads in landscape orientation
- Laptops
- Standard desktop monitors
- Large desktop screens

Responsive design is not complete when desktop elements are merely stacked vertically.

### Minimum responsive checks

Test representative viewport widths around:

- 320–375 px
- 390–430 px
- 768 px
- 820–834 px
- 1024 px
- 1280 px
- 1440 px and above

Use the project’s actual breakpoints where appropriate; do not add arbitrary breakpoints without need.

### Required responsive behavior

- No unintended horizontal scrolling
- No clipped content
- No overlapping text, media, navigation, or controls
- No unreadably small text
- No giant headings that dominate the viewport
- No buttons that are too small to tap
- No navigation that becomes crowded
- No card grids compressed beyond readability
- No images stretched or distorted
- No fixed-height sections that break when text wraps
- No desktop-only hover interaction required for essential information
- No content hidden merely to make the mobile layout easier
- Correct spacing for touch devices
- Safe-area awareness where relevant
- Functional keyboard, touch, pointer, and screen-reader interaction

Tablet layouts must be designed deliberately. Do not treat an iPad as either a large phone or a small desktop without checking the result.

---

## 8. Accessibility Is Part of Design Quality

Meet WCAG 2.2 AA principles where practical.

### Requirements

- Semantic HTML
- Logical heading hierarchy
- Keyboard-accessible navigation and controls
- Visible focus indicators
- Sufficient color contrast
- Text alternatives for meaningful images
- Proper labels for form inputs
- Accessible error messages
- Reduced-motion support
- No essential information conveyed by color alone
- Correct button and link semantics
- Descriptive link labels
- Skip link where appropriate
- Accessible modal, menu, tab, accordion, and carousel behavior
- Sensible reading and focus order

Do not remove focus outlines without replacing them with an equally visible alternative.

---

## 9. Motion Must Be Restrained

Use motion to explain hierarchy, state, or interaction—not to make the page feel artificially impressive.

### Motion rules

- Prefer subtle transitions.
- Keep durations short and consistent.
- Avoid continuous floating, pulsing, glowing, rotating, or particle effects.
- Avoid animating every element on scroll.
- Do not delay access to content for entrance animations.
- Respect `prefers-reduced-motion`.
- Ensure animations do not reduce performance or cause layout shift.
- Avoid parallax unless the user requests it and it works well on touch devices.

A static page with excellent typography and composition is better than a mediocre page covered in animation.

---

## 10. Technical and Performance Standards

- Follow the existing framework, architecture, and coding conventions.
- Reuse existing components when appropriate, but do not preserve poor visual patterns merely because they already exist.
- Keep components focused and maintainable.
- Avoid unnecessary dependencies.
- Use design tokens or shared variables instead of repeated magic values.
- Optimize images and media.
- Lazy-load non-critical media.
- Prevent avoidable cumulative layout shift.
- Minimize render-blocking resources.
- Use responsive images where appropriate.
- Keep JavaScript out of purely presentational behavior when CSS is sufficient.
- Do not introduce console errors or warnings.
- Do not leave broken links, placeholder assets, lorem ipsum, or unfinished states.
- Do not expose secrets or private configuration.
- Preserve existing functionality unless the user requests a change.

---

## 11. Required Work Process

### Step 1: Understand

Before writing code:

- Read the user’s request carefully.
- Inspect the existing repository structure.
- Identify the framework and styling approach.
- Review existing brand assets and content.
- Study every design reference provided.
- Identify functional requirements and responsive risks.
- Clarify only when ambiguity materially affects the result.

### Step 2: Establish direction

Define:

- Visual concept
- Content hierarchy
- Layout system
- Typography
- Color system
- Component rules
- Responsive strategy
- Accessibility considerations

Do not begin by randomly styling components.

### Step 3: Implement

- Build the structure first.
- Apply the visual system consistently.
- Use real content whenever available.
- Complete all important component states.
- Implement responsive behavior during development, not afterward.
- Match the references throughout the process.

### Step 4: Verify

After implementation, inspect and test the work.

Run all relevant commands available in the repository, such as:

- Formatter
- Linter
- Type checker
- Unit tests
- Integration tests
- Production build

Do not claim a check passed unless it was actually run.

### Step 5: Perform visual QA

Inspect the rendered website, not only the source code.

Check:

- Desktop layout
- Mobile layout
- Tablet and iPad layouts
- Typography and wrapping
- Alignment
- Spacing consistency
- Color contrast
- Navigation
- Buttons and links
- Forms
- Images
- Overflow
- Empty states
- Loading states
- Error states
- Hover, focus, active, and disabled states
- Reduced-motion behavior
- Long content and short content
- Realistic data variation

Use screenshots, browser tools, or available preview tools when possible.

### Step 6: Correct problems

Fix issues discovered during testing. Do not stop at identifying them.

Repeat implementation and verification until the result is stable and polished.

---

## 12. Final Self-Review Checklist

Before considering the task complete, confirm all of the following:

### Visual identity

- [ ] The website does not look like a generic AI-generated template.
- [ ] It does not default to purple gradients, neon glows, or cyberpunk styling.
- [ ] The design suits the project’s actual brand and audience.
- [ ] User-provided references clearly influenced the result.
- [ ] The page has a coherent visual system.
- [ ] Typography is polished and appropriate.
- [ ] The design remains strong without decorative effects.
- [ ] The layout does not rely on repetitive cards or generic SaaS sections.

### Content and usability

- [ ] The information hierarchy is clear.
- [ ] The main call to action is easy to understand.
- [ ] Copy is specific rather than generic.
- [ ] Navigation is clear.
- [ ] Forms and controls are easy to use.
- [ ] There is no filler content, lorem ipsum, or unsupported marketing claim.

### Responsive behavior

- [ ] Small mobile layouts were checked.
- [ ] Large mobile layouts were checked.
- [ ] Tablet and iPad portrait layouts were checked.
- [ ] Tablet and iPad landscape layouts were checked.
- [ ] Desktop layouts were checked.
- [ ] There is no unintended horizontal overflow.
- [ ] Text, images, controls, and navigation adapt correctly.

### Accessibility and interaction

- [ ] Keyboard navigation works.
- [ ] Focus states are visible.
- [ ] Contrast is sufficient.
- [ ] Semantic structure is correct.
- [ ] Motion respects reduced-motion preferences.
- [ ] Essential interactions work without hover.

### Technical quality

- [ ] Formatting was checked.
- [ ] Linting was run when available.
- [ ] Type checking was run when available.
- [ ] Tests were run when available.
- [ ] A production build was run when available.
- [ ] No new console errors or warnings remain.
- [ ] No broken links, missing assets, or unfinished states remain.
- [ ] The rendered result was visually inspected after the final change.

---

## 13. Completion Report

When reporting completion:

- Briefly state what was implemented.
- Mention the major design direction.
- List the viewport categories checked.
- State which validation commands were actually run.
- Report any remaining limitation honestly.
- Do not say the result is “pixel-perfect,” “fully tested,” or “production-ready” unless the evidence supports that claim.

The work is complete only when it is visually deliberate, responsive, accessible, technically sound, and verified.
