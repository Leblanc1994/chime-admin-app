<template>
	<cl-page :background-color="pageBackground">
		<view class="page-member-detail">
			<view class="loading-wrap" v-if="pageLoading && !archiveReady">
				<cl-loading :size="42" />
				<text class="loading-wrap__text">正在整理会员档案</text>
			</view>

			<template v-else-if="archiveMember">
				<view class="profile-hero">
					<view class="profile-hero__header">
						<view class="profile-hero__identity">
							<view class="profile-hero__avatar">
								{{ getInitial(archiveMember) }}
							</view>

							<view class="profile-hero__copy">
								<text class="profile-hero__eyebrow">会员档案</text>
								<text class="profile-hero__name">{{ getDisplayName(archiveMember) }}</text>
								<text class="profile-hero__phone">{{ archiveMember.phone || "未绑定手机号" }}</text>
							</view>
						</view>

						<view class="profile-hero__refresh" @tap="refreshAll">
							<cl-icon name="refresh" :size="28" color="currentColor" />
							<text>{{ refreshLoading ? "刷新中..." : "刷新档案" }}</text>
						</view>
					</view>

					<view class="profile-hero__supplement">
						<view class="profile-hero__chips">
							<text class="tag-chip" :class="`is-${getGender(archiveMember.gender).tone}`">
								{{ getGender(archiveMember.gender).label }}
							</text>
							<text class="tag-chip" :class="`is-${getSource(archiveMember.source).tone}`">
								{{ getSource(archiveMember.source).label }}
							</text>
						</view>

						<view class="profile-hero__meta">
							<text
								class="profile-hero__meta-item"
								:class="`profile-hero__meta-item--${item.type}`"
								v-for="item in profileMetaItems"
								:key="item.type"
							>
								{{ item.label }}
							</text>
						</view>
					</view>

					<view class="profile-overview">
						<view class="profile-overview__item" v-for="item in heroStats" :key="item.label">
							<text class="profile-overview__label">{{ item.label }}</text>
							<text
								class="profile-overview__value"
								:class="{
									'profile-overview__value--time': item.isTime,
									'profile-overview__value--empty': item.value === '-'
								}"
							>
								{{ item.value }}
							</text>
						</view>
					</view>

				</view>
				<view class="tabs-shell">
					<cl-tabs
						v-model="activeTab"
						:list="tabOptions"
						fill
						color="#1f6a52"
						un-color="#6a6a63"
						:show-line="false"
						:show-slider="true"
					/>

					<view class="tab-pane" v-if="activeTab === 'records'">
						<scroll-view class="filter-scroll" scroll-x>
							<view class="filter-row">
								<view
									v-for="item in recordFilterOptions"
									:key="item.value || 'all'"
									class="filter-chip"
									:class="{ 'is-active': recordState.consumeType === item.value }"
									@tap="setRecordType(item.value)"
								>
									{{ item.label }}
								</view>
							</view>
						</scroll-view>

						<view class="panel-meta">
							<text>消费记录 {{ recordState.total }} 条</text>
							<text>{{ recordState.loading ? "同步中..." : "按消费时间倒序" }}</text>
						</view>

						<view class="loading-wrap loading-wrap--section" v-if="recordState.loading && !recordState.list.length">
							<cl-loading :size="30" />
						</view>

						<view class="record-list" v-else-if="recordState.list.length">
							<view class="record-card" v-for="row in recordState.list" :key="row.id">
								<view class="record-card__main">
									<view class="record-card__icon" :class="`is-${getConsumeTypeTone(row.consumeType)}`">
										<view class="member-icon member-icon--record"></view>
									</view>

									<view class="record-card__content">
										<view class="record-card__header">
											<view class="record-card__title-wrap">
												<text class="record-card__title">{{ row.consumeType || "未标记" }}</text>
												<text class="record-card__time">{{ formatDate(row.consumeTime) }}</text>
											</view>

											<cl-icon name="arrow-right" :size="36" color="#9a9b96" />
										</view>

										<view class="record-card__summary">
											<text class="summary-pill" v-for="item in getRecordMetaItems(row)" :key="item">
												{{ item }}
											</text>
										</view>

										<view class="card-inline-actions card-inline-actions--record">
											<text class="card-inline-action" @tap="editConsumeRecord(row)">编辑</text>
											<text class="card-inline-action is-danger" @tap="deleteConsumeRecord(row)">删除</text>
										</view>
									</view>
								</view>

								<view class="record-card__remark-box" v-if="row.remark">
									<text class="record-card__label">备注</text>
									<text class="record-card__remark">{{ row.remark }}</text>
								</view>
							</view>
						</view>

						<view class="empty-wrap empty-wrap--section" v-else-if="recordLoaded">
							<cl-empty :fixed="false" text="暂时没有消费记录" />
						</view>

						<view
							class="panel-more"
							v-if="recordState.list.length && recordState.list.length < recordState.total"
							@tap="loadMoreRecords"
						>
							{{ recordState.loading ? "加载中..." : "加载更多记录" }}
						</view>
					</view>

					<view class="tab-pane" v-else-if="activeTab === 'cards'">
						<view class="panel-meta">
							<text>次卡账户 {{ cardState.list.length }} 张</text>
							<text>当前可用 {{ availableCardOptions.length }} 张</text>
						</view>

						<view class="loading-wrap loading-wrap--section" v-if="cardState.loading && !cardState.list.length">
							<cl-loading :size="30" />
						</view>

						<view class="card-list" v-else-if="cardState.list.length">
							<view class="account-card" v-for="row in cardState.list" :key="row.id">
								<view class="account-card__header">
									<view>
										<text class="account-card__title">{{ row.cardName || "次卡" }}</text>
										<text class="account-card__time">创建 {{ formatDate(row.createTime) }}</text>
									</view>
									<text class="tag-chip" :class="`is-${getCardStatus(row).tone}`">
										{{ getCardStatus(row).label }}
									</text>
								</view>

								<view class="account-card__summary">
									<text class="summary-pill" v-for="item in getCardMetaItems(row)" :key="item">
										{{ item }}
									</text>
								</view>

								<text class="account-card__remark" v-if="row.remark">{{ row.remark }}</text>

								<view class="card-inline-actions">
									<text class="card-inline-action" v-if="canAdjustCard(row)" @tap="openCardActionDialog(row, 'plus')">
										补次
									</text>
									<text class="card-inline-action" v-if="canAdjustCard(row)" @tap="openCardActionDialog(row, 'set')">
										手调
									</text>
									<text class="card-inline-action" v-if="canEnableCard(row)" @tap="changeCardStatus(row, 'enable')">
										启用
									</text>
									<text class="card-inline-action is-danger" v-else-if="canStopCard(row)" @tap="changeCardStatus(row, 'stop')">
										停用
									</text>
									<text class="card-inline-action is-danger" v-if="canDiscardCard(row)" @tap="changeCardStatus(row, 'discard')">
										作废
									</text>
								</view>
							</view>
						</view>

						<view class="empty-wrap empty-wrap--section" v-else-if="cardLoaded">
							<cl-empty :fixed="false" text="当前会员还没有次卡账户" />
						</view>
					</view>

					<view class="tab-pane" v-else-if="activeTab === 'flows'">
						<scroll-view class="filter-scroll" scroll-x>
							<view class="filter-row">
								<view
									class="filter-chip"
									:class="{ 'is-active': !flowState.cardAccountId }"
									@tap="setFlowCard(undefined)"
								>
									全部次卡
								</view>
								<view
									v-for="item in cardState.list"
									:key="item.id"
									class="filter-chip"
									:class="{ 'is-active': flowState.cardAccountId === item.id }"
									@tap="setFlowCard(item.id)"
								>
									{{ item.cardName }}
								</view>
							</view>
						</scroll-view>

						<scroll-view class="filter-scroll filter-scroll--compact" scroll-x>
							<view class="filter-row">
								<view
									class="filter-chip filter-chip--soft"
									:class="{ 'is-active': !flowState.changeType }"
									@tap="setFlowChangeType('')"
								>
									全部流水
								</view>
								<view
									v-for="item in flowChangeTypeOptions"
									:key="item"
									class="filter-chip filter-chip--soft"
									:class="{ 'is-active': flowState.changeType === item }"
									@tap="setFlowChangeType(item)"
								>
									{{ item }}
								</view>
							</view>
						</scroll-view>

						<view class="panel-meta">
							<text>次卡流水 {{ flowState.total }} 条</text>
							<text>{{ flowState.loading ? "同步中..." : "记录每次变更轨迹" }}</text>
						</view>

						<view class="loading-wrap loading-wrap--section" v-if="flowState.loading && !flowState.list.length">
							<cl-loading :size="30" />
						</view>

						<view class="flow-list" v-else-if="flowState.list.length">
							<view class="flow-card" v-for="row in flowState.list" :key="row.id">
								<view class="flow-card__header">
									<view>
										<text class="flow-card__title">{{ row.cardName || "次卡流水" }}</text>
										<text class="flow-card__time">{{ formatDate(row.createTime) }}</text>
									</view>
									<text class="tag-chip" :class="`is-${getFlowTypeTone(row.changeType)}`">
										{{ row.changeType || "流水" }}
									</text>
								</view>

								<view class="flow-card__summary">
									<text class="summary-pill" v-for="item in getFlowMetaItems(row)" :key="item">
										{{ item }}
									</text>
								</view>

								<text class="flow-card__remark" v-if="row.remark">{{ row.remark }}</text>
							</view>
						</view>

						<view class="empty-wrap empty-wrap--section" v-else-if="flowLoaded">
							<cl-empty :fixed="false" text="当前筛选条件下没有流水记录" />
						</view>

						<view
							class="panel-more"
							v-if="flowState.list.length && flowState.list.length < flowState.total"
							@tap="loadMoreFlows"
						>
							{{ flowState.loading ? "加载中..." : "加载更多流水" }}
						</view>
					</view>

					<view class="tab-pane" v-else>
						<scroll-view class="filter-scroll filter-scroll--compact" scroll-x>
							<view class="filter-row">
								<view
									class="filter-chip filter-chip--soft"
									:class="{ 'is-active': smsLogState.sendStatus === undefined }"
									@tap="setSmsLogStatus(undefined)"
								>
									全部状态
								</view>
								<view
									v-for="item in smsLogStatusOptions"
									:key="item.value"
									class="filter-chip filter-chip--soft"
									:class="{ 'is-active': smsLogState.sendStatus === item.value }"
									@tap="setSmsLogStatus(item.value)"
								>
									{{ item.label }}
								</view>
							</view>
						</scroll-view>

						<view class="panel-meta">
							<text>短信日志 {{ smsLogState.total }} 条</text>
							<text>{{ smsLogState.loading ? "同步中..." : "查看扣次后的短信发送轨迹" }}</text>
						</view>

						<view class="loading-wrap loading-wrap--section" v-if="smsLogState.loading && !smsLogState.list.length">
							<cl-loading :size="30" />
						</view>

						<view class="flow-list" v-else-if="smsLogState.list.length">
							<view class="flow-card" v-for="row in smsLogState.list" :key="row.id">
								<view class="flow-card__header">
									<view>
										<text class="flow-card__title">{{ row.phone || "短信记录" }}</text>
										<text class="flow-card__time">{{ formatDate(row.lastSendTime || row.createTime) }}</text>
									</view>
									<text class="tag-chip" :class="`is-${getSmsLogStatusTone(row.sendStatus)}`">
										{{ getSmsLogStatusLabel(row.sendStatus) }}
									</text>
								</view>

								<view class="flow-card__summary">
									<text class="summary-pill">渠道 {{ row.provider || "-" }}</text>
									<text class="summary-pill">模板 {{ row.templateCode || "-" }}</text>
									<text class="summary-pill">重试 {{ row.retryCount || 0 }} 次</text>
								</view>

								<text class="flow-card__remark" v-if="row.reason">{{ row.reason }}</text>
								<text class="flow-card__remark" v-if="row.requestPayload">参数 {{ row.requestPayload }}</text>
								<text class="flow-card__remark" v-if="row.responsePayload">回执 {{ row.responsePayload }}</text>
							</view>
						</view>

						<view class="empty-wrap empty-wrap--section" v-else-if="smsLogLoaded">
							<cl-empty :fixed="false" text="暂时没有短信日志" />
						</view>

						<view
							class="panel-more"
							v-if="smsLogState.list.length && smsLogState.list.length < smsLogState.total"
							@tap="loadMoreSmsLogs"
						>
							{{ smsLogState.loading ? "加载中..." : "加载更多日志" }}
						</view>
					</view>
				</view>

				<view class="action-dock-spacer"></view>

				<view class="action-dock">
					<view class="action-strip">
						<view class="action-btn action-btn--primary" @tap="openCardDialog">
							<view class="member-icon member-icon--open"></view>
							<text>开卡</text>
						</view>
						<view class="action-btn action-btn--secondary" @tap="openConsumeDialog('会员次卡')">
							<view class="member-icon member-icon--consume"></view>
							<text>扣次消费</text>
						</view>
						<view class="action-btn action-btn--ghost" @tap="openConsumeDialog()">
							<view class="member-icon member-icon--add"></view>
							<text>新增消费</text>
						</view>
					</view>
				</view>
			</template>

			<view class="empty-wrap" v-else-if="archiveReady">
				<cl-empty :fixed="false" text="没有找到该会员信息" />
			</view>

			<cl-popup
				v-model="cardDialog.visible"
				title="开卡"
				direction="bottom"
				border-radius="36rpx 36rpx 0 0"
				:padding="0"
			>
				<view class="popup-shell">
					<view class="popup-summary">
						<text class="popup-summary__title">为会员创建新的次卡账户</text>
						<text class="popup-summary__text">保存后会自动刷新概览和次卡列表</text>
					</view>

					<scroll-view class="popup-body" scroll-y>
						<cl-form
							ref="CardForm"
							v-model="cardDialog.form"
							:rules="cardRules"
							:disabled="cardDialog.loading"
							label-position="top"
							tips="toast"
						>
							<cl-form-item label="次卡名称" prop="cardName">
								<cl-input v-model="cardDialog.form.cardName" placeholder="请输入次卡名称" :maxlength="50" />
							</cl-form-item>

							<cl-form-item label="总次数" prop="totalTimes" justify="end">
								<cl-input-number v-model="cardDialog.form.totalTimes" :min="1" :max="9999" />
							</cl-form-item>

							<cl-form-item label="过期时间">
								<cl-select-date
									v-model="cardDialog.form.expireTime"
									:mode="dateTimePickerMode"
									:format="minuteDateTimeFormat"
									:display-format="formatMinuteDateTimeDisplay"
								/>
							</cl-form-item>

							<cl-form-item label="备注">
								<cl-textarea
									v-model="cardDialog.form.remark"
									placeholder="填写这张次卡的适用说明或补充信息"
									count
									auto-height
									:maxlength="200"
								/>
							</cl-form-item>
						</cl-form>
					</scroll-view>

					<view class="popup-footer">
						<view class="popup-secondary" @tap="cardDialog.visible = false">取消</view>
						<view class="popup-primary" @tap="submitCard">
							{{ cardDialog.loading ? "保存中..." : "确认开卡" }}
						</view>
					</view>
				</view>
			</cl-popup>

			<cl-popup
				v-model="consumeDialog.visible"
				:title="consumeDialog.title"
				direction="bottom"
				border-radius="36rpx 36rpx 0 0"
				:padding="0"
			>
				<view class="popup-shell">
					<view class="popup-summary">
						<text class="popup-summary__title">{{ consumeDialog.title }}</text>
						<text class="popup-summary__text">
							{{ consumeDialog.isEdit ? "修改后会同步重算次卡余额和流水" : "支持会员次卡、抖音新客福利、美团团购、纹绣、眼线等记录" }}
						</text>
					</view>

					<scroll-view class="popup-body" scroll-y>
						<cl-form
							ref="ConsumeForm"
							v-model="consumeDialog.form"
							:rules="consumeRules"
							:disabled="consumeDialog.loading"
							label-position="top"
							tips="toast"
						>
							<cl-form-item label="消费类型" prop="consumeType">
								<view class="choice-group">
									<view
										v-for="item in consumeTypeOptions"
										:key="item.value"
										class="choice-chip"
										:class="{ 'is-active': consumeDialog.form.consumeType === item.value }"
										@tap="consumeDialog.form.consumeType = item.value"
									>
										{{ item.label }}
									</view>
								</view>
							</cl-form-item>

							<view class="notice-card" v-if="showConsumeSmsNoticeSwitch">
								<view class="notice-card__header">
									<view>
										<text class="notice-card__title">短信通知</text>
										<text class="notice-card__desc">
											{{ smsNoticeSummary.ready ? "扣次成功后给会员手机号发送短信" : "短信未配置完成，当前不能发送" }}
										</text>
									</view>

									<cl-switch
										v-model="consumeDialog.form.sendSmsNotice"
										:disabled="!smsNoticeSummary.ready"
									/>
								</view>

								<text class="notice-card__hint" v-if="!smsNoticeSummary.ready">
									请先完成短信参数与插件配置，开关才会生效。
								</text>
							</view>

							<cl-form-item label="次卡" prop="cardAccountId" v-if="consumeDialog.form.consumeType === '会员次卡'">
								<cl-select v-model="consumeDialog.form.cardAccountId" :options="consumeCardSelectOptions" />
							</cl-form-item>

							<cl-form-item label="扣减次数" justify="end" v-if="consumeDialog.form.consumeType === '会员次卡'">
								<cl-input-number
									v-model="consumeDialog.form.consumeTimes"
									:min="1"
									:max="consumeTimesMax"
								/>
							</cl-form-item>

							<view class="helper-card" v-if="consumeDialog.form.consumeType === '会员次卡' && selectedCard">
								<text class="helper-card__title">{{ selectedCard.cardName }}</text>
								<text class="helper-card__text">当前剩余 {{ selectedCard.remainTimes || 0 }} 次</text>
							</view>

							<cl-form-item label="消费时间" prop="consumeTime">
								<cl-select-date
									v-model="consumeDialog.form.consumeTime"
									:mode="dateTimePickerMode"
									:format="minuteDateTimeFormat"
									:display-format="formatMinuteDateTimeDisplay"
								/>
							</cl-form-item>

							<cl-form-item label="备注">
								<cl-textarea
									v-model="consumeDialog.form.remark"
									placeholder="记录本次服务内容、场景或特殊说明"
									count
									auto-height
									:maxlength="200"
								/>
							</cl-form-item>
						</cl-form>
					</scroll-view>

					<view class="popup-footer">
						<view class="popup-secondary" @tap="consumeDialog.visible = false">取消</view>
						<view class="popup-primary" @tap="submitConsumeRecord">
							{{ consumeDialog.loading ? "保存中..." : "确认保存" }}
						</view>
					</view>
				</view>
			</cl-popup>

			<cl-popup
				v-model="cardActionDialog.visible"
				:title="cardActionDialog.title"
				direction="bottom"
				border-radius="36rpx 36rpx 0 0"
				:padding="0"
			>
				<view class="popup-shell">
					<view class="popup-summary">
						<text class="popup-summary__title">{{ cardActionDialog.cardName || "次卡调整" }}</text>
						<text class="popup-summary__text">当前剩余 {{ cardActionDialog.beforeTimes || 0 }} 次</text>
					</view>

					<scroll-view class="popup-body" scroll-y>
						<cl-form
							ref="CardActionForm"
							v-model="cardActionDialog.form"
							:disabled="cardActionDialog.loading"
							label-position="top"
							tips="toast"
						>
							<cl-form-item label="补次次数" justify="end" v-if="cardActionDialog.mode === 'plus'">
								<cl-input-number
									v-model="cardActionDialog.form.changeTimes"
									:min="1"
									:max="9999"
								/>
							</cl-form-item>

							<cl-form-item label="调整后剩余" justify="end" v-else>
								<cl-input-number
									v-model="cardActionDialog.form.remainTimes"
									:min="0"
									:max="9999"
								/>
							</cl-form-item>

							<cl-form-item label="备注">
								<cl-textarea
									v-model="cardActionDialog.form.remark"
									placeholder="记录这次补次或手动调整的原因"
									count
									auto-height
									:maxlength="200"
								/>
							</cl-form-item>
						</cl-form>
					</scroll-view>

					<view class="popup-footer">
						<view class="popup-secondary" @tap="cardActionDialog.visible = false">取消</view>
						<view class="popup-primary" @tap="submitCardAction">
							{{ cardActionDialog.loading ? "保存中..." : "确认保存" }}
						</view>
					</view>
				</view>
			</cl-popup>
		</view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import { useUi } from "/$/cool-ui";
