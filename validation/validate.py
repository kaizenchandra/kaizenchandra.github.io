"""Dependency-free structural checks; not a browser or WCAG certification."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from collections import Counter
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

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

for path in [ROOT/'index.html', ROOT/'404.html', ROOT/'resume/index.html']:
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
        assert target.exists(), f'Missing local target: {url}'
        if parts.fragment:
            target_doc=doc if target==path else Document(target.read_text())
            assert unquote(parts.fragment) in target_doc.ids, f'Missing anchor: {url}'
    if doc.json_data: assert json.loads(''.join(doc.json_data))['@type']=='Person'
    print(f'PASS {path.relative_to(ROOT)}: headings, IDs, links, images, JSON-LD')
for path in (ROOT/'assets/images').rglob('*.svg'): ET.parse(path)
ET.parse(ROOT/'sitemap.xml')
manifest=json.loads((ROOT/'site.webmanifest').read_text())
for icon in manifest['icons']: assert (ROOT/icon['src']).is_file()
source=(ROOT/'index.html').read_text()
for required in ['Publicis Sapient','HTC Global Services','Siemens','Cyber Infrastructure','Skyway Technocom','2015–2017','code.chandrashekhar@gmail.com','+91-9691714192','+91-9109250699']:
    assert required in source, f'Missing required fact: {required}'
assert (ROOT/'assets/images/og-cover.png').is_file()
print('PASS SVG/XML, manifest, required profile facts, social PNG')
print('Publication note: resume is hosted on Google Drive; public architecture artifacts are not yet linked.')
print('Static checks passed. See MODERNIZATION.md for current browser validation and limitations.')
