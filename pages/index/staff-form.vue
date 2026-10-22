<template>
	<qm-page :title="success ? '操作结果' : id ? '编辑员工' : '新增员工'" :busy="saving">
		<view v-if="loading" class="qm-skeleton" /><view v-else-if="loadError" class="qm-empty"
			><text>员工资料加载失败</text><text>{{ loadError }}</text
			><qm-button @click="load">重新加载</qm-button></view
		>
		<template v-else-if="success">
			<view class="qm-success">
				<text class="qm-success__mark">✓</text>
				<text class="qm-success__title">员工账号已创建</text>
				<text class="qm-muted">可使用新账号登录门店</text>
			</view>
			<view class="qm-panel">
				<view class="qm-kv"
					><text>员工</text><text>{{ form.name }}</text></view
				>
				<view class="qm-kv"
					><text>登录账号</text><text>{{ form.username }}</text></view
				>
				<view class="qm-kv"><text>岗位</text><text>店员</text></view>
			</view>
		</template>
		<template v-else
			><view class="qm-panel"
				><text class="qm-heading">基本资料</text
				><view class="qm-field"
					><text class="qm-label">员工姓名<text class="qm-required">*</text></text
					><cl-input
						v-model="form.name"
						placeholder="请输入员工姓名"
						:maxlength="30" /></view
				><view class="qm-field"
					><text class="qm-label">手机号</text
					><cl-input v-model="form.phone" placeholder="选填" :maxlength="20" /></view
				><view class="qm-field"
					><text class="qm-label">岗位</text><view class="qm-static">店员</view></view
				></view
			>
			<view class="qm-panel"
				><text class="qm-heading">登录账号</text
				><view class="qm-field"
					><text class="qm-label">账号<text class="qm-required">*</text></text
					><cl-input
						v-model="form.username"
						:disabled="!!id"
						placeholder="例如 wangxiaomei"
						:maxlength="32"
					/><text class="qm-hint">字母开头，3–32 位，可含数字、下划线和连字符</text></view
				><view v-if="!id" class="qm-field"
					><text class="qm-label">初始密码<text class="qm-required">*</text></text
					><cl-input
						v-model="form.password"
						:password="true"
						placeholder="至少 6 位"
						:maxlength="64" /></view
				><button v-else class="qm-row" @tap="openPassword">
					<view class="qm-row__copy"
						><text>重置密码</text><text>员工下次登录时使用新密码</text></view
					><image class="qm-chevron" src="/static/business/v53/chevron.svg" /></button
			></view>
			<view class="qm-panel"
				><view class="qm-field"
					><text class="qm-label">备注</text
					><cl-textarea
						v-model="form.remark"
						placeholder="职责或交接信息（选填）"
						:maxlength="200"
						count
						auto-height /></view
			></view>
			<button
				v-if="id"
				class="qm-danger-link"
				@tap="
					statusError = '';
					confirmStatus = true;
				"
			>
				{{ status === 1 ? "停用员工账号" : "启用员工账号" }}</button
			><view v-if="error" class="qm-error" role="alert">{{ error }}</view></template
		>
		<template #footer
			><qm-button v-if="success" @click="router.back()">返回员工管理</qm-button
			><qm-button v-else :loading="saving" :disabled="loading || !!loadError" @click="save">{{
				id ? "保存修改" : "创建员工账号"
			}}</qm-button></template
		>
		<qm-sheet v-model="passwordVisible" title="重置密码" :busy="passwordBusy"
			><view class="qm-notice">{{ form.name }} 将使用新密码重新登录。</view
			><view class="qm-field"
				><text class="qm-label">新密码</text
				><cl-input
					v-model="password"
					:password="true"
					placeholder="至少 6 位"
					:maxlength="64" /></view
			><view class="qm-field"
				><text class="qm-label">确认新密码</text
				><cl-input
					v-model="passwordConfirm"
					:password="true"
					placeholder="再次输入新密码"
					:maxlength="64" /></view
			><view v-if="passwordError" class="qm-error" role="alert">{{ passwordError }}</view
			><template #footer
				><qm-button :loading="passwordBusy" @click="resetPassword"
					>确认重置</qm-button
				></template
			></qm-sheet
		>
		<qm-confirm
			v-model="confirmStatus"
			:title="status === 1 ? '停用员工账号？' : '启用员工账号？'"
			:message="
				status === 1
					? '停用后，' + form.name + ' 将无法登录门店。员工资料仍会保留。'
					: '启用后，' + form.name + ' 可以重新登录门店。'
			"
			:danger="status === 1"
			:busy="statusBusy"
			:error="statusError"
			@confirm="changeStatus"
		/>
	</qm-page>
