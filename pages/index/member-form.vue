<template>
	<qm-page :title="id ? '编辑会员' : '新增会员'" :busy="saving">
		<template v-if="id">
			<view v-if="loading" class="qm-skeleton" />
			<view v-else-if="loadError" class="qm-empty"
				><text>会员资料加载失败</text><text>{{ loadError }}</text
				><qm-button @click="load">重新加载</qm-button></view
			>
			<template v-else
				><view v-if="error" class="qm-error" role="alert">{{ error }}</view
				><qm-member-fields :form="form"
			/></template>
		</template>
		<template v-if="id" #footer
			><qm-button :loading="saving" :disabled="loading || !!loadError" @click="save"
				>保存修改</qm-button
			></template
		>
		<qm-member-business-sheet ref="businessSheet" @closed="router.back()" />
	</qm-page>
</template>
<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import MemberService from "../../service/member/info";
import { newMemberForm, memberFormError, memberPayload } from "./utils/member-form";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmMemberFields from "./components/qm-member-fields.vue";
import QmMemberBusinessSheet from "./components/qm-member-business-sheet.vue";
const { router } = useCool();
const service = new MemberService();
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
const id = ref(0),
	loading = ref(false),
	saving = ref(false),
	error = ref(""),
	loadError = ref("");
const form = reactive(newMemberForm());
async function load() {
	loading.value = true;
	loadError.value = "";
	try {
		const data = await service.info({ id: id.value });
		if (!data?.id) throw new Error("未找到该会员");
		Object.assign(form, {
			name: data.name || "",
			phone: data.phone || "",
			nickName: data.nickName || "",
			wechatNo: data.wechatNo || "",
			gender: data.gender ?? 0,
			source: data.source,
			remark: data.remark || "",
		});
	} catch (e: any) {
		loadError.value = e?.message || "请稍后重试";
	} finally {
		loading.value = false;
	}
}
async function save() {
	if (saving.value || loading.value || loadError.value) return;
	error.value = memberFormError(form);
	if (error.value) return;
	saving.value = true;
	try {
		await service.update({ id: id.value, ...memberPayload(form) });
		uni.$emit("chime:members-changed");
		uni.showToast({ title: "已保存", icon: "success" });
		router.back();
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		saving.value = false;
	}
}
onLoad(async (q) => {
	id.value = Number(q?.id) || 0;
	if (id.value) load();
	else {
		await nextTick();
		businessSheet.value?.openCreate();
	}
});
</script>
