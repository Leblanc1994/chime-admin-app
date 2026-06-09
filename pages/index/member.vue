<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<view class="page-member">
			<view class="member-hero">
				<image class="member-hero__bg" src="/static/member-bg.png" mode="scaleToFill" />

				<view class="member-hero__content">
					<view class="member-hero__top">
						<text class="member-hero__count">
							共 <text class="member-hero__count-value">{{ pagination.total }}</text> 位会员
						</text>
					</view>

					<view class="member-search">
						<cl-icon name="search" :size="42" color="#969ca7" />
						<input
							v-model.trim="filters.keyWord"
							class="member-search__input"
							placeholder="搜索姓名、手机号、微信昵称"
							placeholder-class="member-search__placeholder"
							confirm-type="search"
							@confirm="reload"
						/>

						<view class="member-search__filter" @tap="openFilterPopup">
							<view class="filter-funnel"></view>
							<text class="member-search__badge" v-if="activeFilterCount">{{ activeFilterCount }}</text>
						</view>
					</view>

					<view class="member-hero__filters">
						<scroll-view class="member-tab-scroll" scroll-x>
							<view class="member-tab-group">
								<view
									v-for="item in memberTabOptions"
									:key="item.value"
									class="member-tab-chip"
									:class="{ 'is-active': filters.memberTab === item.value }"
									@tap="setMemberTab(item.value)"
								>
									{{ item.label }}
								</view>
							</view>
						</scroll-view>

						<view class="toolbar__active-bar" v-if="activeFilterPills.length">
							<scroll-view class="toolbar__active-scroll" scroll-x>
								<view class="toolbar__active">
									<text class="active-pill" v-for="item in activeFilterPills" :key="item">
										{{ item }}
									</text>
								</view>
							</scroll-view>

							<text class="toolbar__reset" @tap="resetFilters">重置</text>
						</view>
					</view>
				</view>
			</view>

			<view class="member-list" v-if="list.length">
				<view
					class="member-card"
					v-for="item in list"
					:key="item.id"
					:class="`is-${getCardTone(item)}`"
					@tap="toDetail(item)"
				>
					<view class="member-card__top">
						<view class="member-card__avatar">{{ getInitial(item) }}</view>

						<view class="member-card__body">
							<view class="member-card__name-row">
								<text class="member-card__name">{{ getDisplayName(item) }}</text>
								<view class="member-card__member-mark" v-if="item.validCardCount || item.remainTimes">
									<cl-icon name="my" :size="28" color="#42b978" />
								</view>
							</view>

							<text class="member-card__phone">{{ item.phone || "未绑定手机号" }}</text>

							<view class="member-card__tags">
								<text class="tag-chip" :class="`is-${getGender(item.gender).tone}`">
									{{ getGender(item.gender).label }}
								</text>
								<text class="tag-chip" :class="`is-${getSource(item.source).tone}`">
									{{ getSource(item.source).label }}
								</text>
							</view>
						</view>

						<view class="member-card__stats">
							<view class="member-card__remain">
								<text class="member-card__remain-label">剩余</text>
								<text class="member-card__remain-value">{{ item.remainTimes || 0 }}</text>
								<text class="member-card__remain-unit">张</text>
							</view>
							<text class="member-card__card-count">有效次卡 {{ item.validCardCount || 0 }} 张</text>
						</view>
					</view>

					<view class="member-card__footer">
						<view class="member-card__quick">
							<view class="member-card__action-link" @tap.stop="openUpsert('edit', item)">
								<cl-icon name="edit" :size="30" color="#969ca7" />
								<text>编辑</text>
							</view>
							<view class="member-card__action-link" @tap.stop="removeMember(item)">
								<cl-icon name="delete" :size="30" color="#969ca7" />
								<text>删除</text>
							</view>
						</view>

						<view class="member-card__detail" @tap.stop="toDetail(item)">
							<text class="member-card__detail-text">会员档案</text>
							<cl-icon name="arrow-right" :size="30" color="currentColor" />
						</view>
					</view>
				</view>
			</view>

			<view class="empty-wrap" v-else-if="loaded">
				<cl-empty :fixed="false" text="暂时没有匹配的会员" />
			</view>

			<view class="loading-wrap" v-if="loading && !loaded">
				<cl-loading :size="42" />
				<text class="loading-wrap__text">正在整理会员档案</text>
			</view>

			<view class="list-footer" v-if="loaded && list.length">
				<text>{{ loadText }}</text>
			</view>

			<cl-popup
				v-model="filterPopupVisible"
				title="筛选会员"
				direction="bottom"
				border-radius="36rpx 36rpx 0 0"
				:padding="0"
			>
				<view class="filter-popup">
					<view class="filter-popup__summary">
						<text class="filter-popup__summary-title">按条件筛选会员列表</text>
						<text class="filter-popup__summary-text">
							{{ activeFilterCount ? `当前已启用 ${activeFilterCount} 个条件` : "当前使用默认排序与全量条件" }}
						</text>
					</view>

					<view class="filter-popup__section">
						<text class="toolbar__label">性别</text>

						<view class="chip-group">
							<view
								v-for="item in genderOptions"
								:key="item.value"
								class="chip"
								:class="{ 'is-active': draftFilters.gender === item.value }"
								@tap="draftFilters.gender = item.value"
							>
								{{ item.label }}
							</view>
						</view>
					</view>

					<view class="filter-popup__section">
						<text class="toolbar__label">来源</text>

						<scroll-view class="chip-scroll" scroll-x>
							<view class="chip-group chip-group--nowrap">
								<view
									v-for="item in sourceOptions"
									:key="item.value"
									class="chip"
									:class="{ 'is-active': draftFilters.source === item.value }"
									@tap="draftFilters.source = item.value"
								>
									{{ item.label }}
								</view>
							</view>
						</scroll-view>
					</view>

					<view class="filter-popup__section">
						<text class="toolbar__label">排序</text>

						<scroll-view class="chip-scroll" scroll-x>
							<view class="chip-group chip-group--nowrap">
								<view
									v-for="item in sortOptions"
									:key="item.value"
									class="chip chip--soft"
									:class="{ 'is-active': draftFilters.order === item.value }"
									@tap="draftFilters.order = item.value"
								>
									{{ item.label }}
								</view>
							</view>
						</scroll-view>
					</view>

					<view class="filter-popup__footer">
						<view class="filter-popup__secondary" @tap="resetPopupFilters">重置条件</view>
						<view class="filter-popup__primary" @tap="applyPopupFilters">应用筛选</view>
					</view>
				</view>
			</cl-popup>

			<cl-popup
				v-model="upsertPopupVisible"
				:title="upsertTitle"
				direction="bottom"
				border-radius="36rpx 36rpx 0 0"
				:padding="0"
			>
				<view class="upsert-popup">
					<view class="upsert-popup__summary">
						<text class="upsert-popup__summary-title">{{ upsertTitle }}</text>
						<text class="upsert-popup__summary-text">{{ upsertSummary }}</text>
					</view>

					<scroll-view class="upsert-popup__body" scroll-y>
						<view class="upsert-popup__loading" v-if="formLoading">
							<cl-loading :size="36" />
							<text class="upsert-popup__loading-text">正在准备会员资料</text>
						</view>

						<cl-form
							ref="Form"
							v-model="form"
							:rules="rules"
							:disabled="saving || formLoading"
							label-position="top"
							tips="toast"
						>
							<cl-form-item label="姓名">
								<cl-input
									v-model="form.name"
									placeholder="选填，便于快速识别会员"
									:maxlength="50"
								/>
							</cl-form-item>

							<cl-form-item label="手机号">
								<cl-input
									v-model="form.phone"
									placeholder="选填，用于联系或补充档案"
									:maxlength="20"
								/>
							</cl-form-item>

							<cl-form-item label="微信昵称" prop="nickName">
								<cl-input
									v-model="form.nickName"
									placeholder="请填写微信昵称"
									:maxlength="50"
								/>
							</cl-form-item>

							<cl-form-item label="微信号" prop="wechatNo">
								<cl-input
									v-model="form.wechatNo"
									placeholder="请填写微信号"
									:maxlength="50"
								/>
							</cl-form-item>

							<cl-form-item label="性别">
								<view class="upsert-choice-group upsert-choice-group--gender">
									<view
										v-for="item in genderOptions.filter((e) => e.value > -1)"
										:key="item.value"
										class="upsert-choice"
										:class="{ 'is-active': form.gender === item.value }"
										@tap="form.gender = item.value"
									>
										{{ item.label }}
									</view>
								</view>
							</cl-form-item>

							<cl-form-item label="来源" prop="source">
								<view class="upsert-choice-group upsert-choice-group--source">
									<view
										v-for="item in sourceOptions.filter((e) => e.value > -1)"
										:key="item.value"
										class="upsert-choice"
										:class="{ 'is-active': form.source === item.value }"
										@tap="form.source = item.value"
									>
										{{ item.label }}
									</view>
								</view>
							</cl-form-item>

							<cl-form-item label="备注">
								<cl-textarea
									v-model="form.remark"
									placeholder="填写沟通重点、偏好或其他备注"
									count
									auto-height
									:maxlength="200"
								/>
							</cl-form-item>
						</cl-form>
					</scroll-view>

					<view class="upsert-popup__footer">
						<view class="filter-popup__secondary" @tap="upsertPopupVisible = false">取消</view>
						<view class="filter-popup__primary" @tap="submitUpsert">
							{{ saving ? "保存中..." : popupMode === "add" ? "确认新增" : "保存修改" }}
						</view>
					</view>
				</view>
			</cl-popup>

			<view class="member-fab" @tap="openUpsert('add')">
				<cl-icon name="plus" :size="48" color="#fff" />
			</view>
		</view>

		<tabbar />
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive, ref } from "vue";
import { onPullDownRefresh, onReachBottom, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useUi } from "/$/cool-ui";
import Tabbar from "./components/tabbar.vue";
import MemberInfoService from "../../service/member/info";

