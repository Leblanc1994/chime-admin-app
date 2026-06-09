export const storage = {
	// 后缀标识
	suffix: "_deadtime",

	hasUni() {
		return typeof uni !== "undefined";
	},

	getLocalStorage() {
		return typeof window === "undefined" ? undefined : window.localStorage;
	},

	parse(value: string | null): any {
		if (value == null) {
			return "";
		}

		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	},

	/**
	 * 获取
	 * @param {*} key 关键字
	 */
	get(key: string): any {
		if (!this.hasUni()) {
			return this.parse(this.getLocalStorage()?.getItem(key) ?? null);
		}

		return uni.getStorageSync(key);
	},

	/**
	 * 获取全部
	 */
	info() {
		if (!this.hasUni()) {
			const d: any = {};
			const localStorage = this.getLocalStorage();

			if (!localStorage) {
				return d;
			}

			for (let i = 0; i < localStorage.length; i += 1) {
				const key = localStorage.key(i);

				if (key) {
					d[key] = this.parse(localStorage.getItem(key));
				}
			}

			return d;
		}

		const { keys } = uni.getStorageInfoSync();
		const d: any = {};

		keys.forEach((e: string) => {
			d[e] = uni.getStorageSync(e);
		});

		return d;
	},

	/**
	 * 设置
	 * @param {*} key 关键字
	 * @param {*} value 值
	 * @param {*} expires 过期时间
	 */
	set(key: string, value: any, expires?: number): void {
		if (!this.hasUni()) {
			const localStorage = this.getLocalStorage();

			if (!localStorage) {
				return;
			}

			localStorage.setItem(key, JSON.stringify(value));

			if (expires) {
				localStorage.setItem(
					`${key}${this.suffix}`,
					String(Date.parse(String(new Date())) + expires * 1000),
				);
			}

			return;
		}

		uni.setStorageSync(key, value);

		if (expires) {
			uni.setStorageSync(
				`${key}${this.suffix}`,
				Date.parse(String(new Date())) + expires * 1000
			);
		}
	},

	/**
	 * 是否过期
	 * @param {*} key 关键字
	 */
	isExpired(key: string): boolean {
		return this.get(`${key}${this.suffix}`) - Date.parse(String(new Date())) <= 0;
	},

	/**
	 * 删除
	 * @param {*} key 关键字
	 */
	remove(key: string) {
		if (!this.hasUni()) {
			return this.getLocalStorage()?.removeItem(key);
		}

		return uni.removeStorageSync(key);
	},

	/**
	 * 清理
	 */
	clear() {
		if (!this.hasUni()) {
			this.getLocalStorage()?.clear();
			return;
		}

		uni.clearStorageSync();
	},

	/**
	 * 获取一次后删除
	 */
	once(key: string) {
		const value = this.get(key);
		this.remove(key);
		return value;
	},
};
