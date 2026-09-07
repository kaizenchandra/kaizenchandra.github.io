# Portfolio validation

Validation date: 7 September 2026. Browser: installed Google Chrome, isolated sessions through chrome-devtools CLI. Temporary validation tools are external to the website; no npm dependency or runtime is required by the site.

## Content and structural checks

`python3 validation/validate.py` passes. Checks cover a single H1 per page, heading progression, unique IDs, local files and anchor targets, nonempty links, image alternatives and aspect ratios, SVG/XML parsing, JSON-LD, manifest icon existence, social PNG existence, and key supplied profile facts. JavaScript syntax checks (`node --check` for both scripts) pass.

The five employers, supplied titles and date ranges, client relationships, education, email, and telephone values were reviewed against the supplied brief. Metrics remain attributed to their relevant employers. All project and architecture showcase entries are explicitly marked placeholders; no repositories, GenAI production results, or professional accomplishments were invented.

## Responsive browser matrix

The page was measured at each viewport below; document scroll width equals viewport width, with no accidental horizontal overflow. Final results are recorded in `responsive.json`.

| Viewport    | Overflow |
| ----------- | -------- |
| 320 × 568   | None     |
| 360 × 800   | None     |
| 375 × 667   | None     |
| 390 × 844   | None     |
| 430 × 932   | None     |
| 768 × 1024  | None     |
| 1024 × 768  | None     |
| 1280 × 800  | None     |
| 1440 × 900  | None     |
| 1920 × 1080 | None     |

Desktop/mobile screenshots were captured and visually inspected for typography, header, hero, CTAs, expertise, career timeline, architecture, GenAI, contact, education, and project templates. Screenshots are in this directory. Diagrams preserve their aspect ratios; SVG sources include text alternatives. At the narrowest width, diagrams are compact and can be enlarged using normal browser zoom.

## JavaScript and progressive enhancement

- System light/dark styling, manual theme switch, accessible action label, stored preference, and preference restoration after reload verified.
- Simulated blocked localStorage: the theme still changes without an uncaught error.
- Mobile menu expands/collapses, Escape restores focus to its button, and choosing a section closes it and focuses the destination.
- Native skip-to-content verified with Tab/Enter: focus lands on `main` through its `tabindex="-1"`. Back-to-top verified after smooth scrolling settles: `scrollY` is 0.
- Scroll spy identifies visited sections, including Experience and Contact.
- Email copy returned the successful live-region confirmation on localhost. Denied clipboard access has a guarded manual-copy message; denial was reviewed in code, not forced through a browser permission dialog.
- A temporary copy of the actual page with all scripts removed was loaded at 320px: 9 sections, 5 roles, visible navigation, hidden enhancement-only controls, and no overflow. This tests script-free markup; it is not a claim that browser JavaScript preferences were toggled.
- Direct `file://.../index.html` loading verified: content, stylesheet, and enhancements initialize.
- Resume availability page loaded successfully and explains that the genuine PDF has not been supplied.
- No JavaScript console errors observed. Chrome emitted a lazy-image dimension advisory despite explicit matching HTML width/height and SVG intrinsic dimensions; the structural checks confirm those dimensions. It did not affect the best-practices score.

## Accessibility, SEO, and performance

Local Lighthouse mobile reports are retained in `lighthouse/` (light) and `lighthouse-dark/` (dark). Both themes scored **100 Accessibility, 100 Best Practices, and 100 SEO**. The optional agentic-browsing category scored 100 light / 91 dark, reflecting a 0.128 cumulative-layout-shift measurement in that audit. A separate dark-theme initial-load observation recorded no layout-shift entries. Treat layout stability as something to recheck on the final deployed site rather than a guaranteed result. See the JSON/HTML reports for details. The audit tool does not measure a Performance score. These are local automated results, not a WCAG certification or a guarantee about a future deployment.

Issues corrected during validation: the visible CV home-link label is now included in its accessible name, and muted text has been darkened to meet contrast on secondary light surfaces. Focus styling, semantic controls, skip navigation, headings, alt text, and reduced-motion CSS were reviewed. A screen-reader session and real device testing remain recommended; they were not performed.

Metadata, JSON-LD, robots, sitemap, manifest, favicon, and a 1200 × 630 social PNG exist. Publication URLs intentionally remain marked placeholders. A high SEO audit score does not mean those publication settings are configured. Sitemap URL and 404 home destination must be personalized.

No frameworks, remote fonts, third-party scripts, or analytics are requested. Local assets loaded successfully. Below-fold images are lazy-loaded, all images have intrinsic dimensions, and only the very small theme restoration script blocks initial parsing. Performance 95+ remains an engineering target, not a measured result.

## Deployment and browser coverage

The actual site was loaded under `http://127.0.0.1:8081/github-portfolio/` to validate repository-subpath asset resolution. Assets returned HTTP 200. Root loading, direct-file loading, and the resume availability page were also exercised. The 404 page is self-styled so nested missing URLs cannot break its appearance; its absolute home URL requires final configuration.

The Pages workflow follows GitHub's documented current action versions with separate read-only packaging and privileged deployment jobs. It stages only public site files. No remote repository was created, no commit/push was made, and the workflow has not been executed on GitHub.

Chrome was actually tested. Edge (Chromium), Firefox, and Safari behavior was reasoned from supported standard APIs and fallback paths; those browsers and physical mobile devices were not run. Reduced motion was inspected in CSS rather than tested through an OS preference switch.

## Remaining publication content

- Genuine resume PDF at `resume/chandrashekhar-vishwakarma-resume.pdf`, followed by CTA updates.
- Verified featured repositories and shareable architecture artifacts.
- Final canonical/domain/repository URL in HTML, JSON-LD, sitemap, robots, and 404.
- Optional real profile image; the supplied initials graphic is a complete default.

The SVG and PNG Open Graph artwork are complete. All configuration steps are documented in the root README.
