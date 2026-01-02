# 需求分析与实现方案

## 需求概述

基于当前AutoClicker项目，需要实现以下7个改进需求：

### 3.1 新建脚本按钮位置调整
**当前问题**: 新建脚本按钮位置不合理
**需求**: 将按钮移至右下角（FAB标准位置）

**分析**:
- 当前实现: ScriptList组件中使用FAB，但位置可能不在标准右下角
- 解决方案: 确保FAB使用`position: 'absolute'`并定位在右下角
- 影响文件: `src/components/ScriptList.tsx`
- 难度: ⭐ (简单)

### 3.2 编辑点位弹窗层级问题
**当前问题**: 编辑点位时，弹窗被悬浮窗和遮罩挡住，无法修改
**需求**: 编辑弹窗应显示在最上层

**分析**:
- 当前实现: FloatingEditor使用Modal，EditorPanel中的编辑对话框可能层级不够
- 根本原因: React Native的Modal和Portal层级冲突
- 解决方案:
  1. 使用Portal包裹编辑对话框，确保在最顶层
  2. 或者调整Modal的zIndex
  3. 或者使用独立的全局Portal
- 影响文件: `src/components/FloatingEditor/EditorPanel.tsx`
- 难度: ⭐⭐ (中等)

### 3.3 坐标精度优化
**当前问题**: x, y坐标保存时小数点后数字过多
**需求**: 精确到小数点后三位

**分析**:
- 影响位置:
  1. 添加点位时的坐标保存
  2. 拖动标记时的坐标更新
- 解决方案: 在保存坐标时使用`Math.round(value * 1000) / 1000`
- 影响文件:
  - `src/components/FloatingEditor/MarkerLayer.tsx` (拖动更新)
  - `src/components/FloatingEditor/EditorPanel.tsx` (添加点位)
  - `src/store/clickStore.ts` (可选：在store层统一处理)
- 难度: ⭐ (简单)

### 3.4 Debug模式 - 点击轨迹可视化
**当前问题**: 无法直观看到点击执行轨迹
**需求**: 添加debug模式，运行时用悬浮窗绘制圆点展示点击位置

**分析**:
- 实现方案:
  1. 在globalConfig中添加`debugMode: boolean`
  2. 创建新的原生模块或扩展现有模块，支持绘制悬浮窗圆点
  3. 在executionEngine执行点击时，如果debug模式开启，绘制圆点
  4. 圆点需要在其他应用上层显示（需要SYSTEM_ALERT_WINDOW权限）
- 技术挑战:
  - 需要Android原生代码创建悬浮窗View
  - 需要管理多个圆点的生命周期（显示后自动消失）
  - 需要确保不影响点击执行性能
- 影响文件:
  - `src/store/clickStore.ts` (添加debugMode配置)
  - `src/services/executionEngine.ts` (调用debug绘制)
  - `android/.../DebugOverlayModule.kt` (新建：绘制悬浮圆点)
  - `src/native/DebugOverlayModule.ts` (新建：TS接口)
  - `src/screens/ConfigScreen.tsx` (添加debug开关)
- 难度: ⭐⭐⭐⭐ (困难)

### 3.5 运行按钮改为悬浮窗控制
**当前问题**: 运行按钮直接执行，缺少中间控制层
**需求**: 点击运行后显示悬浮窗，点击悬浮窗上的start图标才执行

**分析**:
- 实现方案:
  1. 创建ExecutionFloatingWindow组件（悬浮窗控制器）
  2. 点击运行按钮 → 显示悬浮窗 → 点击start → 执行脚本
  3. 悬浮窗需要显示：start/stop按钮、当前状态、进度
  4. 悬浮窗需要可拖动、可最小化
- 技术实现:
  - 方案A: 使用React Native Modal + 绝对定位模拟悬浮窗（仅应用内）
  - 方案B: 使用Android原生悬浮窗（可跨应用）**推荐**
- 影响文件:
  - `android/.../ExecutionOverlayModule.kt` (新建：原生悬浮窗)
  - `src/native/ExecutionOverlayModule.ts` (新建：TS接口)
  - `src/screens/ConfigScreen.tsx` (修改运行逻辑)
  - `src/services/executionEngine.ts` (添加悬浮窗状态回调)
- 难度: ⭐⭐⭐⭐ (困难)

### 3.6 悬浮窗跨应用显示
**当前问题**: 编辑点位时的悬浮窗只能在当前应用内显示
**需求**: 悬浮窗应该能在其他应用上层显示，允许切换到其他应用配置点位

