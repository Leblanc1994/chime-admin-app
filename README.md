# COOL-UNI 项目脚手架

## 简介

[演示、文档地址](https://uni-docs.cool-js.com/)

## 更快

#### 启动快

基于 `vite`，快速的冷启动，不需要等待打包，即时的热模块更新，真正的按需编译。

#### 开发快

新增 `eps` 模式，自动扫描接口，代码智能提示。

<img src="https://uni-docs.cool-js.com/images/service-tip.gif" height="300px" />

#### 对接快

有什么功能是前端一个人做不了？？大不了全干了

👉👉 [管理前端（vue3）开发文档、强大的 CRUD 组件](https://cool-js.com/admin/vue/introduce.html#%E4%BB%A3%E7%A0%81%E4%BB%93%E5%BA%93)

👉👉 [服务端（node、midway）开发文档、一键生成代码](https://cool-js.com/admin/node/introduce.html#%E4%BB%A3%E7%A0%81%E4%BB%93%E5%BA%93)

👉👉 [演示地址](http://www.chime.pink/admin-app) 😁

    <img src="https://vue.cool-admin.com/show/admin.jpg" width="500px" />

## 更强

内置请求、路由、文件上传、组件通信、缓存等方法及 ui 库和 hooks

```html
<script lang="ts" setup>
	import { useCool } from "/@/cool";
	import { useUi } from "/$/cool-ui";

	const { service, router, storage, upload } = useCool();
	const ui = useUi();

	// 请求
	service.test.page().then((res) => {
		consoe.log(res);
	});

	// 跳转
	router.push({
		path: "/pages/goods/info",
		query: {
			id: 1,
		},
	});

	// 全局事件
	ui.showLoading();
	ui.showToast();

	// 储存
	storage.set("token", "a123huis");

	// 文件上传
	uni.chooseImage({
		count: 1,
		sourceType: ["album", "camera"],
		success(res) {
			upload(res.tempFiles[0]).then((url) => {
				console.log(url);
			});
		},
	});
</script>
```

## 更全

#### 细腻的代码

-   `service` 无感刷新，直接调用后端接口

    ```ts
    const { service } = useCool();
    ```

-   提供 `entity` 描述，写 `any` 和不写的都哭了

    ```ts
    const list = ref<Eps.UserInfoEntity[]>([]);
    ```

#### 活跃的社区

-   拥有自己的知识库系统

-   [官方有问必答](https://cool-js.com/help/list.html)

#### 丰富的插件

-   [Ai 智能模块](https://cool-js.com/plugin/detail.html?id=58)

-   [客服聊天模块](https://cool-js.com/plugin/detail.html?id=56)

-   [企业机器人](https://cool-js.com/plugin/detail.html?id=41)、[飞书推送](https://cool-js.com/plugin/detail.html?id=30)

-   [各厂商的支付模块](https://cool-js.com/plugin/detail.html?id=33)

-   [云存储](https://cool-js.com/plugin/detail.html?id=36)

-   [PDF 打印](https://cool-js.com/plugin/detail.html?id=44)

-   [更多](https://cool-js.com/plugin/list.html)

## 部署

### 微信小程序

执行 `npm run build:mp-weixin` 生成正式版，并检查主包及各分包是否超过 2048 KB。检查按构建目录的原始文件大小计算，微信开发者工具上传压缩后的体积以工具显示为准。

在微信开发者工具中导入 `dist/build/mp-weixin` 目录后上传。请勿导入整个 `dist` 目录（其中可能混有 H5、旧产物和压缩包），也不要使用开发调试产物发布。上传压缩设置已写入 `manifest.json`，重新构建后会同步到生成的 `project.config.json`。

#### 版本更新提醒

微信小程序启动时注册原生更新监听。新版本下载完成后，前台显示“发现新版本”弹窗；点击“立即重启”应用新版本并重启，点击“稍后”继续使用，下一次回到前台再提醒。后台下载完成时会等到回到前台才弹窗，下载失败则提示检查网络后重新打开。

版本检查和下载由微信管理，无需额外配置后端版本接口或手动比较 `manifest.json` 版本号。本次功能需要先随正式版发布，已运行不含该功能的旧版本无法补加监听；用户运行包含该功能的版本后，后续发布的新版本即可使用此提醒。

验证：在微信开发者工具的编译模式中模拟更新成功及更新失败，分别检查重启、稍后、切后台再返回的行为；正式发布后再用旧版本真机验证。自动化行为测试：`node --test tests/mini-program-update.test.mjs`。

### H5

当前仓库的 `H5` 构建产物目录为 `dist/build/h5`，推荐和 `pc` 端一样使用 `Nginx` 托管静态文件，并反向代理后端接口：

- `Nginx` 提供前端静态资源
- 后端服务运行在 `127.0.0.1:8001`
- `Nginx` 反向代理 `/api`、`/upload`、`/socket`

相关文件：

- `deploy/deploy-frontend.sh`：一键上传 `dist/build/h5`
- `deploy/nginx.admin-app.conf`：服务器站点配置模板
- `deploy/nginx.admin-app.path.conf`：挂到已有站点子路径(`/admin-app/`)的配置片段

默认部署目标：

- `SERVER_HOST=www.chime.pink`
- `SERVER_USER=admin`
- `SSH_KEY=~/.ssh/id_rsa`
- `REMOTE_WEB_ROOT=/var/www/chime-admin-app`

执行方式：

```bash
bash deploy/deploy-frontend.sh
```

如果服务器上的 `Nginx` 配置已经就位，可以加上自动重载：

```bash
RELOAD_NGINX=1 bash deploy/deploy-frontend.sh
```

如果服务器当前已经有 `pc` 端默认站点占用了域名首页，可以把 H5 应用挂到同一站点的 `/admin-app/` 子路径。

## 正式接口与 HTTPS

小程序正式接口为 `https://www.chime.pink/api`，统一在 `config/prod.ts` 配置。

服务器已于 2026-10-21 开通 HTTPS，线上配置保存在 `/etc/nginx/conf.d/chime-admin.conf`，仓库快照为 `deploy/nginx.chime-https.conf`。该配置保留 PC、H5、接口、上传和 WebSocket 的现有路径。

- 证书：`/etc/letsencrypt/live/www.chime.pink/fullchain.pem`
- 私钥：`/etc/letsencrypt/live/www.chime.pink/privkey.pem`，仅保存在服务器。
- 自动续期：`certbot-renew.timer`；续期后通过 `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx` 检查并重载 Nginx。
- HTTP 验证目录：`/var/www/letsencrypt`，80 端口的 ACME 验证路径需保留。
- 修改前的 Nginx 配置备份：`/var/backups/chime-https-20261021-061826`。

微信小程序后台需将 `https://www.chime.pink` 添加为 request、uploadFile、downloadFile 合法域名；使用 WebSocket 时添加 `wss://www.chime.pink`。
