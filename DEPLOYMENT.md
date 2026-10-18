# 部署到 SCU cPanel（Part 5）—— 逐步操作手册

> 先填好这张表，后面每一步都要用到。把 `username` 换成**你的 cPanel 用户名**
> （例如 `zhuo13`）。

| 项目 | 你的值 |
|---|---|
| cPanel 登录地址 | `https://__________________` |
| cPanel 用户名 | `zhuo13` |
| 数据库名（带前缀） | `zhuo13_a3db` |
| 数据库用户（带前缀） | `zhuo13_a3user` |
| 数据库密码 | `__________` |
| API 公开地址 | `https://__________________` |
| 客户端网站地址 | `https://__________________` |
| 管理端网站地址 | `https://__________________` |

---

## 第 1 步：创建 MySQL 数据库

1. 登录 cPanel，打开 **MySQL Databases**（MySQL 数据库）。
2. **Create New Database**（创建新数据库）→ 输入 `a3db`
   → cPanel 会自动加上前缀，完整名字是 `zhuo13_a3db`（**记下来**）。
3. 往下找到 **Add New User**（添加新用户）→ 用户名填 `a3user`，设置一个密码
   （用 **Generate** 生成强密码），点 **Create User**。
   完整用户名是 `zhuo13_a3user`（**记下来**）。
4. 再往下 **Add User To Database** → 选 `zhuo13_a3user` + `zhuo13_a3db`
   → 勾选 **ALL PRIVILEGES** → **Make Changes**。

---

## 第 2 步：导入数据（phpMyAdmin）

1. 回到 cPanel 首页 → **phpMyAdmin**。
2. 左侧点开你的数据库 `zhuo13_a3db`（**一定要先选中它**）。
3. 顶部 **Import**（导入）→ **Choose File** 选 `api/db/charity_events.sql`。
4. 如果报 `CREATE DATABASE ... access denied`：**cPanel 不允许你自己建库**。
   用记事本打开那个 SQL 文件，**删掉第 23–27 行**（`CREATE DATABASE ...` 和
   `USE ...` 两条语句）后保存，再重新导入。
5. 导入成功后，左侧应看到 3 张表，点开确认：

   | 表 | 行数 |
   |---|---|
   | `categories` | 7 |
   | `events` | 13 |
   | `registrations` | 14 |

---

## 第 3 步：部署 API（Setup Node.js App）

1. cPanel → **File Manager** → 进入 `public_html` → **+ Folder** 新建 `a3-api`。
2. 进入 `a3-api` → **Upload** → 上传 `deliverables/A3-api.zip`
   → 右键 zip → **Extract**（解压）→ 解压后**删掉 zip**。
3. 回 cPanel → **Setup Node.js App** → **Create Application**：
   - **Node.js version**：选 **18.x 或 20.x**（不要选太新的）
   - **Application mode**：`Production`
   - **Application root**：`a3-api`
   - **Application URL**：⚠️ **强烈建议选一个子域名**（如 `a3api.你的域名`），
     不要选子路径 `/a3-api`——子路径会让所有请求带上 `/a3-api` 前缀，
     Angular 里写的 `/api/events` 就全部 404 了。
   - **Application startup file**：`server.js`
4. 展开 **Environment variables**，逐条添加（点 **+ Add Variable**）：

   | Name | Value |
   |---|---|
   | `DB_HOST` | `localhost` |
   | `DB_PORT` | `3306` |
   | `DB_USER` | `zhuo13_a3user` |
   | `DB_PASSWORD` | 第 1 步的密码 |
   | `DB_NAME` | `zhuo13_a3db` |

   > `PORT` 由 cPanel 自动分配，**不要手动设置**；`server.js` 已经写成
   > `process.env.PORT || 3000`，会自动用 cPanel 给的端口。
5. 点 **Create**，然后在应用页面点 **Run NPM Install**（安装 express/mysql2 等依赖）。
6. 装完点 **Start App**（或 **Restart**）。
7. 浏览器打开 `https://a3api.你的域名/api/health`：

   ```json
   { "api": "ok", "database": "ok" }
   ```

   看到这个就说明 API + 数据库通了。**把这个地址记进上面的表**，例如
   `https://a3api.username.scudigitalpress.com`。

