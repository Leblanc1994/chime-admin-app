import uni from "@dcloudio/vite-plugin-uni"; // ！此依赖不能安装
import { createRequire } from "module";
import path from "path";
import { defineConfig } from "vite";
import { cool } from "@cool-vue/vite-plugin";
import { proxy } from "./config/proxy";
import { resolveProjectDependency } from "./build/vite/resolve-project-dependency.mjs";
import { fixUniH5VueRuntimeSlotFlags } from "./build/vite/strip-vue-slot-flags.mjs";

const require = createRequire(import.meta.url);

// This repo keeps uni-app entry files at the project root instead of `src/`.
if (!process.env.UNI_INPUT_DIR) {
	process.env.UNI_INPUT_DIR = __dirname;
}

function resolve(dir: string) {
	return path.resolve(__dirname, dir);
}

function resolveUniVue(specifier: string) {
	const uniPluginDir = path.dirname(require.resolve("@dcloudio/vite-plugin-uni/package.json"));

	return require.resolve(specifier, {
		paths: [uniPluginDir],
	});
}

const uniVueRuntime = resolveUniVue("@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js");
const uniVuePackage = resolveUniVue("@dcloudio/uni-h5-vue/package.json");

function resolveUniH5Dependency(specifier: string) {
	const uniH5Dir = path.dirname(require.resolve("@dcloudio/uni-h5/package.json"));

	return require.resolve(specifier, {
		paths: [uniH5Dir],
	});
}

const uniVueRouter = resolveUniH5Dependency("vue-router/dist/vue-router.esm-bundler.js");
const uniVueRouterPackage = resolveUniH5Dependency("vue-router/package.json");
const projectPinia = resolveProjectDependency("pinia/dist/pinia.mjs");
const projectVueDemi = resolveProjectDependency("vue-demi/lib/index.mjs");

function fixUniH5VueSlotFlags() {
	return {
		name: "fix-uni-h5-vue-slot-flags",
		enforce: "post" as const,
		transform(code: string, id: string) {
			if (!id.includes("@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js")) {
				return;
			}

			const fixed = fixUniH5VueRuntimeSlotFlags(code);

			if (fixed === code) {
				return;
			}

			return {
				code: fixed,
				map: null,
			};
		},
	};
}

// https://vitejs.dev/config

export default defineConfig(() => {
	const isH5 = !process.env.UNI_PLATFORM || process.env.UNI_PLATFORM === "h5";

	return {
		plugins: [
			uni(),
			...(isH5 ? [fixUniH5VueSlotFlags()] : []),
			cool({
				type: "app",
				proxy:
					process.env.VITE_CHIME_UI_PREVIEW === "1"
						? {
								...proxy,
								"/prod/": {
									...proxy["/preview/"],
									rewrite: (url: string) => url.replace(/^\/prod/, ""),
								},
							}
						: proxy,
			}),
		],
		server: {
			port: 9900,
			proxy,
			hmr: {
				overlay: true,
			},
		},
		resolve: {
			alias: {
				...(isH5
					? {
							vue: uniVueRuntime,
							"vue/package.json": uniVuePackage,
							"vue-router": uniVueRouter,
							"vue-router/package.json": uniVueRouterPackage,
						}
					: {}),
				pinia: projectPinia,
				"vue-demi": projectVueDemi,
				"/@": resolve("./"),
				"/$": resolve("./uni_modules/"),
			},
		},
	};
});
