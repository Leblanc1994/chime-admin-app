import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist/build/mp-weixin");
const buildDir = path.dirname(output);
const manifestPath = path.join(buildDir, ".mp-weixin-files.json");
const require = createRequire(import.meta.url);
const cli = path.join(
	path.dirname(require.resolve("@dcloudio/vite-plugin-uni/package.json")),
	"bin/uni.js",
);

function listFiles(directory, prefix = "") {
	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const filename = path.join(directory, entry.name);
		const relative = prefix + entry.name;
		if (entry.isDirectory()) {
			files.push(...listFiles(filename, relative + "/"));
		} else if (entry.isFile()) {
			files.push(relative);
		}
	}
	return files;
}

function packageSizes(directory, files) {
	const app = JSON.parse(readFileSync(path.join(directory, "app.json"), "utf8"));
	const subpackages = (app.subPackages ?? app.subpackages ?? []).map(({ root }) =>
		root.replace(/\/$/, ""),
	);
	const sizes = new Map([["主包", 0], ...subpackages.map((name) => [name, 0])]);
	for (const relative of files) {
		const owner = subpackages.find((name) => relative.startsWith(name + "/")) ?? "主包";
		sizes.set(owner, sizes.get(owner) + statSync(path.join(directory, relative)).size);
	}
	return sizes;
}

function publish(staging, files) {
	mkdirSync(output, { recursive: true });
	// Keep app.json available to the DevTools watcher throughout publication.
	for (const relative of files.filter((file) => file !== "app.json")) {
		const destination = path.join(output, relative);
		mkdirSync(path.dirname(destination), { recursive: true });
		renameSync(path.join(staging, relative), destination);
	}
	renameSync(path.join(staging, "app.json"), path.join(output, "app.json"));

	if (existsSync(manifestPath)) {
		const previous = JSON.parse(readFileSync(manifestPath, "utf8"));
		const current = new Set(files);
		for (const relative of previous) {
			if (typeof relative !== "string" || current.has(relative)) continue;
			const stale = path.resolve(output, relative);
			if (stale.startsWith(output + path.sep)) rmSync(stale, { force: true });
		}
	}
	writeFileSync(manifestPath, JSON.stringify(files));
}

function main() {
	mkdirSync(buildDir, { recursive: true });
	const staging = mkdtempSync(path.join(root, ".mp-weixin-staging-"));
	try {
		// Build away from the directory watched by WeChat DevTools.
		const result = spawnSync(process.execPath, [cli, "build", "-p", "mp-weixin"], {
			cwd: root,
			stdio: "inherit",
			env: {
				...process.env,
				UNI_INPUT_DIR: root,
				UNI_OUTPUT_DIR: staging,
			},
		});
		if (result.error) throw result.error;
		if (result.status !== 0) return result.status ?? 1;

		const files = listFiles(staging);
		let oversized = false;
		for (const [name, bytes] of packageSizes(staging, files)) {
			console.log(`${name}: ${(bytes / 1024).toFixed(1)} KB / 2048 KB`);
			if (bytes > 2048 * 1024) oversized = true;
		}
		if (oversized) {
			console.error("代码包超过 2048 KB，请缩减资源或调整分包后再上传。");
			return 1;
		}
		publish(staging, files);
		console.log(`体积检查通过。请在微信开发者工具中导入并上传：${output}`);
		return 0;
	} finally {
		rmSync(staging, { recursive: true, force: true });
	}
}

process.exitCode = main();