type GenderValue = -1 | 0 | 1 | 2;
type SourceValue = -1 | 1 | 2 | 3;
type SortValue = "createTime" | "lastConsumeTime" | "remainTimes" | "validCardCount";
type PopupMode = "add" | "edit";
type MemberTabValue = "all" | "member" | "nonMember";

interface MemberItem {
	id: number;
	name?: string;
	phone?: string;
	nickName?: string;
	wechatNo?: string;
	remark?: string;
	gender?: 0 | 1 | 2;
	source?: 1 | 2 | 3;
	lastConsumeTime?: string;
	remainTimes?: number;
	validCardCount?: number;
	createTime?: string;
	[key: string]: any;
}

interface MemberFormData {
	id?: number;
	name: string;
	phone: string;
	nickName: string;
	wechatNo: string;
	gender: 0 | 1 | 2;
	source: 1 | 2 | 3;
	remark: string;
}

const ui = useUi();
const { router } = useCool();
const service = new MemberInfoService();

const genderOptions = [
	{ label: "全部", value: -1 as GenderValue, tone: "neutral" },
	{ label: "未知", value: 0 as GenderValue, tone: "neutral" },
	{ label: "男", value: 1 as GenderValue, tone: "success" },
	{ label: "女", value: 2 as GenderValue, tone: "danger" },
];

