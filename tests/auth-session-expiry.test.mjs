import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/tuanzi/Documents/chime/chime-admin-app";

function read(file) {
	return fs.readFileSync(path.join(root, file), "utf8");
}

test("request layer handles unauthorized sessions with local logout and rejection", () => {
	const source = read("cool/service/request.ts");

	assert.match(source, /res\.statusCode === 401[\s\S]*remote:\s*false/);
	assert.match(source, /res\.statusCode === 401[\s\S]*reject\(\{/);
	assert.match(source, /storage\.isExpired\("refreshToken"\)[\s\S]*remote:\s*false/);
});

test("user store supports logout without calling backend logout", () => {
	const source = read("cool/store/user.ts");

	assert.match(source, /remote\s*=\s*true/);
	assert.match(source, /if\s*\(!remote\)/);
});
