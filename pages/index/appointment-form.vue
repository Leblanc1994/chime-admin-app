<template>
	<qm-page :title="id ? '编辑预约' : '新增预约'" :busy="saving">
		<view v-if="loading" class="qm-skeleton" />
		<view v-else-if="loadError" class="qm-empty"
			><text>预约资料加载失败</text><text>{{ loadError }}</text
			><qm-button @click="load">重新加载</qm-button></view
		>
		<template v-else>
			<view class="qm-panel appointment-panel">
				<view class="qm-field">
					<view class="appointment-customer-label">
						<text class="qm-label">姓名 <text class="qm-required">*</text></text>
						<button
							class="appointment-member-link"
							:disabled="saving"
							@tap="chooseMember"
						>
							{{ form.memberId ? "更换会员" : "从会员选择" }}
						</button>
					</view>
					<view v-if="form.memberId" class="appointment-member">
						<view class="appointment-member__copy"
							><text>{{ form.customerName }}</text
							><text>会员 · {{ form.memberPhone || "未填写手机号" }}</text></view
						>
						<button
							class="appointment-member-link"
							:disabled="saving"
							@tap="clearAppointmentMember(form)"
						>
							改为手输
						</button>
					</view>
					<cl-input
						v-else
						v-model="form.customerName"
						placeholder="请输入顾客姓名"
						:maxlength="50"
						:disabled="saving"
					/>
				</view>
				<view class="qm-field"
					><text class="qm-label">项目 <text class="qm-required">*</text></text
					><button
						class="appointment-select"
						:disabled="saving"
						@tap="projectVisible = true"
					>
						<text :class="{ placeholder: !project }">{{
							project?.name || "请选择预约项目"
						}}</text
						><image src="/static/business/v53/select-chevron.svg" /></button
				></view>
			</view>
			<view class="qm-panel appointment-panel">
				<view class="qm-field"
					><text class="qm-label">预约日期 <text class="qm-required">*</text></text
					><picker
						mode="date"
						:value="form.date"
						:disabled="saving"
						@change="changeDate($event.detail.value)"
						><view class="appointment-select"
							><text>{{ dateLabel(form.date, true) }}</text
							><image src="/static/business/v53/select-chevron.svg" /></view></picker
				></view>
				<view class="appointment-time-pair">
					<view class="qm-field"
						><text class="qm-label">开始时间 <text class="qm-required">*</text></text
						><button
							class="appointment-select"
							:disabled="saving"
							@tap="openTime('start')"
						>
							<text>{{ form.start }}</text
							><image src="/static/business/v53/select-chevron.svg" /></button
					></view>
					<view class="qm-field"
						><text class="qm-label">结束时间 <text class="qm-required">*</text></text
						><button
							class="appointment-select"
							:disabled="saving"
							@tap="openTime('end')"
						>
							<text>{{ timeLabel(form.endDate + " " + form.end, form.date) }}</text
							><image src="/static/business/v53/select-chevron.svg" /></button
					></view>
				</view>
				<view class="appointment-duration"
					><text class="appointment-duration__badge">{{ duration }}</text
					><text>结束时间自动带出，可调整</text></view
				>
				<picker
					mode="date"
					:value="form.endDate"
					:start="form.date"
					:disabled="saving"
					@change="form.endDate = $event.detail.value"
					><view class="appointment-end-date" role="button" aria-label="调整结束日期"
						>结束日期：{{ form.endDate
						}}{{ form.endDate === form.date ? "（同日）" : "" }}<text>调整</text></view
					></picker
				>
			</view>
			<view class="qm-panel appointment-panel"
				><text class="qm-label">备注（选填）</text
				><cl-textarea
					v-model="form.remark"
					placeholder="记录服务偏好或到店说明"
					:maxlength="500"
					:disabled="saving"
					auto-height
					count
			/></view>
		</template>
		<template #footer
			><view v-if="error" class="qm-error" role="alert">{{ error }}</view
			><qm-button :loading="saving" :disabled="loading || !!loadError" @click="save">{{
				id ? "保存修改" : "保存预约"
			}}</qm-button></template
		>
		<qm-sheet v-model="projectVisible" title="选择项目" :busy="saving">
			<button
				v-for="p in projects"
				:key="p.id"
				class="appointment-project"
				:class="{ selected: form.projectId === p.id }"
				@tap="
					form.projectId = p.id;
					projectVisible = false;
				"
			>
				<view class="appointment-project__dot" :class="'is-' + p.color" /><view
					><text>{{ p.name }}</text
					><text>默认 {{ p.durationMinutes / 60 }} 小时</text></view
				><image v-if="form.projectId === p.id" src="/static/business/v53/check.svg" />
			</button>
		</qm-sheet>
		<qm-sheet v-model="timeVisible" :title="timeField === 'start' ? '开始时间' : '结束时间'">
			<text class="qm-muted appointment-time-date">{{
				dateLabel(timeField === "start" ? form.date : form.endDate)
			}}</text>
			<picker-view
				class="appointment-wheel"
				:value="timeValue"
				indicator-class="appointment-wheel-indicator"
				@change="timeValue = $event.detail.value"
				><picker-view-column
					><view v-for="h in 24" :key="h" class="appointment-wheel__item">{{
						String(h - 1).padStart(2, "0")
					}}</view></picker-view-column
				><picker-view-column
					><view v-for="m in 60" :key="m" class="appointment-wheel__item">{{
						String(m - 1).padStart(2, "0")
					}}</view></picker-view-column
				></picker-view
			>
			<text class="appointment-time-help">{{
				timeField === "start"
					? "结束时间自动设为 " + previewEnd
					: "可单独调整，结束时间需晚于开始时间"
			}}</text>
			<template #footer><qm-button @click="confirmTime">完成</qm-button></template>
		</qm-sheet>
	</qm-page>
