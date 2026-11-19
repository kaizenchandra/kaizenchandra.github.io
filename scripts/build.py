"""Build the static Pages artifact from the portfolio and Markdown content."""
import argparse
import html
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET

from markdown_it import MarkdownIt
from markdown_it.token import Token
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name, TextLexer
from pygments.util import ClassNotFound

from architecture import flow, reference_page

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://kaizenchandra.github.io/"
NAME = "Chandrashekhar Vishwakarma"
COVER = SITE + "assets/images/og-cover.png"
MARKER = ".portfolio-build"
THEME_SCRIPT = re.compile(r'<script src="(?:\.\./|/)*assets/js/theme\.js"( data-nav-bootstrap)?></script>')


def highlight_code(code, language, _attrs):
    try:
        lexer = get_lexer_by_name(language)
    except ClassNotFound:
        lexer = TextLexer()
    return highlight(code, lexer, HtmlFormatter(nowrap=True))


MARKDOWN = MarkdownIt("commonmark", {"html": False, "highlight": highlight_code})


def page(title, description, route, depth, content, schema_type, draft=False):
    escape = html.escape
    prefix = "../" * depth
    url = SITE + route
    robots = '<meta name="robots" content="noindex">' if draft else ""
    canonical = "" if draft else f'<link rel="canonical" href="{url}">'
    metadata = {
        "@context": "https://schema.org", "@type": schema_type,
        "name": title, "description": description, "url": url,
        "author": {"@type": "Person", "name": NAME}, "image": COVER,
    }
    if schema_type in {"Article", "BlogPosting"}:
        metadata["headline"] = title
    schema = json.dumps(metadata, ensure_ascii=False).replace("<", "\\u003c")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)} | {NAME}</title>
  <meta name="description" content="{escape(description)}">
  <meta name="theme-color" content="#f8fafc">
  {robots}
  {canonical}
  <meta property="og:type" content="{'article' if schema_type in {'Article', 'BlogPosting'} else 'website'}">
  <meta property="og:title" content="{escape(title)} | {NAME}">
  <meta property="og:description" content="{escape(description)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{COVER}">
  <meta property="og:image:alt" content="{NAME}, Lead Software Engineer and Technology Architect">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="{prefix}assets/images/favicon.svg" type="image/svg+xml">
  <script src="{prefix}assets/js/theme.js"></script>
  <link rel="stylesheet" href="{prefix}assets/css/styles.css">
  <link rel="stylesheet" href="{prefix}assets/css/interactive.css">
  <link rel="stylesheet" href="{prefix}assets/css/portfolio.css">
  <script src="{prefix}assets/js/interactive.js" defer></script>
  <script type="application/ld+json">{schema}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container reading-header">
      <a class="brand" href="{prefix}index.html" aria-label="CV — {NAME}, home">CV</a>
      <nav aria-label="Portfolio">
        <a href="{prefix}index.html#projects">Projects</a>
        <a href="{prefix}architecture/index.html"{' aria-current="page"' if route == 'architecture/' else ''}>Architecture</a>
        <a href="{prefix}blog/index.html"{' aria-current="page"' if route == 'blog/' else ''}>Blog</a>
        <a href="{prefix}lab/index.html"{' aria-current="page"' if route == 'lab/' else ''}>Lab</a>
      </nav>
      <button class="icon-button theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" hidden></button>
    </div>
    <div class="reading-progress" data-reading-progress aria-hidden="true" hidden><span></span></div>
  </header>
  <main id="main" class="container reading-main" tabindex="-1">
{content}
  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <p>{NAME}</p>
      <a class="text-link" href="{prefix}index.html#contact">Contact <span aria-hidden="true">→</span></a>
    </div>
  </footer>