import MemberCardAccountService from "../../service/member/card-account";
import MemberCardFlowService from "../../service/member/card-flow";
import MemberConsumeNoticeSmsService from "../../service/member/consume-notice-sms";
import MemberConsumeRecordService from "../../service/member/consume-record";
import MemberInfoService from "../../service/member/info";

type ConsumeTypeValue = "会员次卡" | "抖音新客福利" | "美团团购" | "纹绣" | "眼线";
type ActiveTabValue = "records" | "cards" | "flows" | "sms";
type CardActionMode = "plus" | "set";

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

interface ConsumeFormData {
	consumeType: ConsumeTypeValue;
	cardAccountId?: number;
	consumeTimes: number;
	consumeTime: string;
	remark: string;
	sendSmsNotice: boolean;
}

interface CardFormData {
	cardName: string;
	totalTimes: number;
	expireTime: string;
	remark: string;
}

interface CardActionFormData {
	changeTimes: number;
	remainTimes: number;
	remark: string;
}

const ui = useUi();
const { router } = useCool();

const memberService = new MemberInfoService();
const memberCardAccountService = new MemberCardAccountService();
const memberCardFlowService = new MemberCardFlowService();
const memberConsumeNoticeSmsService = new MemberConsumeNoticeSmsService();
const memberConsumeRecordService = new MemberConsumeRecordService();
const smsNoticeFeatureEnabled = true;

