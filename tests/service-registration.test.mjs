import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { merge, orderBy } from "lodash-es";
import { createPinia, defineStore, setActivePinia } from "pinia";
import { ref } from "vue";

const root = fileURLToPath(new URL("../", import.meta.url));

function setup({ failProfile = false } = {}) {
	const calls = [];
	const cache = new Map();
	const modules = new Map();
	const service = {};
	const profile = { id: 7, name: "测试门店", headImg: "/upload/avatar.png" };
	const token = {
		token: "test-token",
		refreshToken: "test-refresh",
		expire: 3600,
		refreshExpire: 7200,
	};
	const storage = {
		info: () => ({}),
		set: (key, value) => cache.set(key, value),
		get: (key) => cache.get(key),
		remove: (key) => cache.delete(key),
	};
	const router = {
		info: () => ({ path: "/pages/user/login" }),
		pages: { login: "/pages/user/login" },
	};
	const eps = {
		service: {
			base: {
				comm: {
					namespace: "app/base/comm",
					upload: { path: "/upload", method: "post" },
					uploadMode: { path: "/uploadMode", method: "get" },
					param: { path: "/param", method: "get" },
				},
			},
		},
	};
	const request = async (options) => {
		calls.push(options);
		if (options.url.endsWith("/admin/base/open/login")) return token;
		if (options.url.endsWith("/admin/base/comm/person")) {
			if (failProfile) throw new Error("登录失效");
			return profile;
		}
		if (options.url.endsWith("/app/base/comm/param")) return "协议正文";
		if (options.url.endsWith("/admin/base/comm/uploadMode")) return { mode: "local" };
		throw new Error(`Unexpected request: ${options.url}`);
	};
	let files = {};
	function load(relative) {
		const filename = path.resolve(root, relative);
		if (modules.has(filename)) return modules.get(filename).exports;
		const module = { exports: {} };
		modules.set(filename, module);
		let source = fs.readFileSync(filename, "utf8");
		source = source.replace(
			/import\.meta\.glob\("\/service\/\*\*\/\*",\s*\{[\s\S]*?\}\)/,
			"__serviceModules",
		);
		source = source.replaceAll("import.meta.hot", "undefined");
		const compiled = ts.transpileModule(source, {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		}).outputText;
		function require(specifier) {
			if (specifier === "lodash-es") return { merge, orderBy };
			if (specifier === "pinia") return { defineStore };
			if (specifier === "vue") return { ref };
			if (specifier === "/@/config" || specifier === "../../config")
				return { isDev: false, config: { baseUrl: "https://www.chime.pink/api" } };
			if (specifier === "/@/locale") return { t: (text) => text };
			if (specifier === "./request" && filename.endsWith("/cool/service/base.ts"))
				return { default: request };
			if (specifier === "/@/cool") return load("cool/service/base.ts");
			if (specifier === "../service") return { service, ...load("cool/service/base.ts") };
			if (specifier === "../utils") return { storage, ...load("cool/utils/comm.ts") };
			if (specifier === "../router") return { router };
			if (specifier === "virtual:eps") return { eps };
			if (specifier.startsWith("."))
				return load(
					path.relative(root, path.resolve(path.dirname(filename), specifier + ".ts")),
				);
			throw new Error(`Unexpected import: ${specifier}`);
		}
		vm.runInNewContext(
			compiled,
			{
				exports: module.exports,
				require,
				__serviceModules: files,
				console: {
					log() {},
					error: (...args) => {
						throw new Error(args.join(" "));
					},
				},
				uni: { getSystemInfoSync: () => ({ platform: "devtools" }), showToast() {} },
			},
			{ filename },
		);
		return module.exports;
	}
	function collect(directory) {
		for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
			const relative = `${directory}/${entry.name}`;
			if (entry.isDirectory()) collect(relative);
			else if (entry.name.endsWith(".ts")) files[`/${relative}`] = load(relative);
		}
	}
	collect("service");
	const { createEps } = load("cool/bootstrap/eps.ts");
	createEps();
	setActivePinia(createPinia());
	const user = load("cool/store/user.ts").useUserStore();
	return { service, user, calls, cache, token, profile, createEps };
}

test("registered login and profile services complete login after EPS initialization", async () => {
	const { service, user, calls, cache, profile } = setup();
	const token = await service.base.open.login({
		username: "test",
		password: "test",
		captchaId: "test",
		verifyCode: "test",
	});
	user.setToken(token);
	await user.get();
	assert.equal(user.token, "test-token");
	assert.equal(user.info.id, profile.id);
	assert.equal(user.info.avatarUrl, profile.headImg);
	assert.equal(cache.get("userInfo").id, profile.id);
	assert.deepEqual(
		calls.map(({ url }) => url),
		[
			"https://www.chime.pink/api/admin/base/open/login",
			"https://www.chime.pink/api/admin/base/comm/person",
		],
	);
});

test("public documents stay separate from admin account and upload services across EPS refreshes", async () => {
	const { service, calls, createEps } = setup();
	createEps();
	assert.equal(await service.base.document.get("privacyPolicy"), "协议正文");
	await service.base.comm.uploadMode();
	for (const method of ["person", "personUpdate", "upload", "logout"])
		assert.equal(typeof service.base.comm[method], "function", method);
	assert.deepEqual(
		calls.map(({ url }) => url),
		[
			"https://www.chime.pink/api/app/base/comm/param",
			"https://www.chime.pink/api/admin/base/comm/uploadMode",
		],
	);
	assert.equal(calls[0].params.key, "privacyPolicy");
});

test("failed profile retrieval clears the new session without a remote logout", async () => {
	const { user, token, calls, cache } = setup({ failProfile: true });
	user.setToken(token);
	await user.get();
	assert.equal(user.token, "");
	assert.equal(user.info, undefined);
	assert.equal(cache.has("token"), false);
	assert.equal(cache.has("refreshToken"), false);
	assert.equal(calls.length, 1);
});
