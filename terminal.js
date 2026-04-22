(() => {
  const output = document.getElementById("output");
  const input = document.getElementById("command-input");
  const inputDisplay = document.getElementById("input-display");
  const terminal = document.getElementById("terminal");
  const canvas = document.getElementById("matrix-canvas");
  const scanlines = document.querySelector(".scanlines");
  const ctx = canvas.getContext("2d");

  let history = [];
  let historyIndex = -1;
  let matrixRunning = false;
  let konamiBuffer = [];
  let commandCount = 0;
  let hackerMode = false;
  let partyMode = false;

  const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

  // ── helpers ──────────────────────────────────────────────

  function addLine(text, cls = "line-output") {
    const div = document.createElement("div");
    div.className = `line ${cls}`;
    div.textContent = text;
    output.appendChild(div);
  }

  function addHTML(html, cls = "line-output") {
    const div = document.createElement("div");
    div.className = `line ${cls}`;
    div.innerHTML = html;
    output.appendChild(div);
  }

  function addCmd(text) {
    addHTML(
      `<span class="prompt-user">paul@pcailly</span><span class="prompt-colon">:</span><span class="prompt-path">~</span><span class="prompt-dollar">$</span> <span class="cmd-text">${escapeHTML(text)}</span>`,
      "line-cmd"
    );
  }

  function escapeHTML(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function scrollBottom() {
    output.scrollTop = output.scrollHeight;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function typeText(text, cls = "line-output", speed = 30) {
    const div = document.createElement("div");
    div.className = `line ${cls} typewriter`;
    output.appendChild(div);
    for (const ch of text) {
      div.textContent += ch;
      scrollBottom();
      await sleep(speed);
    }
    return div;
  }

  async function typeLines(lines, cls = "line-output", speed = 25) {
    for (const line of lines) {
      await typeText(line, cls, speed);
    }
  }

  function glitch() {
    terminal.classList.add("glitch");
    setTimeout(() => terminal.classList.remove("glitch"), 300);
  }

  function shake() {
    terminal.classList.add("shake");
    setTimeout(() => terminal.classList.remove("shake"), 500);
  }

  function fireworks(count = 12) {
    const emojis = ["🎆","🎇","✨","🎉","🎊","💥","⭐","🌟"];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement("div");
        el.className = "firework";
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * 100 + "vw";
        el.style.top = (40 + Math.random() * 40) + "vh";
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
      }, i * 100);
    }
  }

  // ── matrix rain ──────────────────────────────────────────

  function startMatrix() {
    if (matrixRunning) return;
    matrixRunning = true;
    canvas.classList.add("active");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(1);
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789$><=+-*/{}[]|@#%&ポカリ日本語".split("");

    function draw() {
      if (!matrixRunning) return;
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f0";
      ctx.font = "14px Fira Code, monospace";
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 16, drops[i] * 16);
        if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  function stopMatrix() {
    matrixRunning = false;
    canvas.classList.remove("active");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ── ascii art ────────────────────────────────────────────

  const ASCII_LOGO = [
    "                 _ _               _ _ _       ",
    " _ __   ___ __ _(_) | |_   _   ___| (_) |_   _ ",
    "| '_ \\ / __/ _` | | | | | | | / __| | | __| (_)",
    "| |_) | (_| (_| | | | | |_| || (__| | | |_   _ ",
    "| .__/ \\___\\__,_|_|_|_|\\__, (_)___|_|_|\\__| (_)",
    "|_|                    |___/                    ",
  ];

  const ASCII_COFFEE = [
    "        ( (  ",
    "         ) ) ",
    "      ........   ",
    "      |      |]  ",
    "      \\      /   ",
    "       `----'    ",
  ];

  const ASCII_SKULL = [
    "     ______",
    "   /        \\",
    "  |  X    X  |",
    "  |    __    |",
    "   \\  \\__/  /",
    "    \\______/",
  ];

  const ASCII_ROCKET = [
    "       /\\",
    "      /  \\",
    "     | () |",
    "     | () |",
    "    /|    |\\",
    "   / |    | \\",
    "  /__|____|__\\",
    "     /_\\/_\\",
    "      |  |",
    "     /|  |\\",
    "    / |  | \\",
    "   *  ****  *",
  ];

  const FORTUNES = [
    "\"The best way to predict the future is to invent it.\" — Alan Kay",
    "\"Talk is cheap. Show me the code.\" — Linus Torvalds",
    "\"Any sufficiently advanced technology is indistinguishable from magic.\" — Arthur C. Clarke",
    "\"First, solve the problem. Then, write the code.\" — John Johnson",
    "\"It works on my machine.\" — Every developer ever",
    "\"There are only two hard things in CS: cache invalidation, naming things, and off-by-one errors.\"",
    "\"A ship in port is safe, but that's not what ships are built for.\" — Grace Hopper",
    "\"The most dangerous phrase in the language is: we've always done it this way.\" — Grace Hopper",
    "\"Debugging is twice as hard as writing the code in the first place.\" — Brian Kernighan",
    "\"Weeks of coding can save you hours of planning.\"",
    "\"// This code works. I have no idea why.\"",
    "\"sudo make me a sandwich.\"",
    "\"rm -rf / — the solution to all your problems and all your files.\"",
  ];

  // ── neofetch ─────────────────────────────────────────────

  function neofetch() {
    const info = [
      ["OS", "Human OS 1.0 (Homo sapiens)"],
      ["Host", "pcailly.com"],
      ["Kernel", "Brain v∞"],
      ["Uptime", getAge() + " years"],
      ["Shell", "bash + vibes"],
      ["Resolution", `${window.innerWidth}x${window.innerHeight}`],
      ["Terminal", "pcailly-term v1.0"],
      ["CPU", "Caffeine-Powered Neural Net"],
      ["GPU", "Imagination RTX 9090"],
      ["Memory", "∞ / ∞ (optimistic)"],
      ["Disk", "Full of side projects"],
      ["Languages", "TypeScript, JavaScript, Python, French"],
    ];

    const art = [
      "   ____            _  ",
      "  |  _ \\ __ _ _  _| | ",
      "  | |_) / _` | | | | | ",
      "  |  __/ (_| | |_| | | ",
      "  |_|   \\__,_|\\__,_|_| ",
      "                       ",
    ];

    for (let i = 0; i < Math.max(art.length, info.length); i++) {
      const artLine = (art[i] || "").padEnd(28);
      if (i < info.length) {
        addHTML(
          `<span style="color:#27c93f">${escapeHTML(artLine)}</span><span style="color:#5b86e5;font-weight:bold">${escapeHTML(info[i][0])}</span><span style="color:#a0a0a0">: ${escapeHTML(info[i][1])}</span>`,
          "line-output"
        );
      } else {
        addHTML(`<span style="color:#27c93f">${escapeHTML(artLine)}</span>`, "line-output");
      }
    }

    // Color palette
    const colors = ["#1a1a2e","#ff5f56","#27c93f","#ffbd2e","#5b86e5","#c678dd","#56b6c2","#e0e0e0"];
    let palette = "                            ";
    colors.forEach(c => palette += `<span style="background:${c};color:${c}">███</span>`);
    addHTML(palette, "line-output");
  }

  function getAge() {
    const born = new Date(1995, 0, 1); // placeholder
    const diff = Date.now() - born.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  // ── hack animation ──────────────────────────────────────

  async function hackSequence() {
    const targets = [
      "Initializing breach protocol...",
      "Scanning ports... 22, 80, 443, 8080, 31337",
      "Bypassing firewall ██████████ [OK]",
      "Injecting payload... ████████ [OK]",
      "Decrypting mainframe... ██████ [OK]",
      "Accessing root... ",
    ];

    hackerMode = true;
    terminal.classList.add("hacker");
    scanlines.classList.add("active");
    startMatrix();

    for (const line of targets) {
      await typeText(line, "line-success", 20);
      await sleep(300);
    }

    await sleep(500);
    glitch();
    addLine("");
    addLine("ACCESS GRANTED", "line-success");
    addLine("Welcome back, Paul.", "line-success");
    addLine("");
    addLine("Just kidding. This is a website. 😄", "line-warning");

    await sleep(3000);
    stopMatrix();
    scanlines.classList.remove("active");
    terminal.classList.remove("hacker");
    hackerMode = false;
  }

  // ── rm -rf simulation ───────────────────────────────────

  async function rmrf() {
    shake();
    await sleep(200);

    const files = [
      "/usr/bin/life-choices.exe",
      "/home/paul/embarrassing-photos/",
      "/var/log/all-my-mistakes.log",
      "/etc/hopes-and-dreams.conf",
      "/home/paul/side-projects/definitely-finishing-this-one/",
      "/home/paul/.browser-history  (oh no)",
      "/usr/lib/self-esteem.so",
      "/boot/motivation.img",
      "/home/paul/Desktop/New Folder (37)/",
      "/dev/social-life",
      "/home/paul/node_modules/ (this will take a while)",
    ];

    addLine("☠️  Are you insane?! Fine, here goes...", "line-error");
    addLine("");

    for (const f of files) {
      addLine(`rm: removing '${f}'`, "line-error");
      scrollBottom();
      await sleep(150);
    }

    await sleep(500);
    glitch();
    glitch();
    addLine("");
    addLine("💀 System destroyed. Just kidding, it's a website.", "line-warning");
    addLine("   But seriously, don't run that on a real machine.", "line-output");
  }

  // ── cowsay ──────────────────────────────────────────────

  function cowsay(msg) {
    if (!msg) msg = "Moo! I'm a cow on the internet.";
    const border = "-".repeat(msg.length + 2);
    const lines = [
      ` ${border}`,
      `< ${msg} >`,
      ` ${border}`,
      "        \\   ^__^",
      "         \\  (oo)\\_______",
      "            (__)\\       )\\/\\",
      "                ||----w |",
      "                ||     ||",
    ];
    lines.forEach(l => addLine(l, "line-ascii"));
  }

  // ── sl (steam locomotive) ───────────────────────────────

  async function sl() {
    const frames = [
      [
        "      ====        ________                ___________ ",
        "  _D _|  |_______/        \\__I_I_____===__|_________| ",
        "   |(_)---  |   H\\________/ |   |        =|___ ___|  ",
        "   /     |  |   H  |  |     |   |         ||_| |_||  ",
        "  |      |  |   H  |__--------------------| [___] |  ",
        "  | ________|___H__/__|_____/[][]~\\_______|       |  ",
        "  |/ |   |-----------I_____I [][] []  D   |=======|_ ",
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
        "  \\_/      \\O=====O=====O=====O_/      \\_/            ",
      ],
    ];

    addLine("You typed 'sl' instead of 'ls'. Classic.", "line-warning");
    addLine("");
    frames[0].forEach(l => addLine(l, "line-ascii"));
    addLine("");
    addLine("🚂 choo choo!", "line-output");
  }

  // ── progress bar ────────────────────────────────────────

  async function fakeProgress(label, duration = 2000, danger = false) {
    const div = document.createElement("div");
    div.className = "line line-output";
    div.innerHTML = `${escapeHTML(label)} <span class="progress-bar"><span class="progress-fill${danger ? " danger" : ""}"></span></span> <span class="pct">0%</span>`;
    output.appendChild(div);

    const fill = div.querySelector(".progress-fill");
    const pct = div.querySelector(".pct");
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const p = Math.round((i / steps) * 100);
      fill.style.width = p + "%";
      pct.textContent = p + "%";
      scrollBottom();
      await sleep(duration / steps);
    }
    return div;
  }

  // ── sudo ────────────────────────────────────────────────

  function sudo(args) {
    const responses = [
      "Nice try. You're not root here. 🔒",
      "sudo: paul is not in the sudoers file. This incident will be reported.",
      "I'm a website, not a Linux box. But I appreciate the effort.",
      "Permission denied. Have you tried 'please' instead?",
      "🚨 UNAUTHORIZED ACCESS ATTEMPT LOGGED 🚨\n   (just kidding, logs don't exist here)",
    ];
    addLine(responses[Math.floor(Math.random() * responses.length)], "line-error");
  }

  // ── please ──────────────────────────────────────────────

  function please() {
    addLine("Since you asked nicely... ✨", "line-success");
    addLine("Here, have a cookie: 🍪", "line-output");
  }

  // ── weather ─────────────────────────────────────────────

  function weather() {
    const conditions = [
      { icon: "☀️", text: "Sunny, 24°C — Perfect coding weather" },
      { icon: "🌧️", text: "Rainy, 14°C — Stay inside and ship code" },
      { icon: "⛈️", text: "Thunderstorm — Your deployment, probably" },
      { icon: "🌤️", text: "Partly cloudy, 19°C — Nice day to push to prod" },
      { icon: "❄️", text: "Snowing, -2°C — Like your test coverage" },
    ];
    const c = conditions[Math.floor(Math.random() * conditions.length)];
    addLine("");
    addLine(`  ${c.icon}  ${c.text}`, "line-output");
    addLine("  Location: The Internet", "line-output");
    addLine("");
  }

  // ── commands map ────────────────────────────────────────

  const commands = {
    help() {
      addLine("");
      addLine("Available commands:", "line-info");
      addLine("");
      const cmds = [
        ["whoami", "Who am I?"],
        ["about", "Learn more about me"],
        ["links", "Show social links"],
        ["skills", "List technical skills"],
        ["neofetch", "System information"],
        ["projects", "Featured projects"],
        ["contact", "Get in touch"],
        ["weather", "Current weather"],
        ["fortune", "Random wisdom"],
        ["cowsay [msg]", "A cow says things"],
        ["coffee", "Brew some coffee"],
        ["clear", "Clear the terminal"],
        ["history", "Command history"],
        ["date", "Current date"],
        ["echo [text]", "Echo text back"],
        ["ping [host]", "Ping a host"],
        ["ls", "List directory"],
        ["cat [file]", "Read a file"],
      ];
      cmds.forEach(([cmd, desc]) => {
        addHTML(
          `  <span style="color:#27c93f;min-width:160px;display:inline-block">${escapeHTML(cmd.padEnd(18))}</span><span style="color:#a0a0a0">${escapeHTML(desc)}</span>`,
          "line-output"
        );
      });
      addLine("");
      addLine("💡 There might be some hidden commands too...", "line-warning");
      addLine("");
    },

    whoami() {
      addLine("Paul Cailly", "line-output");
    },

    about() {
      addLine("");
      addLine("Hey! I'm Paul 👋", "line-output");
      addLine("Builder & tinkerer. I like shipping things.", "line-output");
      addLine("");
      addLine("→  hello@pcailly.com", "line-info");
      addLine("→  github.com/PaulCailly", "line-info");
      addLine("");
    },

    links() {
      addLine("");
      const div = document.createElement("div");
      div.className = "output-links";
      div.innerHTML = `
        <a href="https://github.com/PaulCailly" target="_blank" rel="noopener"><i class="fab fa-github"></i> <span class="link-label">GitHub</span></a>
        <a href="https://linkedin.com/in/paulcailly" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i> <span class="link-label">LinkedIn</span></a>
        <a href="mailto:hello@pcailly.com"><i class="fas fa-envelope"></i> <span class="link-label">Email</span></a>
      `;
      output.appendChild(div);
      addLine("");
    },

    skills() {
      addLine("");
      addLine("Languages    TypeScript, JavaScript, Python, Go", "line-output");
      addLine("Frontend     React, Next.js, Tailwind, Ink", "line-output");
      addLine("Backend      Node.js, AWS, GCP, Vercel", "line-output");
      addLine("Tools        Git, Docker, Nix, Terraform", "line-output");
      addLine("Vibes        Ship fast, break nothing", "line-output");
      addLine("");
    },

    projects() {
      addLine("");
      addLine("Featured projects:", "line-info");
      addLine("");
      addHTML('  <a href="https://github.com/PaulCailly" target="_blank" style="color:#5b86e5;text-decoration:none">→ Check them out on GitHub</a>', "line-output");
      addLine("");
    },

    contact() {
      addLine("");
      addLine("📬  hello@pcailly.com", "line-output");
      addLine("🐙  github.com/PaulCailly", "line-output");
      addLine("💼  linkedin.com/in/paulcailly", "line-output");
      addLine("");
      addLine("I read every email. Promise.", "line-info");
      addLine("");
    },

    clear() {
      output.innerHTML = "";
    },

    date() {
      addLine(new Date().toString(), "line-output");
    },

    history() {
      if (history.length === 0) {
        addLine("No commands in history yet.", "line-output");
        return;
      }
      history.forEach((cmd, i) => {
        addLine(`  ${String(i + 1).padStart(4)}  ${cmd}`, "line-output");
      });
    },

    fortune() {
      addLine("");
      addLine(FORTUNES[Math.floor(Math.random() * FORTUNES.length)], "line-info");
      addLine("");
    },

    neofetch,

    coffee() {
      addLine("");
      ASCII_COFFEE.forEach(l => addLine(l, "line-ascii"));
      addLine("");
      addLine("  Here's your coffee ☕", "line-output");
      addLine("  Now get back to work.", "line-warning");
      addLine("");
    },

    async ping(args) {
      const host = args || "pcailly.com";
      for (let i = 0; i < 4; i++) {
        const ms = Math.floor(Math.random() * 50) + 5;
        addLine(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${ms}ms`, "line-output");
        scrollBottom();
        await sleep(500);
      }
      addLine(`--- ${host} ping statistics ---`, "line-output");
      addLine("4 packets transmitted, 4 received, 0% packet loss", "line-success");
    },

    ls() {
      addLine("about.txt    links.txt    projects/    skills.txt    .secret    README.md", "line-output");
    },

    cat(args) {
      const files = {
        "about.txt": () => commands.about(),
        "links.txt": () => commands.links(),
        "skills.txt": () => commands.skills(),
        "README.md": () => {
          addLine("");
          addLine("# pcailly.com", "line-info");
          addLine("Personal terminal website.", "line-output");
          addLine("Type 'help' for commands.", "line-output");
          addLine("");
        },
        ".secret": () => {
          addLine("");
          addLine("🤫 You found the secret file!", "line-warning");
          addLine("Here's a secret: I once mass-deployed on a Friday.", "line-error");
          addLine("It went fine. I got lucky.", "line-output");
          addLine("");
        },
      };
      if (!args) {
        addLine("cat: missing operand. Try: cat about.txt", "line-error");
        return;
      }
      if (files[args]) {
        files[args]();
      } else {
        addLine(`cat: ${args}: No such file or directory`, "line-error");
      }
    },

    echo(args) {
      addLine(args || "", "line-output");
    },

    pwd() {
      addLine("/home/paul", "line-output");
    },

    cd(args) {
      if (!args || args === "~") {
        addLine("Already home. 🏠", "line-output");
      } else if (args === "..") {
        addLine("Nice try. You can't escape.", "line-warning");
      } else {
        addLine(`cd: ${args}: Permission denied (and also this is a website)`, "line-error");
      }
    },

    mkdir() {
      addLine("You can't create directories in the void.", "line-error");
    },

    touch(args) {
      addLine(`Creating '${args || "unnamed"}'... just kidding, this is read-only.`, "line-warning");
    },

    sudo,
    please,
    weather,
    cowsay,

    async hack() {
      await hackSequence();
    },

    async "rm"(args) {
      if (args && args.includes("-rf")) {
        await rmrf();
      } else {
        addLine("rm: missing -rf flag. Go big or go home.", "line-warning");
      }
    },

    async matrix() {
      if (matrixRunning) {
        stopMatrix();
        addLine("Matrix rain stopped.", "line-output");
      } else {
        startMatrix();
        addLine("Matrix rain activated. Type 'matrix' again to stop.", "line-success");
      }
    },

    vim() {
      addLine("You've entered vim.", "line-warning");
      addLine("Good luck getting out. 😈", "line-error");
      addLine("");
      addLine("(Hint: you can't. This is a website. Type a real command.)", "line-output");
    },

    emacs() {
      addLine("Ah, a person of culture.", "line-info");
      addLine("Unfortunately, this terminal doesn't have enough RAM for Emacs.", "line-warning");
    },

    nano() {
      addLine("nano: command not found (we're a vim household)", "line-error");
    },

    git(args) {
      if (!args) {
        addLine("usage: git <command>", "line-output");
        return;
      }
      if (args.includes("push") && args.includes("force")) {
        addLine("🚨 FORCE PUSH?! On a FRIDAY?! Bold move.", "line-error");
        shake();
      } else if (args.includes("push")) {
        addLine("Everything up-to-date (because this is a website)", "line-success");
      } else if (args.includes("pull")) {
        addLine("Already up to date. ✨", "line-success");
      } else if (args.includes("blame")) {
        addLine("It was you. It's always you.", "line-warning");
      } else if (args.includes("commit")) {
        addLine('Nothing to commit. But I admire the hustle.', "line-output");
      } else if (args.includes("status")) {
        addLine("On branch main", "line-output");
        addLine("nothing to commit, working tree clean", "line-success");
        addLine("(your life, however, is a different story)", "line-warning");
      } else if (args.includes("log")) {
        addLine("commit a1b2c3d (HEAD -> main)", "line-output");
        addLine("Author: Paul Cailly <hello@pcailly.com>", "line-output");
        addLine("Date:   Just now", "line-output");
        addLine("", "line-output");
        addLine("    Made it look cool", "line-info");
      } else {
        addLine(`git: '${args}' is not a git command.`, "line-error");
      }
    },

    npm(args) {
      if (args && args.includes("install")) {
        addLine("added 1,847 packages in 42s", "line-output");
        addLine("69 vulnerabilities (42 moderate, 27 high)", "line-warning");
        addLine("", "line-output");
        addLine("Sounds about right.", "line-output");
      } else {
        addLine("npm: this terminal runs on vibes, not node_modules", "line-warning");
      }
    },

    async party() {
      partyMode = !partyMode;
      if (partyMode) {
        document.documentElement.classList.add("party");
        fireworks(20);
        addLine("🎉🎊🥳 PARTY MODE ACTIVATED 🥳🎊🎉", "line-rainbow");
        addLine("Type 'party' again to stop the madness.", "line-output");
      } else {
        document.documentElement.classList.remove("party");
        addLine("Party's over. Back to work. 😐", "line-output");
      }
    },

    async rocket() {
      addLine("");
      ASCII_ROCKET.forEach(l => addLine(l, "line-ascii"));
      addLine("");
      addLine("🚀 To infinity and beyond!", "line-rainbow");
      addLine("");
    },

    sl,

    async reboot() {
      output.innerHTML = "";
      glitch();
      await sleep(500);
      addLine("Rebooting...", "line-warning");
      await sleep(1000);
      output.innerHTML = "";
      await bootSequence();
    },

    exit() {
      addLine("Logout? In this economy?", "line-warning");
      addLine("There is no escape. Only more commands.", "line-output");
    },

    "404"() {
      addLine("You found the 404 command. Ironic.", "line-warning");
    },

    async "42"() {
      await typeText("The answer to life, the universe, and everything.", "line-info", 40);
    },

    async deploy() {
      addLine("");
      addLine("Deploying to production... 🚀", "line-info");
      await fakeProgress("Building", 1500);
      await fakeProgress("Testing", 1000);
      await fakeProgress("Deploying", 2000);
      addLine("");
      glitch();
      addLine("✅ Deployed successfully!", "line-success");
      addLine("   (Not really. But wouldn't that be nice?)", "line-output");
      addLine("");
    },

    async sudo_rm_rf() {
      await rmrf();
    },

    async scan() {
      addLine("");
      addLine("Scanning visitor...", "line-info");
      await fakeProgress("Analyzing", 2000);
      addLine("");
      const traits = [
        "Species: Human (probably)",
        "Threat level: Minimal",
        "Vibe check: Passed ✅",
        `Screen: ${window.innerWidth}x${window.innerHeight}`,
        `Browser: ${navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Safari") ? "Safari" : "Unknown"}`,
        "Coffee level: Needs refill",
        "Status: Curious 🧐",
      ];
      for (const t of traits) {
        addLine(`  ${t}`, "line-output");
        await sleep(200);
      }
      addLine("");
    },

    flip() {
      addLine("(╯°□°)╯︵ ┻━┻", "line-output");
      shake();
    },

    unflip() {
      addLine("┬─┬ノ( º _ ºノ)", "line-output");
    },

    shrug() {
      addLine("¯\\_(ツ)_/¯", "line-output");
    },

    lenny() {
      addLine("( ͡° ͜ʖ ͡°)", "line-output");
    },

    async "wake up"() {
      glitch();
      await sleep(300);
      glitch();
      addLine("Wake up, Neo...", "line-success");
      await sleep(1000);
      addLine("The Matrix has you...", "line-success");
      await sleep(1000);
      addLine("Follow the white rabbit. 🐇", "line-success");
      await sleep(500);
      startMatrix();
      await sleep(4000);
      stopMatrix();
    },

    ascii() {
      addLine("");
      ASCII_LOGO.forEach(l => addLine(l, "line-ascii"));
      addLine("");
    },

    skull() {
      addLine("");
      ASCII_SKULL.forEach(l => addLine(l, "line-ascii"));
      addLine("  ☠️  Memento mori  ☠️", "line-output");
      addLine("");
    },

    man(args) {
      if (!args) {
        addLine("What manual page do you want?", "line-error");
        return;
      }
      addLine(`No manual entry for '${args}'.`, "line-output");
      addLine("This is a website. Google it.", "line-warning");
    },

    top() {
      addLine("PID   USER     CPU%  MEM%  COMMAND", "line-info");
      addLine("1     paul     420%  69%   overthinking", "line-output");
      addLine("2     paul     100%  50%   coding", "line-output");
      addLine("3     paul     80%   30%   coffee-daemon", "line-output");
      addLine("4     paul     60%   20%   procrastinating", "line-output");
      addLine("5     paul     40%   10%   existential-dread", "line-output");
    },

    uptime() {
      const start = new Date(2024, 0, 1);
      const now = new Date();
      const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      addLine(`up ${days} days, load average: too damn high`, "line-output");
    },

    whoisthere() {
      addLine("Just you and the blinking cursor. 👀", "line-output");
    },

    async thanos() {
      addLine("*snap* 💎", "line-warning");
      await sleep(500);
      const lines = output.querySelectorAll(".line");
      const toRemove = Array.from(lines).filter(() => Math.random() > 0.5);
      for (const line of toRemove) {
        line.style.transition = "opacity 1s";
        line.style.opacity = "0";
      }
      await sleep(1200);
      toRemove.forEach(l => l.remove());
      addLine("Perfectly balanced, as all things should be.", "line-info");
    },
  };

  // ── boot sequence ───────────────────────────────────────

  async function bootSequence() {
    const lines = [
      { text: "BIOS v4.2.0 — pcailly personal terminal", cls: "line-output", delay: 100 },
      { text: "Checking memory... 640K ought to be enough for anybody", cls: "line-output", delay: 200 },
      { text: "Loading personality module... [OK]", cls: "line-success", delay: 150 },
      { text: "Mounting /dev/coffee... [OK]", cls: "line-success", delay: 100 },
      { text: "Starting vibes daemon... [OK]", cls: "line-success", delay: 150 },
      { text: "", cls: "line-output", delay: 50 },
    ];

    for (const l of lines) {
      const div = document.createElement("div");
      div.className = `line ${l.cls} boot-line`;
      div.textContent = l.text;
      output.appendChild(div);
      scrollBottom();
      await sleep(l.delay);
    }

    ASCII_LOGO.forEach(l => {
      const div = document.createElement("div");
      div.className = "line line-ascii boot-line";
      div.textContent = l;
      output.appendChild(div);
    });
    scrollBottom();

    await sleep(300);
    addLine("");
    addLine('Welcome! Type "help" to see available commands.', "line-info");
    addLine("");

    // Show links on boot
    commands.links();
    scrollBottom();
    input.focus();
  }

  // ── command processing ──────────────────────────────────

  async function processCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    commandCount++;
    history.push(trimmed);
    historyIndex = history.length;

    addCmd(trimmed);
    scrollBottom();

    // Parse command and args
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    // Check for full-string matches first (e.g., "rm -rf /", "wake up")
    const fullLower = trimmed.toLowerCase();

    if (fullLower === "rm -rf /" || fullLower === "rm -rf /*" || fullLower.startsWith("rm -rf")) {
      await commands["rm"](trimmed.slice(3));
    } else if (fullLower === "wake up" || fullLower === "wake up neo") {
      await commands["wake up"]();
    } else if (fullLower === "sudo rm -rf /") {
      shake();
      addLine("😱 WITH SUDO?! You absolute maniac.", "line-error");
      await rmrf();
    } else if (commands[cmd]) {
      await commands[cmd](args);
    } else if (cmd === "sudo" && args) {
      sudo(args);
    } else if (fullLower === "make me a sandwich") {
      addLine("What? Make it yourself.", "line-error");
    } else if (fullLower === "sudo make me a sandwich") {
      addLine("🥪 Okay.", "line-success");
    } else if (fullLower.startsWith("say ")) {
      const msg = trimmed.slice(4);
      cowsay(msg);
    } else {
      addLine(`command not found: ${cmd}`, "line-error");
      addLine(`Type 'help' for available commands.`, "line-output");
    }

    scrollBottom();
  }

  // ── input handling ──────────────────────────────────────

  input.addEventListener("input", () => {
    inputDisplay.textContent = input.value;
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = input.value;
      input.value = "";
      inputDisplay.textContent = "";
      await processCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
        inputDisplay.textContent = input.value;
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex];
        inputDisplay.textContent = input.value;
      } else {
        historyIndex = history.length;
        input.value = "";
        inputDisplay.textContent = "";
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const partial = input.value.toLowerCase();
      if (!partial) return;
      const match = Object.keys(commands).find(c => c.startsWith(partial));
      if (match) {
        input.value = match;
        inputDisplay.textContent = match;
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      commands.clear();
    }

    // Konami code detection
    konamiBuffer.push(e.key);
    if (konamiBuffer.length > 10) konamiBuffer.shift();
    if (konamiBuffer.join(",") === KONAMI.join(",")) {
      konamiBuffer = [];
      fireworks(30);
      addLine("");
      addLine("🎮 KONAMI CODE ACTIVATED!", "line-rainbow");
      addLine("You are a person of exquisite taste.", "line-success");
      addLine("+30 lives. Not that you needed them.", "line-output");
      addLine("");
      scrollBottom();
    }
  });

  // Keep focus on input
  document.addEventListener("click", () => input.focus());
  document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
      input.focus();
    }
  });

  // Resize matrix canvas
  window.addEventListener("resize", () => {
    if (matrixRunning) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });

  // ── init ────────────────────────────────────────────────
  bootSequence();
})();
