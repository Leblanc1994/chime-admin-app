<template>
	<qm-page title="会员档案">
		<view v-if="loading && !member"
			><view class="qm-skeleton" /><view class="qm-skeleton" /></view
		><view v-if="error" class="qm-error" role="alert"
			>{{ error }}<button class="qm-inline" @tap="load">重新加载</button></view
		>
		<template v-if="member"
			><view class="archive-identity">
				<image
					class="archive-watermark"
					src="/static/business/chime-mark.png"
					mode="aspectFit"
				/>
				<view class="qm-identity"
					><view class="archive-avatar">{{ name.slice(0, 1) }}</view
					><view class="archive-name-copy"
						><view class="archive-name-line"
							><text class="archive-name">{{ name }}</text
							><text class="archive-member-tag">{{
								cards.length ? "持卡会员" : "未开卡"
							}}</text></view
						><text class="archive-phone">{{
							member.phone || "未填写手机号"
						}}</text></view
					><button class="archive-edit" aria-label="编辑会员资料" @tap="editMember">
						<image src="/static/business/v53/edit-light.svg" mode="aspectFit" />
						<text>编辑资料</text>
					</button></view
				>
				<view class="archive-identity-meta"
					><text>来源 {{ sources[member.source] || "未标记" }}</text
					><text
						>最近消费
						{{
							member.lastConsumeTime ? date(member.lastConsumeTime, true) : "暂无"
						}}</text
					></view
				>
			</view>
			<view v-if="member.remark" class="archive-preference"
				><image src="/static/business/v53/message.svg" mode="aspectFit" /><text>{{
					member.remark
				}}</text></view
			>
			<view class="archive-tabs"
				><button
					v-for="t in tabs"
					:key="t.value"
					:class="{ 'is-active': tab === t.value }"
					@tap="switchTab(t.value)"
				>
					{{ t.label }}{{ t.value === "cards" ? " " + cards.length : "" }}
				</button></view
			>
			<template v-if="tab === 'cards'"
				><qm-card
					v-for="card in cards"
					:key="card.id"
					:card="card"
					show-actions
					@manage="manage(card)"
					@deduct="deductCard(card)"
				/>
				<view v-if="!cards.length && !loading && !error" class="qm-empty"
					><text>还没有次卡</text><text>为会员开卡，开始记录每次服务</text
					><qm-button @click="action('openCard')">开通次卡</qm-button></view
				></template
			>
			<template v-else
				><view v-if="tab === 'records'" class="qm-chips"
					><button
						v-for="t in recordTypes"
						:key="t"
						class="qm-chip"
						:class="{ 'is-active': filter === t }"
						@tap="setFilter(t)"
					>
						{{ t || "全部类型" }}
					</button></view
				><view v-if="tab === 'flows'" class="qm-field"
					><text class="qm-label">次卡</text
					><cl-select
						v-model="flowCardId"
						:options="flowCardOptions"
						@change="reloadRows"
				/></view>
				<view v-if="tab === 'sms'" class="qm-chips"
					><button
						v-for="status in smsFilters"
						:key="status.value"
						class="qm-chip"
						:class="{ 'is-active': smsStatus === status.value }"
						@tap="setSmsStatus(status.value)"
					>
						{{ status.label }}
					</button></view
				><view v-if="tab === 'flows'" class="qm-chips"
					><button
						v-for="t in flowTypes"
						:key="t"
						class="qm-chip"
						:class="{ 'is-active': filter === t }"
						@tap="setFilter(t)"
					>
						{{ t || "全部变更" }}
					</button></view
				><view v-if="tab === 'sms'" class="qm-notice"
					>{{ smsSummary?.ready ? "消费通知服务可用" : "消费通知暂不可用"
					}}<text v-if="smsSummary?.latest">
						· 最近通知
						{{
							smsSummary.latest.statusText ||
							smsStatuses[smsSummary.latest.status] ||
							"未知"
						}}</text
					></view
				>
				<view v-if="listLoading && !rows.length" class="qm-skeleton" /><view
					v-if="listError"
					class="qm-error"
					role="alert"
					>{{ listError }}<button class="qm-inline" @tap="fetchRows()">重试</button></view
				>
				<view v-if="rows.length" class="qm-panel archive-list"
					><template v-for="row in rows" :key="row.id"
						><button v-if="tab === 'records'" class="qm-row" @tap="recordDetail(row)">
							<view class="qm-row__copy"
								><text
									>{{ row.consumeType || "消费记录"
									}}<text
										v-if="row.consumeType === '会员次卡'"
										class="archive-count"
										>−{{ row.consumeTimes }} 次</text
									></text
								><text
									>{{ row.cardName || "非次卡消费" }} ·
									{{ date(row.consumeTime) }}</text
								><text v-if="row.remark">{{ row.remark }}</text></view
							><image
								class="qm-chevron"
								src="/static/business/v53/chevron.svg"
							/></button
						><view v-else-if="tab === 'flows'" class="qm-row"
							><view class="qm-row__copy"
								><text>{{ row.changeType }} · {{ row.cardName || "次卡" }}</text
								><text
									>{{ date(row.createTime) }} · {{ row.beforeTimes ?? "—" }} →
									{{ row.afterTimes ?? "—" }} 次</text
								><text v-if="row.remark">{{ row.remark }}</text></view
							><text class="archive-count"
								>{{ row.changeTimes > 0 ? "+" : ""
								}}{{ row.changeTimes ?? "—" }} 次</text
							></view
						><view v-else class="qm-row"
							><view class="qm-row__copy"
								><text>{{ row.phone || member.phone || "消费通知" }}</text
								><text>{{ date(row.lastSendTime || row.createTime) }}</text
								><text v-if="row.reason">{{ row.reason }}</text></view
							><text
								class="qm-tag"
								:class="{
									'is-success': row.sendStatus === 1,
									'is-danger': row.sendStatus === 2,
								}"
								>{{ smsStatuses[row.sendStatus] || "未知" }}</text
							></view
						></template
					></view
				>
				<view v-else-if="!listLoading && !listError" class="qm-empty"
					><text>{{
						tab === "records"
							? "还没有消费记录"
							: tab === "flows"
								? "还没有次卡流水"
								: "还没有短信记录"
					}}</text
					><text>{{
						filter || flowCardId || smsStatus !== -1
							? "更换筛选条件后再试"
							: "完成业务后，记录会显示在这里"
					}}</text></view
				><button
					v-if="rows.length < total"
					class="qm-inline"
					:disabled="listLoading"
					@tap="more"
				>
					{{ listLoading ? "正在加载…" : "加载更多" }}
				</button> </template
			><button
				class="archive-more"
				:aria-expanded="profileVisible"
				@tap="profileVisible = !profileVisible"
			>
				{{ profileVisible ? "收起会员资料" : "查看会员资料" }}
			</button>
			<view v-if="profileVisible" class="qm-panel archive-contact"
				><view class="qm-kv"
					><text>微信昵称</text><text>{{ member.nickName || "未填写" }}</text></view
				><view class="qm-kv"
					><text>微信号</text><text>{{ member.wechatNo || "未填写" }}</text></view
				><view class="qm-kv"
					><text>性别</text
					><text>{{ ["未知", "男", "女"][member.gender || 0] }}</text></view
				><view class="qm-kv"
					><text>加入时间</text><text>{{ date(member.createTime, true) }}</text></view
				><button
					class="qm-danger-link"
					@tap="
						deleteError = '';
						deleteVisible = true;
					"
				>
					删除会员
				</button></view
			>
		</template>
		<template #footer
			><view v-if="member" class="archive-footer"
				><qm-button variant="secondary" @click="action('openCard')"
					>＋ 为会员开卡</qm-button
				></view
			><qm-button v-else variant="secondary" @click="router.switchTab('member')"
				>返回会员列表</qm-button
			></template
		>
		<qm-confirm
			v-model="deleteVisible"
			title="删除会员？"
			confirm-text="确认删除"
			danger
			:busy="deleting"
			:error="deleteError"
			:message="
				'将删除 ' + name + ' 的会员档案，此操作无法撤销。有关联业务时，以系统校验结果为准。'
			"
			@confirm="remove"
		/>
		<qm-member-business-sheet ref="businessSheet" @saved="load" />
	</qm-page>
