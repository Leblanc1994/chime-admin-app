<template>
	<qm-page title="编辑昵称" :busy="saving"
		><view class="qm-panel"
			><view class="qm-field"
				><text class="qm-label">昵称</text
				><cl-input v-model="nickName" placeholder="请输入昵称" :maxlength="30" /><text
					class="qm-hint"
					>用于门店内的账号展示</text
				></view
			></view
		><view v-if="error" class="qm-error" role="alert">{{ error }}</view
		><template #footer
			><qm-button :loading="saving" @click="save">保存修改</qm-button></template
		></qm-page
	>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useCool, useStore } from "/@/cool";
import QmPage from "../index/components/qm-page.vue";
import QmButton from "../index/components/qm-button.vue";
const { router } = useCool();
const { user } = useStore();
const nickName = ref(user.info?.nickName || ""),
	saving = ref(false),
	error = ref("");
async function save() {
	if (saving.value) return;
	error.value = "";
	if (!nickName.value.trim()) {
		error.value = "请填写昵称";
		return;
	}
	saving.value = true;
	try {
		await user.update({ nickName: nickName.value.trim() });
		uni.showToast({ title: "昵称已更新", icon: "success" });
		router.back();
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		saving.value = false;
	}
}
</script>
