# Architecture portfolio redesign

## Baseline inventory

The original source is Git revision `aa5495f`. The baseline was built before editing in both production and
draft-preview modes. The production artifact passed the existing structural validator.

| Content                            | Original source and inventory                                                                                                                                       | Destination                                                                                    |
|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Featured project and full gallery  | `index.html#projects`, eight cards with eight distinct titles, one featured                                                                                         | `/#projects`, individually addressable cards                                                   |
| Case studies                       | `content/portfolio.json` and five files under `content/cases/`                                                                                                      | Existing five `/projects/<slug>/` routes plus four evidence-based detail routes                |
| Work experience                    | `index.html#experience`, five employers and 18 responsibility/achievement bullets                                                                                   | `/#experience`, all five dated entries with complete responsibilities                          |
| Professional identity and About    | `index.html#home`, three impact indicators, and `#about` with an introduction and three specializations                                                             | `/#home` and `/#about`                                                                         |
| Technical skills                   | `index.html#expertise`, eight source categories, with the entries inventoried verbatim below                                                                        | `/#expertise`                                                                                  |
| Education                          | `index.html#education`, MCA at SIRT Bhopal, RGPV, 2015–2017                                                                                                         | `/#education`                                                                                  |
| Certifications and recommendations | `content/portfolio.json`, both collections empty                                                                                                                    | Existing conditional build output on the homepage                                              |
| Reference architecture             | `index.html#architecture`, four design notes and the solution architecture SVG. `#genai` was a legacy anchor and the GenAI SVG was a shipped asset                  | Both original anchors and diagrams, with an expanded architecture explorer at `/architecture/` |
| Lab                                | `lab/index.html` and `assets/js/lab.js`, idempotency and backoff examples plus portfolio terminal                                                                   | `/lab/` and original sample anchors                                                            |
| Writing                            | `index.html` external Medium blog, `/blog/`, and one draft in `content/posts/`                                                                                      | Homepage writing links, `/blog/`, and preview-only `/blog/idempotent-event-consumers/`         |
| Contact                            | `index.html#contact`, email and clipboard action, two phone numbers, GitHub, LinkedIn, configurable form with email fallback                                        | `/#contact`                                                                                    |
| Résumé                             | `resume/index.html`, local PDF and Google Docs link                                                                                                                 | Same routes, asset, and links                                                                  |
| Visual assets                      | `assets/images/` portrait and placeholder, favicon, social PNG and SVG, two architecture SVGs. Root `profile.jpeg` is a tracked legacy asset outside the built site | Existing asset paths and homepage portrait retained                                            |
| GitHub activity                    | `assets/js/interactive.js`, public commits API and `assets/data/github-activity.json` fallback                                                                      | Homepage engineering resources                                                                 |
| SEO and delivery                   | `robots.txt`, metadata and JSON-LD, manifest, generated sitemap, GitHub Pages workflow, `404.html`                                                                  | Same supporting endpoints and workflow                                                         |

### Projects and case study destinations

| Original card in `index.html#projects`          | Existing case source                                          | Card and detail destination                                                   |
|-------------------------------------------------|---------------------------------------------------------------|-------------------------------------------------------------------------------|
| Distributed Video Platform                      | `content/cases/distributed-video.md`                          | `/#project-distributed-video`, `/projects/distributed-video/`                 |
| Document Post Batch Processing                  | `content/cases/document-processing.md`                        | `/#project-document-processing`, `/projects/document-processing/`             |
| Industrial Asset Hub                            | `content/cases/industrial-platforms.md` (shared Siemens case) | `/#project-industrial-asset-hub`, `/projects/industrial-asset-hub/`           |
| I&C Monitors and Advisors (ICMA)                | `content/cases/industrial-platforms.md` (shared Siemens case) | `/#project-icma`, `/projects/icma/`                                           |
| Omnivise Asset Management                       | `content/cases/industrial-platforms.md` (shared Siemens case) | `/#project-omnivise`, `/projects/omnivise/`                                   |
| IFC Applications - IPortal, IDesk, IBIS         | `content/cases/ifc-modernization.md`                          | `/#project-ifc-modernization`, `/projects/ifc-modernization/`                 |
| Application Modernization & Feature Development | Homepage project card                                         | `/#project-application-modernization`, `/projects/application-modernization/` |
| Asynchronous reporting at scale                 | `content/cases/reporting-at-scale.md`                         | `/#project-reporting-at-scale`, `/projects/reporting-at-scale/`               |

