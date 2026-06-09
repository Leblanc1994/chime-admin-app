#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SERVER_HOST="${SERVER_HOST:-www.chime.pink}"
SERVER_USER="${SERVER_USER:-admin}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
REMOTE_TMP_DIR="${REMOTE_TMP_DIR:-/home/admin}"
REMOTE_WEB_ROOT="${REMOTE_WEB_ROOT:-/var/www/chime-admin-app}"
BACKUP_PREFIX="${BACKUP_PREFIX:-/var/www/chime-admin-app.bak}"
BACKUP_KEEP="${BACKUP_KEEP:-5}"
DEFAULT_BUILD_DIR="${PROJECT_ROOT}/dist/build/h5"
FALLBACK_BUILD_DIR="${PROJECT_ROOT}/unpackage/dist/build/web"
BUILD_DIR="${BUILD_DIR:-${DEFAULT_BUILD_DIR}}"

if [[ ! -d "${BUILD_DIR}" && "${BUILD_DIR}" == "${DEFAULT_BUILD_DIR}" ]]; then
	BUILD_DIR="${FALLBACK_BUILD_DIR}"
fi
RELOAD_NGINX="${RELOAD_NGINX:-0}"

timestamp="$(date +%Y%m%d-%H%M%S)"
archive_name="chime-admin-app-web-${timestamp}.tgz"
local_archive="/tmp/${archive_name}"
remote_archive="${REMOTE_TMP_DIR}/${archive_name}"
remote_new_root="${REMOTE_WEB_ROOT}.new-${timestamp}"
remote_backup_root="${BACKUP_PREFIX}-${timestamp}"
ssh_target="${SERVER_USER}@${SERVER_HOST}"

log() {
	printf '[deploy-frontend] %s\n' "$1"
}

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

require_cmd ssh
require_cmd scp
require_cmd tar

if [[ ! -f "${SSH_KEY}" ]]; then
	echo "SSH key not found: ${SSH_KEY}" >&2
	exit 1
fi

if [[ ! -d "${BUILD_DIR}" ]]; then
	echo "Build directory does not exist: ${BUILD_DIR}" >&2
	echo "Please generate the web build first, or override BUILD_DIR." >&2
	exit 1
fi

log "Packing ${BUILD_DIR} -> ${local_archive}"
rm -f "${local_archive}"
tar -czf "${local_archive}" -C "${BUILD_DIR}" .

log "Uploading package to ${ssh_target}:${remote_archive}"
scp -i "${SSH_KEY}" "${local_archive}" "${ssh_target}:${remote_archive}"

log "Switching remote web root"
ssh -i "${SSH_KEY}" "${ssh_target}" "\
	set -euo pipefail; \
	sudo rm -rf '${remote_new_root}'; \
	sudo mkdir -p '${remote_new_root}'; \
	sudo tar -xzf '${remote_archive}' -C '${remote_new_root}'; \
	if [ -d '${REMOTE_WEB_ROOT}' ]; then sudo mv '${REMOTE_WEB_ROOT}' '${remote_backup_root}'; fi; \
	sudo mv '${remote_new_root}' '${REMOTE_WEB_ROOT}'; \
	sudo chown -R ${SERVER_USER}:${SERVER_USER} '${REMOTE_WEB_ROOT}'; \
	sudo find '$(dirname "${BACKUP_PREFIX}")' -maxdepth 1 -type d -name '$(basename "${BACKUP_PREFIX}")-*' | sort | head -n -${BACKUP_KEEP} | xargs -r sudo rm -rf; \
	rm -f '${remote_archive}'"

if [[ "${RELOAD_NGINX}" == "1" ]]; then
	log "Reloading nginx"
	ssh -i "${SSH_KEY}" "${ssh_target}" "sudo nginx -t && sudo systemctl reload nginx"
fi

log "Verifying nginx response"
ssh -i "${SSH_KEY}" "${ssh_target}" "curl -I -sS http://127.0.0.1/ | head -n 5"

log "Frontend deployment completed"
