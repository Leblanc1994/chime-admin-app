import { ref } from "vue";

export type MemberQuickAction = "addMember" | "openCard" | "deduct";

// switchTab 不传递查询参数，用一次性意图衔接会员页的新建或选择流程。
export const pendingMemberQuickAction = ref<MemberQuickAction>();

// 首页关怀入口在会员页消费一次筛选意图。
export const pendingMemberFilter = ref<string>();
