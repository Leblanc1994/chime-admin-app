const RUNTIME_SLOT_DEF_RE = /def\(children, '_', type\);/g;
const LOG_ERROR_FN_RE = /\bfunction\s+logError\s*\(/;
const RUNTIME_EXPORT_RE = /export \{ ([^}]*\bhandleError\b[^}]*) \};/;

export function fixUniH5VueRuntimeSlotFlags(code) {
	let fixed = code.replace(RUNTIME_SLOT_DEF_RE, "def(children, '_', type, true);");

	if (LOG_ERROR_FN_RE.test(fixed) && !/\bexport \{[^}]*\blogError\b[^}]*\};/.test(fixed)) {
		fixed = fixed.replace(RUNTIME_EXPORT_RE, (_match, exports) => {
			const names = exports.split(",").map((name) => name.trim());
			const handleErrorIndex = names.indexOf("handleError");

			if (handleErrorIndex === -1) {
				names.push("logError");
			} else {
				names.splice(handleErrorIndex + 1, 0, "logError");
			}

			return `export { ${names.join(", ")} };`;
		});
	}

	return fixed;
}