const pageBackground =
	"radial-gradient(circle at 16% 12%, rgba(27, 118, 82, 0.1), transparent 30%), radial-gradient(circle at 82% 18%, rgba(91, 155, 121, 0.12), transparent 34%), linear-gradient(180deg, #fbfcf9 0%, #f7faf5 45%, #f3f7f1 100%)";

const tabOptions = [
	{ label: "消费记录", value: "records" as ActiveTabValue },
	{ label: "次卡账户", value: "cards" as ActiveTabValue },
	{ label: "次卡流水", value: "flows" as ActiveTabValue },
	...(smsNoticeFeatureEnabled ? [{ label: "短信日志", value: "sms" as ActiveTabValue }] : []),
];

const genderOptions = [
	{ label: "未知", value: 0, tone: "neutral" },
	{ label: "男", value: 1, tone: "success" },
	{ label: "女", value: 2, tone: "danger" },
];

const sourceOptions = [
	{ label: "抖音", value: 1, tone: "danger" },
	{ label: "美团", value: 2, tone: "success" },
	{ label: "朋友介绍", value: 3, tone: "warning" },
];

const consumeTypeOptions = [
	{ label: "会员次卡", value: "会员次卡" as ConsumeTypeValue },
	{ label: "抖音新客福利", value: "抖音新客福利" as ConsumeTypeValue },
	{ label: "美团团购", value: "美团团购" as ConsumeTypeValue },
	{ label: "纹绣", value: "纹绣" as ConsumeTypeValue },
	{ label: "眼线", value: "眼线" as ConsumeTypeValue },
];

const minuteDateTimeFormat = "YYYY-MM-DD HH:mm";
const secondDateTimeFormat = "YYYY-MM-DD HH:mm:ss";
const dateTimePickerMode = ["year", "month", "date", "hour", "minute"] as const;

const recordFilterOptions = [
	{ label: "全部", value: "" as "" | ConsumeTypeValue },
	...consumeTypeOptions,
];

const flowChangeTypeOptions = ["开卡", "扣次", "补次", "手工调整", "停用", "启用", "作废"];
const smsLogStatusOptions = [
	{ label: "发送中", value: 0 },
	{ label: "发送成功", value: 1 },
	{ label: "发送失败", value: 2 },
	{ label: "已跳过", value: 3 },
];

const memberId = ref<number>();
const member = ref<MemberItem | null>(null);
const pageLoading = ref(false);
const archiveReady = ref(false);
const refreshLoading = ref(false);
const recordLoaded = ref(false);
const cardLoaded = ref(false);
const flowLoaded = ref(false);
const smsLogLoaded = ref(false);
const activeTab = ref<ActiveTabValue>("records");

const summary = reactive({
	remainTimes: 0,
	validCardCount: 0,
	latestConsumeTime: "",
});

const recordState = reactive({
	loading: false,
	list: [] as any[],
	page: 1,
	size: 10,
	total: 0,
	consumeType: "" as "" | ConsumeTypeValue,
});

const cardState = reactive({
	loading: false,
	list: [] as any[],
});

const flowState = reactive({
	loading: false,
	list: [] as any[],
	page: 1,
	size: 10,
	total: 0,
	cardAccountId: undefined as number | undefined,
	changeType: "",
});

const smsLogState = reactive({
	loading: false,
	list: [] as any[],
	page: 1,
	size: 10,
	total: 0,
	sendStatus: undefined as number | undefined,
});

const cardDialog = reactive({
	visible: false,
	loading: false,
	form: createCardForm(),
});

const consumeDialog = reactive({
	visible: false,
	loading: false,
	isEdit: false,
	editingId: undefined as number | undefined,
	title: "新增消费记录",
	form: createConsumeForm(),
	originalRecord: null as any,
});

const smsNoticeSummary = reactive({
	loading: false,
	enabled: false,
	configured: false,
	providerReady: false,
	ready: false,
	signName: "",
	templateCode: "",
	brandName: "",
	keys: {
		enabledKey: "member.consume.sms.enabled",
		templateCodeKey: "member.consume.sms.templateCode",
		signNameKey: "member.consume.sms.signName",
		brandNameKey: "member.consume.sms.brandName",
	},
	latest: null as any,
});

const cardActionDialog = reactive({
	visible: false,
	loading: false,
	mode: "plus" as CardActionMode,
	title: "补次",
	cardId: undefined as number | undefined,
	cardName: "",
	beforeTimes: 0,
	form: createCardActionForm(),
});

const CardForm = ref<ClForm.Ref>();
const ConsumeForm = ref<ClForm.Ref>();
const CardActionForm = ref<ClForm.Ref>();

const cardRules = reactive({
	cardName: {
		required: true,
		message: "请输入次卡名称",
	},
	totalTimes: {
		required: true,
		message: "请输入总次数",
	},
});

const consumeRules = reactive({
	consumeType: {
		required: true,
		message: "请选择消费类型",
	},
	consumeTime: {
		required: true,
		message: "请选择消费时间",
	},
});

const archiveMember = computed<MemberItem | null>(() => {
	if (member.value) {
		return member.value;
	}

	if (memberId.value) {
		return {
			id: memberId.value,
		};
	}

	return null;
});

const profileMetaItems = computed(() => {
	const current = archiveMember.value;

	if (!current) {
		return [];
	}

	return [
		{
			type: "id",
			label: `ID ${current.id}`,
		},
		{
			type: "joined",
			label: `加入 ${formatDate(current.createTime, "YYYY.MM.DD")}`,
		},
	];
});

const heroStats = computed(() => {
	const current = archiveMember.value;

	return [
		{
			label: "剩余次数",
			value: `${summary.remainTimes}`,
		},
		{
			label: "有效次卡",
			value: `${summary.validCardCount}`,
		},
		{
			label: "最后消费",
			value: formatDate(summary.latestConsumeTime || current?.lastConsumeTime, "MM.DD HH:mm"),
			isTime: true,
		},
	];
});

const availableCardOptions = computed(() => {
	return cardState.list.filter((item) => canUseCardForConsume(item));
});

const consumeCardOptions = computed(() => {
	const list = [...availableCardOptions.value];
	const currentCardId = consumeDialog.form.cardAccountId;

	if (!currentCardId) {
		return list;
	}

	const currentCard = cardState.list.find((item) => item.id === currentCardId);

	if (currentCard && !list.some((item) => item.id === currentCard.id)) {
		list.unshift(currentCard);
	}

	if (!currentCard && consumeDialog.originalRecord?.cardAccountId === currentCardId) {
		list.unshift({
			id: currentCardId,
			cardName: consumeDialog.originalRecord.cardName || "次卡",
			remainTimes: consumeDialog.originalRecord.remainTimesAfter ?? 0,
		});
	}

	return list;
});

