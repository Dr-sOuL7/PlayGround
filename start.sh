#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PROJECT_DIR="$(pwd -P)"
PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"
STATIC_DIR="$PROJECT_DIR/dist"
METADATA_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
export PROJECT_DIR PORT HOST STATIC_DIR

/usr/bin/time -p npm install --ignore-scripts --no-audit --no-fund --package-lock=false
/usr/bin/time -p npm run build
/usr/bin/time -p mkdir -p "$METADATA_DIR"
/usr/bin/time -p node --input-type=module -e '
  import { writeFileSync } from "node:fs";
  import { resolve } from "node:path";
  const project = resolve(process.env.PROJECT_DIR);
  const directory = resolve(process.env.STATIC_DIR);
  if (!directory.startsWith(`${project}/`)) throw new Error("Static output must be inside PROJECT_DIR");
  writeFileSync(`${process.env.OPENCODE_WEB_DIR || "/home/runner/work/_temp/omgithub-web"}/deployment-output.json`, JSON.stringify({ project, directory }));
'
/usr/bin/time -p npm start