const sourceOptions = [
	{ label: "全部来源", value: -1 as SourceValue, tone: "neutral" },
	{ label: "抖音", value: 1 as SourceValue, tone: "danger" },
	{ label: "美团", value: 2 as SourceValue, tone: "success" },
	{ label: "朋友介绍", value: 3 as SourceValue, tone: "warning" },
];

const sortOptions = [
	{ label: "最新加入", value: "createTime" as SortValue },
	{ label: "最近消费", value: "lastConsumeTime" as SortValue },
	{ label: "剩余次数", value: "remainTimes" as SortValue },
	{ label: "有效次卡", value: "validCardCount" as SortValue },
];

const memberTabOptions = [
	{ label: "全部", value: "all" as MemberTabValue },
	{ label: "会员", value: "member" as MemberTabValue },
	{ label: "非会员", value: "nonMember" as MemberTabValue },
];

const filters = reactive({
	keyWord: "",
	gender: -1 as GenderValue,
	source: -1 as SourceValue,
	order: "createTime" as SortValue,
	memberTab: "all" as MemberTabValue,
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0,
});

const list = ref<MemberItem[]>([]);
const loading = ref(false);
const loaded = ref(false);
const finished = ref(false);
const filterPopupVisible = ref(false);
const upsertPopupVisible = ref(false);
const popupMode = ref<PopupMode>("add");
const formLoading = ref(false);
const saving = ref(false);
const pageBackground = "#f8fbf9";
const draftFilters = reactive({
	gender: -1 as GenderValue,
	source: -1 as SourceValue,
	order: "createTime" as SortValue,
});
const form = reactive<MemberFormData>(createEmptyForm());
const rules = reactive({
	nickName: {
		required: true,
		message: "请填写微信昵称",
	},
	wechatNo: {
		required: true,
		message: "请填写微信号",
	},
	source: {
		required: true,
		message: "请选择来源",
	},
});
const Form = ref<ClForm.Ref>();

const activeFilterPills = computed(() => {
	const pills: string[] = [];

	if (filters.keyWord) {
		pills.push(`搜索: ${filters.keyWord}`);
	}

	if (filters.gender > -1) {
		pills.push(`性别: ${getGender(filters.gender).label}`);
	}

	if (filters.source > -1) {
		pills.push(`来源: ${getSource(filters.source).label}`);
	}

	if (filters.order !== "createTime") {
		const sortLabel = sortOptions.find((item) => item.value === filters.order)?.label || "自定义排序";
		pills.push(`排序: ${sortLabel}`);
	}

	if (filters.memberTab !== "all") {
		pills.push(`档案: ${getMemberTabLabel(filters.memberTab)}`);
	}

	return pills;
});

const activeFilterCount = computed(() => activeFilterPills.value.length);
const upsertTitle = computed(() => (popupMode.value === "add" ? "新增会员" : "编辑会员"));
const upsertSummary = computed(() =>
	popupMode.value === "add"
		? "补充基础会员档案，保存后会自动刷新列表。"
		: "修改基础信息，不影响现有次卡与消费记录。",
);