const consumeCardSelectOptions = computed(() => {
	return consumeCardOptions.value.map((item) => {
		return {
			label: `${item.cardName || "次卡"}（剩余${item.remainTimes || 0}次）`,
			value: item.id,
		};
	});
});

const selectedCard = computed(() => {
	return consumeCardOptions.value.find((item) => item.id === consumeDialog.form.cardAccountId);
});

const showConsumeSmsNoticeSwitch = computed(() => {
	return (
		smsNoticeFeatureEnabled &&
		!consumeDialog.isEdit &&
		consumeDialog.form.consumeType === "会员次卡"
	);
});

const consumeTimesMax = computed(() => {
	if (consumeDialog.form.consumeType !== "会员次卡") {
		return 999;
	}

	const remainTimes = Number(selectedCard.value?.remainTimes) || 0;
	const originalTimes =
		consumeDialog.isEdit &&
		consumeDialog.originalRecord?.consumeType === "会员次卡" &&
		consumeDialog.originalRecord?.cardAccountId === consumeDialog.form.cardAccountId
			? Number(consumeDialog.originalRecord?.consumeTimes) || 1
			: 0;

	return Math.max(remainTimes + originalTimes, Number(consumeDialog.form.consumeTimes) || 1, 1);
});

function createCardForm(): CardFormData {
	return {
		cardName: "",
		totalTimes: 10,
		expireTime: "",
		remark: "",
	};
}

function createConsumeForm(type: ConsumeTypeValue = "会员次卡"): ConsumeFormData {
	return {
		consumeType: type,
		cardAccountId: undefined,
		consumeTimes: 1,
		consumeTime: dayjs().format(minuteDateTimeFormat),
		remark: "",
		sendSmsNotice: false,
	};
}

function createCardActionForm(): CardActionFormData {
	return {
		changeTimes: 1,
		remainTimes: 0,
		remark: "",
	};
}

function getDisplayName(item: MemberItem) {
	return item.name || item.nickName || `会员 #${item.id}`;
}

function getInitial(item: MemberItem) {
	return getDisplayName(item).trim().slice(0, 1).toUpperCase();
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
	return (
		sourceOptions.find((item) => item.value === value) || {
			label: "未标记",
			value: -1,
			tone: "neutral",
		}
	);
}

function formatDate(value?: string, format = "YYYY.MM.DD HH:mm") {
	if (!value) {
		return "-";
	}

	const time = dayjs(value);
	return time.isValid() ? time.format(format) : "-";
}

function formatMinuteDateTimeDisplay(value?: string) {
	if (!value) {
		return "";
	}

	const time = dayjs(value);
	return time.isValid() ? time.format(minuteDateTimeFormat) : value;
}

function normalizeMinuteDateTime(value?: string) {
	if (!value) {
		return "";
	}

	const time = dayjs(value);
	return time.isValid() ? time.format(minuteDateTimeFormat) : value;
}

function toSecondPrecisionDateTime(value?: string) {
	if (!value) {
		return "";
	}

	const time = dayjs(value, [minuteDateTimeFormat, secondDateTimeFormat], true);
	return time.isValid() ? time.format(secondDateTimeFormat) : value;
}

function getConsumeTypeTone(type?: string) {
	if (type === "会员次卡") {
		return "success";
	}

	if (type === "抖音新客福利") {
		return "danger";
	}

	if (type === "美团团购") {
		return "warning";
	}

	return "neutral";
}

function getFlowTypeTone(type?: string) {
	if (["开卡", "补次", "启用"].includes(type || "")) {
		return "success";
	}

	if (["停用", "作废"].includes(type || "")) {
		return "danger";
	}

	if (type === "手工调整") {
		return "warning";
	}

	return "neutral";
}

function getSmsLogStatusTone(status?: number) {
	if (status === 1) {
		return "success";
	}

	if (status === 2) {
		return "danger";
	}

	if (status === 3) {
		return "warning";
	}

	return "neutral";
}

function getSmsLogStatusLabel(status?: number) {
	return smsLogStatusOptions.find((item) => item.value === status)?.label || "未知";
}

function formatDelta(value?: number) {
	const amount = Number(value ?? 0);

	if (amount > 0) {
		return `+${amount}`;
	}

	return `${amount}`;
}

function getRecordMetaItems(row: any) {
	const items = [`次卡 ${row.cardName || "-"}`];

	if (row.consumeType === "会员次卡") {
		items.push(`扣减 ${row.consumeTimes || 1} 次`);
		items.push(`剩余 ${row.remainTimesAfter ?? "-"}`);
	}

	return items;
}

function getCardMetaItems(row: any) {
	return [
		`总次数 ${row.totalTimes || 0}`,
		`剩余 ${row.remainTimes || 0}`,
		`过期 ${formatDate(row.expireTime, "MM.DD HH:mm")}`,
	];
}

function getFlowMetaItems(row: any) {
	return [
		`变更前 ${row.beforeTimes ?? 0}`,
		`变更 ${formatDelta(row.changeTimes)}`,
		`变更后 ${row.afterTimes ?? 0}`,
	];
}

function getCardStatus(row: any) {
	if (row.status === 4) {
		return { label: "已作废", tone: "danger" };
	}

	if (row.status === 0) {
		return { label: "已停用", tone: "danger" };
	}

	if (row.expireTime && dayjs(row.expireTime).isBefore(dayjs())) {
		return { label: "已过期", tone: "neutral" };
	}

	if (row.status === 2 || Number(row.remainTimes) <= 0) {
		return { label: "已用完", tone: "warning" };
	}

	return { label: "生效中", tone: "success" };
}

function isCardExpired(row: any) {
	return row.status === 3 || (row.expireTime && dayjs(row.expireTime).isBefore(dayjs()));
}

function canUseCardForConsume(row: any) {
	return row.status !== 0 && row.status !== 4 && !isCardExpired(row) && Number(row.remainTimes) > 0;
}

function canAdjustCard(row: any) {
	return row.status !== 4 && !isCardExpired(row);
}

function canEnableCard(row: any) {
	return row.status === 0 && !isCardExpired(row) && Number(row.remainTimes) > 0;
}

function canStopCard(row: any) {
	return row.status !== 0 && row.status !== 4 && !isCardExpired(row);
}

function canDiscardCard(row: any) {
	return row.status !== 4;
}

function setRecordType(value: "" | ConsumeTypeValue) {
	if (recordState.consumeType === value || recordState.loading) {
		return;
	}

	recordState.consumeType = value;
	recordState.page = 1;
	recordState.total = 0;
	recordState.list = [];
	fetchRecordList();
}

function setFlowCard(id?: number) {
	if (flowState.cardAccountId === id || flowState.loading) {
		return;
	}

	flowState.cardAccountId = id;
	flowState.page = 1;
	flowState.total = 0;
	flowState.list = [];
	fetchFlowList();
}

function setFlowChangeType(value: string) {
	if (flowState.changeType === value || flowState.loading) {
		return;
	}

	flowState.changeType = value;
	flowState.page = 1;
	flowState.total = 0;
	flowState.list = [];
	fetchFlowList();
}

async function validateForm(formRef?: ClForm.Ref) {
	return new Promise<boolean>((resolve) => {
		if (!formRef) {
			resolve(false);
			return;
		}

		formRef.validate((valid: boolean) => {
			resolve(valid);
		});
	});
}

async function fetchMemberInfo() {
	if (!memberId.value) {
		return;
	}

	try {
		const data = await memberService.info({
			id: memberId.value,
		});

		member.value = data;

		if (!summary.latestConsumeTime && data?.lastConsumeTime) {
			summary.latestConsumeTime = data.lastConsumeTime;
		}
	} catch (err: any) {
		ui.showTips(err?.message || "会员档案加载失败");
	}
}

async function fetchSummary() {
	if (!memberId.value) {
		return;
	}

	try {
		const data: any = await memberCardAccountService.summary({
			memberId: memberId.value,
		});

		summary.remainTimes = data?.remainTimes || 0;
		summary.validCardCount = data?.validCardCount || 0;
	} catch (err: any) {
		ui.showTips(err?.message || "会员概览加载失败");
	}
}

async function fetchCardList() {
	if (!memberId.value) {
		return;
	}

	cardState.loading = true;

	try {
		cardState.list = ((await memberCardAccountService.list({
			memberId: memberId.value,
		})) || []) as any[];
		cardLoaded.value = true;
	} catch (err: any) {
		ui.showTips(err?.message || "次卡账户加载失败");
	} finally {
		cardState.loading = false;
	}
}

async function fetchRecordList(options?: { append?: boolean }) {
	if (!memberId.value) {
		return;
	}

	const { append = false } = options || {};
	recordState.loading = true;

	try {
		const data: any = await memberConsumeRecordService.page({
			memberId: memberId.value,
			page: recordState.page,
			size: recordState.size,
			order: "consumeTime",
			sort: "desc",
			consumeType: recordState.consumeType || undefined,
		});

		const rows = data?.list || [];
		recordState.list = append ? [...recordState.list, ...rows] : rows;
		recordState.total = data?.pagination?.total || 0;
		recordLoaded.value = true;

		if (!recordState.consumeType) {
			summary.latestConsumeTime = rows[0]?.consumeTime || member.value?.lastConsumeTime || "";
		}
	} catch (err: any) {
		if (append && recordState.page > 1) {
			recordState.page -= 1;
		}

		ui.showTips(err?.message || "消费记录加载失败");
	} finally {
		recordState.loading = false;
	}
}

