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

    self.onmessage = async ({ data: code }) => {
      const lines = [];
      const log = (...values) => {
        if (lines.length < 40) lines.push(values.map(stringify).join(" ").slice(0, 500));
      };

      try {
        const AsyncFunction = (async () => {}).constructor;
        await new AsyncFunction("console", '"use strict";\n' + code)({ log, info: log, warn: log, error: log });
        write({ output: lines.join("\n") || "Finished without output." });
      } catch (error) {
        write({ output: [...lines, String(error).slice(0, 500)].join("\n"), error: true });
      }
    };
  }

  function frameProgram(program) {
    addEventListener("message", (event) => {
      if (event.source !== parent || event.data?.type !== "run") return;

      const { id, code } = event.data;
      if (typeof code !== "string" || code.length > 12000) return;
      const url = URL.createObjectURL(new Blob([program], { type: "text/javascript" }));
      const worker = new Worker(url);
      const finish = (result) => {
        clearTimeout(timeout);
        worker.terminate();
        URL.revokeObjectURL(url);
        parent.postMessage({ type: "result", id, ...result }, "*");
      };

      const timeout = setTimeout(() => finish({ output: "Execution stopped after 1.5 seconds.", error: true }), 1500);
      worker.onmessage = (event) => {
        if (typeof event.data?.output !== "string") return;
        finish({ output: event.data.output.slice(0, 21000), error: event.data.error === true });
      };
      worker.onerror = () => finish({ output: "Execution failed in the sandbox.", error: true });
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

      const timeout = setTimeout(() => finish({ output: "The isolated runner could not complete.", error: true }), 3500);
      addEventListener("message", receive);
      frame.addEventListener("load", () => frame.contentWindow.postMessage({ type: "run", id, code }, "*"), { once: true });
      document.body.append(frame);
    });
  }

  let toastTimer;
  function announce(message) {
    const toast = document.querySelector("[data-lab-toast]");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toastTimer = setTimeout(() => { toast.textContent = ""; }, 3000);
  }

  function attachEditor(example) {
    const sample = example.querySelector(".sample-source");
    const original = sample.textContent;
    const controls = document.createElement("div");
    controls.className = "lab-controls";
    controls.innerHTML = `
      <label for="${example.id}-code">JavaScript source</label>
      <textarea class="lab-editor" id="${example.id}-code" maxlength="12000" spellcheck="false"></textarea>
      <div class="actions">
        <button class="button button-primary" type="button" data-run>Run code</button>
        <button class="button button-secondary" type="button" data-reset>Reset</button>
        <button class="button button-secondary" type="button" data-copy>Copy code</button>
      </div>
      <p class="lab-editor-status" role="status">Ready to run.</p>
      <pre class="lab-output" aria-label="Code output" tabindex="0"></pre>`;

    const editor = controls.querySelector("textarea");
    const output = controls.querySelector(".lab-output");
    const status = controls.querySelector(".lab-editor-status");
    const run = controls.querySelector("[data-run]");
    const reset = controls.querySelector("[data-reset]");

    editor.value = original;
    sample.replaceWith(controls);
    run.addEventListener("click", async () => {
      run.disabled = true;
      reset.disabled = true;
      status.textContent = "Running example…";
      const result = await execute(editor.value);
      output.textContent = result.output;
      status.textContent = result.error ? "Execution stopped. See code output for details." : "Run finished. Code output updated.";
      run.disabled = false;
      reset.disabled = false;
    });
    reset.addEventListener("click", () => {
      editor.value = original;
      output.textContent = "";
      status.textContent = "Example reset.";
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

  for (const example of document.querySelectorAll(".lab-example")) {
    function openEditor() {
      if (example.open && example.querySelector(".sample-source")) attachEditor(example);
    }
    example.addEventListener("toggle", openEditor);
  }
  function openLinkedExample() {
    const example = document.getElementById(location.hash.slice(1));
    if (example?.classList.contains("lab-example")) example.open = true;
  }
  addEventListener("hashchange", openLinkedExample);
  openLinkedExample();
  initTerminal(document.querySelector(".terminal"));
})();
