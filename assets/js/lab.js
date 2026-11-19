(() => {
    "use strict";

    function workerProgram() {
        const write = self.postMessage.bind(self);

        function stringify(value) {
            if (typeof value === "string") return value;
            try {
                return JSON.stringify(value) ?? String(value);
            } catch {
                return String(value);
            }
        }

        self.onmessage = async ({data: code}) => {
            const lines = [];
            const log = (...values) => {
                if (lines.length < 40) lines.push(values.map(stringify).join(" ").slice(0, 500));
            };

            try {
                const AsyncFunction = (async () => {
                }).constructor;
                await new AsyncFunction("console", '"use strict";\n' + code)({log, info: log, warn: log, error: log});
                write({output: lines.join("\n") || "Finished without output."});
            } catch (error) {
                write({output: [...lines, String(error).slice(0, 500)].join("\n"), error: true});
            }
        };
    }

    function frameProgram(program) {
        addEventListener("message", (event) => {
            if (event.source !== parent || event.data?.type !== "run") return;

            const {id, code} = event.data;
            if (typeof code !== "string" || code.length > 12000) return;
            const url = URL.createObjectURL(new Blob([program], {type: "text/javascript"}));
            const worker = new Worker(url);
            const finish = (result) => {
                clearTimeout(timeout);
                worker.terminate();
                URL.revokeObjectURL(url);
                parent.postMessage({type: "result", id, ...result}, "*");
            };

            const timeout = setTimeout(() => finish({
                output: "Execution stopped after 1.5 seconds.",
                error: true
            }), 1500);
            worker.onmessage = (event) => {
                if (typeof event.data?.output !== "string") return;
                finish({output: event.data.output.slice(0, 21000), error: event.data.error === true});
            };
            worker.onerror = () => finish({output: "Execution failed in the sandbox.", error: true});
            worker.postMessage(code);
        });
    }

    const WorkerPolicy = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; worker-src blob:; connect-src 'none'";
    const program = JSON.stringify(`(${workerProgram.toString()})();`).replaceAll("<", "\\u003c");
    const runnerDocument = `<!doctype html><meta http-equiv="Content-Security-Policy" content="${WorkerPolicy}"><script>(${frameProgram.toString()})(${program});<\/script>`;

    function execute(code) {
        return new Promise((resolve) => {
            const frame = document.createElement("iframe");
            const id = Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
            frame.hidden = true;
            frame.title = "Isolated code runner";
            frame.sandbox = "allow-scripts";
            frame.srcdoc = runnerDocument;

            function finish(result) {
                clearTimeout(timeout);
                removeEventListener("message", receive);
                frame.remove();
                resolve(result);
            }

            function receive(event) {
                if (event.source !== frame.contentWindow || event.origin !== "null") return;
                if (event.data?.type !== "result" || event.data.id !== id) return;
                finish(event.data);
            }

            const timeout = setTimeout(() => finish({
                output: "The isolated runner could not complete.",
                error: true
            }), 3500);
            addEventListener("message", receive);
            frame.addEventListener("load", () => frame.contentWindow.postMessage({
                type: "run",
                id,
                code
            }, "*"), {once: true});
            document.body.append(frame);
        });
    }

    let toastTimer;

    function announce(message) {
        const toast = document.querySelector("[data-lab-toast]");
        clearTimeout(toastTimer);
        toast.textContent = message;
        toastTimer = setTimeout(() => {
            toast.textContent = "";
        }, 3000);
    }

    function attachEditor(example) {
        const sample = example.querySelector(".sample-source");
        const original = sample.textContent;
        const emptyOutput = "Run the example to see output here.";
        const controls = document.createElement("div");
        controls.className = "lab-controls";
        controls.innerHTML = `
      <div class="lab-toolbar">
        <button class="button button-primary" type="button" aria-keyshortcuts="Control+Enter Meta+Enter" data-run><span aria-hidden="true">▶</span> Run code</button>
        <span class="lab-shortcut"><kbd>Ctrl / ⌘</kbd> + <kbd>Enter</kbd></span>
        <p class="lab-editor-status" data-state="ready" role="status">Ready to run</p>
      </div>
      <div class="lab-panes">
        <div class="lab-pane">
          <div class="lab-pane-heading">
            <label for="${example.id}-code">JavaScript source</label>
            <div class="lab-code-actions">
              <button type="button" data-reset>Reset</button>
              <button type="button" data-copy>Copy code</button>
            </div>
          </div>
          <textarea class="lab-editor" id="${example.id}-code" maxlength="12000" wrap="off" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
        </div>
        <div class="lab-pane lab-output-pane">
          <div class="lab-pane-heading"><h3 id="${example.id}-output-title">Output</h3></div>
          <pre class="lab-output" aria-labelledby="${example.id}-output-title" tabindex="0" data-empty>${emptyOutput}</pre>
        </div>
      </div>
    `;

        const editor = controls.querySelector("textarea");
        const output = controls.querySelector(".lab-output");
        const status = controls.querySelector(".lab-editor-status");
        const run = controls.querySelector("[data-run]");
        const reset = controls.querySelector("[data-reset]");

        function setStatus(state, label) {
            status.dataset.state = state;
            status.textContent = label;
        }

        editor.value = original;
        sample.replaceWith(controls);
        editor.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                run.click();
            }
        });
        run.addEventListener("click", async () => {
            if (run.getAttribute("aria-disabled") === "true") return;
            run.setAttribute("aria-disabled", "true");
            reset.setAttribute("aria-disabled", "true");
            output.setAttribute("aria-busy", "true");
            setStatus("running", "Running code…");
            const result = await execute(editor.value).catch(() => ({
                output: "The isolated runner could not start.",
                error: true,
            }));
            output.textContent = result.output;
            output.removeAttribute("data-empty");
            output.removeAttribute("aria-busy");
            setStatus(result.error ? "error" : "complete", result.error ? "Execution stopped" : "Output ready");
            run.removeAttribute("aria-disabled");
            reset.removeAttribute("aria-disabled");
        });
        reset.addEventListener("click", () => {
            if (reset.getAttribute("aria-disabled") === "true") return;
            editor.value = original;
            output.textContent = emptyOutput;
            output.setAttribute("data-empty", "");
            setStatus("ready", "Example reset");
        });
        controls.querySelector("[data-copy]").addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(editor.value);
                announce("Code copied.");
            } catch {
                announce("Select the code to copy it.");
            }
        });
    }

    function initTerminal(terminal) {
        const form = terminal.querySelector("form");
        const input = form.querySelector("input");
        const output = terminal.querySelector(".terminal-output");
        const destinations = new Map([
            ["projects", ["Selected work", "../index.html#projects"]],
            ["skills", ["Technical skills", "../index.html#expertise"]],
            ["contact", ["Contact Chandrashekhar", "../index.html#contact"]],
            ["resume", ["Download the resume", "../resume/index.html"]],
            ["blog", ["Technical blog", "../blog/index.html"]],
        ]);

        terminal.hidden = false;
        document.querySelector("[data-terminal-link]").hidden = false;
        for (const shortcut of terminal.querySelectorAll("[data-command]")) {
            shortcut.addEventListener("click", () => {
                input.value = shortcut.dataset.command;
                form.requestSubmit();
            });
        }
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const command = input.value.trim().toLowerCase();
            if (command === "clear") {
                output.replaceChildren();
            } else if (command === "help") {
                output.textContent = "Commands: projects, skills, contact, resume, blog, help, clear.";
            } else if (destinations.has(command)) {
                const [label, href] = destinations.get(command);
                const link = document.createElement("a");
                link.href = href;
                link.textContent = label;
                output.replaceChildren(link);
            } else {
                output.textContent = "Unknown command. Type help to see available commands.";
            }
            input.value = "";
        });
    }

    function initExamples() {
        const examples = [...document.querySelectorAll(".lab-example")];
        const links = document.querySelectorAll("[data-lab-example]");

        function select(id) {
            const target = id ? examples.find((example) => example.id === id) : examples[0];
            if (!target) return;

            const focusedExample = document.activeElement.closest(".lab-example");
            for (const example of examples) example.hidden = example !== target;
            for (const link of links) {
                if (link.hash === `#${target.id}`) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            }
            if (target.querySelector(".sample-source")) attachEditor(target);
            if (focusedExample && focusedExample !== target) {
                target.querySelector("textarea").focus({preventScroll: true});
            }
            return target;
        }

        for (const link of links) {
            link.addEventListener("click", (event) => {
                if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
                event.preventDefault();
                if (location.hash !== link.hash) history.pushState(null, "", link.hash);
                select(link.hash.slice(1));
            });
        }

        addEventListener("hashchange", () => select(location.hash.slice(1)));
        const initial = select(location.hash.slice(1)) || select("");
        if (location.hash === `#${initial.id}`) {
            requestAnimationFrame(() => initial.scrollIntoView({behavior: "instant"}));
        }
    }

    initTerminal(document.querySelector(".terminal"));
    initExamples();
})();
