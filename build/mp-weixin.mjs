import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist/build/mp-weixin");
const require = createRequire(import.meta.url);
const cli = path.join(
	path.dirname(require.resolve("@dcloudio/vite-plugin-uni/package.json")),
	"bin/uni.js",
);

// Always build the production package from this repository's root entry files.
const result = spawnSync(process.execPath, [cli, "build", "-p", "mp-weixin"], {
	cwd: root,
	stdio: "inherit",
	env: {
		...process.env,
		UNI_INPUT_DIR: root,
		UNI_OUTPUT_DIR: output,
	},
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const app = JSON.parse(readFileSync(path.join(output, "app.json"), "utf8"));
const subpackages = (app.subPackages ?? app.subpackages ?? []).map(({ root }) =>
	root.replace(/\/$/, ""),
);
const sizes = new Map([["主包", 0], ...subpackages.map((name) => [name, 0])]);

function measure(directory, prefix = "") {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const filename = path.join(directory, entry.name);
		const relative = prefix + entry.name;
		if (entry.isDirectory()) {
			measure(filename, relative + "/");
		} else if (entry.isFile()) {
			const owner = subpackages.find((name) => relative.startsWith(name + "/")) ?? "主包";
			sizes.set(owner, sizes.get(owner) + statSync(filename).size);
		}
	}
}

// Count raw files conservatively, before WeChat's upload compression.
measure(output);
let oversized = false;
for (const [name, bytes] of sizes) {
	console.log(`${name}: ${(bytes / 1024).toFixed(1)} KB / 2048 KB`);
	if (bytes > 2048 * 1024) oversized = true;
}
if (oversized) {
	console.error("代码包超过 2048 KB，请缩减资源或调整分包后再上传。");
	process.exit(1);
}
console.log(`体积检查通过。请在微信开发者工具中导入并上传：${output}`);
