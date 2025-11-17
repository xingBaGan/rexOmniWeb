# Clerk OAuth 登录配置指南

## 概述

代码已经配置好支持 Google 登录。你只需要在 Clerk Dashboard 中启用 Google OAuth 提供商即可。

## 在 Clerk Dashboard 中配置 OAuth 提供商

### 1. 登录 Clerk Dashboard

访问 [Clerk Dashboard](https://dashboard.clerk.com/) 并使用你的账户登录。

### 2. 选择你的应用

在应用列表中选择你的应用。

### 3. 配置 Google 登录

1. 在左侧菜单中，点击 **"Authentication"** → **"Social Connections"**
2. 找到 **"Google"** 并点击启用
3. 你需要提供以下信息：
   - **Client ID**: 从 Google Cloud Console 获取
   - **Client Secret**: 从 Google Cloud Console 获取

#### 获取 Google OAuth 凭证：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API**
4. 转到 **"Credentials"** → **"Create Credentials"** → **"OAuth client ID"**
5. 选择应用类型为 **"Web application"**
6. 添加授权重定向 URI：
   - 开发环境: `http://localhost:3000`
   - 生产环境: `https://yourdomain.com`
7. 复制 **Client ID** 和 **Client Secret** 到 Clerk Dashboard

### 4. 配置重定向 URL

确保在 Google OAuth 中配置了正确的重定向 URL：

- **Clerk 回调 URL**: `https://your-clerk-domain.clerk.accounts.dev/v1/oauth_callback`
- 你可以在 Clerk Dashboard 的 **"Settings"** → **"Domains"** 中找到你的 Clerk 域名

## 代码更改说明

代码已经更新以支持多个 OAuth 提供商：

1. **`main.tsx`**: 在 `ClerkProvider` 中添加了全局样式配置
2. **`AuthPage.tsx`**: 更新了 `SignIn` 和 `SignUp` 组件的样式，确保社交登录按钮正确显示

## 验证配置

配置完成后：

1. 重启你的开发服务器
2. 访问登录页面
3. 你应该能看到 Google 登录按钮（如果已启用）
4. 点击按钮测试登录流程

## 注意事项

- 确保在 Google Cloud Console 中正确配置了重定向 URL
- 在生产环境中，确保使用 HTTPS
- 测试时可以使用 Clerk 的测试模式

## 支持的 OAuth 提供商

Clerk 还支持其他 OAuth 提供商，包括：
- GitHub (已配置)
- Google (需要配置)
- Microsoft
- Facebook
- Twitter
- Discord
- 等等...

你可以在 Clerk Dashboard 中启用任何你需要的提供商。