const loadText = computed(() => {
	if (loading.value && !loaded.value) {
		return "正在加载会员列表";
	}

	if (loading.value && loaded.value) {
		return "正在加载更多会员";
	}

	if (finished.value) {
		return "已经到底了";
	}

	return `第 ${pagination.page} 页 / 共 ${Math.max(Math.ceil(pagination.total / pagination.size), 1)} 页`;
});

function getDisplayName(item: MemberItem) {
	return item.name || item.nickName || `会员 #${item.id}`;
}

function getInitial(item: MemberItem) {
	const value = getDisplayName(item).trim();
	return value.slice(0, 1).toUpperCase();
}

function getCardTone(item: MemberItem) {
	const tones = ["mint", "violet", "amber", "blue", "aqua"];
	const seed = Number(item.id || item.remainTimes || item.validCardCount || 0);

	return tones[Math.abs(seed) % tones.length];
}

function getGender(value?: number) {
	return (
		genderOptions.find((item) => item.value === value) || {
			label: "未知",
			value: 0,
			tone: "neutral",
		}
	);
}

function getSource(value?: number) {
	const match = sourceOptions.find((item) => item.value === value);

	return (
		match || {
			label: "未标记",
			value: -1,
			tone: "neutral",
		}
	);
}

function getMemberTabLabel(value: MemberTabValue) {
	return memberTabOptions.find((item) => item.value === value)?.label || "全部";
}

function createEmptyForm(): MemberFormData {
	return {
		name: "",
		phone: "",
		nickName: "",
		wechatNo: "",
		gender: 2,
		source: 1,
		remark: "",
	};
}

function fillForm(data?: Partial<MemberFormData>) {
	const next = {
		...createEmptyForm(),
		...data,
	};

	form.id = next.id;
	form.name = next.name || "";
	form.phone = next.phone || "";
	form.nickName = next.nickName || "";
	form.wechatNo = next.wechatNo || "";
	form.gender = [0, 1, 2].includes(Number(next.gender)) ? (Number(next.gender) as 0 | 1 | 2) : 2;
	form.source = [1, 2, 3].includes(Number(next.source)) ? (Number(next.source) as 1 | 2 | 3) : 1;
	form.remark = next.remark || "";
}

function normalizeForm() {
	return {
		id: form.id,
		name: form.name.trim(),
		phone: form.phone.trim(),
		nickName: form.nickName.trim(),
		wechatNo: form.wechatNo.trim(),
		gender: form.gender,
		source: form.source,
		remark: form.remark.trim(),
	};
}

function buildParams() {
	return {
		page: pagination.page,
		size: pagination.size,
		keyWord: filters.keyWord || undefined,
		gender: filters.gender > -1 ? filters.gender : undefined,
		source: filters.source > -1 ? filters.source : undefined,
		order: filters.order,
		sort: "desc",
		memberTab: filters.memberTab,
	};
}

async function fetchList(options?: { append?: boolean; silent?: boolean }) {
	const { append = false, silent = false } = options || {};

	if (!silent) {
		loading.value = true;
	}

	try {
		const res = await service.page(buildParams());
		const rows = res?.list || [];
		const total = res?.pagination?.total || 0;

		pagination.total = total;
		list.value = append ? [...list.value, ...rows] : rows;
		finished.value = list.value.length >= total || rows.length < pagination.size;
		loaded.value = true;
	} catch (err: any) {
		if (append && pagination.page > 1) {
			pagination.page -= 1;
		}

		ui.showTips(err?.message || "会员列表加载失败");
	} finally {
		loading.value = false;
	}
}

async function reload() {
	pagination.page = 1;
	finished.value = false;
	await fetchList();
}

function resetFilters() {
	filters.keyWord = "";
	filters.gender = -1;
	filters.source = -1;
	filters.order = "createTime";
	filters.memberTab = "all";
	syncDraftFilters();
	reload();
}

function setMemberTab(value: MemberTabValue) {
	if (loading.value || filters.memberTab === value) {
		return;
	}

	filters.memberTab = value;
	reload();
}

function syncDraftFilters() {
	draftFilters.gender = filters.gender;
	draftFilters.source = filters.source;
	draftFilters.order = filters.order;
}

function openFilterPopup() {
	syncDraftFilters();
	filterPopupVisible.value = true;
}

function resetPopupFilters() {
	draftFilters.gender = -1;
	draftFilters.source = -1;
	draftFilters.order = "createTime";
}

function applyPopupFilters() {
	const changed =
		filters.gender !== draftFilters.gender ||
		filters.source !== draftFilters.source ||
		filters.order !== draftFilters.order;

	filters.gender = draftFilters.gender;
	filters.source = draftFilters.source;
	filters.order = draftFilters.order;
	filterPopupVisible.value = false;

	if (changed) {
		reload();
	}
}

