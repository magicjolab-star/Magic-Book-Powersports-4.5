/**
 * ===================================================================================
 * MAGIC BOOK POWERSPORTS (par Magic app production)
 * Création originale, conception et développement par Jonathan Labelle, PDG.
 * Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
 * Tous droits réservés.
 * ===================================================================================
 */

import {
  cp,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile
} from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const kitRoot = resolve(scriptDirectory, "..");
const overlayRoot = join(kitRoot, "overlay");
const projectRoot = resolve(process.argv[2] || ".");

const LEGAL_JS = `/**
 * ===================================================================================
 * MAGIC BOOK POWERSPORTS (par Magic app production)
 * Création originale, conception et développement par Jonathan Labelle, PDG.
 * Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
 * Tous droits réservés.
 * ===================================================================================
 */

`;

const LEGAL_HTML = `<!--
===================================================================================
MAGIC BOOK POWERSPORTS (par Magic app production)
Création originale, conception et développement par Jonathan Labelle, PDG.
Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
Tous droits réservés.
===================================================================================
-->
`;

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(join(projectRoot, "package.json")))) {
  throw new Error(`package.json absent dans le projet : ${projectRoot}`);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = join(
  projectRoot,
  `.magicbook-v4-backup-${timestamp}`
);

async function backup(relativePath) {
  const source = join(projectRoot, relativePath);
  if (!(await exists(source))) return;

  const destination = join(backupRoot, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

async function copyOverlayDirectory(sourceDirectory, relative = "") {
  for (const entry of await readdir(sourceDirectory, {
    withFileTypes: true
  })) {
    const source = join(sourceDirectory, entry.name);
    const targetRelative = join(relative, entry.name);

    if (targetRelative === "package.playstore.patch.json") {
      continue;
    }

    if (entry.isDirectory()) {
      await copyOverlayDirectory(source, targetRelative);
      continue;
    }

    await backup(targetRelative);

    const destination = join(projectRoot, targetRelative);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination, { force: true });
  }
}

await mkdir(backupRoot, { recursive: true });
await copyOverlayDirectory(overlayRoot);

const packagePath = join(projectRoot, "package.json");
const patchPath = join(overlayRoot, "package.playstore.patch.json");

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
const packagePatch = JSON.parse(await readFile(patchPath, "utf8"));

const mergedPackage = {
  ...packageJson,
  name: packageJson.name || "magic-book-powersports",
  version: "4.0.0",
  private: true,
  engines: {
    ...(packageJson.engines || {}),
    node: "24.x"
  },
  scripts: {
    ...(packageJson.scripts || {}),
    ...packagePatch.scripts
  },
  dependencies: {
    ...(packageJson.dependencies || {}),
    ...packagePatch.dependencies
  },
  devDependencies: {
    ...(packageJson.devDependencies || {}),
    ...packagePatch.devDependencies
  }
};

delete mergedPackage._legal;

const finalPackage = {
  _legal: packagePatch._legal,
  ...mergedPackage
};

await writeFile(
  packagePath,
  JSON.stringify(finalPackage, null, 2) + "\n",
  "utf8"
);

function ensureHtmlLegalHeader(html) {
  if (html.includes("Propriété intellectuelle exclusive de Jonathan Labelle")) {
    return html;
  }

  return LEGAL_HTML + html;
}

function patchHtml(html) {
  let output = ensureHtmlLegalHeader(html);

  output = output
    .replace(/Magic Book Power Sport/gi, "Magic Book Powersports")
    .replace(/Magic Book Powersport(?!s)/gi, "Magic Book Powersports")
    .replace(/content="(?:3|4)\.\d+\.\d+"/g, 'content="4.0.0"')
    .replace(
      /Magic Book Powersports\s+(?:3|4)\.\d+\.\d+/g,
      "Magic Book Powersports 4.0.0"
    )
    .replace(
      /manifest\.webmanifest\?v=\d+/g,
      "manifest.webmanifest?v=400"
    );

  if (!output.includes('name="support-email"')) {
    output = output.replace(
      /<meta\s+name="description"/i,
      '<meta name="support-email" content="Jonathan@magic-app.ca">\n  <meta name="description"'
    );
  }

  if (!output.includes("/style-pro-400.css")) {
    output = output.replace(
      "</head>",
      '  <link rel="stylesheet" href="/style-pro-400.css?v=400">\n</head>'
    );
  }

  if (!output.includes("/native-bridge.js")) {
    output = output.replace(
      "</head>",
      '  <script src="/native-bridge.js?v=400"></script>\n</head>'
    );
  }

  if (!output.includes("/pro-saas-400.js")) {
    output = output.replace(
      "</body>",
      '  <script src="/pro-saas-400.js?v=400" defer></script>\n</body>'
    );
  }

  return output;
}

const index400 = join(projectRoot, "index-400.html");
const index360 = join(projectRoot, "index-360.html");

let activeIndex = "";

if (await exists(index400)) {
  const details = await stat(index400);
  if (details.size > 1000) activeIndex = index400;
}

if (!activeIndex && (await exists(index360))) {
  activeIndex = index360;
}

if (!activeIndex) {
  throw new Error("index-400.html ou index-360.html est obligatoire.");
}

await backup(basename(activeIndex));

const patchedHtml = patchHtml(await readFile(activeIndex, "utf8"));
await writeFile(activeIndex, patchedHtml, "utf8");
await writeFile(index400, patchedHtml, "utf8");

const appPath = join(projectRoot, "app-330.js");

if (await exists(appPath)) {
  await backup("app-330.js");

  let app = await readFile(appPath, "utf8");

  if (!app.includes("Propriété intellectuelle exclusive de Jonathan Labelle")) {
    app = LEGAL_JS + app;
  }

  if (!app.includes("window.MagicBookCore")) {
    const bridge = `window.MagicBookCore=Object.freeze({getCurrentResult(){if(!lastData||!lastPayload)return null;return{data:lastData,payload:lastPayload}},renderSharedResult(data,payload){lastData=data;lastPayload=payload;render(data,payload,false)}});`;
    const initialization = "buildBrands();buildAccessories();";
    const initializationIndex = app.lastIndexOf(initialization);

    if (initializationIndex >= 0) {
      app =
        app.slice(0, initializationIndex) +
        bridge +
        app.slice(initializationIndex);
    } else {
      const closureIndex = app.lastIndexOf("})();");

      if (closureIndex < 0) {
        throw new Error(
          "Impossible d’ajouter le pont MagicBookCore dans app-330.js."
        );
      }

      app =
        app.slice(0, closureIndex) +
        bridge +
        app.slice(closureIndex);
    }
  }

  await writeFile(appPath, app, "utf8");
}

const replacementPairs = [
  [/Théo Récréo/giu, "Magic app production"],
  [/Theo Recreo/giu, "Magic app production"],
  [/theorecreo\.com/giu, "magic-app.ca"],
  [/Jonathan@theorecreo\.com/giu, "Jonathan@magic-app.ca"],
  [/magic\.jolab@gmail\.com/giu, "Jonathan@magic-app.ca"],
  [/Jeff St-Pierre/giu, "Jonathan Labelle"],
  [/Jeff St‑Pierre/giu, "Jonathan Labelle"],
  [/Magic Jolab/giu, "Magic app production"],
  [/Magic Book Power Sport/giu, "Magic Book Powersports"],
  [/Magic Book Powersport(?!s)/giu, "Magic Book Powersports"],
  [/819-623-9445(?:\s*poste\s*223)?/giu, "Jonathan@magic-app.ca"],
  [/819-616-2202/giu, "Jonathan@magic-app.ca"]
];

const textExtensions = new Set([
  ".html",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".css",
  ".json",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".xml",
  ".gradle",
  ".properties",
  ".sql",
  ".webmanifest"
]);

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "www",
  "release",
  basename(kitRoot),
  basename(backupRoot)
]);