async function fetchFlowList(options?: { append?: boolean }) {
	if (!memberId.value) {
		return;
	}

	const { append = false } = options || {};
	flowState.loading = true;

	try {
		const data: any = await memberCardFlowService.page({
			memberId: memberId.value,
			page: flowState.page,
			size: flowState.size,
			cardAccountId: flowState.cardAccountId,
			changeType: flowState.changeType || undefined,
		});

		const rows = data?.list || [];
		flowState.list = append ? [...flowState.list, ...rows] : rows;
		flowState.total = data?.pagination?.total || 0;
		flowLoaded.value = true;
	} catch (err: any) {
		if (append && flowState.page > 1) {
			flowState.page -= 1;
		}

		ui.showTips(err?.message || "次卡流水加载失败");
	} finally {
		flowState.loading = false;
	}
}

async function fetchSmsNoticeSummary() {
	if (!memberId.value) {
		smsNoticeSummary.latest = null;
		return;
	}

	smsNoticeSummary.loading = true;

	try {
		const data: any = await memberConsumeNoticeSmsService.summary({
			memberId: memberId.value,
		});

		smsNoticeSummary.enabled = Boolean(data?.enabled);
		smsNoticeSummary.configured = Boolean(data?.configured);
		smsNoticeSummary.providerReady = Boolean(data?.providerReady);
		smsNoticeSummary.ready = Boolean(data?.ready);
		smsNoticeSummary.signName = data?.signName || "";
		smsNoticeSummary.templateCode = data?.templateCode || "";
		smsNoticeSummary.brandName = data?.brandName || "";
		smsNoticeSummary.keys = {
			enabledKey: data?.enabledKey || smsNoticeSummary.keys.enabledKey,
			templateCodeKey: data?.templateCodeKey || smsNoticeSummary.keys.templateCodeKey,
			signNameKey: data?.signNameKey || smsNoticeSummary.keys.signNameKey,
			brandNameKey: data?.brandNameKey || smsNoticeSummary.keys.brandNameKey,
		};
		smsNoticeSummary.latest = data?.latest || null;
	} catch (err: any) {
		ui.showTips(err?.message || "短信配置加载失败");
	} finally {
		smsNoticeSummary.loading = false;
	}
}

async function fetchSmsLogList(options?: { append?: boolean }) {
	if (!memberId.value) {
		return;
	}

	const { append = false } = options || {};
	smsLogState.loading = true;

	try {
		const data: any = await memberConsumeNoticeSmsService.page({
			memberId: memberId.value,
			page: smsLogState.page,
			size: smsLogState.size,
			sendStatus: smsLogState.sendStatus,
		});

		const rows = data?.list || [];
		smsLogState.list = append ? [...smsLogState.list, ...rows] : rows;
		smsLogState.total = data?.pagination?.total || 0;
		smsLogLoaded.value = true;
	} catch (err: any) {
		if (append && smsLogState.page > 1) {
			smsLogState.page -= 1;
		}

		ui.showTips(err?.message || "短信日志加载失败");
	} finally {
		smsLogState.loading = false;
	}
}

async function loadArchive() {
	if (!memberId.value) {
		archiveReady.value = true;
		return;
	}

	pageLoading.value = true;

	try {
		recordLoaded.value = false;
		cardLoaded.value = false;
		await fetchMemberInfo();
		await Promise.all([
			fetchSummary(),
			fetchCardList(),
			fetchRecordList(),
			...(smsNoticeFeatureEnabled ? [fetchSmsNoticeSummary()] : []),
		]);
		archiveReady.value = true;
	} finally {
		pageLoading.value = false;
	}
}

async function refreshAll() {
	if (!memberId.value || refreshLoading.value) {
		return;
	}

	refreshLoading.value = true;

	try {
		await fetchMemberInfo();

		recordState.page = 1;
		recordState.list = [];
		recordState.total = 0;

		if (flowLoaded.value) {
			flowState.page = 1;
			flowState.list = [];
			flowState.total = 0;
		}

		if (smsLogLoaded.value) {
			smsLogState.page = 1;
			smsLogState.list = [];
			smsLogState.total = 0;
		}

		const tasks: Promise<any>[] = [fetchSummary(), fetchCardList(), fetchRecordList()];

		if (flowLoaded.value) {
			tasks.push(fetchFlowList());
		}

		if (smsNoticeFeatureEnabled) {
			tasks.push(fetchSmsNoticeSummary());
		}

		if (smsLogLoaded.value) {
			tasks.push(fetchSmsLogList());
		}

		await Promise.all(tasks);
	} finally {
		refreshLoading.value = false;
	}
}

function getDefaultConsumeType(type?: ConsumeTypeValue) {
	if (type) {
		return type;
	}

	if (availableCardOptions.value.length > 0) {
		return "会员次卡";
	}

	return "抖音新客福利";
}

async function openCardDialog() {
	cardDialog.form = createCardForm();
	cardDialog.visible = true;
	await nextTick();
	CardForm.value?.clearValidate();
}

async function openConsumeDialog(type?: ConsumeTypeValue) {
	if (type === "会员次卡" && availableCardOptions.value.length === 0) {
		ui.showTips("当前会员没有可用次卡，请先开卡");
		return;
	}

	const consumeType = getDefaultConsumeType(type);
	consumeDialog.visible = true;
	consumeDialog.loading = false;
	consumeDialog.isEdit = false;
	consumeDialog.editingId = undefined;
	consumeDialog.originalRecord = null;
	consumeDialog.title = consumeType === "会员次卡" ? "扣次消费" : "新增消费记录";
	consumeDialog.form = createConsumeForm(consumeType);
	consumeDialog.form.sendSmsNotice = smsNoticeFeatureEnabled && consumeType === "会员次卡" && smsNoticeSummary.ready;

	if (consumeType === "会员次卡") {
		consumeDialog.form.cardAccountId = availableCardOptions.value[0]?.id;
	}

	await nextTick();
	ConsumeForm.value?.clearValidate();
}

async function editConsumeRecord(row: any) {
	consumeDialog.visible = true;
	consumeDialog.loading = false;
	consumeDialog.isEdit = true;
	consumeDialog.editingId = row.id;
	consumeDialog.title = "编辑消费记录";
	consumeDialog.originalRecord = {
		id: row.id,
		consumeType: row.consumeType,
		cardAccountId: row.cardAccountId,
		consumeTimes: row.consumeTimes || 1,
		cardName: row.cardName,
		remainTimesAfter: row.remainTimesAfter,
	};
	consumeDialog.form = {
		consumeType: row.consumeType || "会员次卡",
		cardAccountId: row.consumeType === "会员次卡" ? row.cardAccountId : undefined,
		consumeTimes: row.consumeType === "会员次卡" ? row.consumeTimes || 1 : 1,
		consumeTime: normalizeMinuteDateTime(row.consumeTime) || dayjs().format(minuteDateTimeFormat),
		remark: row.remark || "",
		sendSmsNotice: false,
	};

	await nextTick();
	ConsumeForm.value?.clearValidate();
}

async function refreshAfterConsumeMutation() {
	await fetchMemberInfo();

	recordState.page = 1;
	recordState.list = [];
	recordState.total = 0;

	if (flowLoaded.value) {
		flowState.page = 1;
		flowState.list = [];
		flowState.total = 0;
	}

	await Promise.all([
		fetchSummary(),
		fetchCardList(),
		fetchRecordList(),
		...(flowLoaded.value ? [fetchFlowList()] : []),
		...(smsNoticeFeatureEnabled ? [fetchSmsNoticeSummary()] : []),
		...(smsLogLoaded.value ? [fetchSmsLogList()] : []),
	]);
}

async function submitCard() {
	if (!memberId.value || cardDialog.loading) {
		return;
	}

	const valid = await validateForm(CardForm.value);

	if (!valid) {
		return;
	}

	if (!cardDialog.form.cardName.trim()) {
		ui.showTips("请输入次卡名称");
		return;
	}

	if (!cardDialog.form.totalTimes || cardDialog.form.totalTimes < 1) {
		ui.showTips("请输入正确的总次数");
		return;
	}

	cardDialog.loading = true;

	try {
		await memberCardAccountService.add({
			memberId: memberId.value,
			cardName: cardDialog.form.cardName.trim(),
			totalTimes: cardDialog.form.totalTimes,
			expireTime: toSecondPrecisionDateTime(cardDialog.form.expireTime) || null,
			remark: cardDialog.form.remark.trim(),
		});

		cardDialog.visible = false;
		await Promise.all([fetchSummary(), fetchCardList()]);
		ui.showTips("次卡开通成功");
	} catch (err: any) {
		ui.showTips(err?.message || "开卡失败，请稍后重试");
	} finally {
		cardDialog.loading = false;
	}
}

