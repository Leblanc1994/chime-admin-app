<template>
	<qm-page :title="success ? '操作结果' : id ? '编辑散客消费' : '登记散客消费'" :busy="saving"
		><view v-if="loading" class="qm-skeleton" /><view v-else-if="loadError" class="qm-empty"
			><text>资料加载失败</text><text>{{ loadError }}</text
			><qm-button @click="load">重新加载</qm-button></view
		><template v-else-if="success"
			><view class="qm-success"
				><text class="qm-success__mark">✓</text
				><text class="qm-success__title">消费已记录</text
				><text class="qm-muted">本次服务信息已保存</text></view
			><view class="qm-panel"
				><view class="qm-kv"
					><text>顾客</text><text>{{ form.name }}</text></view
				><view class="qm-kv"
					><text>消费类型</text><text>{{ form.consumeType }}</text></view
				><view class="qm-kv"
					><text>消费时间</text><text>{{ form.consumeTime }}</text></view
				></view
			></template
		><template v-else
			><view class="qm-panel"
				><text class="qm-heading">散客资料</text
				><view class="qm-field"
					><text class="qm-label">姓名<text class="qm-required">*</text></text
					><cl-input
						v-model="form.name"
						placeholder="请输入客户姓名"
						:maxlength="30" /></view
				><view class="qm-field"
					><text class="qm-label">手机号</text
					><cl-input v-model="form.phone" placeholder="选填" :maxlength="20" /></view
				><view class="qm-field"
					><text class="qm-label">客户备注</text
					><cl-textarea
						v-model="form.remark"
						placeholder="偏好或注意事项（选填）"
						:maxlength="500"
						auto-height /></view></view
			><view class="qm-panel"
				><text class="qm-heading">本次消费</text
				><view class="qm-field"
					><text class="qm-label">消费类型<text class="qm-required">*</text></text
					><cl-select v-model="form.consumeType" :options="types" /></view
				><view class="qm-field"
					><text class="qm-label">消费时间<text class="qm-required">*</text></text
					><cl-select-date
						v-model="form.consumeTime"
						:mode="dateMode"
						format="YYYY-MM-DD HH:mm" /></view
				><view class="qm-field"
					><text class="qm-label">消费备注</text
					><cl-textarea
						v-model="form.consumeRemark"
						placeholder="服务内容或交接说明（选填）"
						:maxlength="500"
						count
						auto-height /></view></view
			><view v-if="error" class="qm-error" role="alert">{{ error }}</view></template
		><template #footer
			><view v-if="success" class="qm-pair"
				><qm-button variant="secondary" @click="router.switchTab('home')"
					>返回首页</qm-button
				><qm-button @click="records">查看消费记录</qm-button></view
			><qm-button v-else :loading="saving" :disabled="loading || !!loadError" @click="save">{{
				id ? "保存修改" : "保存消费记录"
			}}</qm-button></template
		></qm-page
	>
</template>
<script setup lang="ts">
import { ref, reactive } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import Service from "../../service/member/consume-record";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
const { router } = useCool(),
	service = new Service();
const id = ref(0),
	loading = ref(false),
	saving = ref(false),
	error = ref(""),
	loadError = ref(""),
	success = ref(false);
const form = reactive({
	name: "",
	phone: "",
	remark: "",
	consumeType: "抖音新客福利",
	consumeTime: dayjs().format("YYYY-MM-DD HH:mm"),
	consumeRemark: "",
});
const dateMode = ["year", "month", "date", "hour", "minute"],
	types = ["抖音新客福利", "美团团购", "纹绣", "眼线"].map((value) => ({ label: value, value }));
function records() {
	router.push({ path: "/pages/index/consume-statistics", mode: "redirectTo" });
}
async function load() {
	if (!id.value) return;
	loading.value = true;
	loadError.value = "";
	try {
		const row: any = await service.info({ id: id.value });
		if (!row?.id || row.customerType !== "guest") throw new Error("未找到散客消费记录");
		Object.assign(form, {
			name: row.memberName || row.memberNickName || row.name || "",
			phone: row.memberPhone || row.phone || "",
			remark: row.memberRemark || row.customerRemark || "",
			consumeType: row.consumeType,
			consumeTime: dayjs(row.consumeTime).format("YYYY-MM-DD HH:mm"),
			consumeRemark: row.remark || "",
		});
	} catch (e: any) {
		loadError.value = e?.message || "加载失败";
	} finally {
		loading.value = false;
	}
}
async function save() {
	if (saving.value || loading.value || loadError.value) return;
	error.value = "";
	if (!form.name.trim()) error.value = "请填写客户姓名";
	else if (!types.some((t) => t.value === form.consumeType)) error.value = "请选择消费类型";
	else if (!form.consumeTime || !dayjs(form.consumeTime).isValid())
		error.value = "请选择有效的消费时间";
	if (error.value) return;
	saving.value = true;
	try {
		const payload = {
			...form,
			name: form.name.trim(),
			phone: form.phone.trim(),
			remark: form.remark.trim(),
			consumeRemark: form.consumeRemark.trim(),
			consumeTime: dayjs(form.consumeTime).format("YYYY-MM-DD HH:mm:ss"),
		};
		if (id.value) await service.updateGuestConsume({ id: id.value, ...payload });
		else await service.addGuestConsume(payload);
		uni.$emit("chime:consumes-changed");
		if (id.value) {
			uni.showToast({ title: "消费已保存", icon: "success" });
			router.back();
		} else success.value = true;
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		saving.value = false;
	}
}
onLoad((q) => {
	id.value = Number(q?.id) || 0;
	load();
});
</script>
