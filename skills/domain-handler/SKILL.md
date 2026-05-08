---
name: domain-handler
description:
  使用 Spaceship API 注册域名并接入 Cloudflare。凡是用户想查询域名可用性、购买或注册域名、创建 Spaceship 联系人、把域名加入 Cloudflare、把注册商 nameserver 切到 Cloudflare，或等待 Cloudflare 激活时，都应使用这个 skill。对于“帮我查这个域名能不能买”“把这个域名接到 Cloudflare”“更新 Spaceship nameserver”这类只覆盖部分流程的请求，也应触发这个 skill。
version: 0.1.0
metadata:
  openclaw:
    homepage: https://github.com/RobinWM/ship-skills#domain-handler
---

# domain-handler

用这个 skill 处理 Spaceship -> Cloudflare 的域名接入流程。

## 开始前

- 域名注册和 nameserver 修改都属于高影响操作。
- 在没有得到用户明确确认前，不要注册域名、创建付费订单，或修改 nameserver。
- 如果用户只是想了解流程，就说明步骤，不要实际执行变更。
- 如果用户希望直接执行，但缺少关键的账单或账号信息，只询问真正缺失的部分。

## 必要输入

发起 API 调用前，先确认这些环境变量存在：

```bash
SPACESHIP_API_KEY=
SPACESHIP_API_SECRET=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

所需权限：

- Spaceship scopes：`Domains`、`Billing`、`Contacts`
- Cloudflare token 权限：`Zone:Edit`、`DNS:Edit`

需要流程概览、环境变量或权限说明时，读取 [references/README.md](./references/README.md)。
需要接口细节、请求示例或 TypeScript 示例时，读取 [references/api.md](./references/api.md)。

## 工作流程

### 1. 先确认用户意图

先判断用户到底要哪一段流程：

- 只查域名可用性
- 完整执行“注册域名 + 接入 Cloudflare”
- 只给已有域名做 Cloudflare 接入
- 只更新 nameserver
- 只检查激活状态

在任何不可逆步骤之前，都要确认准确的域名以及即将执行的动作。

### 2. 检查域名可用性

调用 Spaceship 的批量可用性接口：

```http
POST /v1/domains/available
```

执行要求：

- 按用户明确给出的域名或 TLD 组合查询。
- 如果用户没有说明要查哪些后缀，默认按这个顺序查询：`.com`、`.net`、`.org`、`.co`、`.pro`、`.io`、`.app`。
- 按顺序逐个检查并汇报结果，不要擅自扩展到这份列表之外的 TLD。
- 如果用户只是想看是否可注册，返回结果后就在这里停下，除非用户明确要求继续。

### 3. 先查询已有联系人，再决定是否创建

如果用户要注册域名，先查询账号里已有的联系人，优先复用可用的 contact ID；只有在没有可用联系人时，才创建新的 Spaceship 联系人：

```http
POST /v1/contacts
```

执行要求：

- 先检查账号里是否已有联系人，或先从用户现有域名里读取正在使用的 contact ID。
- 如果用户已经有现成的 contact ID，优先复用。
- 只有在没有可复用联系人时，才创建新联系人。
- 不要编造联系人信息。只有在 API 必填时，才向用户补问缺失的法务或注册信息。

### 4. 注册域名

只有在用户确认购买后，才调用注册接口：

```http
POST /v1/domains/{domain}
```

当前文档里的默认请求结构：

```json
{
  "years": 1,
  "autoRenew": false,
  "privacyProtection": {
    "level": "high",
    "userConsent": true
  },
  "contacts": {
    "registrant": "CONTACT_ID",
    "admin": "CONTACT_ID",
    "tech": "CONTACT_ID",
    "billing": "CONTACT_ID",
    "attributes": []
  }
}
```

执行要求：

- 不要静默修改和价格相关的字段，比如注册年限或自动续费。
- 如果用户没有明确说明 `years`、`autoRenew` 或隐私保护设置，要么先说明将采用上面的默认值，要么在购买前补充确认。
- 如果用户的目标是完整执行“注册域名 + 接入 Cloudflare”，那么在注册成功后不要停下，应立即继续执行第 5 步，把域名加入 Cloudflare；只有当用户明确只要求购买域名时，才在这里结束。

### 5. 把域名加入 Cloudflare

创建 Cloudflare zone：

```http
POST /zones
```

需要记录：

- `zone_id`
- Cloudflare 分配的 nameserver

执行要求：

- 使用用户提供的 `CLOUDFLARE_ACCOUNT_ID`。
- 如果 Cloudflare 返回该 zone 已存在，不要重复创建。应向用户说明当前状态，并仅在后续步骤仍然有效时继续。

### 6. 更新注册商 nameserver

把 Spaceship 域名切到 Cloudflare nameserver：

```http
PUT /v1/domains/{domain}/nameservers
```

使用：

```json
{
  "provider": "custom",
  "hosts": [
    "amy.ns.cloudflare.com",
    "bob.ns.cloudflare.com"
  ]
}
```

执行要求：

- 明确回显即将应用的 nameserver。
- 提醒用户 nameserver 生效需要传播时间。

### 7. 等待 Cloudflare 激活

轮询 zone 状态：

```http
GET /zones/{zone_id}
```

直到返回：

```json
{
  "result": {
    "status": "active"
  }
}
```

执行要求：

- 使用合理的轮询间隔，例如 30 秒。
- 如果长时间未激活，不要无限等待；应把当前状态同步给用户，并把控制权交还给用户。

## 输出格式

执行结束后，用简短状态报告告诉用户：

- 域名
- 已完成的步骤
- 如果已创建 Cloudflare zone，则给出 `zone_id`
- 当前注册商应该配置的 nameserver
- 当前激活状态
- 如果还没完成，下一步建议做什么

## 异常处理

- 认证或权限失败：说明是 Spaceship 还是 Cloudflare 失败，并指出缺的是哪个环境变量或权限。
- 域名不可用：直接说明，并在注册步骤前停止。
- Cloudflare zone 已存在或注册商状态不一致：说明阻塞点和最安全的下一步。
- 激活耗时过长：告诉用户 Cloudflare 仍在 pending，并附带最新状态。