const purgeSkipFiles = new Set([
  "scripts/build-capacitor.mjs",
  "scripts/verify-playstore.mjs"
]);

async function purgeDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      await purgeDirectory(path);
      continue;
    }

    if (!textExtensions.has(extname(entry.name).toLowerCase())) {
      continue;
    }

    const projectRelative = relative(projectRoot, path).replace(/\\/g, "/");

    if (purgeSkipFiles.has(projectRelative)) {
      continue;
    }

    let content;

    try {
      content = await readFile(path, "utf8");
    } catch {
      continue;
    }

    let updated = content;

    for (const [pattern, replacement] of replacementPairs) {
      pattern.lastIndex = 0;
      updated = updated.replace(pattern, replacement);
    }

    if (updated !== content) {
      await writeFile(path, updated, "utf8");
    }
  }
}

await purgeDirectory(projectRoot);

const vercelPath = join(projectRoot, "vercel.json");
let vercel = {};

if (await exists(vercelPath)) {
  try {
    vercel = JSON.parse(await readFile(vercelPath, "utf8"));
  } catch {
    throw new Error("vercel.json contient un JSON invalide.");
  }
}

vercel.$schema =
  vercel.$schema || "https://openapi.vercel.sh/vercel.json";

vercel.functions = {
  ...(vercel.functions || {}),
  "api/generate.js": { maxDuration: 60 },
  "api/billing.js": { maxDuration: 30 },
  "api/revenuecat-webhook.js": { maxDuration: 30 },
  "api/pro.js": { maxDuration: 30 },
  "api/lead.js": { maxDuration: 30 }
};

