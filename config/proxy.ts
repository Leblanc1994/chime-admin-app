import prod from "./prod";

const proxy = {
	// Isolated UI verification only. Selected explicitly by VITE_CHIME_UI_PREVIEW=1.
	"/preview/": {
		target: "http://127.0.0.1:9915",
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/preview/, ""),
	},
	"/dev/": {
		target: "http://127.0.0.1:8001",
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/dev/, ""),
	},

	"/prod/": {
		target: prod.host,
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/prod/, "/api"),
	},
};

const value = "prod";
const host = proxy[`/${value}/`]?.target;

export { proxy, host, value };
