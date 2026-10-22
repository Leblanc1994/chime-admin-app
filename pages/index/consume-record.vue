<template>
	<cl-page><view /></cl-page>
</template>
<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
const { router } = useCool();
onLoad(() => router.push({ path: "/pages/index/consume-statistics", mode: "redirectTo" }));
</script>
