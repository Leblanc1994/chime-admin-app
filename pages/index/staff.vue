<template>
	<cl-page :background-color="pageBackground" @refresh="reload">
		<view class="page-staff">
			<view class="staff-hero">
				<view class="staff-hero__glow"></view>
				<view class="staff-hero__copy">
					<text class="staff-hero__eyebrow">STORE TEAM</text>
					<text class="staff-hero__title">员工管理</text>
					<text class="staff-hero__desc">管理本门店店员账号与登录权限</text>
				</view>
				<view class="staff-hero__count"><strong>{{ pagination.total }}</strong><text>名员工</text></view>
			</view>

			<view class="staff-tools">
				<view class="staff-search">
					<cl-icon name="search" :size="32" color="#8f899d" />
					<input
					v-model.trim="filters.keyword"
						placeholder="搜索姓名、账号、手机号"
						placeholder-class="staff-search__placeholder"
						confirm-type="search"
						@confirm="reload"
					/>
				</view>
				<view class="staff-add" @tap="openStaffPopup('add')"><cl-icon name="plus" :size="32" color="#fff" /></view>
			</view>

			<scroll-view class="staff-filter" scroll-x>
				<view class="staff-filter__inner">
					<view
						v-for="item in statusOptions"
						:key="item.value"
						class="staff-filter__item"
						:class="{ 'is-active': filters.status === item.value }"
						@tap="setStatus(item.value)"
					>
						{{ item.label }}
					</view>
				</view>
			</scroll-view>

			<view v-if="loading && !loaded" class="staff-loading"><cl-loading :size="40" /><text>正在加载员工</text></view>

			<view v-else-if="staff.length" class="staff-list">
				<view v-for="item in staff" :key="item.id" class="staff-card">
					<view class="staff-card__top">
						<view class="staff-avatar">{{ getInitial(item) }}</view>
						<view class="staff-card__main">
							<view class="staff-card__name-line"><text>{{ item.name || item.username }}</text><text class="staff-status" :class="{ 'is-disabled': item.status !== 1 }">{{ item.status === 1 ? "在职" : "已停用" }}</text></view>
							<text class="staff-card__account">{{ item.username }}</text>
						</view>
						<view class="staff-card__more" @tap="openActions(item)">•••</view>
					</view>
					<view class="staff-card__details">
						<view><text>手机号</text><strong>{{ item.phone || "未填写" }}</strong></view>
						<view><text>岗位</text><strong>店员</strong></view>
						<view><text>创建时间</text><strong>{{ formatDate(item.createTime) }}</strong></view>
					</view>
					<text v-if="item.remark" class="staff-card__remark">{{ item.remark }}</text>
					<view class="staff-card__actions">
						<view @tap="openStaffPopup('edit', item)">编辑资料</view>
						<view @tap="openPasswordPopup(item)">重置密码</view>
						<view :class="{ 'is-danger': item.status === 1, 'is-success': item.status !== 1 }" @tap="confirmStatus(item)">{{ item.status === 1 ? "停用" : "启用" }}</view>
					</view>
				</view>
			</view>

			<view v-else-if="loaded" class="staff-empty"><cl-empty :fixed="false" text="暂时没有匹配的员工" /><view @tap="openStaffPopup('add')">添加第一名员工</view></view>

			<view v-if="loaded && staff.length" class="staff-footer">{{ loading ? "正在加载更多" : finished ? "已经到底了" : "上拉加载更多" }}</view>
		</view>

		<cl-popup v-model="staffPopup.visible" :title="staffPopup.mode === 'add' ? '添加员工' : '编辑员工'" direction="bottom" border-radius="36rpx 36rpx 0 0" :padding="0">
			<view class="form-popup">
				<view class="form-popup__hint">{{ staffPopup.mode === "add" ? "创建后请将账号和初始密码单独交付给员工。" : "登录账号与岗位不可修改，可更新员工资料。" }}</view>
				<scroll-view class="form-popup__body" scroll-y>
					<view class="form-field"><text>员工姓名 <em>*</em></text><cl-input v-model="staffForm.name" placeholder="请输入员工姓名" :maxlength="30" /></view>
					<view class="form-field"><text>手机号</text><cl-input v-model="staffForm.phone" placeholder="选填" :maxlength="20" /></view>
					<view class="form-field"><text>登录账号 <em>*</em></text><cl-input v-model="staffForm.username" :disabled="staffPopup.mode === 'edit'" placeholder="例如 wangxiaomei" :maxlength="32" /></view>
					<view v-if="staffPopup.mode === 'add'" class="form-field"><text>初始密码 <em>*</em></text><cl-input v-model="staffForm.password" type="password" placeholder="至少 6 位" :maxlength="64" /></view>
					<view class="form-field"><text>岗位</text><view class="form-field__static">店员</view></view>
					<view class="form-field"><text>备注</text><cl-textarea v-model="staffForm.remark" placeholder="选填，可记录职责或交接信息" count auto-height :maxlength="200" /></view>
				</scroll-view>
				<view class="form-popup__footer"><view @tap="staffPopup.visible = false">取消</view><view class="is-primary" @tap="saveStaff">{{ saving ? "保存中..." : staffPopup.mode === "add" ? "确认添加" : "保存修改" }}</view></view>
			</view>
		</cl-popup>

		<cl-popup v-model="passwordPopup.visible" title="重置员工密码" direction="bottom" border-radius="36rpx 36rpx 0 0" :padding="0">
			<view class="form-popup form-popup--short">
				<view class="form-popup__hint">重置后，{{ passwordForm.name }} 需要使用新密码重新登录。</view>
				<view class="form-popup__body form-popup__body--short"><view class="form-field"><text>新密码 <em>*</em></text><cl-input v-model="passwordForm.password" type="password" placeholder="至少 6 位" :maxlength="64" /></view><view class="form-field"><text>确认新密码 <em>*</em></text><cl-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" :maxlength="64" /></view></view>
				<view class="form-popup__footer"><view @tap="passwordPopup.visible = false">取消</view><view class="is-primary" @tap="resetPassword">{{ resettingPassword ? "重置中..." : "确认重置" }}</view></view>
			</view>
		</cl-popup>
	</cl-page>
