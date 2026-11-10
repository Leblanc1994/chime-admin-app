<template>
	<qm-page title="预约详情" :busy="cancelling || addingCalendar">
		<view v-if="loading" class="qm-skeleton" />
		<view v-else-if="error" class="qm-empty"
			><text>预约加载失败</text><text>{{ error }}</text
			><qm-button @click="load">重新加载</qm-button></view
		>
		<template v-else-if="row">
			<view class="qm-panel appointment-detail" :class="'is-' + row.projectColor"
				><view class="appointment-detail__heading"
					><text>{{ row.customerName }}</text
					><text class="appointment-status">{{
						row.status === 0 ? "已取消" : "已预约"
					}}</text></view
				><text>{{ row.projectName }}</text
				><text>{{ dateLabel(row.startTime.slice(0, 10), true) }}</text
				><text class="appointment-detail__time">{{ appointmentTime(row) }}</text
				><text>{{ durationLabel(row.startTime, row.endTime) }}</text></view
			>
			<view class="qm-panel"
				><view class="qm-kv"
					><text>顾客姓名</text><text>{{ row.customerName }}</text></view
				><view v-if="row.memberId" class="qm-kv"
					><text>预约会员</text
					><text>会员 · {{ row.memberPhone || "未填写手机号" }}</text></view
				><view class="qm-kv"
					><text>预约项目</text><text>{{ row.projectName }}</text></view
				><view class="qm-kv"
					><text>开始时间</text><text>{{ row.startTime.slice(0, 16) }}</text></view
				><view class="qm-kv"
					><text>结束时间</text><text>{{ row.endTime.slice(0, 16) }}</text></view
				><view class="qm-kv"
					><text>预约备注</text
					><text class="appointment-remark">{{ row.remark || "未填写" }}</text></view
				><view v-if="row.cancelledAt" class="qm-kv"
					><text>取消时间</text><text>{{ row.cancelledAt.slice(0, 16) }}</text></view
				></view
			>
			<text class="qm-muted appointment-explanation">{{
				row.status === 0
					? "取消记录已保留，不再显示于日历。"
					: "此日程用于门店预约安排，不会自动扣次或生成消费记录。"
			}}</text>
			<view v-if="row.status === 1 && calendarAvailable" class="appointment-calendar">
				<qm-button
					variant="secondary"
					:loading="addingCalendar"
					loading-text="正在添加…"
					:disabled="cancelling || calendarAdded"
					@click="addCalendar"
				>{{ calendarAdded ? "已添加到手机日历" : "添加到手机日历" }}</qm-button>
				<text class="appointment-calendar__hint">如已添加，请勿重复操作；修改或取消预约后，需自行更新手机日历。</text>
				<text v-if="calendarError" class="qm-error appointment-calendar__error" role="alert">{{ calendarError }}</text>
			</view>
		</template>
		<template v-if="row && !loading && !error && row.status === 1" #footer
			><view class="appointment-detail-actions"
				><view class="appointment-detail-action"
					><qm-button
						variant="secondary"
						:disabled="cancelling || addingCalendar"
						@click="
							cancelVisible = true;
							cancelError = '';
						"
						>取消预约</qm-button
					></view
				><view class="appointment-detail-action"
					><qm-button :disabled="cancelling || addingCalendar" @click="edit">编辑预约</qm-button></view
				></view
			></template
		>
		<qm-confirm
			v-model="cancelVisible"
			title="取消这条预约？"
			confirm-text="确认取消预约"
			cancel-text="保留预约"
			danger
			:busy="cancelling"
			:error="cancelError"
			:message="
				row ? row.customerName + ' · ' + row.projectName + ' · ' + appointmentTime(row) : ''
			"
			@confirm="cancel"
			><view class="qm-notice">取消后从日历中隐藏，预约历史记录仍会保留。</view></qm-confirm
		>
	</qm-page>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import AppointmentService from "../../service/appointment/schedule";
import type { Appointment } from "../../service/appointment/schedule";
import { dateLabel, appointmentTime, durationLabel, appointmentPhoneCalendarEventFromRow, phoneCalendarFailure } from "./utils/appointment";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmConfirm from "./components/qm-confirm.vue";
const { router } = useCool(),
	service = new AppointmentService();
const id = ref(0),
	row = ref<Appointment>(),
	loading = ref(true),
	error = ref("");
const cancelVisible = ref(false),
	cancelling = ref(false),
	cancelError = ref("");
const calendarAvailable = ref(false),
	addingCalendar = ref(false),
	calendarError = ref(""),
	addedCalendarSignature = ref("");
