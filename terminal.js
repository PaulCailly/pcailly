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
  let partyMode = false;

  const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

  // regex to catch any hack-related command
  const HACK_RE = /\b(hack|hacking|exploit|breach|pentest|nmap|metasploit|sqlinjection|sqli|xss|bruteforce|brute.?force|ddos|payload|shellcode|rootkit|trojan|phishing|keylog|wireshark|burpsuite|hydra|john|hashcat|aircrack|nikto|gobuster|dirbuster|reverse.?shell|backdoor|pwn|0day|zero.?day|inject|overflow|crack|sniff)\b/i;

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
      `<span class="prompt-arrow">➜</span> <span class="prompt-dir">~/pcailly</span> <span class="prompt-git">git:(main)</span> <span class="cmd-text">${escapeHTML(text)}</span>`,
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

  function glitch() {
    terminal.classList.add("glitch");
    setTimeout(() => terminal.classList.remove("glitch"), 300);
  }

  function shake() {
    terminal.classList.add("shake");
    setTimeout(() => terminal.classList.remove("shake"), 500);
  }

  function fireworks(count = 12) {
    const emojis = ["*","**","+","x","#","~","^","!"];
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
      ctx.fillStyle = "#50fa7b";
      ctx.font = "14px Fira Code, monospace";
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 16, drops[i] * 16);
        if (drops[i] * 16 > canvas.height && Math.random() > 0.99) drops[i] = 0;
        drops[i] += 0.4;
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

  // ── reverse hack simulation ─────────────────────────────

  async function reverseHack(originalCmd) {
    terminal.classList.add("hacker");
    scanlines.classList.add("active");

    addLine("");
    await typeText("[ALERT] Unauthorized access attempt detected.", "line-error", 20);
    await sleep(600);
    await typeText("[ALERT] Activating defensive countermeasures.", "line-error", 20);
    await sleep(400);

    startMatrix();
    await sleep(300);

    const fakeIp = `${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    const fakeMac = Array.from({length:6}, () => Math.floor(Math.random()*256).toString(16).padStart(2,"0")).join(":");
    const fakeAsn = `AS${Math.floor(Math.random()*60000)+1000}`;
    const timestamp = new Date().toISOString();

    const steps = [
      { t: `[${timestamp}] TRACE    Backtrace initiated on inbound connection`, c: "line-cyan" },
      { t: `[${timestamp}] TRACE    Source: ${fakeIp}`, c: "line-cyan" },
      { t: `[${timestamp}] TRACE    MAC: ${fakeMac}`, c: "line-cyan" },
      { t: `[${timestamp}] TRACE    ASN: ${fakeAsn}`, c: "line-cyan" },
      { t: `[${timestamp}] TRACE    Reverse DNS: ${["corp-workstation.internal","dev-machine.home.arpa","unknown-host.residential.isp"][Math.floor(Math.random()*3)]}`, c: "line-cyan" },
      { t: `[${timestamp}] SCAN     Port scan on origin host...`, c: "line-pink" },
      { t: `[${timestamp}] SCAN       22/tcp   open   ssh        OpenSSH 8.9`, c: "line-pink" },
      { t: `[${timestamp}] SCAN       80/tcp   open   http       nginx/1.18`, c: "line-pink" },
      { t: `[${timestamp}] SCAN       3306/tcp open   mysql      5.7.42 (unauthenticated)`, c: "line-pink" },
      { t: `[${timestamp}] SCAN       8080/tcp open   http-proxy (misconfigured)`, c: "line-pink" },
      { t: `[${timestamp}] EXFIL    Extracting fingerprint data...`, c: "line-warning" },
      { t: `[${timestamp}] EXFIL    Browser: ${navigator.userAgent.slice(0, 60)}`, c: "line-warning" },
      { t: `[${timestamp}] EXFIL    Screen: ${window.screen.width}x${window.screen.height}`, c: "line-warning" },
      { t: `[${timestamp}] EXFIL    Platform: ${navigator.platform}`, c: "line-warning" },
      { t: `[${timestamp}] EXFIL    Language: ${navigator.language}`, c: "line-warning" },
      { t: `[${timestamp}] EXFIL    Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`, c: "line-warning" },
      { t: `[${timestamp}] EXFIL    CPU cores: ${navigator.hardwareConcurrency || "unknown"}`, c: "line-warning" },
      { t: `[${timestamp}] ACCESS   Establishing reverse tunnel...`, c: "line-error" },
      { t: `[${timestamp}] ACCESS   Tunnel active on port ${Math.floor(Math.random()*60000)+1024}`, c: "line-error" },
      { t: `[${timestamp}] ACCESS   Enumerating filesystem...`, c: "line-error" },
      { t: `[${timestamp}] ACCESS   Credential harvest in progress`, c: "line-error" },
    ];

    for (const { t, c } of steps) {
      await typeText(t, c, 10);
      scrollBottom();
      await sleep(120);
    }

    await sleep(800);
    glitch();
    await sleep(200);
    glitch();

    addLine("");
    addLine("========================================", "line-error");
    addLine("  COUNTER-INTRUSION COMPLETE", "line-error");
    addLine("  Session logged. Evidence preserved.", "line-error");
    addLine("  Incident ID: " + Math.random().toString(36).slice(2, 14).toUpperCase(), "line-error");
    addLine("========================================", "line-error");

    await sleep(3000);
    addLine("");
    addLine("Relax. None of that was real.", "line-output");
    addLine("But your browser fingerprint above is.", "line-output");
    addLine("");

    await sleep(2000);
    stopMatrix();
    scanlines.classList.remove("active");
    terminal.classList.remove("hacker");
  }

  // ── rm -rf simulation ───────────────────────────────────

  async function rmrf() {
    shake();
    await sleep(200);

    const files = [
      "/usr/bin/life-choices.exe",
      "/home/root/embarrassing-photos/",
      "/var/log/all-my-mistakes.log",
      "/etc/hopes-and-dreams.conf",
      "/home/root/side-projects/definitely-finishing-this-one/",
      "/home/root/.browser-history  (oh no)",
      "/usr/lib/self-esteem.so",
      "/boot/motivation.img",
      "/home/root/Desktop/New Folder (37)/",
      "/dev/social-life",
      "/home/root/node_modules/ (this will take a while)",
    ];

    addLine("Are you insane? Fine, here goes...", "line-error");
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
    addLine("System destroyed. Just kidding, it's a website.", "line-warning");
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
    const train = [
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
    ];

    addLine("You typed 'sl' instead of 'ls'. Classic.", "line-warning");
    addLine("");
    train.forEach(l => addLine(l, "line-ascii"));
    addLine("");
    addLine("choo choo.", "line-output");
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

  // ── commands map ────────────────────────────────────────

  const commands = {
    help() {
      addLine("");
      const cmds = [
        ["whoami", "Who am I?"],
        ["about", "Learn more"],
        ["links", "Socials"],
        ["skills", "Tech stack"],
        ["contact", "Get in touch"],
        ["clear", "Clear"],
      ];
      cmds.forEach(([cmd, desc]) => {
        addHTML(
          `  <span style="color:#50fa7b;min-width:140px;display:inline-block">${escapeHTML(cmd.padEnd(14))}</span><span style="color:#6272a4">${escapeHTML(desc)}</span>`,
          "line-output"
        );
      });
      addLine("");
    },

    whoami() {
      addLine("root", "line-output");
    },

    about() {
      addLine("");
      addLine("Paul Cailly — Paris, France", "line-output");
      addLine("Software Engineer @ Deezer", "line-output");
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
      addLine("Languages    TypeScript, JavaScript, Python", "line-output");
      addLine("Frontend     React, Next.js, Tailwind, Ink", "line-output");
      addLine("Backend      Node.js, NestJS, AWS, GCP", "line-output");
      addLine("Tools        Git, Docker, Nix, Vercel", "line-output");
      addLine("");
    },

    contact() {
      addLine("");
      addLine("hello@pcailly.com", "line-output");
      addLine("github.com/PaulCailly", "line-output");
      addLine("linkedin.com/in/paulcailly", "line-output");
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

    coffee() {
      addLine("");
      ASCII_COFFEE.forEach(l => addLine(l, "line-ascii"));
      addLine("");
      addLine("  Here's your coffee.", "line-output");
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
          addLine("You found the secret file.", "line-warning");
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
      addLine("/root/pcailly", "line-output");
    },

    cd(args) {
      if (!args || args === "~") {
        addLine("Already home.", "line-output");
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

    sudo(args) {
      addLine("You're already root.", "line-success");
    },

    please() {
      addLine("Since you asked nicely...", "line-success");
      addLine("Here, have a cookie.", "line-output");
    },

    weather() {
      const conditions = [
        { icon: "[sun]", text: "Sunny, 24C — Perfect coding weather" },
        { icon: "[rain]", text: "Rainy, 14C — Stay inside and ship code" },
        { icon: "[storm]", text: "Thunderstorm — Your deployment, probably" },
        { icon: "[cloud]", text: "Partly cloudy, 19C — Nice day to push to prod" },
        { icon: "[snow]", text: "Snowing, -2C — Like your test coverage" },
      ];
      const c = conditions[Math.floor(Math.random() * conditions.length)];
      addLine("");
      addLine(`  ${c.icon}  ${c.text}`, "line-output");
      addLine("  Location: The Internet", "line-output");
      addLine("");
    },

    cowsay,

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
      addLine("Good luck getting out.", "line-error");
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
        addLine("FORCE PUSH? On a Friday? Bold move.", "line-error");
        shake();
      } else if (args.includes("push")) {
        addLine("Everything up-to-date (because this is a website)", "line-success");
      } else if (args.includes("pull")) {
        addLine("Already up to date.", "line-success");
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
        addLine("PARTY MODE ACTIVATED", "line-rainbow");
        addLine("Type 'party' again to stop the madness.", "line-output");
      } else {
        document.documentElement.classList.remove("party");
        addLine("Party's over. Back to work.", "line-output");
      }
    },

    async rocket() {
      addLine("");
      ASCII_ROCKET.forEach(l => addLine(l, "line-ascii"));
      addLine("");
      addLine("To infinity and beyond.", "line-rainbow");
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
      addLine("Deploying to production...", "line-info");
      await fakeProgress("Building", 1500);
      await fakeProgress("Testing", 1000);
      await fakeProgress("Deploying", 2000);
      addLine("");
      glitch();
      addLine("[OK] Deployed successfully.", "line-success");
      addLine("   (Not really. But wouldn't that be nice?)", "line-output");
      addLine("");
    },

    async scan() {
      addLine("");
      addLine("Scanning visitor...", "line-info");
      await fakeProgress("Analyzing", 2000);
      addLine("");
      const traits = [
        "Species: Human (probably)",
        "Threat level: Minimal",
        "Vibe check: Passed",
        `Screen: ${window.innerWidth}x${window.innerHeight}`,
        `Browser: ${navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Safari") ? "Safari" : "Unknown"}`,
        "Coffee level: Needs refill",
        "Status: Curious",
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

    skull() {
      addLine("");
      ASCII_SKULL.forEach(l => addLine(l, "line-ascii"));
      addLine("  Memento mori.", "line-output");
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
      addLine("1     root     420%  69%   overthinking", "line-output");
      addLine("2     root     100%  50%   coding", "line-output");
      addLine("3     root     80%   30%   coffee-daemon", "line-output");
      addLine("4     root     60%   20%   procrastinating", "line-output");
      addLine("5     root     40%   10%   existential-dread", "line-output");
    },

    uptime() {
      const start = new Date(2024, 0, 1);
      const now = new Date();
      const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      addLine(`up ${days} days, load average: too damn high`, "line-output");
    },

    async thanos() {
      addLine("*snap*", "line-warning");
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
    const fullLower = trimmed.toLowerCase();

    // Hack regex — catch anything suspicious and reverse-hack them
    if (HACK_RE.test(fullLower)) {
      await reverseHack(trimmed);
      scrollBottom();
      return;
    }

    // Full-string matches
    if (fullLower === "rm -rf /" || fullLower === "rm -rf /*" || fullLower.startsWith("rm -rf")) {
      await commands["rm"](trimmed.slice(3));
    } else if (fullLower === "wake up" || fullLower === "wake up neo") {
      await commands["wake up"]();
    } else if (fullLower === "sudo rm -rf /") {
      shake();
      addLine("WITH SUDO? You absolute maniac.", "line-error");
      await rmrf();
    } else if (commands[cmd]) {
      await commands[cmd](args);
    } else if (cmd === "sudo" && args) {
      commands.sudo(args);
    } else if (fullLower === "make me a sandwich") {
      addLine("What? Make it yourself.", "line-error");
    } else if (fullLower === "sudo make me a sandwich") {
      addLine("Okay.", "line-success");
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

  const inputHint = document.getElementById("input-hint");

  input.addEventListener("input", () => {
    inputDisplay.textContent = input.value;
    inputHint.classList.toggle("hidden", input.value.length > 0);
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = input.value;
      input.value = "";
      inputDisplay.textContent = "";
      inputHint.classList.remove("hidden");
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
      addLine("KONAMI CODE ACTIVATED.", "line-rainbow");
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
