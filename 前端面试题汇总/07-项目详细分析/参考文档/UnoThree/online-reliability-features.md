# 在线可靠性特性说明（新特性）

作者：Shyu  | 更新日期：2026-02-18

## 1. 目标
描述本项目针对断线重连、会话恢复、房间生命周期治理的新特性与契约。

## 2. 已落地特性

### 2.1 会话保留窗口（Grace Window）
- 字段：`GameConfig.disconnectGraceSeconds`（默认 60 秒）。
- 行为：
  1. 所有人类玩家离线后，不立即解散。
  2. 进入 `pendingDissolveAt` 倒计时窗口。
  3. 窗口内若任一玩家恢复在线，取消解散。
  4. 超时后广播 `roomClosed` 并解散房间。

### 2.2 重连身份凭据（不依赖昵称）
- 客户端上行：`joinRoom` 支持 `sessionId`、`reconnectToken`。
- 服务端下行：`reconnectCredentials` 回写最新凭据。
- 服务端匹配顺序：
  1. `reconnectToken`
  2. `sessionId`
  3. `playerName`（最后兜底）

### 2.3 房间关闭事件与本地回收
- 下行事件：`roomClosed`。
- 客户端收到后清理：
  - `uno_room_id`
  - `uno_player_name`
  - `uno_invite_token`
  - 本地重连凭据缓存

### 2.4 分级重连提示（客户端）
- 短断线：立即提示“正在重连”。
- 长断线：延迟阈值后提示“持续重连中”。
- 重连成功：按短/长断线分别提示。
- 房间关闭：提示“房间已解散/已关闭”。
- 通知采用节流去重，避免刷屏。

## 3. Socket 契约（新增/变更）

### 3.1 客户端 -> 服务端
- `joinRoom`
  - 输入：
    - `roomId: string`
    - `playerName: string`
    - `config?: Partial<GameConfig>`
    - `inviteToken?: string`
    - `isReconnect?: boolean`
    - `sessionId?: string`
    - `reconnectToken?: string`

### 3.2 服务端 -> 客户端
- `reconnectCredentials`
  - 输出：`{ roomId, sessionId, reconnectToken }`
- `roomClosed`
  - 输出：`{ roomId, reason }`

## 4. 安全与脱敏
- `reconnectToken` 与 `sessionId` 不进入 `gameStateUpdate` 广播。
- 广播前按玩家连接做个性化脱敏，非本人看不到他人手牌。

## 5. 后续建议（未落地）
- Presence 集中服务（Redis）用于多实例一致性。
- `stateVersion` 防乱序回滚。
- 重连次数/时长指标上报（SLO 监控）。