async function openUpsert(mode: PopupMode, item?: MemberItem) {
	popupMode.value = mode;
	formLoading.value = false;

	if (mode === "add") {
		fillForm();
		upsertPopupVisible.value = true;
		await nextTick();
		Form.value?.clearValidate();
		return;
	}

	if (!item?.id) {
		ui.showTips("没有找到可编辑的会员信息");
		return;
	}

	fillForm(item);
	upsertPopupVisible.value = true;
	await nextTick();
	Form.value?.clearValidate();
	formLoading.value = true;

	try {
		const detail = await service.info({
			id: item.id,
		});

		fillForm(detail);
	} catch (err: any) {
		ui.showTips(err?.message || "会员信息加载失败");
	} finally {
		formLoading.value = false;
	}
}

function validateUpsert() {
	return new Promise<boolean>((resolve) => {
		if (!Form.value) {
			resolve(false);
			return;
		}

		Form.value?.validate((valid: boolean) => {
			resolve(valid);
		});
	});
}

async function submitUpsert() {
	if (saving.value || formLoading.value) {
		return;
	}

	const valid = await validateUpsert();

	if (!valid) {
		return;
	}

	const payload = normalizeForm();

	if (!payload.nickName) {
		ui.showTips("请填写微信昵称");
		return;
	}

	if (!payload.wechatNo) {
		ui.showTips("请填写微信号");
		return;
	}

	saving.value = true;

	try {
		if (popupMode.value === "edit" && payload.id) {
			await service.update(payload);
		} else {
			await service.add(payload);
		}

		upsertPopupVisible.value = false;

		if (popupMode.value === "add") {
			await reload();
		} else {
			await fetchList({
				silent: true,
			});
		}

		ui.showTips(popupMode.value === "add" ? "会员新增成功" : "会员信息已更新");
	} catch (err: any) {
		ui.showTips(
			err?.message || (popupMode.value === "add" ? "会员新增失败，请稍后重试" : "会员更新失败，请稍后重试"),
		);
	} finally {
		saving.value = false;
	}
}

async function refreshAfterDelete() {
	if (list.value.length === 1 && pagination.page > 1) {
		pagination.page -= 1;
	}

	finished.value = false;
	await fetchList({
		silent: true,
	});
}

function removeMember(item: MemberItem) {
	if (!item?.id) {
		ui.showTips("没有找到可删除的会员信息");
		return;
	}

	const name = getDisplayName(item);

	ui.showConfirm({
		title: "删除会员",
		type: "warning",
		message: `确认删除「${name}」吗？删除后无法恢复。`,
		confirmButtonText: "确认删除",
		beforeClose(action, { done, showLoading, hideLoading }) {
			if (action !== "confirm") {
				done();
				return;
			}

			showLoading();

			service
				.delete({
					ids: [item.id],
				})
				.then(async () => {
					if (upsertPopupVisible.value && form.id === item.id) {
						upsertPopupVisible.value = false;
					}

					await refreshAfterDelete();
					done();
					ui.showTips("会员删除成功");
				})
				.catch((err: any) => {
					hideLoading();
					ui.showTips(err?.message || "会员删除失败，请稍后重试");
				});
		},
	});
}

function toDetail(item: MemberItem) {
	router.push({
		path: "/pages/index/member-detail",
		query: {
			id: item.id,
		},
	});
}

onShow(() => {
	if (!loaded.value) {
		reload();
	}
});

onPullDownRefresh(async () => {
	await reload();
	uni.stopPullDownRefresh();
});

onReachBottom(async () => {
	if (loading.value || finished.value) {
		return;
	}

	pagination.page += 1;
	await fetchList({
		append: true,
	});
});
</script>

<style lang="scss" scoped>
.page-member {
	--ink: #1f2734;
	--muted: #697080;
	--soft: #f3faf6;
	--accent: #32b66d;
	--accent-dark: #10845a;
	--line: rgba(54, 99, 77, 0.08);
	--pink: #d14f78;
	--violet: #8d55c8;
	--amber: #e78212;

	position: relative;
	min-height: 100%;
	padding: 0 34rpx 188rpx;
	background:
		linear-gradient(180deg, rgba(250, 255, 252, 0) 0, #f8fbf9 420rpx),
		#f8fbf9;
	box-sizing: border-box;
	overflow: hidden;
}

.member-hero {
	position: relative;
	margin: 0 -34rpx;
	padding: 96rpx 34rpx 34rpx;
	overflow: hidden;
}

.member-hero__bg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 520rpx;
}

.member-hero__content {
	position: relative;
	z-index: 1;
}

.member-hero__top {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 22rpx;
	min-height: 116rpx;
}

