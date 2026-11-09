#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"
: "${RUNTIME_DIR:?RUNTIME_DIR must point to the worker runtime}"
PROJECT_DIR="$(pwd -P)"
CAPTURE_DIR="$(/usr/bin/time -p realpath -m "$CAPTURE_DIR")"
case "$CAPTURE_DIR/" in
  "$PROJECT_DIR/"*) echo 'CAPTURE_DIR must be outside the project source tree.' >&2; exit 1 ;;
esac
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"

CAPTURE_AUTO_START=false \
CAPTURE_READY_SELECTOR='.page-title' \
CAPTURE_STRICT=1 \
/usr/bin/time -p node "${RUNTIME_DIR}/scripts/default-capture.mjs"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-mobile.png"
