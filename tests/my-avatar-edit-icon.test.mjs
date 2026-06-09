import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/tuanzi/Documents/chime/chime-admin-app";

function read(file) {
	return fs.readFileSync(path.join(root, file), "utf8");
}

test("my page avatar edit affordance uses the component library edit icon", () => {
	const source = read("pages/index/my.vue");

	assert.match(source, /<view class="avatar-edit">\s*<cl-icon\s+name="edit"[^>]*\/>\s*<\/view>/);
	assert.doesNotMatch(source, /class="icon-pencil"/);
	assert.doesNotMatch(source, /\.icon-pencil\b/);
});