declare const wx: {
	addPhoneCalendar?: (options: ReturnType<typeof appointmentPhoneCalendarEventFromRow> & {
		success: () => void;
		fail: (result: { errMsg?: string }) => void;
	}) => void;
};
function calendarSignature(appointment: Appointment) {
	return JSON.stringify([
		appointment.id,
		appointment.customerName,
		appointment.projectName,
		appointment.startTime,
		appointment.endTime,
		appointment.remark,
	]);
}
const calendarAdded = computed(
	() => !!row.value && addedCalendarSignature.value === calendarSignature(row.value),
);
async function load() {
	loading.value = true;
	error.value = "";
	try {
		const data = (await service.info({ id: id.value })) as Appointment;
		if (!data?.id) throw new Error("预约不存在");
		row.value = data;
	} catch (e: any) {
		error.value = e?.message || "请检查网络后重试";
	} finally {
		loading.value = false;
	}
}
function edit() {
	router.push({ path: "/pages/index/appointment-form", query: { id: id.value } });
}
function addCalendar() {
	const appointment = row.value;
	if (!appointment || appointment.status !== 1 || !calendarAvailable.value || addingCalendar.value || calendarAdded.value) return;
	if (typeof wx === "undefined" || typeof wx.addPhoneCalendar !== "function") {
		calendarError.value = "当前微信版本暂不支持添加到手机日历，请更新微信后重试。";
		return;
	}
	addingCalendar.value = true;
	calendarError.value = "";
	try {
		wx.addPhoneCalendar!({
			...appointmentPhoneCalendarEventFromRow(appointment),
			success: () => {
				addedCalendarSignature.value = calendarSignature(appointment);
				addingCalendar.value = false;
			},
			fail: (result) => {
				calendarError.value = phoneCalendarFailure(result);
				addingCalendar.value = false;
			},
		});
	} catch {
		calendarError.value = "手机日历添加失败，请重试。";
		addingCalendar.value = false;
	}
}
async function cancel() {
	if (cancelling.value || addingCalendar.value) return;
	cancelling.value = true;
	cancelError.value = "";
	try {
		await service.cancel(id.value);
		cancelVisible.value = false;
		uni.$emit("chime:appointments-changed");
		uni.showToast({ title: "预约已取消", icon: "success" });
		router.back();
	} catch (e: any) {
		cancelError.value = e?.message || "取消失败，请重试";
	} finally {
		cancelling.value = false;
	}
}
onLoad((q) => {
	id.value = Number(q?.id) || 0;
	// #ifdef MP-WEIXIN
	calendarAvailable.value = true;
	// #endif
});
onShow(load);
</script>
<style scoped lang="scss">
.appointment-detail {
	padding: 32rpx;
	> text {
		display: block;
		color: var(--qm-muted);
		font-size: 25rpx;
		margin-top: 10rpx;
	}
	&.is-purple {
		background: var(--qm-lilac);
	}
	&.is-gold {
		background: var(--qm-cream);
	}
	&.is-green {
		background: var(--qm-success-bg);
	}
	> .appointment-detail__time {
		font-size: 44rpx;
		font-weight: 700;
		color: var(--qm-deep);
		margin-top: 28rpx;
	}
}
.appointment-detail__heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	> text:first-child {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 40rpx;
		font-weight: 700;
		color: var(--qm-deep);
	}
}
.appointment-status {
	flex-shrink: 0;
	font-size: 23rpx;
	color: var(--qm-brand);
	background: var(--qm-surface);
	border-radius: 40rpx;
	padding: 8rpx 20rpx;
}
.appointment-remark {
	white-space: pre-wrap;
	word-break: break-all;
}
.appointment-explanation {
	display: block;
	font-size: 23rpx;
}
.appointment-calendar {
	margin-top: 30rpx;
}
.appointment-calendar__hint {
	display: block;
	margin-top: 16rpx;
	color: var(--qm-muted);
	font-size: 23rpx;
	line-height: 1.55;
}
.appointment-calendar__error {
	margin-top: 16rpx;
}
.appointment-detail-actions {
	display: flex;
	align-items: stretch;
	width: 100%;
	box-sizing: border-box;
}
// Native views take part in the mini-program flex layout outside component boundaries.
.appointment-detail-action {
	flex: 0 0 48%;
	width: 48%;
	min-width: 0;
	box-sizing: border-box;
}
.appointment-detail-action + .appointment-detail-action {
	margin-left: 4%;
}
</style>