</template>

<script lang="ts" setup>
import { onPullDownRefresh, onReachBottom, onShow } from "@dcloudio/uni-app";
import { reactive, ref } from "vue";
import { useUi } from "/$/cool-ui";
import StoreStaffService, { type StoreStaff } from "../../service/store/staff";

type StaffMode = "add" | "edit";
type StaffStatus = -1 | 0 | 1;

const ui = useUi();
const service = new StoreStaffService();
const pageBackground = "#f8f8fc";
const statusOptions = [{ label: "全部", value: -1 as StaffStatus }, { label: "在职", value: 1 as StaffStatus }, { label: "已停用", value: 0 as StaffStatus }];
const staff = ref<StoreStaff[]>([]);
const loading = ref(false);
const loaded = ref(false);
const finished = ref(false);
const saving = ref(false);
const resettingPassword = ref(false);
const filters = reactive({ keyword: "", status: -1 as StaffStatus });
const pagination = reactive({ page: 1, size: 15, total: 0 });
const staffPopup = reactive({ visible: false, mode: "add" as StaffMode });
const passwordPopup = reactive({ visible: false });
const staffForm = reactive({ id: 0, name: "", phone: "", username: "", password: "", remark: "" });
const passwordForm = reactive({ id: 0, name: "", password: "", confirmPassword: "" });

function getInitial(item: StoreStaff) { return (item.name || item.username || "员").trim().slice(0, 1).toUpperCase(); }
function formatDate(value?: string) { return value ? value.replace("T", " ").slice(0, 10) : "-"; }
function isAccountValid(value: string) { return /^[A-Za-z][A-Za-z0-9_-]{2,31}$/.test(value); }

function buildParams() { return { page: pagination.page, size: pagination.size, keyword: filters.keyword || undefined, status: filters.status === -1 ? undefined : filters.status }; }

async function fetchStaff(append = false) {
	if (loading.value) return;
	loading.value = true;
	try {
		const result = await service.page(buildParams());
		const rows = result?.list || [];
		pagination.total = result?.total || 0;
		staff.value = append ? [...staff.value, ...rows] : rows;
		finished.value = staff.value.length >= pagination.total || rows.length < pagination.size;
		loaded.value = true;
	} catch (error: any) {
		if (append) pagination.page -= 1;
		ui.showTips(error?.message || "员工列表加载失败");
	} finally { loading.value = false; }
}

async function reload() { pagination.page = 1; finished.value = false; await fetchStaff(); }
async function loadMore() { if (!loaded.value || loading.value || finished.value) return; pagination.page += 1; await fetchStaff(true); }
function setStatus(status: StaffStatus) { if (filters.status === status) return; filters.status = status; reload(); }

function openStaffPopup(mode: StaffMode, item?: StoreStaff) {
	staffPopup.mode = mode;
	Object.assign(staffForm, mode === "edit" && item ? { id: item.id, name: item.name || "", phone: item.phone || "", username: item.username || "", password: "", remark: item.remark || "" } : { id: 0, name: "", phone: "", username: "", password: "", remark: "" });
	staffPopup.visible = true;
}

