<template>
	<qm-page :title="title">
		<view v-if="content" class="doc-content"
			><mp-html :content="content" :tag-style="tagStyle"
		/></view>
		<view v-else class="qm-empty"><text>文档地址无效</text></view>
	</qm-page>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { defaultDocuments, type DocumentKey } from "./default-documents";
import QmPage from "../index/components/qm-page.vue";
const { router } = useCool();
const title = ref("文档"),
	content = ref("");
const tagStyle = {
	h1: "font-size:38rpx;line-height:1.4;margin:10rpx 0 20rpx;font-weight:600",
	h2: "font-size:31rpx;line-height:1.5;margin:38rpx 0 14rpx;font-weight:600",
	p: "margin:0 0 20rpx",
};
onLoad((q) => {
	const key = q?.key || router.query.key;
	if (key === "userAgreement" || key === "privacyPolicy") {
		title.value = key === "privacyPolicy" ? "隐私政策" : "用户协议";
		content.value = defaultDocuments[key as DocumentKey];
	}
});
</script>
<style scoped>
.doc-content {
	font-size: 28rpx;
	line-height: 1.8;
	color: #303138;
	overflow-wrap: anywhere;
}
</style>