</template>
<script setup lang="ts">
import { ref, reactive } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import StaffService from "../../service/store/staff";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmSheet from "./components/qm-sheet.vue";
import QmConfirm from "./components/qm-confirm.vue";
const { router } = useCool(),
	service = new StaffService();
const id = ref(0),
	status = ref(1),
	loading = ref(false),
	loadError = ref(""),
	error = ref(""),
	saving = ref(false),
	passwordVisible = ref(false),
	passwordBusy = ref(false),
	password = ref(""),
	passwordConfirm = ref(""),
	passwordError = ref(""),
	confirmStatus = ref(false),
	statusBusy = ref(false),
	statusError = ref(""),
	success = ref(false);
const form = reactive({ name: "", phone: "", username: "", password: "", remark: "" });
async function load() {
	if (!id.value) return;
	loading.value = true;
	loadError.value = "";
	try {
		let row: any;
		const cached = router.params.staff;
		if (cached?.id === id.value) row = cached;
		else {
			let page = 1;
			do {
				const res = await service.page({ page, size: 100 });
				row = res.list.find((r) => r.id === id.value);
				if (row || page * 100 >= res.total || !res.list.length) break;
				page++;
			} while (page < 100);
		}
		if (!row) throw new Error("未找到该员工，请返回列表刷新");
		Object.assign(form, {
			name: row.name || "",
			phone: row.phone || "",
			username: row.username || "",
			remark: row.remark || "",
		});
		status.value = row.status;
	} catch (e: any) {
		loadError.value = e?.message || "加载失败";
	} finally {
		loading.value = false;
	}
}
async function save() {
	if (saving.value || loading.value || loadError.value) return;
	error.value = "";
	if (!form.name.trim()) error.value = "请填写员工姓名";
	else if (!id.value && !/^[A-Za-z][A-Za-z0-9_-]{2,31}$/.test(form.username.trim()))
		error.value = "请填写有效的登录账号";
	else if (!id.value && form.password.length < 6) error.value = "初始密码至少 6 位";
	if (error.value) return;
	saving.value = true;
	try {
		const data = {
			name: form.name.trim(),
			phone: form.phone.trim(),
			remark: form.remark.trim(),
		};
		if (id.value) await service.update({ id: id.value, ...data });
		else
			await service.add({ ...data, username: form.username.trim(), password: form.password });
		uni.$emit("chime:staff-changed");
		if (id.value) {
			uni.showToast({ title: "已保存", icon: "success" });
			router.back();
		} else {
			success.value = true;
			form.password = "";
		}
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		saving.value = false;
	}
}
function openPassword() {
	password.value = "";
	passwordConfirm.value = "";
	passwordError.value = "";
	passwordVisible.value = true;
}
async function resetPassword() {
	if (passwordBusy.value) return;
	passwordError.value = "";
	if (password.value.length < 6) passwordError.value = "新密码至少 6 位";
	else if (password.value !== passwordConfirm.value) passwordError.value = "两次密码不一致";
	if (passwordError.value) return;
	passwordBusy.value = true;
	try {
		await service.resetPassword(id.value, password.value);
		passwordVisible.value = false;
		password.value = "";
		passwordConfirm.value = "";
		uni.showToast({ title: "密码已重置", icon: "success" });
	} catch (e: any) {
		passwordError.value = e?.message || "重置失败，请重试";
	} finally {
		passwordBusy.value = false;
	}
}
async function changeStatus() {
	if (statusBusy.value) return;
	statusBusy.value = true;
	statusError.value = "";
	try {
		const next = status.value === 1 ? 0 : 1;
		await service.updateStatus(id.value, next);
		status.value = next;
		confirmStatus.value = false;
		uni.$emit("chime:staff-changed");
	} catch (e: any) {
		statusError.value = e?.message || "操作失败，请重试";
	} finally {
		statusBusy.value = false;
	}
}
onLoad((q) => {
	id.value = Number(q?.id) || 0;
	load();
});
</script>