.member-hero__count {
	display: inline-flex;
	align-items: baseline;
	justify-content: center;
	height: 58rpx;
	padding: 0 24rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.7);
	box-shadow: 0 12rpx 28rpx rgba(64, 100, 82, 0.08);
	backdrop-filter: blur(12rpx);
	font-size: 26rpx;
	font-weight: 500;
	color: #28313f;
	white-space: nowrap;
}

.member-hero__count-value {
	font-size: 34rpx;
	font-weight: 800;
	color: #26a365;
	margin: 0 4rpx;
}

.member-search {
	display: flex;
	align-items: center;
	gap: 18rpx;
	height: 112rpx;
	margin-top: 42rpx;
	padding: 0 14rpx 0 34rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.94);
	box-shadow: 0 22rpx 48rpx rgba(64, 100, 82, 0.1);
	box-sizing: border-box;
}

.member-search__input {
	flex: 1;
	min-width: 0;
	height: 100%;
	font-size: 28rpx;
	color: var(--ink);
}

.member-search__placeholder {
	color: #9da2ad;
	font-weight: 500;
}

.member-search__filter {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background: linear-gradient(145deg, #65c97d 0%, #23945c 100%);
	box-shadow: 0 18rpx 34rpx rgba(36, 153, 91, 0.3);
	flex-shrink: 0;
}

.member-search__badge {
	position: absolute;
	top: 2rpx;
	right: 4rpx;
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	border-radius: 999rpx;
	background: #202936;
	color: #fff;
	font-size: 18rpx;
	line-height: 32rpx;
	text-align: center;
	box-shadow: 0 4rpx 10rpx rgba(32, 41, 54, 0.2);
}

.filter-funnel {
	width: 46rpx;
	height: 46rpx;
	background: url("data:image/svg+xml,%3Csvg width='46' height='46' viewBox='0 0 46 46' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 12H37L26 25V34L20 37V25L9 12Z' stroke='white' stroke-width='4.5' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E")
		center / contain no-repeat;
}

.member-hero__filters {
	margin-top: 20rpx;
}

.member-tab-scroll,
.chip-scroll,
.toolbar__active-scroll {
	width: 100%;
	white-space: nowrap;
}

.member-tab-group {
	display: inline-flex;
	gap: 12rpx;
	padding-right: 8rpx;
}

.member-tab-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 54rpx;
	padding: 0 24rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.62);
	border: 1rpx solid rgba(45, 157, 96, 0.12);
	color: rgba(30, 132, 83, 0.72);
	font-size: 23rpx;
	font-weight: 700;
}

.member-tab-chip.is-active {
	background: rgba(28, 151, 91, 0.94);
	border-color: rgba(28, 151, 91, 0.94);
	color: #fff;
	box-shadow: 0 12rpx 24rpx rgba(34, 142, 88, 0.18);
}

.toolbar__active-bar {
	display: flex;
	align-items: center;
	gap: 18rpx;
	margin-top: 14rpx;
}

.toolbar__active {
	display: inline-flex;
	gap: 10rpx;
	padding-right: 8rpx;
}

.active-pill {
	display: inline-flex;
	align-items: center;
	height: 46rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.7);
	color: var(--muted);
	font-size: 21rpx;
	white-space: nowrap;
}

.toolbar__reset {
	font-size: 22rpx;
	font-weight: 700;
	color: var(--accent-dark);
	white-space: nowrap;
	flex-shrink: 0;
}

.member-list {
	position: relative;
	z-index: 2;
	margin-top: -8rpx;
}

.member-card {
	--tone: #32b66d;
	--tone-dark: #11895c;
	--tone-soft: rgba(50, 182, 109, 0.1);
	--tone-glow: rgba(50, 182, 109, 0.18);

	position: relative;
	margin-bottom: 24rpx;
	padding: 42rpx 34rpx 26rpx;
	border-radius: 36rpx;
	background:
		radial-gradient(circle at 88% 20%, var(--tone-soft) 0, rgba(255, 255, 255, 0) 220rpx),
		linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92));
	border: 1rpx solid rgba(255, 255, 255, 0.94);
	box-shadow: 0 22rpx 48rpx rgba(42, 58, 69, 0.08);
	box-sizing: border-box;
	overflow: hidden;
}

.member-card::before {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	border: 1rpx solid rgba(61, 191, 122, 0.08);
	pointer-events: none;
}

.member-card.is-violet {
	--tone: #b66ce5;
	--tone-dark: #7f4db1;
	--tone-soft: rgba(182, 108, 229, 0.12);
	--tone-glow: rgba(182, 108, 229, 0.22);
}

.member-card.is-amber {
	--tone: #ffab31;
	--tone-dark: #e47b0e;
	--tone-soft: rgba(255, 171, 49, 0.12);
	--tone-glow: rgba(255, 171, 49, 0.22);
}

.member-card.is-blue {
	--tone: #5298ff;
	--tone-dark: #1e7fe9;
	--tone-soft: rgba(82, 152, 255, 0.12);
	--tone-glow: rgba(82, 152, 255, 0.2);
}

