# modify.ai.md

## 同步检查记录（2026-03-15）

依据 `md/modify_check/modify.md` 与 `md/modify_check/index.bak.2026_3_15.html` 对照后，已完成以下同步：

1. `t8star` 厂家默认 BaseURL 缺少
- 已补齐：
  - `src/views/setting/model/modeListDialog.vue`
  - `src/views/setting/model/modelData.vue`
- 已新增 `t8star` 的官网映射、厂商名称、默认 `baseUrl`（`https://ai.t8star.cn/v1`），并补了视频默认地址（模式配置场景）。

2. 分镜“进入全选删除”按钮与功能缺少
- 已补齐：
  - `src/views/projectDetail/components/scriptManager/components/storyboardImage.vue`
- 已增加：`进入多选删除 / 取消多选 / 全选 / 删除选中(n)`。
- 已支持批量删除请求（`/storyboard/delStoryboard` 传 `ids`）。

3. 聊天历史管理与助手优化缺少
- 聊天历史管理入口：当前 `index.html` 内 `chat-history-manager-entry` 逻辑已在。
- 助手消息渲染优化已补齐：
  - `src/components/chat/chatMessage.vue`
- 已支持 `textWithConfirm`、思考折叠、图片消息、确认状态展示。
- 已按参考界面补齐助手头部视觉（Toonflow Logo + “助手”标识）。
- 已对齐后端 `chatStoryboard.ts` 协议：
  - `src/views/projectDetail/components/scriptManager/components/storyboardImage/storyboardChat.vue`
  - WebSocket URL 按模式传参（视频模式增加 `mode=video`）
  - 接收并应用 `sessionHistory`（恢复会话历史）
  - 保存并回传 `sessionId`（断线/重连尽量回到同一会话）

4. AI 视频生成与助手优化缺少
- 已补齐：
  - `src/views/projectDetail/components/scriptManager/components/generateVideo.vue`
  - `src/views/projectDetail/components/scriptManager/components/storyboardImage/storyboardChat.vue`
- 已增加“AI视频生成”入口，接入助手弹窗（`mode=video`）。
- 视频配置卡片补了“刷新状态”能力（`/video/refreshVideoStatus`）。
- 已修正 AI 视频助手 WebSocket 连接参数，确保后端进入视频会话分支（`mode=video`）。

5. 镜头编辑器修改未同步
- 已补齐：
  - `src/components/storyboardEditor/index.vue`
  - `src/views/projectDetail/components/scriptManager/components/storyboardImage/draggableCanvas.vue`
- 已实现：
  - 镜头提示词可编辑（textarea）
  - 编辑指令不会覆盖镜头提示词
  - `editPrompt / otherImgs / generateImg / selectedResultId` 与镜头提示词一起保存并回填

6. 视频配置“进入全选删除”按钮与功能缺少
- 已补齐：
  - `src/views/projectDetail/components/scriptManager/components/generateVideo.vue`
  - `src/stores/video.ts`
- 已增加：`进入多选删除 / 取消多选 / 全选 / 删除选中(n)`。
- `video store` 的 `removeConfig` 已支持单个与批量 ID。

7. 会话历史管理功能缺少
- 已补齐并增强：
  - `index.html`
  - `dist/index.html`
  - `src/pages/workbench/index.vue`
- 已确保会话记录入口注入逻辑优先挂在“我的项目”区域（上方菜单），并对“设置”区域做回退兜底。
- 已增加文本替换兜底，避免入口文字被错误保留为原菜单项文本。
- 已将工作台侧栏默认从折叠改为展开（`collapsed=false`），避免入口仅显示图标导致“看起来缺失”。

## 本地验证情况
- 受当前环境依赖问题影响（`rollup` 可选依赖缺失、`vue-tsc` 不可用），本机未能完成 `yarn build-only` / `yarn type-check`。
- 代码层面已完成逐文件自检，建议你在可用 Node/依赖环境下再跑一次完整构建。