The three Siemens cards and the application modernization card require **four** new per-project detail routes. The
shared Siemens case remains a separate, stable route. The reporting card attributed the project to Apple Political,
while the case study attributed it to Stafftravel Voyage. The baseline provides no basis for correcting either
attribution.

### Employment inventory

All entries originate in `index.html#experience`.

| Employer | Role | Dates | Location | Responsibilities | Destination |
| --- | --- | --- | --- | --- | ---: | --- |
| Publicis Sapient | Manager Technology | Feb 2026–Present | Bengaluru, India | 5 | `/#role-publicis-sapient` |
| HTC Global Services | Technical Lead | Jul 2024–Nov 2025 | Chennai, India | 4 | `/#role-htc` |
| Siemens | Senior Software Development Engineer | Sep 2020–Jun 2024 | Gurugram, India | 4 | `/#role-siemens` |
| Cyber Infrastructure (CIS) | Senior Software Engineer | Aug 2018–Jul 2020 | Indore, India | 2 | `/#role-cis` |
| STC | Software Engineer | Jun 2015–Jul 2018 | Pune, India | 3 | `/#role-stc` |

### Existing URLs

The production baseline contains 10 HTML endpoints. Nine are indexable through the sitemap. The 404 page remains
excluded. The draft preview contains one additional noindex article. Original endpoints are `/`, `/404.html`,
`/resume/`, `/lab/`, `/blog/`, `/projects/distributed-video/`, `/projects/document-processing/`,
`/projects/industrial-platforms/`, `/projects/ifc-modernization/`, and `/projects/reporting-at-scale/`. The PDF remains
downloadable at `/resume/chandrashekhar-vishwakarma.pdf`.

| External destination                                   | Original and planned location                         |
|--------------------------------------------------------|-------------------------------------------------------|
| GitHub profile and portfolio repository                | Homepage contact, hero, and engineering resources     |
| LinkedIn profile                                       | Homepage contact and hero                             |
| Medium blog                                            | Homepage engineering resources and writing navigation |
| Portfolio deployment                                   | GitHub activity card and 404 recovery                 |
| YouTube video `PHsLPhX6vN4`                            | Distributed Video Platform reference                  |
| Siemens Industrial Asset Hub product page              | Industrial Asset Hub card and project details         |
| Siemens Energy Instrumentation & Controls product page | ICMA card and project details                         |
| Siemens Energy Omnivise Asset Management product page  | Omnivise card and project details                     |
| Stafftravel Voyage `/homenew`                          | Application modernization card and project details    |
| Google Docs résumé                                     | Résumé page                                           |
| Email and two telephone links                          | Homepage contact                                      |
| GitHub commits API                                     | On-demand GitHub activity integration                 |

### Original technical skills

- **Languages & frameworks** — Java 17/21, Go, Spring Boot, Spring Framework, Spring Cloud, Spring Security, Spring
  WebFlux, Spring Data JPA, Spring Batch, Hibernate ORM, Python, Scala, Kotlin, Node.js, React, Angular
- **System design & architecture** — Microservices, event-driven architecture, cloud-native architecture, domain-driven
  design, Clean Architecture, SOLID, API-first design, design patterns, high availability, scalability, resiliency
- **Messaging, integration & APIs** — Apache Kafka, Kafka Streams, Flink, RabbitMQ, Google Cloud Pub/Sub, Schema
  Registry, CDC, event ordering, schema evolution, REST APIs, gRPC, GraphQL, WebSockets, SSE
- **Cloud & platform engineering** — AWS EKS, ECS/Fargate, Lambda, S3, SQS, SNS, RDS, DynamoDB, API Gateway, CloudWatch.
  Google Cloud (GCP) with Cloud Storage and Pub/Sub. Docker, Kubernetes, Helm, Terraform
- **Databases & caching** — PostgreSQL, Oracle, Redis, MongoDB, Cassandra, Couchbase, InfluxDB, SQL optimization,
  distributed caching, transactions, data consistency, partitioning, sharding, replication
- **Reliability, security & observability** — Idempotency, circuit breakers, retries with exponential backoff,
  transactional outbox, saga, OAuth 2.0, OpenID Connect (OIDC), JWT, mTLS, OpenTelemetry, Prometheus, Grafana, Datadog,
  New Relic, Splunk
- **Testing & DevOps** — JUnit 5, Mockito, Testcontainers, REST Assured, Git, CI/CD, GitHub Actions, GitLab CI, Azure
  Pipelines, SonarQube
- **Engineering leadership** — Technical design, architecture decision records (ADRs), code reviews, production
  troubleshooting, technical risk management, engineering mentorship, cross-functional collaboration