async function submitConsumeRecord() {
	if (!memberId.value || consumeDialog.loading) {
		return;
	}

	const valid = await validateForm(ConsumeForm.value);

	if (!valid) {
		return;
	}

	if (!consumeDialog.form.consumeTime) {
		ui.showTips("请选择消费时间");
		return;
	}

	if (consumeDialog.form.consumeType === "会员次卡") {
		if (!consumeDialog.form.cardAccountId) {
			ui.showTips("请选择次卡");
			return;
		}

		if (!consumeDialog.form.consumeTimes || consumeDialog.form.consumeTimes < 1) {
			ui.showTips("请输入正确的扣减次数");
			return;
		}
	}

	consumeDialog.loading = true;

	try {
		const payload = {
			memberId: memberId.value,
			consumeType: consumeDialog.form.consumeType,
			cardAccountId: consumeDialog.form.consumeType === "会员次卡" ? consumeDialog.form.cardAccountId : null,
			consumeTimes: consumeDialog.form.consumeType === "会员次卡" ? consumeDialog.form.consumeTimes || 1 : null,
			consumeTime: toSecondPrecisionDateTime(consumeDialog.form.consumeTime),
			remark: consumeDialog.form.remark.trim(),
			sendSmsNotice:
				smsNoticeFeatureEnabled &&
				!consumeDialog.isEdit &&
				consumeDialog.form.consumeType === "会员次卡" &&
				Boolean(consumeDialog.form.sendSmsNotice),
		};

		if (consumeDialog.isEdit && consumeDialog.editingId) {
			await memberConsumeRecordService.update({
				id: consumeDialog.editingId,
				...payload,
			});
		} else {
			await memberConsumeRecordService.add(payload);
		}

		consumeDialog.visible = false;
		await refreshAfterConsumeMutation();
		ui.showTips(
			payload.sendSmsNotice && smsNoticeSummary.ready
				? "保存成功，已加入短信发送流程"
				: consumeDialog.isEdit
					? "消费记录已更新"
					: "消费记录新增成功",
		);
	} catch (err: any) {
		ui.showTips(err?.message || "消费记录保存失败，请稍后重试");
	} finally {
		consumeDialog.loading = false;
	}
}

function deleteConsumeRecord(row: any) {
	ui.showConfirm({
		title: "删除消费记录",
		type: "warning",
		message: "确认删除这条消费记录吗？删除后会同步回滚相关统计。",
		confirmButtonText: "确认删除",
		beforeClose(action, { done, showLoading, hideLoading }) {
			if (action !== "confirm") {
				done();
				return;
			}

			showLoading();

			memberConsumeRecordService
				.delete({
					ids: [row.id],
				})
				.then(async () => {
					await refreshAfterConsumeMutation();
					done();
					ui.showTips("消费记录已删除");
				})
				.catch((err: any) => {
					hideLoading();
					ui.showTips(err?.message || "消费记录删除失败，请稍后重试");
				});
		},
	});
}

function openCardActionDialog(row: any, mode: CardActionMode) {
	cardActionDialog.visible = true;
	cardActionDialog.loading = false;
	cardActionDialog.mode = mode;
	cardActionDialog.title = mode === "plus" ? "补次" : "手工调整";
	cardActionDialog.cardId = row.id;
	cardActionDialog.cardName = row.cardName || "次卡";
	cardActionDialog.beforeTimes = row.remainTimes || 0;
	cardActionDialog.form = {
		changeTimes: 1,
		remainTimes: row.remainTimes || 0,
		remark: "",
	};
}

async function submitCardAction() {
	if (!cardActionDialog.cardId || cardActionDialog.loading) {
		return;
	}

	if (cardActionDialog.mode === "plus" && (!cardActionDialog.form.changeTimes || cardActionDialog.form.changeTimes < 1)) {
		ui.showTips("请输入正确的补次次数");
		return;
	}

	if (cardActionDialog.mode === "set" && cardActionDialog.form.remainTimes < 0) {
		ui.showTips("请输入正确的调整后剩余次数");
		return;
	}

	cardActionDialog.loading = true;

	try {
		if (cardActionDialog.mode === "plus") {
			await memberCardAccountService.plusTimes({
				id: cardActionDialog.cardId,
				changeTimes: cardActionDialog.form.changeTimes,
				remark: cardActionDialog.form.remark.trim(),
			});
		} else {
			await memberCardAccountService.setRemainTimes({
				id: cardActionDialog.cardId,
				remainTimes: cardActionDialog.form.remainTimes,
				remark: cardActionDialog.form.remark.trim(),
			});
		}

		cardActionDialog.visible = false;

		const tasks: Promise<any>[] = [fetchSummary(), fetchCardList()];

		if (flowLoaded.value) {
			flowState.page = 1;
			flowState.list = [];
			flowState.total = 0;
			tasks.push(fetchFlowList());
		}

		await Promise.all(tasks);
		ui.showTips("次卡调整成功");
	} catch (err: any) {
		ui.showTips(err?.message || "次卡调整失败，请稍后重试");
	} finally {
		cardActionDialog.loading = false;
	}
}

function changeCardStatus(row: any, action: "enable" | "stop" | "discard") {
	const actionText = action === "enable" ? "启用" : action === "stop" ? "停用" : "作废";

	ui.showConfirm({
		title: actionText,
		type: "warning",
		message: `确认执行“${actionText}”操作吗？`,
		confirmButtonText: `确认${actionText}`,
		beforeClose(confirmAction, { done, showLoading, hideLoading }) {
			if (confirmAction !== "confirm") {
				done();
				return;
			}

			showLoading();

			memberCardAccountService[action]({
				id: row.id,
			})
				.then(async () => {
					const tasks: Promise<any>[] = [fetchSummary(), fetchCardList()];

					if (flowLoaded.value) {
						flowState.page = 1;
						flowState.list = [];
						flowState.total = 0;
						tasks.push(fetchFlowList());
					}

					await Promise.all(tasks);
					done();
					ui.showTips(`${actionText}成功`);
				})
				.catch((err: any) => {
					hideLoading();
					ui.showTips(err?.message || `${actionText}失败，请稍后重试`);
				});
		},
	});
}

function loadMoreRecords() {
	if (recordState.loading || recordState.list.length >= recordState.total) {
		return;
	}

	recordState.page += 1;
	fetchRecordList({
		append: true,
	});
}

function loadMoreFlows() {
	if (flowState.loading || flowState.list.length >= flowState.total) {
		return;
	}

	flowState.page += 1;
	fetchFlowList({
		append: true,
	});
}

function setSmsLogStatus(value?: number) {
	if (smsLogState.loading || smsLogState.sendStatus === value) {
		return;
	}

	smsLogState.sendStatus = value;
	smsLogState.page = 1;
	smsLogState.total = 0;
	smsLogState.list = [];
	fetchSmsLogList();
}

function loadMoreSmsLogs() {
	if (smsLogState.loading || smsLogState.list.length >= smsLogState.total) {
		return;
	}

	smsLogState.page += 1;
	fetchSmsLogList({
		append: true,
	});
}

watch(
	() => consumeDialog.form.consumeType,
	(value) => {
		if (value !== "会员次卡") {
			consumeDialog.form.cardAccountId = undefined;
			consumeDialog.form.consumeTimes = 1;
			consumeDialog.form.sendSmsNotice = false;
			return;
		}

		if (!consumeDialog.form.cardAccountId) {
			consumeDialog.form.cardAccountId = consumeCardOptions.value[0]?.id;
		}

		if (!consumeDialog.isEdit) {
			consumeDialog.form.sendSmsNotice = smsNoticeFeatureEnabled && smsNoticeSummary.ready;
		}
	},
);

watch(
	activeTab,
	(value) => {
		if (value === "flows" && !flowLoaded.value) {
			fetchFlowList();
		}

		if (value === "sms" && !smsLogLoaded.value) {
			fetchSmsLogList();
		}
	},
);

onLoad((query) => {
	const value = Number(query?.id || router.query.id);

	memberId.value = Number.isFinite(value) && value > 0 ? value : undefined;

	if (memberId.value) {
		loadArchive();
	} else {
		archiveReady.value = true;
	}
});
</script>

<style lang="scss" scoped>
.page-member-detail {
	--bg: #f7faf5;
	--paper: rgba(254, 255, 252, 0.94);
	--paper-strong: rgba(254, 255, 253, 0.98);
	--ink: #111816;
	--muted: #6a6d68;
	--line: rgba(19, 52, 39, 0.1);
	--accent: #17724f;
	--accent-deep: #105f42;
	--accent-soft: rgba(23, 114, 79, 0.12);
	--mint: #86c99d;
	--rose: #a12d45;
	--amber: #a66d09;

	min-height: 100%;
	padding: 28rpx 28rpx 44rpx;
	box-sizing: border-box;
}

.profile-hero,
.tabs-shell,
.account-card,
.record-card,
.flow-card {
	border-radius: 30rpx;
	background: var(--paper);
	border: 1rpx solid rgba(248, 252, 247, 0.82);
	box-shadow: 0 18rpx 46rpx rgba(25, 61, 45, 0.08);
}

.profile-hero {
	position: relative;
	display: flex;
	flex-direction: column;
	min-height: 432rpx;
	padding: 54rpx 30rpx 26rpx;
	box-sizing: border-box;
	overflow: hidden;
	border-radius: 46rpx;
	background-image: url("/static/member-detail-hero-bg.png");
	background-size: 100% 100%;
	background-position: center;
	background-repeat: no-repeat;
}

.profile-hero__header,
.profile-hero__identity,
.profile-hero__supplement {
	display: flex;
	align-items: center;
}

.profile-hero__header {
	position: relative;
	z-index: 1;
	justify-content: space-between;
	gap: 18rpx;
}

.profile-hero__identity {
	flex: 1;
	min-width: 0;
	gap: 26rpx;
}

