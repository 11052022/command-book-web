# 📖 Command Book Web（v2 重构版）

> 在线轻快版命令速查：中文描述搜命令，覆盖 **Linux / Redis / Git**，支持**收藏**与**最近查看**。

与 v1（`command-book`，离线单文件 10MB）相比，本版本：

| 对比项 | v1 单文件版 | v2 在线版 |
|---|---|---|
| 入口体积 | 10 MB 单 HTML | 首屏入口 **~31 kB**（gzip ~12 kB）+ 按需拆包 |
| 路由 | 无 | `#/linux` `#/redis` `#/git` `#/favorites` `#/recent` |
| 构建方式 | `vite-plugin-singlefile` 全内联 | 常规多文件 + `manualChunks` 拆包（shiki/naive/vendor 独立 chunk） |
| 语法高亮 | Shiki 全量 | Shiki 全局单例 + 动态 import 按需加载 + 结果缓存 |
| 数据契约 | 无校验（曾因缺字段整页黑屏） | `npm run check` 强制 Schema 校验，dev/build 前拦截问题字段 |
| 命令构建器 / 并排对比 | 有 | **已移除**（低频负资产，砍掉换轻快） |
| 收藏 / 最近查看 | 无 | **新增**（localStorage 持久化） |
| 打包引用 | 全量 naive-ui | naive-ui 按需 tree-shake |

## 快速开始

```bash
npm install      # 首次
npm run dev      # 开发（热更新），浏览器打开 http://localhost:5173
```

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev`   | 开发模式 |
| `npm run build` | 生产构建（输出 `dist/`，纯静态，可部署任意托管） |
| `npm run preview` | 本地预览构建产物 |
| `npm run check` | **数据 Schema 校验**（新增/修改命令数据后必跑，防黑屏） |

> 推荐流程：改完数据 → `npm run check` → `npm run build` → 部署。

## 功能

- **中文搜索**：多关键词 AND / 自动降级 OR，`#recipe` `#命令` 快捷类型过滤，实时补全建议
- **三大模块**：🐧 Linux（154 命令 + 20 配方）/ 🔴 Redis（103 + 18）/ 🔀 Git（40 + 23）
- **收藏 ⭐**：卡片上星标收藏，顶部「收藏」聚合跨模块收藏项
- **最近查看 🕘**：展开过的卡片自动记录（最多 20 条）
- **键盘导航**：`/` 聚焦搜索、`j/k` 上下、`Enter` 展开、`l` 跳相关、`Esc` 收起
- **主题/紧凑模式**：偏好持久化（`cb.theme` / `cb.compact`）
- **危险等级**：低/中/高/极高危四档徽标

## 项目结构

**数据按模块懒加载**：`src/data/modules.js` 只同步导出模块元信息（导航用），命令/配方 JSON 通过 `loadModule()` 动态 `import` 按需加载——进哪个模块才拉取哪份数据（构建期自动拆出 linux/redis/git 独立 chunk），命令库持续增长也不会拖累首屏。

```
src/
├── main.js                # 入口
├── App.vue                # 布局 + 全局提供（theme/compact/message）
├── router/index.js        # hash 路由（模块 / 收藏 / 最近）
├── components/
│   ├── Browser.vue        # ★ 页面组件：按需加载模块数据 + 搜索 + 收藏/最近接线 + 键盘导航
│   ├── HeaderBar.vue      # 顶部栏（模块切换 / 收藏 / 最近 / 主题 / 紧凑 / 设置）
│   ├── SearchBar.vue      # 搜索 + 类型过滤 + 建议
│   ├── CategoryTree.vue   # 分类侧栏（仅模块页）
│   ├── CommandCard.vue    # 命令卡片（星标 / 高亮 / 复制）
│   ├── RecipeCard.vue     # 配方卡片
│   ├── CommandList.vue    # 结果列表
│   └── ResultSummary.vue  # 结果统计
├── composables/
│   ├── useSearch.js       # ★ 搜索（数据源注入式，支持模块/收藏/最近三种来源）
│   ├── useModule.js       # 模块（由路由驱动）
│   ├── useFavorites.js    # 收藏单例
│   ├── useRecent.js       # 最近查看单例
│   ├── useSuggestions.js  # 搜索建议
│   ├── useKeyboard.js     # 键盘导航
│   └── useTheme.js        # 主题
├── utils/
│   ├── highlighter.js     # Shiki 全局单例 + 渲染缓存 + redis→bash 映射
│   └── storage.js         # localStorage 读写封装
├── data/                  # 模块数据（命令 JSON + 配方 + 注册表）
└── styles/global.css
scripts/
└── validate-data.js       # 数据 Schema 校验（npm run check）
```

## 数据格式与校验

命令 / 配方数据字段见旧版 [README](../command-book/README.md)（字段契约一致）。新增/修改数据后运行：

```bash
npm run check
```

校验规则（缺失或类型错直接报错退出）：

- **命令必填**：`name` `description` `category` `danger_level`（low/medium/high/critical）`tags[]` `examples[]`（每项含 `description` + 非空 `code`）
- **配方必填**：`name` `description` `fullCommand` `steps[]`（每项含 `description` + 非空 `code`）`tags[]`

当前数据量：297 命令 + 61 配方，全部通过校验。

## 部署

`npm run build` 输出纯静态 `dist/`，可部署到任意静态托管（Gitee Pages / GitHub Pages / Nginx / 对象存储）。hash 路由无需服务器 fallback。

### GitHub Pages（自动部署，已配置）

仓库已配置 GitHub Actions（`.github/workflows/deploy.yml`）：**push 到 `master` 即自动构建并发布**，无需手动操作。

- 线上地址：https://11052022.github.io/command-book-web/
- 更新流程：本地 `git commit` 后推送 GitHub 即可自动上线

### 双远端提交（Gitee + GitHub）

本地仓库同时关联两个远端：

| 远端名 | 地址 | 用途 |
|---|---|---|
| `origin` | gitee.com/fang-mingrui/command-book-web | 国内源码镜像 |
| `github` | github.com/11052022/command-book-web | 源码 + 触发自动部署 |

```bash
git push origin master   # 推 Gitee（国内备份）
git push github master   # 推 GitHub（触发自动部署）
```

> 注意：GitHub 需要代理才能连接（本地代理端口 7897）。

## 文档

- 用户手册（小白向）：`docs/user-guide.md`
- 旧版 v1（离线单文件）仍保留在上级目录 `command-book/`，作为历史版本存档