## Repository assessment

The portfolio uses static HTML, CSS, and vanilla JavaScript. The Python build uses MarkdownIt and Pygments to render
article and case-study routes. GitHub Actions validates the built artifact and publishes it to GitHub Pages. The
redesign uses the same build, dependency pins, and deployment workflow.

The original site already had a configurable contact form, a searchable gallery and skills list, an executable lab, a
résumé page, and a lazy-loaded GitHub activity chart. Architecture lived under a collapsed section inside Projects. The
homepage had no system illustration or direct paths from the eight project cards to the five published case studies. The
theme control toggled between two explicit modes and offered no way to return to System after an override.

## Content reconciliation

| Content                                         |                           Original |       Redesigned | Status |
|-------------------------------------------------|-----------------------------------:|-----------------:|--------|
| Homepage projects                               |                                  8 |                8 | Pass   |
| Featured homepage projects                      |                                  1 |                1 | Pass   |
| Case-study routes                               |                                  5 |                9 | Pass   |
| Employment entries                              |                                  5 |                5 | Pass   |
| Verbatim responsibility and achievement bullets |                                 18 |               18 | Pass   |
| About Me body                                   | Introduction and 3 specializations | Exact HTML match | Pass   |
| Hero career indicators                          |                                  3 |                3 | Pass   |
| Technical skills                                |     8 categories, 101 listed items | Exact list match | Pass   |
| Certifications                                  |                                  0 |                0 | Pass   |
| Education                                       |                                  1 |                1 | Pass   |
| Production HTML endpoints including 404         |                                 10 |               15 | Pass   |
| Existing absolute anchor destinations           |                          14 unique |  All 14 retained | Pass   |
| Architecture design notes                       |                                  4 |                4 | Pass   |
| Original architecture assets                    |                                  2 |                2 | Pass   |
| Draft article                                   |                     1 preview-only |   1 preview-only | Pass   |

The route, original anchor ID, and outbound link comparison ran on two built artifacts. All original employer names,
roles, dates, locations, engagements, and responsibility lists matched. The About Me and Education sections matched byte
for byte at the markup level. The five original case bodies remain complete, with additional evidence-based sections.
Shipped image assets, the résumé PDF, and the GitHub snapshot matched byte for byte. The lab fragment and draft article
content also matched.

The application modernization project description received a grammar edit that preserves the business requirements,
technical implementation, delivery estimates, and client satisfaction figure. The original numerical career indicators
remain. The reporting client discrepancy is visible on both the gallery card and the case page.

## UI and architecture

- A sticky app bar, responsive navigation panel, and skip link connect the homepage’s main sections. Secondary pages
  share a compact app bar. The hero pairs the existing illustrated portrait and employment identity with project and
  architecture CTAs and direct profile and PDF links.
- Material Design 3 influences include semantic tonal palettes, elevated surfaces, filled and tonal buttons, chips, and
  visible focus. The site keeps the existing system font stack. A native selector offers Light, Dark, and System,
  persists the preference, and follows OS preference changes in System. Both the lab editor and the article code blocks
  use theme tokens.
- About Me pairs the original narrative with three original capability callouts. Technical expertise keeps every skill
  category, gives Cloud and Platform Engineering its own tonal surface, and links to the Kubernetes runtime view.
- A bento gallery provides all eight projects by default, with category filters, text search, result counts, and reset.
  Each card links to its own case page. The case layout adds an outline, documented technologies, public references
  where available, related roles, and design decisions where the evidence supports them.
- The complete career timeline keeps all details in native disclosures and adds verified engineering-area tags and
  related case links. Education, blog, lab, GitHub activity, résumé, contact form, email, and telephone links remain
  accessible.
- The architecture explorer provides five URL-addressable views with keyboard tabs, labeled directional flows, notes, a
  legend, and a native dialog. The static view links work with scripts blocked. The homepage exposes two retained SVG
  learning references and a new conceptual topology.

