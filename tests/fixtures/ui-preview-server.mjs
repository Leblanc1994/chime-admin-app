import http from "node:http";
import { readFile } from "node:fs/promises";
const now = "2026-10-20 14:32:00";
let nextId = 100;
const user = {
	id: 9001,
	nickName: "栗子",
	name: "栗子",
	username: "preview-manager",
	role: "manager",
	phone: "13800009001",
};
let members = [
	{
		id: 1,
		name: "李晓妍",
		nickName: "晓妍",
		wechatNo: "xiaoyan-preview",
		phone: "13800000001",
		gender: 2,
		source: 3,
		remark: "偏好轻柔手法，服务前沟通护理感受",
		createTime: "2026-09-19 10:00:00",
		lastConsumeTime: now,
	},
	{
		id: 2,
		name: "王琳",
		nickName: "琳琳",
		wechatNo: "lin-preview",
		phone: "13800000002",
		gender: 2,
		source: 2,
		remark: "",
		createTime: "2026-10-01 10:00:00",
	},
	{
		id: 3,
		name: "陈晨",
		nickName: "晨",
		wechatNo: "chen-preview",
		phone: "13800000003",
		gender: 2,
		source: 1,
		remark: "",
		createTime: "2026-10-19 10:00:00",
	},
	{
		id: 4,
		name: "张敏",
		nickName: "敏",
		wechatNo: "min-preview",
		phone: "13800000004",
		gender: 2,
		source: 3,
		remark: "",
		createTime: "2026-09-01 10:00:00",
	},
];
const guestProfiles = [
	{ id: 5, customerType: "guest", name: "体验顾客", phone: "", remark: "偏好安静的护理环境" },
];
let templates = [
	{
		id: 81,
		name: "水光焕肤次卡",
		totalTimes: 6,
		price: "1280.00",
		color: "purple",
		status: 1,
		remark: "补水修护 · 适合日常护理",
		createTime: now,
	},
	{
		id: 82,
		name: "肩颈舒缓次卡",
		totalTimes: 10,
		price: "980.00",
		color: "gold",
		status: 1,
		remark: "肩颈放松 · 舒缓日常疲劳",
		createTime: now,
	},
	{
		id: 83,
		name: "玫瑰焕亮体验卡",
		totalTimes: 3,
		price: "399.00",
		color: "rose",
		status: 0,
		remark: "活动结束，暂不售卖",
		createTime: now,
	},
];
let cards = [
	{
		id: 11,
		templateId: 81,
		color: "purple",
		price: "1280.00",
		memberId: 1,
		cardName: "水光焕肤次卡",
		totalTimes: 6,
		remainTimes: 4,
		status: 1,
		expireTime: "2027-01-19 23:59:00",
		createTime: "2026-09-19 10:00:00",
		remark: "每次护理前确认皮肤状态",
	},
	{
		id: 12,
		templateId: 82,
		color: "gold",
		price: "980.00",
		memberId: 1,
		cardName: "肩颈舒缓次卡",
		totalTimes: 4,
		remainTimes: 2,
		status: 1,
		expireTime: "2026-12-19 23:59:00",
		createTime: "2026-09-19 10:00:00",
	},
	{
		id: 21,
		memberId: 2,
		cardName: "基础护理次卡",
		totalTimes: 4,
		remainTimes: 1,
		status: 1,
		expireTime: "2026-11-19 23:59:00",
		createTime: "2026-09-19 10:00:00",
	},
	{
		id: 41,
		memberId: 4,
		cardName: "肩颈舒缓次卡",
		totalTimes: 6,
		remainTimes: 0,
		status: 3,
		expireTime: "2026-09-19 23:59:00",
	},
];
let records = [
	{
		id: 51,
		memberId: 1,
		customerType: "member",
		memberName: "李晓妍",
		memberPhone: "13800000001",
		consumeType: "会员次卡",
		cardAccountId: 11,
		cardName: "水光焕肤次卡",
		consumeTimes: 1,
		remainTimesAfter: 4,
		consumeTime: now,
		remark: "补水修护护理，状态稳定",
	},
	{
		id: 52,
		memberId: 5,
		customerType: "guest",
		memberName: "体验顾客",
		memberPhone: "",
		consumeType: "美团团购",
		consumeTime: "2026-10-20 10:30:00",
		remark: "首次到店体验",
	},
	{
		id: 53,
		memberId: 2,
		customerType: "member",
		memberName: "王琳",
		memberPhone: "13800000002",
		consumeType: "会员次卡",
		cardAccountId: 21,
		cardName: "基础护理次卡",
		consumeTimes: 1,
		remainTimesAfter: 1,
		consumeTime: "2026-10-19 16:20:00",
		remark: "",
	},
];
let flows = [
	{
		id: 61,
		memberId: 1,
		cardAccountId: 11,
		cardName: "水光焕肤次卡",
		changeType: "扣次",
		changeTimes: -1,
		beforeTimes: 5,
		afterTimes: 4,
		createTime: now,
		remark: "补水修护护理",
	},
];
let staff = [
	{
		id: 71,
		name: "王小美",
		username: "wangxiaomei",
		phone: "13800000071",
		status: 1,
		remark: "护理与接待",
		createTime: "2026-09-19 10:00:00",
	},
	{
		id: 72,
		name: "林晓",
		username: "linxiao",
		phone: "13800000072",
		status: 1,
		remark: "客户维护",
		createTime: "2026-09-21 10:00:00",
	},
	{
		id: 73,
		name: "陈悦",
		username: "chenyue",
		phone: "13800000073",
		status: 0,
		remark: "",
		createTime: "2026-09-22 10:00:00",
	},
];
const failures = new Map();
const appointmentDate = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
const appointmentProjects = [
	{ id: 1, code: "lash", name: "美睫", color: "purple", durationMinutes: 120 },
	{ id: 2, code: "brow", name: "纹绣", color: "gold", durationMinutes: 120 },
	{ id: 3, code: "removal", name: "洗眉", color: "green", durationMinutes: 120 },
];
const appointments = [
	{
		id: 201,
		customerName: "林女士",
		projectId: 3,
		projectName: "洗眉",
		projectColor: "green",
		startTime: appointmentDate + " 11:00:00",
		endTime: appointmentDate + " 13:00:00",
		status: 1,
		remark: "",
	},
	{
		id: 202,
		customerName: "张女士",
		projectId: 1,
		projectName: "美睫",
		projectColor: "purple",
		startTime: appointmentDate + " 13:00:00",
		endTime: appointmentDate + " 15:00:00",
		status: 1,
		remark: "自然款，第一次到店",
	},
	{
		id: 203,
		customerName: "陈女士",
		projectId: 2,
		projectName: "纹绣",
		projectColor: "gold",
		startTime: appointmentDate + " 14:30:00",
		endTime: appointmentDate + " 16:30:00",
		status: 1,
		remark: "",
	},
	{
		id: 204,
		customerName: "李女士",
		projectId: 3,
		projectName: "洗眉",
		projectColor: "green",
		startTime: appointmentDate + " 16:30:00",
		endTime: appointmentDate + " 18:30:00",
		status: 1,
		remark: "",
	},
];
let delay = 0;
const audit = [];
function page(list, body, direct = false) {
	const p = Number(body.page) || 1,
		s = Number(body.size) || 15;
	return {
		list: list.slice((p - 1) * s, p * s),
		...(direct
			? { total: list.length, page: p, size: s }
			: { pagination: { total: list.length, page: p, size: s } }),
	};
}
function summary(id) {
	const c = cards.filter((c) => c.memberId === Number(id));
	return {
		remainTimes: c.reduce((s, c) => s + c.remainTimes, 0),
		validCardCount: c.filter((c) => c.status === 1 && c.remainTimes > 0).length,
	};
}
function requireRow(list, id) {
	const row = list.find((x) => x.id === Number(id));
	if (!row) throw Error("记录不存在");
	return row;
}
function cardFlow(card, type, before, remark) {
	flows.unshift({
		id: nextId++,
		memberId: card.memberId,
		cardAccountId: card.id,
		cardName: card.cardName,
		changeType: type,
		changeTimes: card.remainTimes - before,
		beforeTimes: before,
		afterTimes: card.remainTimes,
		remark,
		createTime: now,
	});
}
function applyConsume(b, old) {
	if (old?.cardAccountId) {
		const card = requireRow(cards, old.cardAccountId);
		card.remainTimes += old.consumeTimes;
	}
	const next = b.cardAccountId ? requireRow(cards, b.cardAccountId) : null;
	if (
		next &&
		(!Number.isSafeInteger(b.consumeTimes) ||
			b.consumeTimes <= 0 ||
			b.consumeTimes > next.remainTimes ||
			[0, 3, 4].includes(next.status))
	) {
		if (old?.cardAccountId)
			requireRow(cards, old.cardAccountId).remainTimes -= old.consumeTimes;
		throw Error("次卡余额或状态已变化，请重新核对");
	}
	if (next) {
		const before = next.remainTimes;
		next.remainTimes -= b.consumeTimes;
		next.status = next.remainTimes ? 1 : 2;
		cardFlow(next, "扣次", before, b.remark);
	}
	const m = requireRow(members, b.memberId);
	m.lastConsumeTime = b.consumeTime;
	return {
		...b,
		id: old?.id || nextId++,
		customerType: "member",
		memberName: m.name,
		memberPhone: m.phone,
		cardName: next?.cardName,
		remainTimesAfter: next?.remainTimes,
	};
}
function api(path, b, q) {
	if (path === "/admin/appointment/project/list") return appointmentProjects;
	if (path.startsWith("/admin/appointment/schedule/")) {
		const action = path.split("/").at(-1);
		if (action === "list")
			return appointments
				.filter(
					(a) =>
						a.status === 1 &&
						a.startTime < b.endDate + " 00:00:00" &&
						a.endTime > b.startDate + " 00:00:00",
				)
				.sort((a, b) => a.startTime.localeCompare(b.startTime));
		if (action === "info") return requireRow(appointments, q.id);
		if (action === "cancel") {
			const row = requireRow(appointments, b.id);
			row.status = 0;
			row.cancelledAt = appointmentDate + " 12:40:00";
			return null;
		}
		if (action === "add" || action === "update") {
			if (!b.customerName?.trim() || b.endTime <= b.startTime)
				throw Error("请核对姓名与预约时间");
			const project = requireRow(appointmentProjects, b.projectId);
			if (action === "add") {
				const previous = appointments.find((a) => a.requestId === b.requestId);
				if (previous) return previous.id;
			}
			const row =
				action === "update" ? requireRow(appointments, b.id) : { id: nextId++, status: 1 };
			if (row.status === 0) throw Error("已取消的预约不能编辑");
			const member = b.memberId ? requireRow(members, b.memberId) : null;
			Object.assign(row, b, {
				memberId: member?.id || null,
				memberPhone: member?.phone || null,
				customerName: member
					? member.name || member.nickName || "未命名会员"
					: b.customerName.trim(),
				projectName: project.name,
				projectColor: project.color,
			});
			if (action === "add") appointments.push(row);
			return row.id;
		}
	}
	if (path.endsWith("/person")) return user;
	if (path.endsWith("/personUpdate")) {
		Object.assign(user, b);
		return null;
	}
	if (path.endsWith("/logout")) return null;
	if (path.endsWith("/param")) return "";
	if (path.endsWith("/refreshToken"))
		return {
			token: "local-preview-only",
			refreshToken: "local-preview-refresh",
			expire: 86400,
			refreshExpire: 86400,
		};
	if (path.endsWith("/captcha"))
		return {
			captchaId: "preview-captcha",
			data:
				"data:image/svg+xml," +
				encodeURIComponent(
					'<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50"><rect width="150" height="50" fill="#ece4f3"/><text x="75" y="31" font-size="18" text-anchor="middle" fill="#6741b1">本地预览</text></svg>',
				),
		};
	if (path.endsWith("/eps")) return {};
	if (path.includes("/dict/")) return [];
	if (path.includes("/dashboard/summary"))
		return {
			statisticsDate: "2026-10-20",
			totalMemberCount: 3,
			todayNewMemberCount: 0,
			todayConsumeRecordCount: records.filter((r) => r.consumeTime.startsWith("2026-10-20"))
				.length,
			yesterdayConsumeRecordCount: 1,
			weekConsumeRecordCount: records.length,
			monthConsumeRecordCount: records.length,
			lowBalanceCardCount: 1,
			expiringCardCount: 0,
			inactiveMemberCount: 1,
			todayTypeCounts: [],
			monthlyConsumeRecordCounts: Array.from({ length: 10 }, (_, i) => ({
				month: i + 1,
				recordCount: i === 9 ? records.length : 0,
			})),
			dailyConsumeRecordCounts: Array.from({ length: 7 }, (_, i) => ({
				date: "2026-10-" + (14 + i),
				recordCount: i === 5 ? 1 : i === 6 ? records.length - 1 : 0,
			})),
		};
	const group = path.split("/").at(-2),
		action = path.split("/").at(-1);
	if (group === "info" && path.includes("/member/")) {
		if (action === "info") {
			const { lastConsumeTime, ...profile } = requireRow(
				[...members, ...guestProfiles],
				q.id,
			);
			return { customerType: "member", ...profile };
		}
		if (action === "page") {
			let rows = members.map((m) => ({ ...m, ...summary(m.id) }));
			if (b.keyWord)
				rows = rows.filter((m) =>
					[m.name, m.nickName, m.phone].some((s) => s?.includes(b.keyWord)),
				);
			if (b.gender != null) rows = rows.filter((m) => m.gender === b.gender);
			if (b.source != null) rows = rows.filter((m) => m.source === b.source);
			return page(rows, b);
		}
		if (action === "add") {
			const id = nextId++;
			members.push({ ...b, id, createTime: now });
			return id;
		}
		if (action === "update") {
			Object.assign(requireRow(members, b.id), b);
			return null;
		}
		if (action === "delete") {
			if (cards.some((c) => b.ids.includes(c.memberId)))
				throw Error("该会员有关联次卡，暂不能删除");
			members = members.filter((m) => !b.ids.includes(m.id));
			return null;
		}
	}
	if (group === "cardTemplate") {
		if (action === "info") return requireRow(templates, q.id);
		if (action === "page" || action === "list") {
			const rows = templates.filter(
				(t) =>
					(b.status == null || t.status === b.status) &&
					(!b.keyWord || t.name.includes(b.keyWord)),
			);
			return action === "page" ? page(rows, b) : rows;
		}
		if (
			!b.name?.trim() ||
			!Number.isInteger(b.totalTimes) ||
			b.totalTimes <= 0 ||
			!/^[0-9]{1,10}([.][0-9]{1,2})?$/.test(String(b.price))
		)
			throw Error("请填写卡项名称、总次数和售价");
		if (action === "add") {
			const id = nextId++;
			templates.unshift({
				...b,
				color: b.color || "purple",
				status: b.status ?? 1,
				id,
				createTime: now,
			});
			return { id };
		}
		if (action === "update") {
			Object.assign(requireRow(templates, b.id), b);
			for (const c of cards) if (c.templateId === b.id) c.color = b.color;
			return null;
		}
	}
	if (group === "cardAccount") {
		if (action === "summary") return summary(q.memberId);
		if (action === "list") return cards.filter((c) => c.memberId === Number(b.memberId));
		if (action === "add") {
			requireRow(members, b.memberId);
			const template = requireRow(templates, b.templateId);
			if (template.status !== 1) throw Error("该卡项已停用，请重新选择");
			cards.push({
				...b,
				cardName: template.name,
				totalTimes: template.totalTimes,
				price: template.price,
				color: template.color,
				id: nextId++,
				remainTimes: template.totalTimes,
				status: 1,
				createTime: now,
			});
			return null;
		}
		const card = requireRow(cards, b.id),
			before = card.remainTimes;
		if (action === "plusTimes") {
			card.remainTimes += b.changeTimes;
			if (card.status === 2) card.status = 1;
			cardFlow(card, "补次", before, b.remark);
		} else if (action === "setRemainTimes") {
			card.remainTimes = b.remainTimes;
			if (card.status !== 0) card.status = b.remainTimes ? 1 : 2;
			cardFlow(card, "手工调整", before, b.remark);
		} else if (action === "stop") {
			card.status = 0;
			cardFlow(card, "停用", before, "");
		} else if (action === "enable") {
			card.status = 1;
			cardFlow(card, "启用", before, "");
		} else if (action === "discard") {
			card.status = 4;
			cardFlow(card, "作废", before, "");
		}
		return null;
	}
	if (group === "consumeRecord") {
		if (action === "info") {
			const {
				customerType,
				memberName,
				memberPhone,
				memberNickName,
				cardName,
				customerRemark,
				...record
			} = requireRow(records, q.id);
			return record;
		}
		if (action === "page") {
			let rows = records.slice();
			if (b.memberId) rows = rows.filter((r) => r.memberId === Number(b.memberId));
			if (b.consumeType) rows = rows.filter((r) => r.consumeType === b.consumeType);
			if (b.memberKeyword)
				rows = rows.filter((r) =>
					[r.memberName, r.memberPhone].some((x) => x?.includes(b.memberKeyword)),
				);
			if (b.consumeStartTime) rows = rows.filter((r) => r.consumeTime >= b.consumeStartTime);
			if (b.consumeEndTime) rows = rows.filter((r) => r.consumeTime < b.consumeEndTime);
			return page(
				rows.sort((a, b) => b.consumeTime.localeCompare(a.consumeTime)),
				b,
			);
		}
		if (action === "add" || action === "update") {
			const old = action === "update" ? requireRow(records, b.id) : null;
			const row = applyConsume(b, old);
			if (old) Object.assign(old, row);
			else records.unshift(row);
			return null;
		}
		if (action === "addGuestConsume" || action === "updateGuestConsume") {
			const old = action === "updateGuestConsume" ? requireRow(records, b.id) : null;
			const profile = old
				? requireRow(guestProfiles, old.memberId)
				: { id: nextId++, customerType: "guest" };
			Object.assign(profile, { name: b.name, phone: b.phone, remark: b.remark });
			if (!old) guestProfiles.push(profile);
			const row = {
				memberId: profile.id,
				customerType: "guest",
				memberName: b.name,
				memberPhone: b.phone,
				customerRemark: b.remark,
				consumeType: b.consumeType,
				consumeTime: b.consumeTime,
				remark: b.consumeRemark,
			};
			if (action === "updateGuestConsume") Object.assign(requireRow(records, b.id), row);
			else records.unshift({ ...row, id: nextId++ });
			return null;
		}
		if (action === "delete") {
			for (const row of records.filter((r) => b.ids.includes(r.id)))
				if (row.cardAccountId)
					requireRow(cards, row.cardAccountId).remainTimes += row.consumeTimes;
			records = records.filter((r) => !b.ids.includes(r.id));
			return null;
		}
	}
	if (group === "cardFlow" && action === "page")
		return page(
			flows.filter(
				(r) =>
					r.memberId === Number(b.memberId) &&
					(!b.changeType || r.changeType === b.changeType) &&
					(!b.cardAccountId || r.cardAccountId === Number(b.cardAccountId)),
			),
			b,
		);
	if (group === "consumeNoticeSms") {
		const logs = [
			{
				id: 81,
				memberId: 1,
				phone: "13800000001",
				sendStatus: 3,
				reason: "短信服务未启用",
				createTime: now,
			},
		];
		if (action === "summary")
			return {
				enabled: false,
				ready: false,
				configured: false,
				providerReady: false,
				latest:
					Number(q.memberId) === 1
						? { status: 3, statusText: "已跳过", phone: "13800000001", createTime: now }
						: null,
			};
		if (action === "page")
			return page(
				logs.filter(
					(log) =>
						log.memberId === Number(b.memberId) &&
						(b.sendStatus == null || log.sendStatus === b.sendStatus),
				),
				b,
			);
	}
	if (group === "staff") {
		if (action === "page")
			return page(
				staff.filter(
					(s) =>
						(b.status == null || s.status === b.status) &&
						(!b.keyword ||
							[s.name, s.username, s.phone].some((v) => v?.includes(b.keyword))),
				),
				b,
				true,
			);
		if (action === "add") {
			staff.push({ ...b, id: nextId++, status: 1, createTime: now });
			return null;
		}
		if (action === "update") {
			Object.assign(requireRow(staff, b.id), b);
			return null;
		}
		if (action === "resetPassword") return null;
		if (action === "updateStatus") {
			requireRow(staff, b.id).status = b.status;
			return null;
		}
	}
	throw Error("本地样例未提供该接口：" + path);
}
http.createServer(async (req, res) => {
	const u = new URL(req.url, "http://localhost"),
		path = u.pathname;
	let raw = "";
	for await (const part of req) raw += part;
	let body = {};
	try {
		body = raw ? JSON.parse(raw) : {};
	} catch {}
	if (path === "/__control") {
		if (body.failNext)
			failures.set(body.failNext, {
				remaining: body.count || 1,
				message: body.message || "本地模拟：网络暂不可用",
			});
		if (body.delay != null) delay = body.delay;
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({ audit }));
		return;
	}
	if (path === "/session") {
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.end(
			'<!doctype html><meta charset="utf-8"><title>千绵 UI 本地验证</title><script>const account=' +
				JSON.stringify(user) +
				';localStorage.setItem("token","local-preview-only");localStorage.setItem("refreshToken","local-preview-refresh");localStorage.setItem("userInfo",JSON.stringify({type:"object",data:account}));localStorage.setItem("token_deadtime",String(Date.now()+86400000));localStorage.setItem("refreshToken_deadtime",String(Date.now()+86400000));location.replace("/#/pages/index/home");</script>',
		);
		return;
	}
	audit.push({ path, method: req.method, body });
	try {
		if (delay) await new Promise((r) => setTimeout(r, delay));
		const f = failures.get(path);
		if (f?.remaining) {
			f.remaining--;
			throw Error(f.message);
		}
		const data = api(path, body, Object.fromEntries(u.searchParams));
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.end(JSON.stringify({ code: 1000, data }));
	} catch (e) {
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.end(JSON.stringify({ code: 1001, message: e.message }));
	}
}).listen(9915, "127.0.0.1", () =>
	console.log("Isolated UI fixtures on 127.0.0.1:9915; memory only, no upstream network"),
);
