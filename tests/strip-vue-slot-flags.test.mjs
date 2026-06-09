import test from "node:test";
import assert from "node:assert/strict";
import { fixUniH5VueRuntimeSlotFlags } from "../build/vite/strip-vue-slot-flags.mjs";

test("fixUniH5VueRuntimeSlotFlags makes Vue slot marker writable", () => {
	const source = `
if (type) {
  instance.slots = toRaw(children);
  def(children, '_', type);
}
`;

	const result = fixUniH5VueRuntimeSlotFlags(source);

	assert.match(result, /def\(children, '_', type, true\)/);
	assert.doesNotMatch(result, /def\(children, '_', type\);/);
});

test("fixUniH5VueRuntimeSlotFlags exports logError when uni-h5 imports it from vue", () => {
	const source = `
function logError(err, type, contextVNode, throwInDev = true) {
  console.error(err);
}

export { createApp, handleError, warn };
`;

	const result = fixUniH5VueRuntimeSlotFlags(source);

	assert.match(result, /export \{ createApp, handleError, logError, warn \};/);
});