| Architecture view         | Illustrations and design questions                                                                                                              | Evidence                                                     |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| System context            | Shopper and order platform, payment provider, notification provider, network boundaries and availability                                        | Conceptual                                                   |
| Microservices and data    | REST entry path, bounded ownership, separate writes, asynchronous service handoffs, data consistency and the read cache                         | Conceptual                                                   |
| Event flow                | Order transaction and outbox relay, partition ordering, at-least-once delivery, independent payment and notification handling, retry and replay | Conceptual                                                   |
| Kubernetes and cloud      | Load balancer, ingress, Services, Pods, registry, private data services, telemetry, rollout and scaling                                         | Conceptual                                                   |
| Delivery and IaC          | Separate Docker and Helm application delivery and Terraform infrastructure provision paths, with CI/CD gates and environment promotion          | Conceptual                                                   |
| CNA document processing   | SmartCOMM, documented integration boundaries, and SFTP delivery. The caption records Cloud Storage and Cloud Pub/Sub                            | Implemented, as recorded in the portfolio case documentation |
| Asynchronous reporting    | Report work, Java and Spring Boot processing, and JasperReports                                                                                 | Implemented, as recorded in the portfolio case documentation |
| Hybrid cloud-edge preview | High-level edge and cloud relationship on the gallery’s featured card                                                                           | Conceptual                                                   |

## Changed files

| Path                                                                                                                                       | Change                                                                                                                |
|--------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `index.html`                                                                                                                               | Architecture-led homepage, content order, gallery and timeline links, platform and contact presentation               |
| `assets/css/styles.css`                                                                                                                    | Shared semantic tokens, navigation behavior, surface styling, and removal of unused styles                            |
| `assets/css/interactive.css`                                                                                                               | Themed form and code styles, retained lab and activity styles, and reduced motion code                                |
| `assets/css/portfolio.css`                                                                                                                 | Hero topology, responsive grids and case layouts, shared controls, diagram and explorer visuals                       |
| `assets/js/theme.js`                                                                                                                       | Pre-paint preference restore, three-way theme control, OS and storage synchronization                                 |
| `assets/js/main.js`                                                                                                                        | Responsive navigation focus, dismissal, and measured sticky-header offset                                             |
| `assets/js/interactive.js`                                                                                                                 | Search and filter reset, preserved activity and contact behavior, and removal of pointer-tilt and entrance animations |
| `assets/js/architecture.js`                                                                                                                | Hash-aware keyboard tabs and native diagram dialog                                                                    |
| `scripts/build.py`                                                                                                                         | Architecture route and sitemap entry, case template, and shared presentation for generated routes                     |
| `scripts/architecture.py`                                                                                                                  | Static semantic flow-and-view rendering                                                                               |
| `content/architecture.json`                                                                                                                | Five conceptual reference views and technical source links                                                            |
| `content/portfolio.json`                                                                                                                   | Case metadata, technology tags, evidence, related work, and two documented implementation diagrams                    |
| `content/cases/distributed-video.md`, `document-processing.md`, `ifc-modernization.md`, `industrial-platforms.md`, `reporting-at-scale.md` | Original case bodies with additional documented design scope, links, or attribution context                           |
| `content/cases/application-modernization.md`, `industrial-asset-hub.md`, `icma.md`, `omnivise.md`                                          | Four project detail routes based on the original gallery and case content                                             |
| `resume/index.html`, `404.html`                                                                                                            | Shared theme behavior and updated layout with original destinations                                                   |
| `site.webmanifest`                                                                                                                         | Browser and manifest colors aligned with the design tokens                                                            |
| `README.md`, `validation/ARCHITECTURE-REDESIGN.md`                                                                                         | Content editing workflow, original inventory, reconciliation, and verification                                        |

## Verification