</body>
</html>
"""


def write_page(dest, route, text):
    path = dest / route / "index.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def evidence(data):
    escape = html.escape
    groups = []
    if data["certifications"]:
        cards = []
        for item in data["certifications"]:
            name, issuer, url = (escape(item[field]) for field in ("name", "issuer", "url"))
            if urlsplit(item["url"]).scheme != "https":
                raise ValueError("Certification links must use HTTPS.")
            cards.append(f'<li class="evidence-card"><strong>{name}</strong> · {issuer} <a href="{url}">View credential</a></li>')
        groups.append('<section class="container proof-section"><h2>Certifications</h2><ul>' + "".join(cards) + '</ul></section>')
    if data["recommendations"]:
        cards = []
        for item in data["recommendations"]:
            quote, name, role = (escape(item[field]) for field in ("quote", "name", "role"))
            cards.append(f'<figure class="evidence-card"><blockquote>{quote}</blockquote><figcaption>{name} · {role}</figcaption></figure>')
        groups.append('<section class="container proof-section"><h2>Peer recommendations</h2>' + "".join(cards) + '</section>')
    return "\n".join(groups)


def project_page(item, source):
    escape = html.escape
    tokens = MARKDOWN.parse(source)
    outline = []
    for token, heading in zip(tokens, tokens[1:]):
        if token.type != "heading_open" or token.tag != "h2":
            continue
        identifier = f"section-{len(outline) + 1}"
        token.attrSet("id", identifier)
        outline.append(f'<li><a href="#{identifier}">{escape(heading.content)}</a></li>')
    name = escape(item["title"])
    project = escape(item.get("project", ""))
    back = f"../../index.html#project-{project}" if project else "../../index.html#projects"
    technologies = "".join(f"<li>{escape(technology)}</li>" for technology in item["technologies"])
    links = [
        f'<a class="text-link" href="{escape(link["url"])}">{escape(link["label"])} <span aria-hidden="true">↗</span></a>'
        for link in item.get("links", [])
    ]
    links.append(f'<a class="text-link" href="../../index.html#role-{escape(item["experience"])}">Related work experience</a>')

    diagram = ""
    if model := item.get("diagram"):
        diagram = f"""
        <h2 id="documented-architecture">Documented architecture</h2>
        <figure class="case-diagram">
          <figcaption><span class="evidence-label">Implemented · portfolio documentation</span>
            <p>{escape(model["caption"])}</p>
          </figcaption>
          <div class="flow-canvas">{flow(model)}</div>
        </figure>"""
    if diagram:
        # Place the documented flow after the problem without changing section IDs.
        diagram_at = next((i for i, token in enumerate(tokens) if token.attrGet("id") == "section-2"), len(tokens))
        outline.insert(1, '<li><a href="#documented-architecture">Documented architecture</a></li>')
        tokens.insert(diagram_at, Token("html_block", "", 0, content=diagram))
    body = MARKDOWN.renderer.render(tokens, MARKDOWN.options, {})

    return f"""
    <a class="text-link back-link" href="{back}">← Project gallery</a>
    <header class="article-header case-masthead">
      <p class="eyebrow">{escape(item["organization"])}</p>
      <h1>{name}</h1>
      <p class="lead">{escape(item["description"])}</p>
      <ul class="tags" role="list" aria-label="Documented engineering areas">{technologies}</ul>
      <nav class="case-evidence" aria-label="Evidence and related work">
        {"".join(links)}
      </nav>
    </header>
    <div class="case-layout">
      <aside class="case-sidebar">
        <nav aria-label="Case study sections">
          <p class="case-sidebar-label">On this page</p>
          <ul role="list">{"".join(outline)}</ul>
        </nav>
      </aside>
      <article class="prose case-prose" data-reading-article>
        {body}
      </article>
    </div>"""


def build(dest, drafts, contact_endpoint):
    escape = html.escape
    data = json.loads((ROOT / "content/portfolio.json").read_text(encoding="utf-8"))
    for directory in ("assets", "resume"):
        shutil.copytree(ROOT / directory, dest / directory)
    for filename in ("robots.txt", "site.webmanifest"):
        shutil.copy2(ROOT / filename, dest / filename)
    shutil.copy2(ROOT / "404.html", dest / "404.html")
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    home = home.replace('data-endpoint=""', f'data-endpoint="{escape(contact_endpoint)}"')
    home = home.replace("<!-- Approved evidence -->", evidence(data))
    (dest / "index.html").write_text(home, encoding="utf-8")

    title, description, architecture = reference_page()
    write_page(dest, "architecture/", page(title, description, "architecture/", 1, architecture, "WebPage"))

    routes = ["", "architecture/", "resume/", "lab/", "blog/"]
    for collection, folder, schema_type in (("cases", "projects", "Article"), ("posts", "blog", "BlogPosting")):
        for item in data[collection]:
            draft = item.get("draft", False)
            if draft and not drafts:
                continue
            slug = item["slug"]
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
                raise ValueError(f"Invalid content slug: {slug}")
            route = f"{folder}/{slug}/"
            source = (ROOT / "content" / collection / f"{slug}.md").read_text(encoding="utf-8")
            if collection == "cases":
                text = project_page(item, source)
            else:
                body = MARKDOWN.render(source)
                label = escape(item.get("organization", "Draft for review" if draft else "Technical writing"))
                text = f"""    <a class="text-link back-link" href="../index.html">← Blog</a>
    <article class="prose" data-reading-article>
      <header class="article-header">
        <p class="eyebrow">{label}</p>
        <h1>{escape(item['title'])}</h1>
        <p class="lead">{escape(item['description'])}</p>
      </header>
      {body}
    </article>"""
            write_page(dest, route, page(item["title"], item["description"], route, 2, text, schema_type, draft))
            if not draft:
                routes.append(route)

    posts = []
    for item in data["posts"]:
        if item.get("draft") and not drafts:
            continue
        label = '<small class="eyebrow">Draft for review</small>' if item.get("draft") else ""
        posts.append(f"""<article class="project-card">{label}
          <h2><a href="{escape(item['slug'])}/index.html">{escape(item['title'])}</a></h2>
          <p>{escape(item['description'])}</p></article>""")
    listing = "\n".join(posts) or '<p>No articles have been published yet. Explore the <a href="../lab/index.html">interactive lab</a> for practical examples.</p>'
    blog = f'<header class="article-header"><h1>Technical blog</h1><p class="lead">Notes on distributed systems, architecture, and production engineering.</p></header><div class="blog-list">{listing}</div>'
    write_page(dest, "blog/", page("Technical blog", "Notes on distributed systems and production engineering.", "blog/", 1, blog, "Blog"))

    lab = (ROOT / "lab/index.html").read_text(encoding="utf-8")
    write_page(dest, "lab/", page("Engineering lab", "Try executable examples of idempotency and exponential backoff.", "lab/", 1, lab, "WebPage"))
    theme_script = (ROOT / "assets/js/theme.js").read_text(encoding="utf-8")
    for path in dest.rglob("*.html"):
        source = path.read_text(encoding="utf-8")
        source = THEME_SCRIPT.sub(lambda match: f'<script{match[1] or ""}>{theme_script}</script>', source)
        path.write_text(source, encoding="utf-8")
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", namespace)
    sitemap = ET.Element(f"{{{namespace}}}urlset")
    for route in routes:
        item = ET.SubElement(sitemap, f"{{{namespace}}}url")
        ET.SubElement(item, f"{{{namespace}}}loc").text = SITE + route
    ET.ElementTree(sitemap).write(dest / "sitemap.xml", encoding="utf-8", xml_declaration=True)
    (dest / MARKER).touch()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    parser.add_argument("--drafts", action="store_true", help="Include noindex article drafts in a local preview")
    parser.add_argument("--preview", action="store_true", help="Point the form at the loopback contact fixture")
    args = parser.parse_args()
    endpoint = "/api/contact" if args.preview else os.environ.get("PORTFOLIO_CONTACT_ENDPOINT", "")
    if endpoint and not args.preview:
        url = urlsplit(endpoint)
        if url.scheme != "https" or not url.hostname or url.username or url.password or url.fragment:
            parser.error("PORTFOLIO_CONTACT_ENDPOINT must be an HTTPS URL without credentials or fragments.")
    dest = args.output.absolute()
    if dest.is_symlink() or (dest.exists() and not (dest / MARKER).is_file()):
        parser.error(f"Output must be a new directory or a previous portfolio build: {dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=dest.parent) as work:
        staging = Path(work) / "site"
        staging.mkdir()
        build(staging, args.drafts, endpoint)
        if dest.exists():
            shutil.rmtree(dest)
        staging.rename(dest)
    print(f"Built {dest}")


if __name__ == "__main__":
    main()
