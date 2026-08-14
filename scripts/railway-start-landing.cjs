const http = require("node:http");
const { spawn } = require("node:child_process");

const PUBLIC_PORT = Number(process.env.PORT || 3000);
const ASTRO_PORT = Number(process.env.ASTRO_INTERNAL_PORT || 4300);
const NEXT_PORT = Number(process.env.NEXT_INTERNAL_PORT || 4301);
const INTERNAL_HOST = "127.0.0.1";

const children = [];
let shuttingDown = false;

function spawnService(name, command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`${name} exited unexpectedly`, { code, signal });
      shutdown(code || 1);
    }
  });

  children.push(child);
}

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 250).unref();
}

function routeTarget(req) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;

  if ((path === "/" || path === "") && (url.searchParams.has("code") || url.searchParams.has("token_hash"))) {
    url.pathname = "/ops/auth/confirm";
    if (!url.searchParams.has("next")) url.searchParams.set("next", "/ops");
    return { redirect: url.pathname + url.search };
  }

  if (path === "/ops" || path.startsWith("/ops/") || path.startsWith("/_next/")) {
    return { port: NEXT_PORT };
  }

  return { port: ASTRO_PORT };
}

function proxy(req, res, port) {
  const upstream = http.request(
    {
      host: INTERNAL_HOST,
      port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        "x-forwarded-host": req.headers.host,
        "x-forwarded-proto": req.headers["x-forwarded-proto"] || "https",
      },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );

  upstream.on("error", (error) => {
    console.error("Proxy upstream error", { port, message: error.message });
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("Bad gateway");
  });

  req.pipe(upstream);
}

spawnService("astro", "node", ["apps/marketing/dist/server/entry.mjs"], {
  HOST: INTERNAL_HOST,
  PORT: String(ASTRO_PORT),
});

spawnService("next", "npx", ["next", "start", "-H", INTERNAL_HOST, "-p", String(NEXT_PORT)], {
  HOSTNAME: INTERNAL_HOST,
  PORT: String(NEXT_PORT),
});

const server = http.createServer((req, res) => {
  const target = routeTarget(req);

  if (target.redirect) {
    res.writeHead(307, { location: target.redirect });
    res.end();
    return;
  }

  proxy(req, res, target.port);
});

server.listen(PUBLIC_PORT, "0.0.0.0", () => {
  console.log(`Landing router listening on ${PUBLIC_PORT}; Astro:${ASTRO_PORT}, Next:${NEXT_PORT}`);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
