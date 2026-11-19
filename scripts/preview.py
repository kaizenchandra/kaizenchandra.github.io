"""Serve a built portfolio with a loopback-only contact test endpoint."""
import argparse
from collections import deque
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
from threading import Lock
from time import monotonic

EMAIL = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")
WINDOW_SECONDS = 60


class PreviewHandler(SimpleHTTPRequestHandler):
    attempts = deque()
    lock = Lock()

    def end_headers(self):
        if self.server.scripts_blocked:
            self.send_header("Content-Security-Policy", "script-src 'none'")
        super().end_headers()

    def reply(self, status, accepted=False):
        body = json.dumps({"accepted": accepted}).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/contact":
            self.reply(404)
            return

        try:
            size = int(self.headers.get("Content-Length", "0"))
            if self.headers.get_content_type() != "application/json" or not 0 < size <= 24000:
                self.reply(400)
                return
            form = json.loads(self.rfile.read(size))
            name, email, message, website = (form[field].strip() for field in ("name", "email", "message", "website"))
        except (ValueError, TypeError, KeyError, AttributeError):
            self.reply(400)
            return

        if website or not 1 <= len(name) <= 100 or len(email) > 254 or not EMAIL.fullmatch(email) or not 10 <= len(message) <= 4000:
            self.reply(400)
            return

        with self.lock:
            now = monotonic()
            while self.attempts and now - self.attempts[0] >= WINDOW_SECONDS:
                self.attempts.popleft()
            if len(self.attempts) >= 6:
                self.reply(429)
                return
            self.attempts.append(now)

        if email == "unavailable@example.invalid":
            self.reply(503)
            return
        self.reply(200, accepted=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=Path("dist"))
    parser.add_argument("--port", type=int, default=8052)
    parser.add_argument("--block-scripts", action="store_true")
    args = parser.parse_args()
    if not (args.directory / ".portfolio-build").is_file():
        parser.error("Build the portfolio before starting the preview.")
    handler = partial(PreviewHandler, directory=str(args.directory))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        server.scripts_blocked = args.block_scripts
        print(f"Preview: http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
