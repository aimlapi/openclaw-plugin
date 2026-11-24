#!/usr/bin/env node
// Copies the AI/ML API agent skills from the published npm package into ./skills.
//
// Source of truth: npm `@ai-ml.api/skills` (built from github.com/aimlapi/skills
// with provenance). The version is pinned in package.json -> aimlapiSkills.version.
// The tarball is checked against the registry's sha512 integrity before use.
//
//   node scripts/sync-skills.mjs          # write ./skills
//   node scripts/sync-skills.mjs --check  # fail if ./skills differs from the pinned release
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const { package: skillsPackage, version } = pkg.aimlapiSkills ?? {};
if (!skillsPackage || !version) {
  throw new Error("package.json is missing aimlapiSkills.package / aimlapiSkills.version");
}
const check = process.argv.includes("--check");
const target = path.join(root, "skills");

const registryUrl = `https://registry.npmjs.org/${skillsPackage.replace("/", "%2f")}/${version}`;
const meta = await (await fetch(registryUrl)).json();
const { tarball, integrity } = meta.dist ?? {};
if (!tarball || !integrity?.startsWith("sha512-")) {
  throw new Error(`No sha512 tarball for ${skillsPackage}@${version}`);
}
const bytes = Buffer.from(await (await fetch(tarball)).arrayBuffer());
const actual = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
if (actual !== integrity) {
  throw new Error(`Integrity mismatch for ${skillsPackage}@${version}: ${actual} != ${integrity}`);
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "aimlapi-skills-"));
try {
  const archive = path.join(work, "skills.tgz");
  fs.writeFileSync(archive, bytes);
  execFileSync("tar", ["-xzf", archive, "-C", work]);
  const extracted = path.join(work, "package", "skills");
  const staged = path.join(work, "staged");
  fs.cpSync(extracted, staged, {
    recursive: true,
    filter: (src) => !/(__pycache__|\.pyc$|\.DS_Store$)/.test(src),
  });
  fs.copyFileSync(path.join(work, "package", "LICENSE"), path.join(staged, "LICENSE"));
  fs.writeFileSync(
    path.join(staged, "SOURCE.json"),
    `${JSON.stringify({ package: skillsPackage, version, integrity }, null, 2)}\n`,
  );

  if (check) {
    const diff = spawnDiff(staged, target);
    if (diff) {
      console.error(`skills/ differs from ${skillsPackage}@${version}:\n${diff}`);
      process.exit(1);
    }
    console.log(`skills/ matches ${skillsPackage}@${version}`);
  } else {
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(staged, target, { recursive: true });
    const names = fs
      .readdirSync(target, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    console.log(`Wrote ${names.length} skills from ${skillsPackage}@${version}: ${names.join(", ")}`);
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

function spawnDiff(a, b) {
  try {
    execFileSync("diff", ["-r", a, b], { stdio: "pipe" });
    return "";
  } catch (error) {
    return String(error.stdout || error.message);
  }
}