.profile-hero__avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 106rpx;
	height: 106rpx;
	border-radius: 999rpx;
	background:
		radial-gradient(circle at 34% 26%, rgba(255, 255, 255, 0.18), transparent 28%),
		linear-gradient(145deg, #1d7b55 0%, #0f6543 100%);
	border: 5rpx solid rgba(255, 255, 255, 0.88);
	color: #fffffd;
	font-size: 48rpx;
	font-weight: 700;
	line-height: 1;
	box-shadow: 0 18rpx 36rpx rgba(15, 101, 67, 0.22);
	flex-shrink: 0;
}

.profile-hero__copy {
	flex: 1;
	min-width: 0;
}

.profile-hero__eyebrow,
.profile-hero__phone,
.detail-note__label,
.panel-meta,
.record-card__label,
.account-stat__label,
.account-card__time,
.flow-card__time,
.popup-summary__text,
.helper-card__text {
	font-size: 22rpx;
	color: var(--muted);
}

.profile-hero__eyebrow {
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	padding: 7rpx 17rpx;
	border-radius: 14rpx;
	border: 1rpx solid rgba(23, 114, 79, 0.2);
	background: rgba(253, 255, 251, 0.45);
	color: var(--accent);
	font-size: 22rpx;
	font-weight: 700;
}

.popup-summary__text {
	display: block;
}

.profile-hero__name {
	display: block;
	margin-top: 14rpx;
	font-size: 40rpx;
	font-weight: 800;
	color: var(--ink);
	line-height: 1.08;
}

.profile-hero__phone {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.2;
}

.profile-hero__refresh {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	height: 58rpx;
	padding: 0 26rpx;
	border-radius: 999rpx;
	background: rgba(254, 255, 252, 0.92);
	border: 1rpx solid rgba(236, 243, 236, 0.95);
	color: var(--accent);
	font-size: 22rpx;
	font-weight: 700;
	box-shadow: 0 12rpx 26rpx rgba(39, 91, 65, 0.12);
	flex-shrink: 0;
}

.profile-hero__supplement {
	position: relative;
	z-index: 1;
	justify-content: space-between;
	gap: 14rpx;
	margin-top: 34rpx;
}

.profile-hero__meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 16rpx;
}

.profile-hero__meta-item {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 42rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	border-radius: 999rpx;
	background: rgba(254, 255, 252, 0.66);
	border: 1rpx solid rgba(23, 114, 79, 0.1);
	color: var(--accent);
	font-size: 21rpx;
	font-weight: 700;
	line-height: 1;
	white-space: nowrap;
	box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.75);
}

.profile-hero__meta-item--id {
	min-width: 94rpx;
}

.profile-hero__meta-item--joined {
	min-width: 174rpx;
}

.profile-hero__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
}

.profile-hero__chips .tag-chip {
	padding: 9rpx 20rpx;
	font-size: 22rpx;
}

.profile-overview {
	position: relative;
	z-index: 1;
	display: flex;
	margin-top: 24rpx;
	min-height: 116rpx;
	border-radius: 26rpx;
	background: rgba(254, 255, 253, 0.92);
	border: 1rpx solid rgba(20, 58, 42, 0.08);
	box-shadow: 0 16rpx 30rpx rgba(21, 52, 40, 0.11);
	overflow: hidden;
}

.profile-overview__item {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 12rpx;
	padding: 20rpx 12rpx 18rpx;
	min-width: 0;
	text-align: center;
}

.profile-overview__item + .profile-overview__item {
	border-left: 1rpx solid rgba(30, 34, 32, 0.08);
}

.detail-note__value,
.record-card__value,
.account-card__title,
.flow-card__title,
.popup-summary__title,
.helper-card__title {
	color: var(--ink);
}

.profile-overview__label,
.popup-summary__title,
.detail-note__label {
	font-size: 24rpx;
	font-weight: 700;
}

.profile-overview__value {
	display: block;
	font-size: 32rpx;
	font-weight: 800;
	line-height: 1.15;
	color: var(--accent);
}

.profile-overview__value--time {
	font-size: 25rpx;
	line-height: 1.3;
}

.profile-overview__value--empty {
	color: var(--muted);
}

.tag-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 11rpx 22rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	font-weight: 700;
	line-height: 1.1;
}

.tag-chip.is-success {
	color: #126f49;
	background: rgba(49, 172, 101, 0.14);
}

.tag-chip.is-danger {
	color: var(--rose);
	background: rgba(194, 52, 80, 0.1);
}

.tag-chip.is-warning {
	color: var(--amber);
	background: rgba(237, 162, 53, 0.15);
}

.tag-chip.is-neutral {
	color: #6a6a63;
	background: rgba(34, 47, 41, 0.08);
}

.tag-chip.is-dark {
	color: #fffffd;
	background: var(--ink);
}

.tabs-shell {
	margin-top: 24rpx;
	padding: 0 0 34rpx;
	border-radius: 42rpx;
	overflow: hidden;
	background: rgba(254, 255, 253, 0.95);
}

.detail-note__value {
	display: block;
}

.detail-note {
	margin-top: 12rpx;
	padding: 18rpx 20rpx;
	border-radius: 20rpx;
	background: rgba(31, 106, 82, 0.06);
}

.detail-note__value {
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.7;
}

.tabs-shell :deep(.cl-tabs) {
	margin-bottom: 28rpx;
}

.tabs-shell :deep(.cl-tabs__list) {
	background: transparent;
	border-radius: 0;
	border-bottom: 1rpx solid rgba(23, 48, 38, 0.08);
}

.tabs-shell :deep(.cl-tabs__bar-item) {
	height: 102rpx;
	border-radius: 0;
	transition: color 0.25s ease;
}

.tabs-shell :deep(.cl-tabs__item) {
	font-size: 30rpx;
	font-weight: 700;
	color: var(--muted);
}

.tabs-shell :deep(.cl-tabs__item.is-active) {
	color: var(--accent);
}

.tabs-shell :deep(.cl-tabs__slider) {
	height: 6rpx;
	width: 46rpx !important;
	left: 50% !important;
	margin-left: -23rpx;
	background: var(--accent);
	border-radius: 999rpx;
}

.filter-scroll {
	white-space: nowrap;
	margin-top: 0;
	padding-left: 24rpx;
	box-sizing: border-box;
}

.filter-scroll--compact {
	margin-top: 14rpx;
}

.filter-row {
	display: inline-flex;
	gap: 16rpx;
	padding-right: 24rpx;
}

.filter-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 62rpx;
	padding: 0 26rpx;
	border-radius: 16rpx;
	background: rgba(28, 38, 33, 0.07);
	border: 1rpx solid transparent;
	color: #50544f;
	font-size: 24rpx;
	font-weight: 700;
}

.filter-chip--soft {
	background: rgba(28, 38, 33, 0.06);
	border-color: transparent;
	color: #555955;
}

.filter-chip.is-active {
	background: linear-gradient(135deg, #1a7d56, #116a49);
	border-color: var(--accent);
	color: #fffffd;
	box-shadow: 0 10rpx 18rpx rgba(19, 105, 73, 0.18);
}

.panel-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 32rpx;
	padding: 0 24rpx;
	gap: 12rpx;
	flex-wrap: wrap;
	font-size: 24rpx;
	color: #2e332f;
}

.record-list,
.card-list,
.flow-list {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
	margin-top: 22rpx;
	padding: 0 24rpx;
	box-sizing: border-box;
}

.record-card,
.account-card,
.flow-card {
	padding: 24rpx;
	border-radius: 26rpx;
	background: rgba(254, 255, 253, 0.98);
	border-color: rgba(21, 52, 40, 0.07);
	box-shadow: 0 12rpx 30rpx rgba(18, 54, 40, 0.07);
}

.record-card__header,
.account-card__header,
.flow-card__header,
.popup-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14rpx;
}

.record-card__main {
	display: flex;
	align-items: flex-start;
	gap: 18rpx;
}

.record-card__content {
	flex: 1;
	min-width: 0;
}

.record-card__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 76rpx;
	height: 76rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #8cd89f, #5fb978);
	flex-shrink: 0;
}