const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];
const rewriteMap = new Map(
  rewrites.map((rewrite) => [rewrite.source, rewrite])
);

rewriteMap.set("/", {
  source: "/",
  destination: "/index-400.html"
});

rewriteMap.set("/index.html", {
  source: "/index.html",
  destination: "/index-400.html"
});

vercel.rewrites = Array.from(rewriteMap.values());

const headers = Array.isArray(vercel.headers) ? vercel.headers : [];
const headerMap = new Map(headers.map((entry) => [entry.source, entry]));

headerMap.set("/sw.js", {
  source: "/sw.js",
  headers: [
    {
      key: "Cache-Control",
      value: "no-cache, no-store, must-revalidate"
    },
    {
      key: "Service-Worker-Allowed",
      value: "/"
    }
  ]
});

headerMap.set("/manifest.webmanifest", {
  source: "/manifest.webmanifest",
  headers: [
    {
      key: "Content-Type",
      value: "application/manifest+json; charset=utf-8"
    },
    {
      key: "Cache-Control",
      value: "no-cache, must-revalidate"
    }
  ]
});

headerMap.set("/api/:path*", {
  source: "/api/:path*",
  headers: [
    {
      key: "Cache-Control",
      value: "no-store, max-age=0"
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff"
    }
  ]
});

for (const [source, entry] of headerMap.entries()) {
  if (source !== "/(.*)") continue;

  const csp = entry.headers?.find(
    (header) => header.key === "Content-Security-Policy"
  );

  if (csp && !csp.value.includes("https://*.supabase.co")) {
    csp.value = csp.value.replace(
      /img-src\s+([^;]+)/,
      (match, values) =>
        `img-src ${values} https://*.supabase.co`
    );
  }
}

vercel.headers = Array.from(headerMap.values());

await writeFile(
  vercelPath,
  JSON.stringify(vercel, null, 2) + "\n",
  "utf8"
);

const gitignorePath = join(projectRoot, ".gitignore");
let gitignore = (await exists(gitignorePath))
  ? await readFile(gitignorePath, "utf8")
  : "";

const ignoreLines = [
  ".env",
  ".env.local",
  ".env.*.local",
  "node_modules/",
  "www/",
  "release/",
  "*.keystore",
  "*.jks",
  ".magicbook-v4-backup-*/"
];

for (const line of ignoreLines) {
  if (!gitignore.split(/\r?\n/).includes(line)) {
    gitignore += `${gitignore.endsWith("\n") || !gitignore ? "" : "\n"}${line}\n`;
  }
}

await writeFile(gitignorePath, gitignore, "utf8");

const envExamplePath = join(projectRoot, ".env.example");
const playstoreEnv = await readFile(
  join(overlayRoot, ".env.playstore.example"),
  "utf8"
);
let envExample = (await exists(envExamplePath))
  ? await readFile(envExamplePath, "utf8")
  : "";

if (!envExample.includes("REVENUECAT_SECRET_API_KEY")) {
  envExample +=
    `${envExample.endsWith("\n") || !envExample ? "" : "\n"}` +
    playstoreEnv;
}

await writeFile(envExamplePath, envExample, "utf8");

console.log("\nMagic Book Powersports 4.0 installé dans :");
console.log(projectRoot);
console.log("\nSauvegarde créée dans :");
console.log(backupRoot);
console.log("\nÉtape suivante : npm install");
