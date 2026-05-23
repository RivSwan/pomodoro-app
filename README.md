# 🍅 番茄钟

基于 Electron 的番茄工作法桌面应用，暖色卡通风 UI，支持自定义时长。

## 功能

- **三种模式** — 工作 (25min)、短休息 (5min)、长休息 (15min)，自动循环
- **自定义时长** — 可分别调整工作、短休息、长休息的分钟数
- **番茄计数** — 记录每日完成的番茄数，每 4 个番茄自动进入长休息
- **桌面通知** — 计时结束时弹出系统通知 + 提示音
- **可缩放窗口** — 支持自由拖动调整窗口大小
- **键盘快捷键** — 空格 开始/暂停，R 重置

## 快速开始

```bash
npm install
npm start
```

## 项目结构

```
pomodoro-app/
├── main.js           # Electron 主进程
├── index.html        # 页面结构
├── style.css         # 暖色卡通风样式
├── timer.js          # 计时逻辑
├── generate-icon.js  # 图标生成脚本
├── icon.png          # 应用图标
└── package.json
```

## 技术栈

- **Electron** — 桌面应用框架
- **原生 HTML/CSS/JS** — 无额外前端框架
- **Web Audio API** — 结束提示音
- **Jimp** — 程序化生成应用图标