.record-card__icon.is-warning {
	background: linear-gradient(135deg, #f0c46c, #d6922c);
}

.record-card__icon.is-danger {
	background: linear-gradient(135deg, #e6a0ad, #ca5d74);
}

.record-card__icon.is-neutral {
	background: linear-gradient(135deg, #bac2bb, #8b958e);
}

.record-card__icon .member-icon {
	color: rgba(255, 255, 255, 0.96);
	width: 46rpx;
	height: 46rpx;
}

.member-icon {
	width: 38rpx;
	height: 38rpx;
	background-color: currentColor;
	flex-shrink: 0;
	-webkit-mask: var(--member-icon-url) center / contain no-repeat;
	mask: var(--member-icon-url) center / contain no-repeat;
}

.member-icon--record {
	--member-icon-url: url("/static/member-icons/01-member-card.svg");
}

.member-icon--open {
	--member-icon-url: url("/static/member-icons/02-open-card.svg");
}

.member-icon--consume {
	--member-icon-url: url("/static/member-icons/03-consume-check.svg");
}

.member-icon--add {
	--member-icon-url: url("/static/member-icons/04-add-consume.svg");
}

.record-card__title-wrap,
.card-inline-actions,
.record-card__summary,
.account-card__summary,
.flow-card__summary {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
}

.record-card__title-wrap {
	gap: 10rpx;
	min-width: 0;
	flex: 1;
}

.record-card__title {
	font-size: 28rpx;
	font-weight: 800;
	color: var(--ink);
	line-height: 1.25;
}

.record-card__time,
.record-card__remark,
.account-card__remark,
.flow-card__remark {
	font-size: 23rpx;
	color: var(--muted);
}

.record-card__summary,
.account-card__summary,
.flow-card__summary {
	gap: 10rpx;
	margin-top: 20rpx;
}

.summary-pill {
	display: inline-flex;
	align-items: center;
	min-height: 46rpx;
	padding: 0 18rpx;
	border-radius: 10rpx;
	background: rgba(23, 114, 79, 0.08);
	color: rgba(23, 114, 79, 0.95);
	font-size: 22rpx;
	font-weight: 700;
	border: 1rpx solid rgba(23, 114, 79, 0.06);
}

.record-card__remark-box {
	margin-top: 20rpx;
	padding: 18rpx 20rpx;
	border-radius: 16rpx;
	background: rgba(25, 45, 35, 0.04);
}

.account-card__title,
.flow-card__title,
.helper-card__title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}

.account-card__time,
.flow-card__time {
	display: block;
	margin-top: 8rpx;
}

.account-card__remark,
.flow-card__remark,
.record-card__remark {
	display: block;
	margin-top: 16rpx;
	line-height: 1.7;
}

.card-inline-actions {
	gap: 30rpx;
	margin-top: 22rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(23, 48, 38, 0.08);
}

.card-inline-actions--record {
	width: 100%;
	box-sizing: border-box;
}

.card-inline-action {
	font-size: 24rpx;
	font-weight: 600;
	color: var(--accent);
}

.card-inline-action.is-danger {
	color: #a43e47;
}

.action-strip {
	display: grid;
	grid-template-columns: 1.22fr 1.12fr 1fr;
	gap: 24rpx;
}

.action-dock-spacer {
	height: 164rpx;
}

.action-dock {
	position: fixed;
	left: 28rpx;
	right: 28rpx;
	bottom: calc(22rpx + constant(safe-area-inset-bottom));
	bottom: calc(22rpx + env(safe-area-inset-bottom));
	z-index: 30;
	padding: 18rpx 20rpx;
	border-radius: 28rpx;
	background: rgba(254, 255, 253, 0.94);
	border: 1rpx solid rgba(255, 255, 255, 0.95);
	box-shadow: 0 18rpx 44rpx rgba(25, 61, 45, 0.12);
	backdrop-filter: blur(18rpx);
}

.action-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14rpx;
	min-width: 0;
	height: 72rpx;
	border-radius: 16rpx;
	font-size: 28rpx;
	font-weight: 800;
	line-height: 1;
}

.action-btn--primary {
	background:
		radial-gradient(circle at 25% 24%, rgba(255, 255, 255, 0.14), transparent 30%),
		linear-gradient(135deg, #1b8058, #106845);
	color: #fffffd;
	box-shadow: 0 10rpx 20rpx rgba(16, 104, 69, 0.2);
}

.action-btn--secondary {
	background: rgba(23, 114, 79, 0.1);
	color: var(--accent);
}

.action-btn--ghost {
	background: rgba(254, 255, 253, 0.82);
	color: #3f4240;
	border: 1rpx solid rgba(28, 38, 33, 0.1);
}

.panel-more,
.popup-secondary,
.popup-primary {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 68rpx;
	padding: 0 24rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	font-weight: 700;
}

.panel-more {
	width: 100%;
	margin-top: 18rpx;
	background: rgba(31, 106, 82, 0.08);
	color: var(--accent);
}

.popup-shell {
	display: flex;
	flex-direction: column;
	max-height: 78vh;
}

.popup-summary {
	padding: 26rpx 26rpx 12rpx;
}

.popup-summary__title {
	display: block;
}

.popup-summary__text {
	margin-top: 10rpx;
}

.popup-body {
	max-height: 56vh;
	padding: 0 26rpx 12rpx;
	box-sizing: border-box;
}

.popup-footer {
	padding: 18rpx 26rpx 26rpx;
	background: rgba(255, 255, 255, 0.95);
}

.popup-secondary,
.popup-primary {
	flex: 1;
}

.popup-secondary {
	background: rgba(30, 34, 32, 0.08);
	color: var(--ink);
}

.popup-primary {
	background: var(--accent);
	color: #fff;
}

.choice-group {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}

.choice-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 170rpx;
	height: 72rpx;
	padding: 0 20rpx;
	border-radius: 20rpx;
	background: rgba(31, 106, 82, 0.08);
	color: var(--muted);
	font-size: 24rpx;
	font-weight: 600;
}

.choice-chip.is-active {
	background: var(--accent);
	color: #fff;
}

.helper-card {
	padding: 20rpx 22rpx;
	margin-top: -4rpx;
	margin-bottom: 16rpx;
	border-radius: 22rpx;
	background: rgba(31, 106, 82, 0.08);
}

.notice-card {
	margin-bottom: 18rpx;
	padding: 20rpx 22rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 247, 0.98);
	border: 1rpx solid rgba(31, 106, 82, 0.12);
	box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.notice-card__header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16rpx;
}

.notice-card__title {
	display: block;
	font-size: 24rpx;
	font-weight: 600;
	color: var(--ink);
}

.notice-card__desc,
.notice-card__hint {
	display: block;
	font-size: 22rpx;
	line-height: 1.6;
	color: var(--muted);
}

.notice-card__desc {
	margin-top: 8rpx;
}

.notice-card__hint {
	margin-top: 12rpx;
}

.helper-card__text {
	display: block;
	margin-top: 8rpx;
}

.loading-wrap,
.empty-wrap {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
}

.loading-wrap--section,
.empty-wrap--section {
	min-height: 240rpx;
}

.loading-wrap__text {
	margin-top: 20rpx;
	font-size: 24rpx;
	color: var(--muted);
}

.popup-body :deep(.cl-form-item__label) {
	font-size: 24rpx;
	font-weight: 600;
	color: var(--ink);
}

.popup-body :deep(.cl-input),
.popup-body :deep(.cl-textarea),
.popup-body :deep(.cl-select-inner),
.popup-body :deep(.cl-input-number),
.popup-body :deep(.cl-select-date__value) {
	border-radius: 20rpx;
}

.popup-body :deep(.cl-input.is-border),
.popup-body :deep(.cl-textarea.is-border),
.popup-body :deep(.cl-select-inner.is-border),
.popup-body :deep(.cl-select-date__value.is-border) {
	border-color: rgba(31, 106, 82, 0.16);
	background: rgba(255, 252, 247, 0.98);
}

.popup-body :deep(.cl-input--focus) {
	border-color: rgba(31, 106, 82, 0.48);
	box-shadow: 0 0 0 2rpx rgba(31, 106, 82, 0.08);
}

.popup-body :deep(.cl-input__inner),
.popup-body :deep(.cl-textarea__inner),
.popup-body :deep(.cl-select-inner__value),
.popup-body :deep(.cl-input-number__value) {
	color: var(--ink);
}

.popup-body :deep(.cl-input__icon),
.popup-body :deep(.cl-select-inner__icon),
.popup-body :deep(.cl-textarea__count) {
	color: rgba(31, 106, 82, 0.56);
}

.popup-body :deep(.cl-input-number) {
	background: transparent;
}

.popup-body :deep(.cl-input-number__plus) {
	background: var(--accent);
	color: #fff;
}

.popup-body :deep(.cl-input-number__minus) {
	background: rgba(31, 106, 82, 0.1);
	color: var(--accent);
}

.popup-body :deep(.cl-input-number__value) {
	color: var(--accent);
}

.page-member-detail :deep(.cl-select-popup__item.is-active) {
	color: var(--accent);
}

.page-member-detail :deep(.cl-select-popup__item .is-check) {
	color: var(--accent);
}

.page-member-detail :deep(.cl-select-popup__footer) {
	background: rgba(255, 252, 247, 0.96);
}

.page-member-detail :deep(.cl-select-popup__footer .cl-button--primary) {
	background: var(--accent);
	border-color: var(--accent);
}

.page-member-detail :deep(.cl-select-popup__footer .cl-button--primary.button-hover) {
	background: rgba(31, 106, 82, 0.86);
}

@media (max-width: 375px) {
	.profile-hero {
		padding: 48rpx 24rpx 22rpx;
		border-radius: 38rpx;
	}

	.profile-hero__avatar {
		width: 98rpx;
		height: 98rpx;
		font-size: 44rpx;
	}

	.profile-hero__header,
	.profile-hero__supplement {
		flex-wrap: wrap;
	}

	.profile-hero__meta {
		width: 100%;
		justify-content: flex-start;
	}

	.profile-overview {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		border-radius: 18rpx;
	}

	.profile-overview__item + .profile-overview__item {
		border-left: 0;
	}

	.profile-overview__item {
		padding: 12rpx 8rpx;
		gap: 4rpx;
	}

	.profile-overview__item:not(:last-child) {
		border-bottom: 0;
		border-right: 1rpx solid rgba(30, 34, 32, 0.08);
	}

	.profile-overview__label {
		font-size: 20rpx;
	}

	.profile-overview__value {
		font-size: 26rpx;
	}

	.profile-overview__value--time {
		font-size: 20rpx;
	}

	.action-strip {
		gap: 10rpx;
	}

	.action-dock {
		left: 20rpx;
		right: 20rpx;
		padding: 12rpx;
		border-radius: 22rpx;
	}

	.action-dock-spacer {
		height: 122rpx;
	}

	.action-btn {
		height: 66rpx;
		font-size: 20rpx;
	}

	.account-card__header,
	.flow-card__header {
		align-items: flex-start;
		flex-direction: column;
	}

	.card-inline-actions {
		width: 100%;
		justify-content: flex-start;
	}
}
</style>