</template>
<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import MemberService from "../../service/member/info";
import CardService from "../../service/member/card-account";
import FlowService from "../../service/member/card-flow";
import RecordService from "../../service/member/consume-record";
import SmsService from "../../service/member/consume-notice-sms";
import QmMemberBusinessSheet from "./components/qm-member-business-sheet.vue";
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmCard from "./components/qm-card.vue";
import QmConfirm from "./components/qm-confirm.vue";
const { router } = useCool(),
	members = new MemberService(),
	cardService = new CardService(),
	flowService = new FlowService(),
	recordService = new RecordService(),
	smsService = new SmsService();
const id = ref(0),
	member = ref<any>(null),
	summary = ref<any>(null),
	profileVisible = ref(false),
	cards = ref<any[]>([]),
	smsSummary = ref<any>(),
	tab = ref("cards"),
	loading = ref(false),
	error = ref(""),
	rows = ref<any[]>([]),
	listLoading = ref(false),
	listError = ref(""),
	total = ref(0),
	page = ref(1),
	filter = ref(""),
	deleteVisible = ref(false),
	deleteError = ref(""),
	deleting = ref(false);
let dirty = false,
	initialized = false,
	generation = 0;
const flowCardId = ref(0),
	smsStatus = ref(-1);
const flowCardOptions = computed(() => [
	{ label: "全部次卡", value: 0 },
	...cards.value.map((card) => ({ label: card.cardName || "会员次卡", value: card.id })),
]);
const name = computed(() => member.value?.name || member.value?.nickName || "未命名会员");
const sources = { 1: "抖音", 2: "美团", 3: "朋友介绍" },
	tabs = [
		{ label: "次卡", value: "cards" },
		{ label: "消费记录", value: "records" },
		{ label: "次卡流水", value: "flows" },
		{ label: "短信日志", value: "sms" },
	],
	recordTypes = ["", "会员次卡", "抖音新客福利", "美团团购", "纹绣", "眼线", "美睫"],
	flowTypes = ["", "开卡", "扣次", "补次", "手工调整", "停用", "启用", "作废"],
	smsStatuses = ["发送中", "已发送", "发送失败", "已跳过"];
