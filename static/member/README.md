# 会员列表设计资源

来源：用户提供的 [BeautyOS Ardot 设计文件](https://ardot.tencent.com/file/724279249184238)，会员列表画板 `3:312`，390 × 1425px。

- `avatar-*.png`：从原稿三倍分辨率导出图提取的五种默认插画头像，用于女性会员，按会员 ID 保持稳定；其他会员以姓名首字作为默认头像。
- `search.svg`、`chat.svg`、`chevron*.svg`：依据原稿绘制的矢量图标。消息图标随卡片进入原有会员档案，不发送消息。
- 字体复用 `static/home/noto-sans-sc.woff2`，在 `static/css/design-font.scss` 统一声明，使会员页面直接打开时也能使用。动态会员姓名缺失的字形使用系统中文字体。

页面使用真实数据，手机号按原稿隐藏中间四位，消费日期在最近一个月以内显示为相对时间。设计尺寸通过 `750 / 390` 转换为 uni-app 的 rpx。