</template>
<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import AppointmentService from "../../service/appointment/schedule";
import type { Appointment, AppointmentProject } from "../../service/appointment/schedule";
import {
	newAppointmentForm,
	selectAppointmentMember,
	clearAppointmentMember,
	appointmentFormError,
	appointmentPayload,
	addMinutes,
	durationLabel,
	dateLabel,
	wallTime,
	requestKey,
	timeLabel,
} from "./utils/appointment";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmSheet from "./components/qm-sheet.vue";
const { router } = useCool(),
	service = new AppointmentService();
const form = reactive(newAppointmentForm()),
	id = ref(0),
	projects = ref<AppointmentProject[]>([]);
const loading = ref(true),
	saving = ref(false),
	error = ref(""),
	loadError = ref("");
const projectVisible = ref(false),
	timeVisible = ref(false),
	timeField = ref<"start" | "end">("start"),
	timeValue = ref([13, 0]);
const requestId = requestKey();
const selectionEvent = "chime:appointment-member:" + requestId;
function receiveMember(member: Parameters<typeof selectAppointmentMember>[1]) {
	selectAppointmentMember(form, member);
	error.value = "";
}
uni.$on(selectionEvent, receiveMember);
onUnload(() => uni.$off(selectionEvent, receiveMember));
function chooseMember() {
	if (saving.value) return;
	router.push({
		path: "/pages/index/member-select",
		query: { purpose: "appointment", selectionToken: requestId },
	});
}
const project = computed(() => projects.value.find((p) => p.id === form.projectId));
const duration = computed(() =>
	durationLabel(`${form.date} ${form.start}`, `${form.endDate} ${form.end}`),
);
const pickedTime = computed(() => timeValue.value.map((n) => String(n).padStart(2, "0")).join(":"));
const previewEnd = computed(() => {
	const e = addMinutes(form.date, pickedTime.value);
	return timeLabel(e.date + " " + e.time, form.date);
});
function resetEnd() {
	const e = addMinutes(form.date, form.start);
	form.endDate = e.date;
	form.end = e.time;
}
function changeDate(value: string) {
	form.date = value;
	resetEnd();
}
function openTime(field: "start" | "end") {
	timeField.value = field;
	timeValue.value = form[field].split(":").map(Number);
	timeVisible.value = true;
}
function confirmTime() {
	form[timeField.value] = pickedTime.value;
	if (timeField.value === "start") resetEnd();
	timeVisible.value = false;
}
async function load() {
	loading.value = true;
	loadError.value = "";
	try {
		const [list, row] = await Promise.all([
			service.projects(),
			id.value
				? (service.info({ id: id.value }) as Promise<Appointment>)
				: Promise.resolve(null),
		]);
		projects.value = list;
		if (!list.length) throw new Error("暂无可预约项目，请联系门店管理员");
		if (row) {
			if (row.status !== 1) throw new Error("该预约已取消，无法编辑");
			Object.assign(form, {
				customerName: row.customerName,
				memberId: row.memberId || null,
				memberPhone: row.memberPhone || "",
				projectId: row.projectId,
				date: row.startTime.slice(0, 10),
				start: row.startTime.slice(11, 16),
				endDate: row.endTime.slice(0, 10),
				end: row.endTime.slice(11, 16),
				remark: row.remark || "",
			});
		}
	} catch (e: any) {
		loadError.value = e?.message || "请检查网络后重试";
	} finally {
		loading.value = false;
	}
}
async function save() {
	if (saving.value || loading.value || loadError.value) return;
	error.value = appointmentFormError(form, projects.value);
	if (error.value) return;
	saving.value = true;
	try {
		const payload = appointmentPayload(form);
		if (id.value) await service.update({ id: id.value, ...payload });
		else await service.add({ ...payload, requestId });
		uni.$emit("chime:appointments-changed", { date: form.date });
		uni.showToast({ title: id.value ? "预约已更新" : "预约已保存", icon: "success" });
		router.back();
	} catch (e: any) {
		error.value = e?.message || "保存失败，已保留填写内容，请重试";
	} finally {
		saving.value = false;
	}
}
onLoad((q) => {
	id.value = Number(q?.id) || 0;
	const date = q?.date && Number.isFinite(wallTime(q.date)) ? q.date : form.date;
	const start = q?.start && /^([01]\d|2[0-3]):[0-5]\d$/.test(q.start) ? q.start : form.start;
	Object.assign(form, newAppointmentForm(date, start));
	load();
});
</script>
<style scoped lang="scss">
.appointment-customer-label {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 16rpx;
	.qm-label {
		margin-bottom: 0;
	}
}
.appointment-member-link {
	flex-shrink: 0;
	padding: 10rpx 0 !important;
	font-size: 25rpx;
	line-height: 1.5;
	color: var(--qm-brand);
}
.appointment-member {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 24rpx;
	border-radius: 24rpx;
	background: var(--qm-paper);
	border: 1px solid var(--qm-line);
}
.appointment-member__copy {
	flex: 1;
	min-width: 0;
	text {
		display: block;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	text:first-child {
		font-size: 29rpx;
		color: var(--qm-deep);
	}
	text + text {
		font-size: 23rpx;
		color: var(--qm-muted);
		margin-top: 8rpx;
	}
}
.appointment-panel {
	padding: 30rpx;
	border-radius: 34rpx;
	margin-bottom: 30rpx;
	.qm-field:last-child {
		margin-bottom: 0;
	}
}
.appointment-select {
	width: 100%;
	min-height: 88rpx;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	padding: 18rpx 24rpx;
	background: var(--qm-paper);
	border: 1px solid var(--qm-line);
	border-radius: 24rpx;
	color: var(--qm-muted);
	text-align: left;
	font-size: 27rpx;
	image {
		width: 28rpx;
		height: 28rpx;
		flex-shrink: 0;
	}
	.placeholder {
		color: #a49da9;
	}
}
.appointment-time-pair {
	display: flex;
	gap: 24rpx;
	> view {
		flex: 1;
		min-width: 0;
		margin: 0;
	}
}
.appointment-duration {
	margin-top: 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	font-size: 21rpx;
	color: var(--qm-muted);
}
.appointment-duration__badge {
	padding: 8rpx 18rpx;
	border-radius: 30rpx;
	background: var(--qm-lilac);
	color: var(--qm-brand);
}
.appointment-end-date {
	margin-top: 12rpx;
	min-height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 16rpx;
	font-size: 21rpx;
	color: var(--qm-muted);
	text {
		color: var(--qm-brand);
	}
}
.appointment-project {
	width: 100%;
	padding: 24rpx;
	display: flex;
	align-items: center;
	gap: 24rpx;
	text-align: left;
	margin: 12rpx 0;
	border-radius: 24rpx;
	border: 1px solid var(--qm-line);
	&.selected {
		background: var(--qm-lilac);
		border-color: var(--qm-brand);
	}
	> view + view {
		flex: 1;
		text {
			display: block;
			font-size: 29rpx;
		}
		text + text {
			font-size: 23rpx;
			color: var(--qm-muted);
			margin-top: 4rpx;
		}
	}
	image {
		width: 32rpx;
		height: 32rpx;
	}
}
.appointment-project__dot {
	width: 22rpx;
	height: 22rpx;
	border-radius: 50%;
	&.is-purple {
		background: var(--qm-brand);
	}
	&.is-gold {
		background: var(--qm-warning);
	}
	&.is-green {
		background: var(--qm-success);
	}
}
.appointment-time-date {
	font-size: 24rpx;
}
.appointment-wheel {
	height: 340rpx;
	margin: 24rpx 60rpx;
}
.appointment-wheel__item {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 38rpx;
	color: var(--qm-brand);
}
:deep(.appointment-wheel-indicator) {
	height: 84rpx;
	background: rgba(103, 65, 177, 0.08);
	border-radius: 20rpx;
}
.appointment-time-help {
	font-size: 25rpx;
	color: var(--qm-deep);
	display: block;
	margin: 20rpx 0;
}
</style>
