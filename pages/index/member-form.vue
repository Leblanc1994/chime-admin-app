<template>
	<qm-page :title="id ? '编辑会员' : '新增会员'" :busy="saving || deleting">
		<template v-if="id">
			<view v-if="loading" class="qm-skeleton" />
			<view v-else-if="loadError" class="qm-empty">
				<text>会员资料加载失败</text>
				<text>{{ loadError }}</text>
				<qm-button @click="load">重新加载</qm-button>
			</view>
			<template v-else>
				<view v-if="error" class="qm-error" role="alert">{{ error }}</view>
				<qm-member-fields :form="form" />
				<button class="qm-danger-link" :disabled="saving || deleting" @tap="openDelete">
					删除会员
				</button>
			</template>
		</template>
		<template v-if="id" #footer>
			<qm-button :loading="saving" :disabled="loading || deleting || !!loadError" @click="save">
				保存修改
			</qm-button>
		</template>
		<qm-member-business-sheet ref="businessSheet" @closed="router.back()" />
		<qm-confirm
			v-model="deleteVisible"
			title="删除会员？"
			confirm-text="确认删除"
			danger
			:busy="deleting"
			:error="deleteError"
			:message="`将删除 ${loadedName} 的会员档案、关联次卡、消费记录、次卡流水和地址。删除后无法恢复。`"
			@confirm="remove"
		/>
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
import QmConfirm from "./components/qm-confirm.vue";
const { router } = useCool();
const service = new MemberService();
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
const id = ref(0),
	loading = ref(false),
	saving = ref(false),
	error = ref(""),
	loadError = ref(""),
	loadedName = ref("该会员"),
	deleteVisible = ref(false),
	deleteError = ref(""),
	deleting = ref(false);
const form = reactive(newMemberForm());
async function load() {
	loading.value = true;
	loadError.value = "";
	try {
		const data = await service.info({ id: id.value });
		if (!data?.id) throw new Error("未找到该会员");
		loadedName.value = data.name || data.nickName || "该会员";
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
	if (saving.value || deleting.value || loading.value || loadError.value) return;
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
function openDelete() {
	if (saving.value || deleting.value || loading.value || loadError.value) return;
	deleteError.value = "";
	deleteVisible.value = true;
}
async function remove() {
	if (saving.value || deleting.value || loading.value || loadError.value || !id.value) return;
	deleting.value = true;
	deleteError.value = "";
	try {
		const removed = await service.delete({ ids: [id.value] });
		if (removed === false) throw new Error("删除未成功，请刷新会员档案后重试");
		deleteVisible.value = false;
		uni.$emit("chime:members-changed");
		uni.showToast({ title: "会员已删除", icon: "success" });
		router.switchTab("member");
	} catch (e: any) {
		deleteError.value = e?.message || "删除失败，请重试";
	} finally {
		deleting.value = false;
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
