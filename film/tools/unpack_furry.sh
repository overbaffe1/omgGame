#!/usr/bin/env bash
# Собирает exports/furry-ep01.mp4 из архива (когда mp4 нет в рабочей копии).
# Нужен только zip. Работает из корня репозитория.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [ -f exports/furry-ep01.mp4 ]; then
  echo "exports/furry-ep01.mp4 уже на месте"
  exit 0
fi
cd exports
zip -s 0 furry-ep01.zip --out furry-ep01.mp4
echo "готово: exports/furry-ep01.mp4"
