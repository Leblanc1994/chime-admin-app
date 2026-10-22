<template>
	<view>
		<view class="qm-panel"
			><text class="qm-section-title">微信信息</text
			><view
				v-for="field in wechatFields"
				:key="field.key"
				:id="'member-field-' + field.key"
				class="qm-field"
				><text class="qm-label">{{ field.label }}<text class="qm-required">*</text></text
				><cl-input
					v-model="form[field.key]"
					:placeholder="field.placeholder"
					:maxlength="field.max"
					:adjust-position="!sheet"
					@focus="emit('focus-field', 'member-field-' + field.key)" /></view
			><view class="qm-field"
				><text class="qm-label">客户来源<text class="qm-required">*</text></text
				><cl-select
					v-model="form.source"
					:options="sources"
					:default-first-option="false"
					placeholder="请选择来源" /></view
		></view>
		<view class="qm-panel"
			><text class="qm-section-title">基本资料</text
			><view
				v-for="field in basicFields"
				:key="field.key"
				:id="'member-field-' + field.key"
				class="qm-field"
				><text class="qm-label">{{ field.label }}</text
				><cl-input
					v-model="form[field.key]"
					:placeholder="field.placeholder"
					:maxlength="field.max"
					:adjust-position="!sheet"
					@focus="emit('focus-field', 'member-field-' + field.key)" /></view
			><view class="qm-field"
				><text class="qm-label">性别</text
				><cl-select v-model="form.gender" :options="genders" /></view
			><view class="qm-field"
				><text class="qm-label" id="member-field-remark">会员备注</text
				><cl-textarea
					v-model="form.remark"
					placeholder="记录服务偏好，便于下次接待"
					:maxlength="500"
					count
					auto-height
					:fixed="sheet"
					@focus="emit('focus-field', 'member-field-remark')"
					:adjust-position="!sheet" /></view
		></view>
	</view>
</template>
<script setup lang="ts">
import { memberSources as sources, type MemberForm } from "../utils/member-form";
const emit = defineEmits<{ (e: "focus-field", id: string): void }>();
defineProps<{ form: MemberForm; sheet?: boolean }>();
const wechatFields = [
	{ key: "nickName", label: "微信昵称", placeholder: "请输入微信昵称", max: 50 },
	{ key: "wechatNo", label: "微信号", placeholder: "请输入微信号", max: 50 },
] as const;
const basicFields = [
	{ key: "name", label: "姓名", placeholder: "请输入姓名", max: 30 },
	{ key: "phone", label: "手机号", placeholder: "请输入手机号", max: 20 },
] as const;
const genders = [
	{ label: "未知", value: 0 },
	{ label: "男", value: 1 },
	{ label: "女", value: 2 },
];
</script>