---

## 第 4 步：改 API 地址、重新构建、重新打包

两个 Angular 站点现在还指向 `http://localhost:3000`，必须改成第 3 步的 API 地址。

1. 打开 `charity-workspace/projects/client/src/environments/environment.ts`：

   ```ts
   export const environment = {
     production: false,
     apiBaseUrl: 'https://a3api.你的域名/api',   // ← 改这里
   };
   ```

2. 同样改 `charity-workspace/projects/admin/src/environments/environment.ts`。

3. 在**项目根目录**执行一条命令完成「构建 + 生成 .htaccess + 打包」：

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\package.ps1 -Username zhuo13
   ```

   （把 `zhuo13` 换成你的 cPanel 用户名；如果网站要放在
   `public_html/a3-client` 这种子目录里，再加
   `-ClientBase "/a3-client/" -AdminBase "/a3-admin/"`）

4. 产出在 `deliverables/`，文件名已经是提交要求的格式：

   ```
   zhuo13A3-clientside.zip
   zhuo13A3-adminside.zip
   zhuo13A3-api.zip        ← 这个第 3 步已经上传过，不用再传
   ```

> `.htaccess` 是必须带的：没有它，在活动详情页刷新页面会因为 SPA 路由被
> Apache 当成真实目录而 404。脚本已自动写进两个包里。

---

## 第 5 步：上传两个网站

1. File Manager → `public_html` → 新建文件夹 `a3-client` 和 `a3-admin`
   （用子域名部署的话就进到对应子域名的根目录）。
2. 分别上传对应的 zip 并 **Extract**，解压后删掉 zip。
3. 确认解压后的目录里能看到 `index.html` 和 `.htaccess`
   （File Manager 右上角 **Settings → Show Hidden Files** 才能看到点开头的文件）。
4. 浏览器打开客户端地址 → 首页应列出 13 个活动。

---

## 第 6 步：验收清单

- [ ] 客户端首页显示活动列表（数据来自 cPanel 数据库）
- [ ] 打开任一活动详情 → 显示报名记录 + **7 天天气预报**
- [ ] 提交一条新报名 → 到 phpMyAdmin 的 `registrations` 表里能看到新行
- [ ] 用同一邮箱再提交一次 → 页面提示"已经报名过"（409）
- [ ] 管理端 `/events` 列表正常
- [ ] 管理端新建一个活动 → 客户端能搜到
- [ ] 管理端更新一个活动 → 客户端看到变化
- [ ] 试着删除一个有报名的活动 → 应该被拒绝并给出提示
- [ ] 在详情页直接按 F5 刷新 → **不能出现 404**

---

## 常见故障排查

| 现象 | 原因 / 处理 |
|---|---|
| `database: "unreachable"` | `.env` 变量没生效或数据库名/用户名没带 cPanel 前缀。回 Setup Node.js App 检查环境变量，然后 Restart。 |
| 打开 API 显示 `Cannot GET /` 之外的 404 | 说明用了子路径部署，请求带 `/a3-api` 前缀。**改成子域名部署**。 |
| 页面空白、控制台报 CORS 错误 | `apiBaseUrl` 写错，或漏了 `/api` 后缀。 |
| 控制台报 *mixed content* | 网站是 `https` 但 `apiBaseUrl` 还写着 `http`。两个站点都必须用 `https` 的 API 地址。 |
| 刷新详情页 404 | `.htaccess` 没上传，或 `RewriteBase` 与实际目录不符（子目录部署要传 `-ClientBase "/a3-client/"`）。 |
| `npm install` 失败 | 把 Node.js version 换成 18.x，再 Run NPM Install。 |

---

## 提交前最后一步

把 `deliverables/` 里的三个 zip 作为作业附件提交（文件名已符合要求），
并在提交页写上 GitHub 仓库链接、Three deployed URLs 和一个 15 分钟内的演示视频链接。
