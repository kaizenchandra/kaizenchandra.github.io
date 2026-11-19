# Chandrashekhar Vishwakarma’s portfolio

Build with Python 3.12 or newer. The deployed site consists of static files.

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r scripts/requirements.txt
python scripts/build.py --drafts --preview
python validation/validate.py
python scripts/preview.py
```

Open `http://127.0.0.1:8052/`. The preview accepts messages locally and sends no email. Use
`unavailable@example.invalid` to exercise a delivery failure. The fixture accepts up to six valid requests per minute
and rate-limits subsequent attempts.

`python scripts/build.py` builds the production artifact in `dist/`. The Pages workflow deploys that directory. Run with
`--drafts` only for editorial previews. The public build lists articles marked with `"draft": false` and excludes draft
pages and sitemap entries. The site renders articles from `content/posts/` and case studies from `content/cases/` using
the metadata in `content/portfolio.json`.

The build inlines `assets/js/theme.js` so the saved Light or Dark preference can be applied before the stylesheets load.
First visits follow the operating-system preference. The icon button saves the next explicit choice.

## Production content and services

- Set the GitHub Actions repository variable `PORTFOLIO_CONTACT_ENDPOINT` to the HTTPS URL of an authorized delivery
  endpoint. The browser sends a JSON POST with `name`, `email`, `message`, and the honeypot `website`. Return a 2xx JSON
  response with `{"accepted":true}` only after accepting the message. Prefer a 4xx response for invalid input and 429
  for rate limiting. Configure CORS for the portfolio origin, validate email and field lengths server-side, reject bots,
  and keep delivery credentials on the server. Builds without the endpoint offer an email draft.
- Add approved peer recommendations or verified certification entries in `content/portfolio.json`. Recommendations take
  `quote`, `name`, and `role`. Certifications take `name`, `issuer`, and an HTTPS verification `url`.
- Update the PDF in `resume/` when the approved resume changes.
- GitHub activity uses public, author-filtered default-branch commits from this portfolio repository. The dated snapshot
  in `assets/data/github-activity.json` is a fallback for unavailable or rate-limited API requests.

## Architecture and project content

- Edit `content/architecture.json` to update the five conceptual views under `/architecture/`. Each flow declares an
  ordered list of nodes and one labeled relationship per adjacent pair. All views render as HTML and work as linked
  sections before JavaScript adds tabs and the diagram dialog.
- Project case metadata lives in `content/portfolio.json`, and case bodies live in `content/cases/`. Existing case URLs
  continue to work for direct visits. The project gallery links to all eight individual case studies. The shared Siemens
  case is linked from Work experience. Published case pages and the architecture explorer are included in the generated
  sitemap.
- The [earlier architecture redesign report](validation/ARCHITECTURE-REDESIGN.md) records the original inventory and
  page mapping.
