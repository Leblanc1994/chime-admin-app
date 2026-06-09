import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

export function resolveProjectDependency(specifier) {
	try {
		return require.resolve(specifier);
	} catch {
		const piniaDir = path.dirname(require.resolve("pinia/package.json"));

		return require.resolve(specifier, {
			paths: [piniaDir],
		});
	}
}
