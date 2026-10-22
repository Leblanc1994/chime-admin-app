# 首页设计资源

来源：用户提供的 [BeautyOS Ardot 设计文件](https://ardot.tencent.com/file/724279249184238)，首页画板 `3:1`。

- `entry-*.png`、`assistant.png`、`tab-*.png`：从原稿三倍分辨率导出图提取，作为独立图标使用。
- `bell.svg`、`scan.svg`：依据原稿绘制的矢量图形。`sparkline.svg`、`trend.svg` 为原稿参考资源，首页不再使用模拟曲线，趋势图由后端真实消费笔数绘制。
- `noto-sans-sc.woff2`：原稿采用的 Noto Sans SC 可变字体的首页、会员列表、会员档案、工作台、我的与导航文字子集，保留 100–900 字重，约 111 KB。新增页面文案时需更新字体子集；缺失字符由系统中文字体补足。许可见 `OFL.txt`。字体统一在 `static/css/design-font.scss` 声明。

设计基准为 390px 屏宽，通过 `750 / 390` 转换为 uni-app 的 rpx。系统时间、信号和电量由设备提供，页面不绘制模拟状态栏。首页、会员列表、工作台、我的传入 `tabbar` 的 `design` 参数，启用设计稿导航外观，其他页面仍使用原有外观。
