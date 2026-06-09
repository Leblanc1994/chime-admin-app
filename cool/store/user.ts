import { defineStore } from "pinia";
import { ref } from "vue";
import { storage } from "../utils";
import { router } from "../router";
import { service } from "../service";
import type { User } from "../types";
import { t } from "/@/locale";

// 本地缓存
const data = storage.info();
function getService() {
	return service as any;
}

const useUserStore = defineStore("user", function () {
	// 标识
	const token = ref(data.token || "");

	// 设置标识
	function setToken(data: User.Token) {
		token.value = data.token;

		// 访问
		storage.set("token", data.token, data.expire - 5);
		// 刷新
		storage.set("refreshToken", data.refreshToken, data.refreshExpire - 5);
	}

	// 刷新标识
	async function refreshToken() {
		return getService().base.open
			.refreshToken({
				refreshToken: storage.get("refreshToken"),
			})
			.then((res: User.Token) => {
				setToken(res);
				return res.token;
			});
	}

	// 用户信息
	const info = ref<User.Info | undefined>(data.userInfo);

	// 设置用户信息
	function set(value: User.Info) {
		const data = {
			...value,
			avatarUrl: value.avatarUrl || value.headImg || "",
			headImg: value.headImg || value.avatarUrl || "",
		};

		info.value = data;
		storage.set("userInfo", data);
	}

	// 更新用户信息
	async function update(data: User.Info & { [key: string]: any }) {
		const payload = {
			...data,
			headImg: data.headImg || data.avatarUrl,
		};

		return getService().base.comm.personUpdate(payload).then(() => {
			set({
				...(info.value || {}),
				...data,
				headImg: payload.headImg,
				avatarUrl: payload.headImg,
			});
		});
	}

	// 清除用户
	function clear() {
		storage.remove("userInfo");
		storage.remove("token");
		storage.remove("token_deadtime");
		storage.remove("refreshToken");
		storage.remove("refreshToken_deadtime");
		token.value = "";
		info.value = undefined;
	}

	function redirectToLogin(showMessage?: boolean) {
		clear();

		if (showMessage) {
			uni.showToast({
				title: t("登录失效，请重试~"),
				icon: "none",
			});
		}

		if (router.info()?.path !== router.pages.login) {
			router.login({ reLaunch: true });
		}
	}

	// 退出
	function logout(options?: { remote?: boolean; showMessage?: boolean }) {
		const { remote = true, showMessage = false } = options || {};

		if (!remote) {
			redirectToLogin(showMessage);
			return Promise.resolve();
		}

		return getService().base.comm
			.logout()
			.catch(() => {
				//
			})
			.finally(() => {
				redirectToLogin(showMessage);
			});
	}

	// 获取用户信息
	async function get() {
		return getService().base.comm
			.person()
			.then((res: User.Info) => {
				if (res) {
					set(res);
				}
				return res;
			})
			.catch(() => {
				return logout({
					remote: false,
					showMessage: true,
				});
			});
	}

	return {
		token,
		setToken,
		refreshToken,
		info,
		get,
		set,
		update,
		logout,
	};
});

export { useUserStore };
