import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/tuanzi/Documents/chime/chime-admin-app";

function read(file) {
	return fs.readFileSync(path.join(root, file), "utf8");
}

test("custom tabbar renders configured image icons", () => {
	const source = read("pages/index/components/tabbar.vue");

	assert.match(source, /<image\s+:src="item\.icon"\s+mode="aspectFit"\s*\/>/);
	assert.match(source, /icon:\s*"\/"\s+\+\s+\(active\s+\?\s+e\.selectedIconPath\s+:\s+e\.iconPath\)/);
	assert.doesNotMatch(source, /<cl-icon[\s>]/);
	assert.doesNotMatch(source, /getTabIconName/);
});

test("custom tabbar refreshes active tab from current route instead of a setup snapshot", () => {
	const source = read("pages/index/components/tabbar.vue");

	assert.match(source, /const\s+currentPagePath\s*=\s*ref/);
	assert.match(source, /onShow\(\(\)\s*=>\s*\{/);
	assert.match(source, /currentPagePath\.value\s*=\s*normalizePath\(router\.path\)/);
	assert.match(source, /normalizePath\(e\.pagePath\)\s*===\s*currentPagePath\.value/);
	assert.doesNotMatch(source, /const\s+pagePath\s*=\s*router\.path/);
	assert.doesNotMatch(source, /pagePath\?\.includes\(e\.pagePath\)/);
});

test("custom tabbar floats without a full-width footer background or active underline", () => {
	const source = read("pages/index/components/tabbar.vue");

	assert.match(source, /<cl-footer[^>]*background-color="transparent"/);
	assert.doesNotMatch(source, /\.item\s*\.?is-active\s*\{[\s\S]*?&::after/);
	assert.doesNotMatch(source, /background:\s*#1677ff;/);
});
