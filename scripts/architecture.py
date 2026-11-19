"""Render lightweight, text-based system diagrams for the static site."""
from html import escape
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
EDGE_LABELS = {
    "http": "Synchronous request",
    "event": "Asynchronous event",
    "data": "Data access",
    "delivery": "Delivery or deployment",
}


def flow(diagram):
    name, nodes, edges = (diagram[key] for key in ("name", "nodes", "edges"))
    if len(edges) != len(nodes) - 1:
        raise ValueError(f"Diagram needs one edge between each pair of nodes: {name}")
    steps = []
    for index, node in enumerate(nodes):
        edge = ""
        if index < len(edges):
            kind, label = edges[index]
            edge = (f'<span class="flow-edge flow-edge-{kind}">'
                    f'<span class="visually-hidden">{EDGE_LABELS[kind]}. </span>'
                    f'{escape(label)} <span aria-hidden="true">→</span></span>')
        symbol = ""
        if node in diagram.get("stores", []):
            symbol = (
                '<svg class="flow-store" viewBox="0 0 24 24" aria-hidden="true">'
                '<ellipse cx="12" cy="5" rx="8" ry="3"/>'
                '<path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'
                '</svg>'
            )
        steps.append(f'<li><span class="flow-node">{symbol}{escape(node)}</span>{edge}</li>')
    return (f'<div class="flow-lane"><p class="flow-name">{escape(name)}</p>'
            f'<ol class="diagram-flow" role="list" aria-label="{escape(name)}">{"".join(steps)}</ol></div>')


def reference_page():
    data = json.loads((ROOT / "content/architecture.json").read_text(encoding="utf-8"))
    tabs, panels = [], []
    for view in data["views"]:
        identifier = escape(view["id"])
        title = escape(view["title"])
        tabs.append(f'<a id="tab-{identifier}" href="#{identifier}">{escape(view["tab"])}</a>')
        diagrams = "".join(flow(item) for item in view["flows"])
        notes = "".join(
            f'<div><dt>{escape(term)}</dt><dd>{escape(note)}</dd></div>'
            for term, note in view["notes"]
        )
        references = " · ".join(
            f'<a href="{escape(item["url"])}">{escape(item["label"])}</a>'
            for item in view.get("references", [])
        )
        references = f'<p class="diagram-references">{references}</p>' if references else ""
        panels.append(f"""
        <section id="{identifier}" class="explorer-view">
          <header class="explorer-view-header">
            <div><p class="eyebrow">{escape(view["kind"])}</p><h2>{title}</h2></div>
            <button class="button button-secondary" type="button" data-enlarge disabled>Expand diagram <span aria-hidden="true">↗</span></button>
          </header>
          <p class="explorer-summary">{escape(view["summary"])}</p>
          <div class="flow-canvas">
            {diagrams}
          </div>
          <dl class="design-notes">{notes}</dl>
          {references}
        </section>""")

    body = f"""
    <header class="article-header architecture-masthead">
      <p class="evidence-label">Conceptual reference architecture</p>
      <h1>{escape(data["title"])}</h1>
      <p class="lead">{escape(data["description"])}</p>
    </header>
    <div class="explorer" data-explorer>
      <nav class="explorer-nav" aria-label="Architecture views">{"".join(tabs)}</nav>
      <ul class="flow-legend" role="list" aria-label="Diagram legend">
        <li><span aria-hidden="true"></span> Synchronous request</li>
        <li><span aria-hidden="true"></span> Asynchronous event</li>
        <li><span aria-hidden="true"></span> Data and delivery arrows have text labels</li>
      </ul>
      {"".join(panels)}
      <dialog class="diagram-dialog" aria-labelledby="diagram-dialog-title">
        <div class="explorer-view-header">
          <h2 id="diagram-dialog-title">Architecture diagram</h2>
          <form method="dialog"><button class="button button-secondary" autofocus>Close</button></form>
        </div>
        <p class="evidence-label">Conceptual</p>
        <div data-expanded-diagram></div>
        <p class="diagram-references">Dashed arrows indicate asynchronous events. Other relationships are labeled.</p>
      </dialog>
    </div>
    <div class="architecture-next">
      <a class="button button-primary" href="../index.html#projects">Browse projects <span aria-hidden="true">→</span></a>
      <a class="button button-secondary" href="../lab/index.html">Try the engineering lab <span aria-hidden="true">→</span></a>
    </div>
    <script src="../assets/js/architecture.js" defer></script>"""
    return data["title"], data["description"], body