async function saveStaff() {
	if (saving.value) return;
	const name = staffForm.name.trim();
	const username = staffForm.username.trim();
	if (!name) return ui.showTips("请输入员工姓名");
	if (!isAccountValid(username)) return ui.showTips("账号需为 3-32 位，并以字母开头");
	if (staffPopup.mode === "add" && staffForm.password.length < 6) return ui.showTips("初始密码至少 6 位");
	saving.value = true;
	try {
		if (staffPopup.mode === "add") { await service.add({ name, username, password: staffForm.password, phone: staffForm.phone.trim(), remark: staffForm.remark.trim() }); ui.showTips(`员工账号“${username}”已创建`); }
		else { await service.update({ id: staffForm.id, name, phone: staffForm.phone.trim(), remark: staffForm.remark.trim() }); ui.showTips("员工资料已保存"); }
		staffPopup.visible = false;
		await reload();
	} catch (error: any) { ui.showTips(error?.message || "员工账号保存失败"); } finally { saving.value = false; }
}

function openPasswordPopup(item: StoreStaff) { Object.assign(passwordForm, { id: item.id, name: item.name || item.username, password: "", confirmPassword: "" }); passwordPopup.visible = true; }
async function resetPassword() {
	if (resettingPassword.value) return;
	if (passwordForm.password.length < 6) return ui.showTips("新密码至少 6 位");
	if (passwordForm.password !== passwordForm.confirmPassword) return ui.showTips("两次输入的密码不一致");
	resettingPassword.value = true;
	try { await service.resetPassword(passwordForm.id, passwordForm.password); passwordPopup.visible = false; ui.showTips("员工密码已重置，原登录状态已失效"); }
	catch (error: any) { ui.showTips(error?.message || "密码重置失败"); } finally { resettingPassword.value = false; }
}

function confirmStatus(item: StoreStaff) {
	const enable = item.status !== 1;
	ui.showConfirm({
		title: enable ? "确认启用员工" : "确认停用员工",
		type: enable ? "success" : "warning",
		message: enable ? `启用后，“${item.name}”可以立即登录系统。` : `停用后，“${item.name}”将无法继续登录系统。`,
		confirmButtonText: "确认",
		beforeClose(action, { done, showLoading, hideLoading }) {
			if (action !== "confirm") { done(); return; }
			showLoading();
			service.updateStatus(item.id, enable ? 1 : 0)
				.then(async () => { await reload(); done(); ui.showTips(enable ? "员工已启用" : "员工已停用"); })
				.catch((error: any) => { hideLoading(); ui.showTips(error?.message || "员工状态更新失败"); });
		},
	});
}

