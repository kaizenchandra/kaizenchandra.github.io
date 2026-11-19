"""Dependency-free structural checks; not a browser or WCAG certification."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from collections import Counter
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'dist'
assert (ROOT / '.portfolio-build').is_file(), 'Build the portfolio before validating it.'

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.headings, self.images, self.scripts = [], [], [], [], []
        self.json_data = []
        self.in_json = False
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag in ('a', 'link', 'script', 'img'):
            url = a.get('href') or a.get('src')
            if url is not None: self.links.append(url)
        if tag.startswith('h') and len(tag) == 2 and tag[1].isdigit(): self.headings.append(int(tag[1]))
        if tag == 'img': self.images.append(a)
        if tag == 'script' and a.get('type') == 'application/ld+json': self.in_json = True
        if tag == 'a':
            assert a.get('href', '').strip(), 'Empty anchor'
            if a.get('target') == '_blank': assert 'noopener' in a.get('rel', '')
    def handle_data(self, data):
        if self.in_json: self.json_data.append(data)
    def handle_endtag(self, tag):
        if tag == 'script': self.in_json = False

for path in sorted(ROOT.rglob('*.html')):
    doc = Document(path.read_text())
    assert doc.headings.count(1) == 1, f'{path}: one H1 required'
    assert not [i for i,n in Counter(doc.ids).items() if n > 1], 'Duplicate IDs'
    for prev,nxt in zip(doc.headings,doc.headings[1:]): assert nxt <= prev+1, 'Skipped heading level'
    for image in doc.images:
        assert all(k in image for k in ('alt','width','height')), 'Image metadata missing'
        asset = path.parent/image['src']
        if asset.suffix == '.svg':
            svg=ET.parse(asset).getroot()
            assert int(image['width']) * int(svg.attrib['height']) == int(image['height']) * int(svg.attrib['width']), 'Aspect ratio mismatch'
    for url in doc.links:
        parts=urlsplit(url)
        if parts.scheme or parts.netloc: continue
        assert not parts.path.startswith('/'), f'Root-relative asset: {url}'
        target=(path.parent/unquote(parts.path)).resolve() if parts.path else path
        if target.is_dir():
            target = target / 'index.html'
        assert target.exists(), f'Missing local target: {url}'
        if parts.fragment:
            target_doc=doc if target==path else Document(target.read_text())
            assert unquote(parts.fragment) in target_doc.ids, f'Missing anchor: {url}'
    if doc.json_data:
        schema = json.loads(''.join(doc.json_data))
        assert schema['@type'] in {'Person', 'Article', 'Blog', 'BlogPosting', 'WebPage'}
        assert schema['url'].startswith('https://kaizenchandra.github.io/')
    print(f'PASS {path.relative_to(ROOT)}: headings, IDs, links, images, JSON-LD')
for path in (ROOT/'assets/images').rglob('*.svg'): ET.parse(path)
namespace = {'map': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap = ET.parse(ROOT/'sitemap.xml')
for entry in sitemap.findall('map:url/map:loc', namespace):
    assert entry.text.startswith('https://kaizenchandra.github.io/')
    indexed = ROOT / urlsplit(entry.text).path.lstrip('/') / 'index.html'
    assert indexed.is_file(), f'Missing sitemap route: {entry.text}'
    assert 'content="noindex"' not in indexed.read_text(), f'Private sitemap route: {entry.text}'
assert (ROOT/'resume/chandrashekhar-vishwakarma.pdf').read_bytes().startswith(b'%PDF-')
manifest=json.loads((ROOT/'site.webmanifest').read_text())
for icon in manifest['icons']: assert (ROOT/icon['src']).is_file()
source=(ROOT/'index.html').read_text()
for required in [
    'Lead Software Engineer &amp;', 'Technology Architect',
    'Publicis Sapient', 'Manager Technology', 'Feb 2026–Present',
    'HTC Global Services', 'Technical Lead', 'Jul 2024–Nov 2025',
    'Siemens', 'Senior Software Development Engineer', 'Sep 2020–Jun 2024',
    'Cyber Infrastructure (CIS)', 'Senior Software Engineer', 'Aug 2018–Jul 2020',
    '>STC<', 'Jun 2015–Jul 2018',
    'mailto:code.chandrashekhar@hotmail.com',
    'tel:+919691714192', 'tel:+919109250699',
]:
    assert required in source, f'Missing required fact: {required}'
assert (ROOT/'assets/images/og-cover.png').is_file()
print('PASS SVG/XML, manifest, required profile facts, social PNG')
print('Static checks passed. External link availability is checked separately.')
