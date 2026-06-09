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
