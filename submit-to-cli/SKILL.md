---
name: submit-to-cli
description:
  CLI tool wrapping aidirs.org and backlinkdirs.com submission APIs. Use when the user needs to submit a URL
  or preview site metadata via CLI. Supports three commands: login (browser-based OAuth), submit (send URL),
  and fetch (preview without submitting).
---

# submit-to-cli

## Overview

`submit-to-cli` 封装 aidirs.org / backlinkdirs.com 的提交 API，提供三个命令：

- `login` — 浏览器授权，自动获取并存储 Token
- `submit <url>` — 提交 URL
- `fetch <url>` — 仅预览网站元数据，不提交

凭证存储在 `~/.config/submit-to-cli/config.json`。

## Workflow

### 1. Login — 浏览器授权

```bash
submit-to-cli login
```

1. 选择站点（aidirs.org 或 backlinkdirs.com）
2. 自动打开浏览器，进入登录页
3. 用户在浏览器完成登录
4. 回调自动完成，Token 存入本地

如用户尚无 API Token，系统会自动创建一个（名为 "CLI Token"）。

### 2. Submit — 提交 URL

```bash
submit-to-cli submit <url>
```

内部调用：

```http
POST /api/submit
Authorization: Bearer <token>
Content-Type: application/json

{ "link": "https://example.com" }
```

常见错误：

| 状态码 | 含义 |
|--------|------|
| 400 | link 参数缺失或格式错误、重复站点 |
| 401 | Token 无效或未授权 |
| 500 | 服务器错误 |

### 3. Fetch — 预览元数据

```bash
submit-to-cli fetch <url>
```

调用 `POST /api/fetch-website`，不创建提交记录。

## Environment / Config Reference

| 来源 | 键 | 说明 |
|------|----|------|
| 配置文件 | `~/.config/submit-to-cli/config.json` | 本地存储的凭证（优先） |
| 环境变量 | `DIRS_TOKEN` | Bearer Token（备用） |
| 环境变量 | `DIRS_BASE_URL` | API Base URL（备用） |
| CLI 默认 | Base URL | `https://aidirs.org` |

配置文件格式：

```json
{
  "DIRS_BASE_URL": "https://aidirs.org",
  "DIRS_TOKEN": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Scripts

```bash
export DIRS_BASE_URL="https://aidirs.org"
export DIRS_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
submit-to-cli submit https://example.com
```