| Check                             | Method                                                                                                                                                                                               | Result                                                                                                                                                                                    |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Content and route coverage        | Compare production artifacts from baseline and working tree, and compare both draft previews                                                                                                         | Pass. See the inventories and reconciliation above                                                                                                                                        |
| Production build                  | `python scripts/build.py` with the pinned requirements and no delivery endpoint                                                                                                                      | Pass. 15 HTML endpoints                                                                                                                                                                   |
| Preview build                     | `python scripts/build.py --drafts --preview`                                                                                                                                                         | Pass. 16 HTML endpoints, including the noindex draft                                                                                                                                      |
| Structural route and asset checks | `python3 validation/validate.py` on both artifacts                                                                                                                                                   | Pass. Local routes and fragments, headings, image dimensions and alternatives, SVG/XML, manifest, JSON-LD, PDF and sitemap                                                                |
| JavaScript and Python syntax      | `node --check` for each script in `assets/js/`, and `python3 -m py_compile scripts/architecture.py scripts/build.py scripts/preview.py validation/validate.py`                                       | Pass                                                                                                                                                                                      |
| Type check and lint               | Repository configuration review                                                                                                                                                                      | No configured type checker or linter                                                                                                                                                      |
| Theme                             | Chrome media emulation and preference change across home, explorer, résumé, 404, lab, and case study pages                                                                                           | Pass. Explicit preference persisted and System followed changes                                                                                                                           |
| Responsive layout                 | 104 Chrome viewport/theme checks across all preview endpoints and four explorer deep links. Sizes ranged from 320px to 1920px. Four representative pages were also checked at 200% default font size | Pass. No document-level horizontal overflow in the checked states                                                                                                                         |
| Visual review                     | Chrome screenshots of the homepage, gallery, case pages, architecture views, diagram dialog, mobile navigation, and lab                                                                              | Reviewed in desktop light and mobile dark, with the diagram dialog also reviewed in mobile light                                                                                          |
| Keyboard accessibility            | Chrome keyboard checks for the skip link, menu focus and Escape, sticky anchor offset, architecture tab selection, and modal focus restoration. Reduced motion was emulated                          | Pass                                                                                                                                                                                      |
| Automated accessibility and SEO   | Chrome Lighthouse navigation audits for the homepage in both themes, the dark Event Flow deep link, and the light Document Processing case                                                           | Accessibility, Best Practices, and SEO scored 100 in all four audits                                                                                                                      |
| Theme contrast                    | WCAG relative luminance calculation for representative semantic text and control/focus pairs in both themes                                                                                          | See measured ratios below                                                                                                                                                                 |
| Project and career interactions   | Chrome checks for initial all-projects state, category and query combinations, empty results and reset, and all five responsibility disclosures                                                      | Pass                                                                                                                                                                                      |
| Architecture fallback             | Chrome with scripts blocked at 320px, using deep links to select the static diagrams                                                                                                                 | Pass. The original core content and contact links also remained accessible                                                                                                                |
| Contact                           | Chrome validation and rejection/acceptance against the local fixture, plus the no-endpoint production UI                                                                                             | Pass. Email draft was offered in production mode                                                                                                                                          |
| Lab, activity, and résumé         | Executed the idempotency sandbox and terminal, simulated GitHub API rate limiting to exercise the 16-week chart and table fallback, and loaded the PDF in Chrome                                     | Pass                                                                                                                                                                                      |
| Existing external destinations    | Direct HTTPS requests against the 11 original external web URLs                                                                                                                                      | Nine returned HTTP 200, including the GitHub profile/repository and portfolio deployment. Medium and Stafftravel Voyage returned HTTP 403 to the direct requests. Both links are retained |

The representative contrast checks measured a minimum text ratio of **5.50:1** in Light and **7.04:1** in Dark. The
lowest measured control or focus contrast was **3.32:1** in Light and **3.45:1** in Dark. The initial 200% text-size
findings on Home and Résumé passed after layout fixes. Lighthouse reported zero CLS on the corrected Event Flow deep
link, down from 0.16 in the first audit of the redesigned explorer.

### Local performance

Chrome measured three cache-bypassed reloads per build at 390 × 844 in Dark, using Slow 4G emulation and 4× CPU
throttling. The results are local laboratory measurements.

| Homepage metric                           | Baseline median | Redesign median |
|-------------------------------------------|----------------:|----------------:|
| LCP                                       |         1.568 s |         1.640 s |
| Observed layout shift                     |          0.0044 |          0.0056 |
| DOMContentLoaded                          |         1.875 s |         1.882 s |
| Transfer including local response headers |       122,952 B |       147,385 B |
| Requests including document               |               8 |               9 |

The additional homepage content and presentation add 24,433 bytes and one stylesheet request under these conditions.
Median LCP increased by 72 ms and remained below the 2.5 s local target. Field LCP, field CLS, and INP were unavailable.

## Risks and limitations

- The portfolio reports both Apple Political and Stafftravel Voyage in connection with asynchronous reporting. The two
  original attributions are labeled where they occur. Public sources supplied with the repository do not resolve the
  mismatch.
- Private project repositories, deployment manifests, and full ADR records were unavailable. The implemented diagrams
  describe only boundaries recorded in the written case studies. The cloud-native explorer and its Docker, Kubernetes,
  Helm, Terraform, and CI/CD flows are conceptual.
- Medium and Stafftravel Voyage blocked the direct HTTP check. A retrieved copy of Stafftravel Voyage showed content,
  while current availability to all visitors remains unconfirmed. Google Docs responded with HTTP 200 and edit
  permissions were outside the check.
- The form exercise used the local fixture. Production delivery depends on the configured HTTPS endpoint. The
  no-endpoint build offers an email draft.
- WCAG checks used automated audits, contrast calculations, and manual Chrome keyboard and layout checks. Screen
  readers, physical devices, and other browser engines were outside this run.
- The production artifact was built locally. GitHub Actions execution, deployment, and deployed field performance remain
  unverified.
