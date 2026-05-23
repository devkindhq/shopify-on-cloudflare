#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"

echo "=== Cloudflare Shopify Starter — Frontend Build ==="

if [[ ! -f "${ENV_FILE}" ]]; then
  echo ""
  echo "ERROR: .env not found at ${ENV_FILE}"
  echo ""
  echo "Create it from .env.example and fill in the real values:"
  echo "  cp ${PROJECT_ROOT}/.env.example ${ENV_FILE}"
  echo ""
  echo "Required:"
  echo "  VITE_SHOPIFY_CLIENT_ID=your_actual_client_id"
  echo ""
  exit 1
fi

CLIENT_ID=$(grep '^VITE_SHOPIFY_CLIENT_ID=' "${ENV_FILE}" | cut -d'=' -f2 || true)
if [[ -z "${CLIENT_ID}" ]]; then
  echo ""
  echo "ERROR: VITE_SHOPIFY_CLIENT_ID is not set in ${ENV_FILE}"
  echo "Add it: VITE_SHOPIFY_CLIENT_ID=your_actual_client_id"
  echo ""
  exit 1
fi

echo "Found VITE_SHOPIFY_CLIENT_ID (length=${#CLIENT_ID})"

echo ""
echo "=== Building frontend ==="
cd "${PROJECT_ROOT}"
NODE_ENV=production npx vite build

echo ""
echo "=== Build complete ==="
echo ""
echo "To deploy: npm run deploy"
