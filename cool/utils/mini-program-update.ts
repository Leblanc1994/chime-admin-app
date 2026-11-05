// 由 App 生命周期管理，更新监听只注册一次，后台下载完成后等回到前台再提示。
export function createMiniProgramUpdate() {
	let manager: ReturnType<typeof uni.getUpdateManager> | undefined;
	let state: "idle" | "ready" | "failed" = "idle";
	let visible = false;
	let prompting = false;
	let applying = false;

	function prompt() {
		if (!visible || prompting || applying || state === "idle") return;

		const ready = state === "ready";
		prompting = true;
		uni.showModal({
			title: ready ? "发现新版本" : "更新下载失败",
			content: ready
				? "新版本已准备好，需要重启小程序完成更新。是否立即重启？"
				: "新版本下载失败，请检查网络后重新打开小程序。当前版本仍可继续使用。",
			showCancel: ready,
			confirmText: ready ? "立即重启" : "知道了",
			cancelText: "稍后",
			success(res) {
				if (ready && res.confirm && !applying) {
					applying = true;
					manager?.applyUpdate();
				} else if (!ready && state === "failed") {
					state = "idle";
				}
			},
			complete() {
				prompting = false;
			},
		});
	}

	return {
		init() {
			if (manager || typeof uni.getUpdateManager !== "function" || !uni.canIUse("getUpdateManager")) {
				return;
			}

			manager = uni.getUpdateManager();
			manager.onUpdateReady(() => {
				if (state === "ready") return;
				state = "ready";
				prompt();
			});
			manager.onUpdateFailed(() => {
				if (state === "ready" || state === "failed") return;
				state = "failed";
				prompt();
			});
		},
		onShow() {
			visible = true;
			prompt();
		},
		onHide() {
			visible = false;
		},
	};
}