.member-card.is-aqua {
	--tone: #65d9c0;
	--tone-dark: #2aa98f;
	--tone-soft: rgba(101, 217, 192, 0.14);
	--tone-glow: rgba(101, 217, 192, 0.2);
}

.member-card__top {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	gap: 26rpx;
}

.member-card__avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 104rpx;
	height: 104rpx;
	border-radius: 28rpx;
	background: linear-gradient(145deg, var(--tone), var(--tone-dark));
	box-shadow: 0 18rpx 30rpx var(--tone-glow);
	color: #fff;
	font-size: 46rpx;
	font-weight: 900;
	flex-shrink: 0;
}

.member-card__body {
	flex: 1;
	min-width: 0;
	padding-top: 4rpx;
}

.member-card__name-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
	min-width: 0;
}

.member-card__name {
	display: block;
	max-width: 248rpx;
	font-size: 34rpx;
	line-height: 1.18;
	font-weight: 900;
	color: var(--ink);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.member-card__member-mark {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	background: rgba(66, 185, 120, 0.12);
	flex-shrink: 0;
}

.member-card__phone {
	display: block;
	margin-top: 4rpx;
	font-size: 26rpx;
	line-height: 1.2;
	color: var(--muted);
}

.member-card__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 10rpx;
}

.tag-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 72rpx;
	height: 38rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 800;
	line-height: 1;
	box-sizing: border-box;
}

.tag-chip.is-neutral {
	background: rgba(105, 112, 128, 0.1);
	color: #7b8190;
}

.tag-chip.is-success {
	background: rgba(50, 182, 109, 0.12);
	color: #1f9a62;
}

.tag-chip.is-danger {
	background: rgba(235, 93, 139, 0.12);
	color: var(--pink);
}

.tag-chip.is-warning {
	background: rgba(241, 171, 52, 0.16);
	color: #cf7d06;
}

.tag-chip.is-dark {
	background: rgba(31, 39, 52, 0.9);
	color: #fff;
}

.member-card__stats {
	width: 170rpx;
	padding-top: 8rpx;
	text-align: right;
	flex-shrink: 0;
}

.member-card__remain {
	display: flex;
	align-items: baseline;
	justify-content: flex-end;
	gap: 6rpx;
	color: #2d3747;
}

.member-card__remain-label,
.member-card__remain-unit {
	font-size: 25rpx;
	font-weight: 700;
}

.member-card__remain-value {
	font-size: 48rpx;
	font-weight: 900;
	line-height: 0.95;
	color: var(--tone-dark);
}

.member-card__card-count {
	display: block;
	margin-top: 22rpx;
	font-size: 24rpx;
	line-height: 1.2;
	color: var(--muted);
	white-space: nowrap;
}

.member-card__footer {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	margin-top: 38rpx;
}

.member-card__quick {
	display: flex;
	align-items: center;
	gap: 34rpx;
	min-width: 0;
}

.member-card__action-link {
	display: inline-flex;
	align-items: center;
	gap: 12rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: #747b88;
	white-space: nowrap;
}

.member-card__detail {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	width: 196rpx;
	height: 60rpx;
	border-radius: 22rpx;
	background: var(--tone-soft);
	color: var(--tone-dark);
	font-size: 24rpx;
	font-weight: 900;
	white-space: nowrap;
	flex-shrink: 0;
}

.member-card__detail-text {
	font-size: 24rpx;
	font-weight: 900;
}

.member-fab {
	position: fixed;
	right: 28rpx;
	bottom: calc(136rpx + env(safe-area-inset-bottom));
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 128rpx;
	height: 128rpx;
	border-radius: 50%;
	background: linear-gradient(145deg, #32e0a1 0%, #19a963 100%);
	box-shadow: 0 22rpx 42rpx rgba(25, 169, 99, 0.34);
	color: #fff;
	z-index: 30;
}

.member-fab::before,
.member-fab::after {
	content: "";
	position: absolute;
	border-radius: 6rpx;
	transform: rotate(28deg);
}

.member-fab::before {
	top: -22rpx;
	right: 10rpx;
	width: 14rpx;
	height: 24rpx;
	background: #4db4ff;
}

.member-fab::after {
	top: 4rpx;
	right: -18rpx;
	width: 12rpx;
	height: 18rpx;
	background: #ee62bf;
}

.toolbar__label {
	display: block;
	margin-bottom: 14rpx;
	font-size: 22rpx;
	color: var(--muted);
}

.chip-group {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.chip-group--nowrap {
	display: inline-flex;
	flex-wrap: nowrap;
	padding-right: 12rpx;
}

.chip {
	padding: 12rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(50, 182, 109, 0.08);
	border: 1rpx solid transparent;
	font-size: 22rpx;
	color: var(--muted);
	transition: all 0.2s ease;
}

.chip--soft {
	background: rgba(141, 85, 200, 0.08);
}

.chip.is-active {
	background: var(--accent-dark);
	border-color: var(--accent-dark);
	color: #fff;
	box-shadow: 0 10rpx 24rpx rgba(28, 132, 90, 0.18);
}

.filter-popup,
.upsert-popup {
	padding: 16rpx 24rpx calc(28rpx + env(safe-area-inset-bottom));
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 251, 247, 0.98));
}