function openActions(item: StoreStaff) { openStaffPopup("edit", item); }
onShow(() => { if (!loaded.value) reload(); });
onPullDownRefresh(async () => { await reload(); uni.stopPullDownRefresh(); });
onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
.page-staff { min-height: 100%; padding: 26rpx 25rpx 58rpx; box-sizing: border-box; color: #343042; }
.staff-hero { position: relative; display:flex; align-items:center; justify-content:space-between; min-height:196rpx; padding:28rpx; overflow:hidden; border-radius:24rpx; background:linear-gradient(135deg,#6843ee,#8d69fb); color:#fff; box-shadow:0 14rpx 32rpx rgba(82,53,195,.21); box-sizing:border-box; }.staff-hero__glow { position:absolute; right:-72rpx; top:-103rpx; width:246rpx; height:246rpx; border-radius:50%; background:rgba(230,217,255,.22); }.staff-hero__copy,.staff-hero__count { position:relative; z-index:1; display:flex; flex-direction:column; }.staff-hero__eyebrow { color:rgba(255,255,255,.75); font-size:16rpx; letter-spacing:2rpx; }.staff-hero__title { margin-top:14rpx; font-size:42rpx; font-weight:800; line-height:1.1; }.staff-hero__desc { margin-top:12rpx; color:rgba(255,255,255,.79); font-size:20rpx; }.staff-hero__count { align-items:flex-end; }.staff-hero__count strong { font-size:52rpx; line-height:1; }.staff-hero__count text { margin-top:8rpx; color:rgba(255,255,255,.76); font-size:18rpx; }
.staff-tools { display:flex; gap:15rpx; margin-top:27rpx; }.staff-search { display:flex; flex:1; align-items:center; gap:13rpx; height:76rpx; padding:0 21rpx; border:1rpx solid #edeaf2; border-radius:17rpx; background:#fff; box-sizing:border-box; }.staff-search input { flex:1; min-width:0; color:#3d3749; font-size:24rpx; }.staff-search__placeholder { color:#aaa4b3; }.staff-add { display:flex; align-items:center; justify-content:center; width:76rpx; height:76rpx; border-radius:17rpx; background:#7149ee; box-shadow:0 8rpx 18rpx rgba(93,54,220,.25); }
.staff-filter { margin-top:19rpx; white-space:nowrap; }.staff-filter__inner { display:inline-flex; gap:12rpx; }.staff-filter__item { padding:14rpx 25rpx; border:1rpx solid #e9e5ed; border-radius:99rpx; background:#fff; color:#817a8c; font-size:22rpx; }.staff-filter__item.is-active { border-color:#dcd2ff; background:#eeeaff; color:#633dd6; font-weight:700; }
.staff-list { margin-top:21rpx; }.staff-card { margin-bottom:17rpx; padding:24rpx; border:1rpx solid #edeaf2; border-radius:22rpx; background:#fff; box-shadow:0 7rpx 20rpx rgba(45,35,77,.045); }.staff-card__top { display:flex; align-items:center; }.staff-avatar { display:flex; align-items:center; justify-content:center; width:68rpx; height:68rpx; border-radius:20rpx; background:#eee9ff; color:#6a44df; font-size:29rpx; font-weight:800; }.staff-card__main { flex:1; min-width:0; margin-left:16rpx; }.staff-card__name-line { display:flex; align-items:center; gap:10rpx; font-size:27rpx; font-weight:800; }.staff-status { padding:4rpx 10rpx; border-radius:99rpx; background:#e6f8ef; color:#25a96d; font-size:17rpx; font-weight:600; }.staff-status.is-disabled { background:#f0eef2; color:#8b8492; }.staff-card__account { display:block; margin-top:7rpx; color:#90899b; font-size:20rpx; }.staff-card__more { padding:10rpx; color:#918a9d; font-weight:800; letter-spacing:2rpx; }.staff-card__details { display:grid; grid-template-columns:1.3fr .75fr 1fr; gap:8rpx; margin-top:20rpx; padding:16rpx 0; border-top:1rpx solid #f0edf3; border-bottom:1rpx solid #f0edf3; }.staff-card__details view { display:flex; flex-direction:column; min-width:0; gap:7rpx; }.staff-card__details text { color:#a099a9; font-size:17rpx; }.staff-card__details strong { overflow:hidden; color:#5a5365; font-size:19rpx; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }.staff-card__remark { display:block; margin-top:15rpx; color:#887f91; font-size:20rpx; line-height:1.45; }.staff-card__actions { display:flex; margin:19rpx -5rpx -4rpx; }.staff-card__actions view { flex:1; padding:6rpx 0; border-right:1rpx solid #efebf2; color:#6742dc; text-align:center; font-size:20rpx; }.staff-card__actions view:last-child { border:0; }.staff-card__actions .is-danger { color:#d85a71; }.staff-card__actions .is-success { color:#26a46b; }.staff-loading,.staff-empty { display:flex; align-items:center; flex-direction:column; padding:116rpx 0 50rpx; color:#918a99; font-size:22rpx; gap:18rpx; }.staff-empty > view:last-child { padding:15rpx 25rpx; border-radius:99rpx; background:#eeeaff; color:#6841df; font-weight:650; }.staff-footer { padding:10rpx 0 32rpx; color:#a19aa9; text-align:center; font-size:20rpx; }
.form-popup { padding-bottom:calc(22rpx + env(safe-area-inset-bottom)); background:#fff; }.form-popup__hint { padding:21rpx 28rpx; background:#f5f2ff; color:#6f6580; font-size:20rpx; line-height:1.55; }.form-popup__body { max-height:760rpx; padding:8rpx 28rpx 10rpx; box-sizing:border-box; }.form-popup__body--short { min-height:270rpx; }.form-field { margin-top:21rpx; }.form-field > text { display:block; margin-bottom:11rpx; color:#4b4455; font-size:23rpx; font-weight:700; }.form-field em { color:#e35d79; font-style:normal; }.form-field__static { padding:19rpx 20rpx; border-radius:14rpx; background:#f5f3f7; color:#938c9d; font-size:23rpx; }.form-popup__footer { display:flex; gap:16rpx; margin-top:18rpx; padding:0 28rpx; }.form-popup__footer view { flex:1; padding:21rpx 0; border-radius:15rpx; background:#f0edf4; color:#766f7f; text-align:center; font-size:24rpx; font-weight:700; }.form-popup__footer .is-primary { background:#7048ed; color:#fff; }.form-popup--short .form-popup__body { padding-bottom:22rpx; }
</style>