**分析**:
- 当前实现: FloatingEditor使用React Native Modal，只能在应用内显示
- 根本限制: React Native Modal无法跨应用显示
- 解决方案: **必须使用Android原生悬浮窗**
  1. 创建Android Service管理悬浮窗
  2. 使用WindowManager添加TYPE_APPLICATION_OVERLAY类型的View
  3. 需要SYSTEM_ALERT_WINDOW权限（Android 6.0+需要用户授权）
  4. 悬浮窗内容可以是原生View或WebView加载RN bundle
- 技术挑战:
  - 原生悬浮窗与RN状态同步
  - 悬浮窗UI需要用原生代码实现或使用WebView
  - 权限管理和用户引导
- 影响文件:
  - `android/.../FloatingEditorService.kt` (新建：悬浮窗Service)
  - `android/.../FloatingEditorView.kt` (新建：悬浮窗View)
  - `src/native/FloatingEditorModule.ts` (新建：控制悬浮窗)
  - `src/components/FloatingEditor/FloatingEditor.tsx` (重构为原生悬浮窗)
  - `AndroidManifest.xml` (添加权限和Service声明)
- 难度: ⭐⭐⭐⭐⭐ (非常困难)

### 3.7 文档输出
**需求**: 完成以上改动后，输出完整的实现文档

---

## 实现优先级与依赖关系

### 第一阶段：简单修复（立即实施）
1. **3.1 新建脚本按钮位置** - 独立，无依赖
2. **3.3 坐标精度优化** - 独立，无依赖

### 第二阶段：中等难度（需要设计）
3. **3.2 编辑弹窗层级** - 独立，但需要测试

### 第三阶段：高难度功能（需要原生开发）
4. **3.4 Debug模式** - 需要原生模块，但相对独立
5. **3.5 运行悬浮窗** - 需要原生模块，与3.6有关联
6. **3.6 跨应用悬浮窗** - **最复杂**，需要完全重构FloatingEditor

### 依赖关系
- 3.5和3.6都需要原生悬浮窗技术，可以共享部分代码
- 3.4的debug悬浮圆点可以复用3.5/3.6的悬浮窗权限管理

---

## 技术风险评估

### 高风险项
1. **3.6 跨应用悬浮窗**:
   - 需要完全重写FloatingEditor为原生实现
   - RN与原生状态同步复杂
   - 用户体验可能不如当前Modal流畅
   - 开发工作量大（预计2-3天）

2. **3.5 运行悬浮窗**:
   - 需要原生Service保持悬浮窗
   - 执行过程中的状态同步
   - 开发工作量中等（预计1-2天）

### 中风险项
3. **3.4 Debug模式**:
   - 原生绘制相对简单
   - 但需要管理多个圆点的生命周期
   - 开发工作量中等（预计1天）

### 低风险项
4. **3.1, 3.2, 3.3**: 纯RN层修改，风险低

---

## 建议实施方案

### 方案A：完整实现（推荐给有充足时间的情况）
按优先级顺序实现所有需求，预计总工作量：5-7天

### 方案B：分阶段实现（推荐）
1. **立即实施**: 3.1, 3.3 (30分钟)
2. **短期实施**: 3.2 (1小时)
3. **中期规划**: 3.4, 3.5 (2-3天)
4. **长期规划**: 3.6 (2-3天，需要架构重构)

### 方案C：最小可行方案
1. 实施3.1, 3.2, 3.3（立即修复明显问题）
2. 3.4添加简化版：仅在应用内显示debug圆点（使用RN View）
3. 3.5简化：使用应用内Modal模拟悬浮窗
4. 3.6暂缓，或提供"切换应用后需返回"的使用说明

---

## 用户确认问题

在开始实施前，需要确认：

1. **时间预期**: 是否接受分阶段实施？还是需要一次性完成所有功能？
2. **3.6的必要性**: 跨应用悬浮窗是否是必需功能？如果是，是否接受完全重构FloatingEditor？
3. **3.5的实现方式**: 运行悬浮窗是否必须跨应用？还是应用内悬浮窗即可？
4. **3.4的范围**: Debug模式是否必须跨应用显示？还是应用内显示即可？

---

## 推荐实施计划

基于实际情况，我建议：

### 立即实施（今天）
- ✅ 3.1 新建脚本按钮位置调整
- ✅ 3.3 坐标精度优化
- ✅ 3.2 编辑弹窗层级修复

### 近期实施（本周）
- 🔄 3.4 Debug模式（应用内版本）
- 🔄 3.5 运行悬浮窗（应用内版本）

### 后续规划（需要架构讨论）
- ⏳ 3.6 跨应用悬浮窗（需要重构）
- ⏳ 3.4/3.5 升级为跨应用版本

这样可以快速解决当前明显的问题，同时为复杂功能留出充分的设计和开发时间。