.filter-popup__summary,
.upsert-popup__summary {
	padding: 12rpx 4rpx 10rpx;
}

.filter-popup__summary-title,
.upsert-popup__summary-title {
	display: block;
	font-size: 28rpx;
	font-weight: 800;
	color: var(--ink);
}

.filter-popup__summary-text,
.upsert-popup__summary-text {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: var(--muted);
}

.filter-popup__section {
	margin-top: 24rpx;
}

.filter-popup__footer,
.upsert-popup__footer {
	display: flex;
	gap: 16rpx;
	margin-top: 28rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(31, 39, 52, 0.06);
}

.filter-popup__secondary,
.filter-popup__primary {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 78rpx;
	border-radius: 22rpx;
	font-size: 24rpx;
	font-weight: 800;
}

.filter-popup__secondary {
	flex: 1;
	background: rgba(31, 39, 52, 0.06);
	color: var(--muted);
}

.filter-popup__primary {
	flex: 1.4;
	background: linear-gradient(145deg, #44c879, #15935d);
	color: #fff;
	box-shadow: 0 14rpx 28rpx rgba(30, 159, 94, 0.2);
}

.upsert-popup__body {
	max-height: 68vh;
	margin-top: 8rpx;
}

.upsert-popup__loading {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 14rpx 4rpx 24rpx;
}

.upsert-popup__loading-text {
	font-size: 22rpx;
	color: var(--muted);
}

.upsert-popup :deep(.cl-form-item) {
	margin-bottom: 20rpx;
}

.upsert-popup :deep(.cl-form-item__label) {
	font-size: 24rpx;
	font-weight: 700;
	color: var(--ink);
}

.upsert-popup :deep(.cl-input),
.upsert-popup :deep(.cl-textarea) {
	background: rgba(255, 255, 255, 0.78);
}

.upsert-choice-group {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
	padding: 10rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.6);
	border: 1rpx solid rgba(31, 39, 52, 0.06);
	box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.upsert-choice {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 112rpx;
	height: 62rpx;
	padding: 0 24rpx;
	border-radius: 18rpx;
	background: rgba(255, 255, 255, 0.92);
	border: 1rpx solid rgba(31, 39, 52, 0.1);
	color: var(--ink);
	font-size: 24rpx;
	font-weight: 700;
	box-sizing: border-box;
	transition: all 0.2s ease;
}

.upsert-choice.is-active {
	color: #fff;
	border-color: transparent;
	box-shadow: 0 10rpx 24rpx rgba(42, 58, 69, 0.12);
}

.upsert-choice-group--gender .upsert-choice.is-active {
	background: linear-gradient(135deg, #e7659a, #c94e7d);
}

.upsert-choice-group--source .upsert-choice.is-active {
	background: linear-gradient(135deg, #44c879, #15935d);
}

.empty-wrap,
.loading-wrap {
	position: relative;
	z-index: 2;
	padding: 90rpx 0 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.loading-wrap__text {
	margin-top: 18rpx;
	font-size: 24rpx;
	color: var(--muted);
}

.list-footer {
	padding: 8rpx 0 14rpx;
	text-align: center;
	font-size: 22rpx;
	color: #9aa0aa;
}

@media screen and (max-width: 390px) {
	.page-member {
		padding-right: 24rpx;
		padding-left: 24rpx;
	}

	.member-hero {
		margin-right: -24rpx;
		margin-left: -24rpx;
		padding-right: 24rpx;
		padding-left: 24rpx;
	}

	.member-search {
		height: 104rpx;
		padding-left: 28rpx;
	}

	.member-search__filter {
		width: 88rpx;
		height: 88rpx;
	}

	.member-card {
		padding: 36rpx 28rpx 24rpx;
		border-radius: 32rpx;
	}

	.member-card__top {
		gap: 20rpx;
	}

	.member-card__avatar {
		width: 96rpx;
		height: 96rpx;
		font-size: 42rpx;
	}

	.member-card__stats {
		width: 142rpx;
	}

	.member-card__name {
		max-width: 210rpx;
		font-size: 32rpx;
	}

	.member-card__remain-value {
		font-size: 44rpx;
	}

	.member-card__footer {
		gap: 16rpx;
	}

	.member-card__quick {
		gap: 22rpx;
	}

	.member-card__detail {
		width: 174rpx;
	}
}
</style>