const smsFilters = [
	{ label: "全部状态", value: -1 },
	...smsStatuses.map((label, value) => ({ label, value })),
];
function date(value?: string, short = false) {
	return value && dayjs(value).isValid()
		? dayjs(value).format(short ? "MM.DD" : "MM.DD HH:mm")
		: "未记录";
}
async function load() {
	if (loading.value) return;
	loading.value = true;
	error.value = "";
	try {
		if (!id.value) throw new Error("缺少会员编号，请返回列表选择");
		const m: any = await members.info({ id: id.value });
		if (!m?.id) throw new Error("未找到该会员");
		member.value = m;
		const results = await Promise.allSettled([
			cardService.list({ memberId: id.value }),
			cardService.summary({ memberId: id.value }),
			smsService.summary({ memberId: id.value }),
			recordService.page({
				memberId: id.value,
				page: 1,
				size: 1,
				order: "consumeTime",
				sort: "desc",
			}),
		]);
		if (results[0].status === "fulfilled") cards.value = (results[0].value || []) as any[];
		else throw results[0].reason;
		if (results[1].status === "fulfilled") summary.value = results[1].value;
		else summary.value = null;
		if (results[2].status === "fulfilled") smsSummary.value = results[2].value;
		member.value.lastConsumeTime =
			results[3].status === "fulfilled"
				? (results[3].value as any)?.list?.[0]?.consumeTime
				: undefined;
		dirty = false;
		if (tab.value !== "cards") await fetchRows();
	} catch (e: any) {
		error.value = e?.message || "会员档案加载失败";
	} finally {
		loading.value = false;
		initialized = true;
	}
}
async function fetchRows(append = false) {
	const seq = ++generation;
	const selected = tab.value;
	if (selected === "cards") return;
	listLoading.value = true;
	listError.value = "";
	try {
		const service =
			selected === "records"
				? recordService
				: selected === "flows"
					? flowService
					: smsService;
		const data: any = await service.page({
			memberId: id.value,
			page: page.value,
			size: 15,
			...(selected === "records"
				? { order: "consumeTime", sort: "desc", consumeType: filter.value || undefined }
				: selected === "flows"
					? {
							cardAccountId: flowCardId.value || undefined,
							changeType: filter.value || undefined,
						}
					: { sendStatus: smsStatus.value === -1 ? undefined : smsStatus.value }),
		});
		if (seq !== generation) return;
		rows.value = append ? [...rows.value, ...(data.list || [])] : data.list || [];
		total.value = data.pagination?.total ?? data.total ?? rows.value.length;
	} catch (e: any) {
		if (seq !== generation) return;
		listError.value = e?.message || "记录加载失败";
		if (append) page.value--;
	} finally {
		if (seq === generation) listLoading.value = false;
	}
}
function switchTab(value: string) {
	if (tab.value === value) return;
	tab.value = value;
	filter.value = "";
	flowCardId.value = 0;
	smsStatus.value = -1;
	rows.value = [];
	total.value = 0;
	page.value = 1;
	fetchRows();
}
function reloadRows() {
	page.value = 1;
	rows.value = [];
	return fetchRows();
}
function setSmsStatus(value: number) {
	smsStatus.value = value;
	reloadRows();
}
function setFilter(value: string) {
	filter.value = value;
	page.value = 1;
	rows.value = [];
	fetchRows();
}
function more() {
	if (listLoading.value) return;
	page.value++;
	fetchRows(true);
}
function action(value: string) {
	if (value === "openCard") return businessSheet.value?.openCard(member.value);
	router.push({
		path: "/pages/index/member-action",
		query: {
			memberId: id.value,
			mode: value === "openCard" ? "openCard" : undefined,
			type: value === "other" ? "other" : undefined,
		},
	});
}
function deductCard(card: any) {
	router.push({
		path: "/pages/index/member-action",
		query: { memberId: id.value, cardId: card.id },
	});
}
function editMember() {
	router.push({ path: "/pages/index/member-form", query: { id: id.value } });
}
function manage(card: any) {
	router.push({
		path: "/pages/index/card-manage",
		query: { memberId: id.value, cardId: card.id },
	});
}
function recordDetail(row: any) {
	router.push({
		path: "/pages/index/consume-detail",
		query: { id: row.id },
		params: {
			record: {
				...row,
				memberId: id.value,
				memberName: name.value,
				memberPhone: member.value.phone,
			},
		},
	});
}
async function remove() {
	if (deleting.value) return;
	deleting.value = true;
	deleteError.value = "";
	try {
		await members.delete({ ids: [id.value] });
		deleteVisible.value = false;
		uni.$emit("chime:members-changed");
		router.switchTab("member");
	} catch (e: any) {
		deleteError.value = e?.message || "删除失败，可能存在关联业务";
	} finally {
		deleting.value = false;
	}
}
function markDirty(changedId?: number) {
	if (!changedId || changedId === id.value) dirty = true;
}
uni.$on("chime:member-changed", markDirty);
uni.$on("chime:members-changed", markDirty);
uni.$on("chime:card-templates-changed", markDirty);
onUnmounted(() => {
	uni.$off("chime:member-changed", markDirty);
	uni.$off("chime:members-changed", markDirty);
	uni.$off("chime:card-templates-changed", markDirty);
});
onShow(() => {
	if (initialized && dirty) load();
});
onLoad(async (q) => {
	id.value = Number(q?.id) || 0;
	await load();
	if (member.value && q?.action) action(q.action);
});
</script>
<style scoped lang="scss">
.archive-identity .archive-edit {
	display: flex;
	align-items: center;
	justify-content: center;
	align-self: flex-start;
	flex-shrink: 0;
	gap: 8rpx;
	min-height: 44px;
	padding: 0 16rpx;
	border-radius: 999rpx;
	background: rgba(253, 249, 255, 0.1);
	color: var(--qm-on-brand);
	font-size: 22rpx;
	white-space: nowrap;
	image {
		width: 26rpx;
		height: 26rpx;
		flex-shrink: 0;
	}
	&:focus-visible {
		outline-color: var(--qm-on-brand);
	}
	&:active {
		background: rgba(253, 249, 255, 0.18);
	}
}
.archive-identity {
	position: relative;
	overflow: hidden;
	border-radius: 46rpx;
	background: linear-gradient(125deg, #39274f, #77539b);
	padding: 34rpx;
	color: var(--qm-on-brand);
	min-height: 210rpx;
	box-sizing: border-box;
	box-shadow: 0 10rpx 34rpx #39274f12;
}
.archive-watermark {
	position: absolute;
	width: 390rpx;
	height: 390rpx;
	right: -110rpx;
	top: -24rpx;
	opacity: 0.13;
	pointer-events: none;
}
.archive-identity .qm-identity {
	position: relative;
	gap: 25rpx;
}
.archive-avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 108rpx;
	height: 108rpx;
	border: 1px solid #e8d4aa;
	border-radius: 50%;
	color: #e8d4aa;
	font-size: 50rpx;
	flex-shrink: 0;
}
.archive-name-copy {
	flex: 1;
	min-width: 0;
}
.archive-name-line {
	display: flex;
	align-items: center;
	gap: 16rpx;
	flex-wrap: wrap;
}
.archive-name {
	font-size: 48rpx;
	font-weight: 700;
	line-height: 1.4;
	overflow-wrap: anywhere;
}
.archive-member-tag {
	color: var(--qm-warning);
	background: var(--qm-cream);
	padding: 5rpx 14rpx;
	font-size: 21rpx;
	border-radius: 999rpx;
}
.archive-phone {
	display: block;
	margin-top: 8rpx;
	font-size: 27rpx;
}
.archive-identity-meta {
	position: relative;
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 28rpx;
	font-size: 22rpx;
	> text:first-child {
		color: #e8d4aa;
	}
}
.archive-preference {
	display: flex;
	align-items: flex-start;
	gap: 14rpx;
	padding: 20rpx 24rpx;
	background: var(--qm-cream);
	border-radius: 23rpx;
	font-size: 24rpx;
	color: var(--qm-muted);
	margin-top: 26rpx;
	image {
		width: 34rpx;
		height: 34rpx;
		flex-shrink: 0;
		margin-top: 3rpx;
	}
}
.archive-tabs {
	display: flex;
	border-bottom: 1px solid var(--qm-line);
	margin: 24rpx 0;
	button {
		position: relative;
		flex: 1;
		min-width: 0;
		min-height: 92rpx;
		padding: 12rpx 4rpx;
		font-size: 25rpx;
		color: var(--qm-muted);
		white-space: nowrap;
	}
	.is-active {
		color: var(--qm-brand);
		font-weight: 500;
		&::before {
			content: "";
			position: absolute;
			height: 4rpx;
			border-radius: 4rpx;
			left: 28%;
			right: 28%;
			bottom: 0;
			background: var(--qm-brand);
		}
	}
}
.archive-list {
	padding: 0 26rpx;
}
.archive-count {
	font-size: 24rpx;
	color: var(--qm-brand);
	margin-left: 16rpx;
	white-space: nowrap;
}
.archive-footer :deep(.qm-button) {
	border: 1px solid var(--qm-brand) !important;
}
.archive-more {
	width: 100%;
	color: var(--qm-muted);
	font-size: 23rpx;
	min-height: 80rpx;
	margin-top: 22rpx;
}
.archive-contact {
	padding: 8rpx 28rpx;
	margin-top: 10rpx;
}
</style>
