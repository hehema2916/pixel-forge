# 像素工坊 PixelForge — 结构演示站（杂志风 · 全栈版）

> 信息架构参考「即时设计（js.design）逆向体检」的学习笔记重建，**代码与文案均为原创**，仅用于学习与演示，不代表任何真实产品。
> 2026-10-14 · 已升级：**杂志风视觉** + **迷你真实后端**（Node 零依赖，含 API）。

## 这是什么

一个「设计工具官网」示例站：信息架构对齐参考案例；视觉为**杂志风**（米白纸面 / 墨色正文 / 朱红点缀 / 衬线大标题 / 细线分栏）；带一个**零依赖 Node 后端**（静态文件 + JSON API 一体），前端在接口不可用时自动回退静态数据。

## 页面结构

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 首页 | `index.html` | 8 板块（Hero/数据/功能/流程/资源/对比/更新/CTA）+ 编辑器模拟插图 |
| 定价 | `pricing.html` | 月付/年付切换 + 4 档套餐 + FAQ |
| 资源广场 | `community.html` | 搜索 / 分类筛选 / 加载更多（**接口驱动**） |
| 下载中心 | `download.html` | 多平台卡片 + 版本记录表 |
| 登录 | `login.html` | 手机/扫码/SSO 切换；**验证码与登录走真实接口** |
| 产品对比 | `compare.html` | 对比表 + SEO 对比页矩阵 |

## 运行方式

**方式 A（推荐）：Node 后端（含 API）**

```bash
cd /Users/jack/pixel-forge
node server.js          # 默认 8899 端口
# 打开 http://localhost:8899
```

**方式 B：纯静态（无 API，自动回退静态数据）**

```bash
cd /Users/jack/pixel-forge
python3 -m http.server 8899
```

## API 一览（server.js）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查（状态/版本/运行时长） |
| GET | `/api/resources?cat=&q=` | 资源列表（20 条，支持分类与搜索） |
| POST | `/api/auth/code` | 发送验证码（演示：随机码直接返回） |
| POST | `/api/auth/login` | 登录（校验验证码，签发 token） |

## 目录结构

```
pixel-forge/
├── index.html / pricing.html / community.html
├── download.html / login.html / compare.html
├── server.js                     # 迷你后端（零依赖 Node）
├── README.md
└── assets/
    ├── css/style.css             # 杂志风设计系统（:root 换肤）
    ├── js/main.js                # 交互 + 接口调用（自动回退）
    └── data/resources.json       # 静态数据（接口不可用时的回退）
```

## 上线部署（速览）

- **静态托管**（GitHub Pages / Vercel / Cloudflare Pages）：发布整个目录即可；接口不可用时前端自动回退静态数据
- **完整全栈**：前端静态托管 + 后端迁移到 Serverless（Vercel Functions / Cloudflare Workers）或轻量云服务器
- **国内正式站点**：国内服务器须 ICP 备案（+ 公安联网备案）；海外/香港节点免备案（速度略降）
- ⚠️ 详细的上线注意事项与后端选型指南：见知识库《网站上线指南》outputs/

## 版权与口径

- 不含参考案例的任何代码、文案、图片、品牌素材；结构与命名均为学习性改写
- 演示数据均为虚构；「像素工坊 / PixelForge」为虚构品牌
- 如需商用化：请替换为自有品牌、补齐后端与合规信息（备案等）
