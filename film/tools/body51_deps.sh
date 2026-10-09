#!/usr/bin/env bash
# body51_deps.sh — ставит зависимости офлайн-рендера мультфильма вне репозитория.
#   bash film/tools/body51_deps.sh            # в /tmp/body51-deps
#   DEPS_DIR=~/.cache/body51-deps bash ...    # куда угодно
# Печатает путь, который надо передать в BODY51_DEPS.
set -euo pipefail
DEPS_DIR="${DEPS_DIR:-/tmp/body51-deps}"
mkdir -p "$DEPS_DIR"
cd "$DEPS_DIR"
if [ ! -d node_modules/@napi-rs/canvas ] || [ ! -d node_modules/@ffmpeg-installer ] || [ ! -d node_modules/@ffprobe-installer ]; then
  echo "ставлю @napi-rs/canvas и @ffmpeg-installer/ffmpeg в $DEPS_DIR …" >&2
  npm i --no-audit --no-fund --silent @napi-rs/canvas @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe >&2
fi
echo "$DEPS_DIR/node_modules"
