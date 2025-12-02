# OAuth2 デバイスフロー実装ガイド

## 概要

OAuth2 デバイスフロー（Device Authorization Grant）は、**ブラウザを持たないデバイスや CLI ツール**で安全に認証を行うための仕組みです。

**参考実装**:
- [GitHub CLI (`gh`)](https://github.com/cli/cli)
- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/gcloud)
- RFC 8628: OAuth 2.0 Device Authorization Grant

---

## フロー概要

```
┌──────────┐                                  ┌───────────────┐                    ┌─────────┐
│   CLI    │                                  │ mirelplatform │                    │ Browser │
│ (mirel)  │                                  │   Backend     │                    │  (User) │
└────┬─────┘                                  └───────┬───────┘                    └────┬────┘
     │                                                │                                  │
     │ 1. デバイスコード要求                          │                                  │
     │ POST /api/auth/device/code                    │                                  │
     │ { client_id: "mirel-cli" }                    │                                  │
     ├──────────────────────────────────────────────>│                                  │
     │                                                │                                  │
     │ 2. デバイスコード応答                          │                                  │
     │ {                                              │                                  │
     │   device_code: "3c9a8f6b...",                 │                                  │
     │   user_code: "WDJB-MJHT",                     │                                  │
     │   verification_uri: "https://.../cli/auth",   │                                  │
     │   expires_in: 900,                            │                                  │
     │   interval: 5                                 │                                  │
     │ }                                              │                                  │
     │<──────────────────────────────────────────────┤                                  │
     │                                                │                                  │
     │ 3. ユーザーに指示を表示                        │                                  │
     │ "Opening browser..."                          │                                  │
     │ "Visit: https://.../cli/auth?code=WDJB-MJHT"  │                                  │
     │                                                │                                  │
     │ 4. ブラウザを開く                              │                                  │
     │────────────────────────────────────────────────────────────────────────────────>│
     │                                                │                                  │
     │                                                │ 5. ユーザーコード入力             │
     │                                                │  GET /cli/auth?code=WDJB-MJHT    │
     │                                                │<─────────────────────────────────┤
     │                                                │                                  │
     │                                                │ 6. ログイン確認                   │
     │                                                │  (既にログイン済みなら自動承認)   │
     │                                                │                                  │
     │                                                │ 7. 承認確認                       │
     │                                                │  "Authorize mirel-cli?"          │
     │                                                │   [Authorize] [Deny]             │
     │                                                │<─────────────────────────────────┤
     │                                                │                                  │
     │                                                │ 8. 承認完了                       │
     │                                                │  "✓ mirel-cli authorized"        │
     │                                                │  (device_codeを承認済みに更新)    │
     │                                                │──────────────────────────────────>
     │                                                │                                  │
     │ 9. ポーリング開始 (5秒間隔)                    │                                  │
     │ POST /api/auth/device/token                   │                                  │
     │ { device_code: "3c9a8f6b..." }                │                                  │
     ├──────────────────────────────────────────────>│                                  │
     │                                                │                                  │
     │ 10a. まだ承認されていない                      │                                  │
     │ { status: "pending" }                         │                                  │
     │<──────────────────────────────────────────────┤                                  │
     │                                                │                                  │
     │ ... (5秒待機) ...                             │                                  │
     │                                                │                                  │
     │ 11. 再度ポーリング                             │                                  │
     │ POST /api/auth/device/token                   │                                  │
     ├──────────────────────────────────────────────>│                                  │
     │                                                │                                  │
     │ 12. 承認完了 - トークン発行                    │                                  │
     │ {                                              │                                  │
     │   status: "authorized",                       │                                  │
     │   access_token: "eyJhbGc...",                 │                                  │
     │   token_type: "Bearer",                       │                                  │
     │   expires_in: 86400,                          │                                  │
     │   user: {                                      │                                  │
     │     email: "user@example.com",                │                                  │
     │     name: "John Doe"                          │                                  │
     │   }                                            │                                  │
     │ }                                              │                                  │
     │<──────────────────────────────────────────────┤                                  │
     │                                                │                                  │
     │ 13. トークン保存 (keychain)                    │                                  │
     │                                                │                                  │
     │ 14. 完了メッセージ                             │                                  │
     │ "✓ Logged in as user@example.com"             │                                  │
     │                                                │                                  │
```

---

## CLI側実装 (TypeScript)

### 1. login コマンド

```typescript
// packages/cli/src/commands/login.ts
import { Command, Flags } from '@oclif/core';
import open from 'open';
import { saveToken } from '../core/auth.js';
import { loadGlobalConfig } from '../core/config-manager.js';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    email: string;
    name: string;
  };
}

export default class Login extends Command {
  static description = 'mirelplatform にログイン';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    'web-only': Flags.boolean({
      description: 'ブラウザを自動で開かない',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Login);
    const config = loadGlobalConfig();
    const apiUrl = config.apiUrl || 'https://mirelplatform.example.com';

    this.log('Logging in to mirelplatform...\n');

    // 1. デバイスコード取得
    const deviceCode = await this.requestDeviceCode(apiUrl);

    // 2. ユーザーに指示を表示
    this.log('Please visit the following URL to authorize this device:');
    this.log(`  ${deviceCode.verification_uri}?code=${deviceCode.user_code}\n`);
    this.log(`Or enter the code manually: ${deviceCode.user_code}\n`);

    // 3. ブラウザを開く
    if (!flags['web-only']) {
      this.log('Opening browser...');
      try {
        await open(`${deviceCode.verification_uri}?code=${deviceCode.user_code}`);
      } catch (error) {
        this.warn('Failed to open browser automatically. Please visit the URL above manually.');
      }
    }

    // 4. ポーリング
    this.log('\nWaiting for authorization...');
    const token = await this.pollForToken(apiUrl, deviceCode);

    // 5. トークン保存
    await saveToken(token.access_token!);

    // 6. 完了
    this.log(`\n✅ Logged in as ${token.user!.email}`);
  }

  private async requestDeviceCode(apiUrl: string): Promise<DeviceCodeResponse> {
    const response = await fetch(`${apiUrl}/api/auth/device/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 'mirel-cli',
        scope: 'promarker:read promarker:write',
      }),
    });

    if (!response.ok) {
      this.error(`Failed to request device code: ${response.statusText}`);
    }

    return response.json();
  }

  private async pollForToken(
    apiUrl: string,
    deviceCode: DeviceCodeResponse,
    maxAttempts = 180 // 15分 (180 * 5秒)
  ): Promise<TokenResponse> {
    const interval = deviceCode.interval * 1000; // 秒 → ミリ秒

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // interval秒待機
      await new Promise(resolve => setTimeout(resolve, interval));

      const response = await fetch(`${apiUrl}/api/auth/device/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'mirel-cli',
          device_code: deviceCode.device_code,
        }),
      });

      const data: TokenResponse = await response.json();

      if (data.status === 'authorized') {
        return data;
      }

      if (data.status === 'denied') {
        this.error('Authorization was denied');
      }

      if (data.status === 'expired') {
        this.error('Device code expired. Please try again.');
      }

      // status === 'pending' の場合は継続
      process.stdout.write('.');
    }

    this.error('Authentication timeout. Please try again.');
  }
}
```

---

## サーバー側実装 (Spring Boot)

### 1. デバイスコード発行

```java
// backend/src/main/java/com/mirelplatform/api/auth/DeviceAuthController.java
package com.mirelplatform.api.auth;

import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/device")
@RequiredArgsConstructor
public class DeviceAuthController {
    
    private final DeviceAuthService deviceAuthService;
    
    @PostMapping("/code")
    public DeviceCodeResponse requestDeviceCode(@RequestBody DeviceCodeRequest request) {
        // デバイスコードとユーザーコードを生成
        String deviceCode = UUID.randomUUID().toString();
        String userCode = generateUserCode(); // "WDJB-MJHT" 形式
        
        // Redisに一時保存 (15分間有効)
        DeviceAuthSession session = DeviceAuthSession.builder()
            .deviceCode(deviceCode)
            .userCode(userCode)
            .clientId(request.getClientId())
            .scope(request.getScope())
            .status("pending")
            .build();
        
        deviceAuthService.saveSession(session, Duration.ofMinutes(15));
        
        return DeviceCodeResponse.builder()
            .deviceCode(deviceCode)
            .userCode(userCode)
            .verificationUri("https://mirelplatform.example.com/cli/auth")
            .expiresIn(900) // 15分
            .interval(5)    // 5秒
            .build();
    }
    
    private String generateUserCode() {
        // 8文字のランダムコード (XXXX-XXXX 形式)
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
        StringBuilder code = new StringBuilder();
        SecureRandom random = new SecureRandom();
        
        for (int i = 0; i < 8; i++) {
            if (i == 4) code.append('-');
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return code.toString();
    }
}
```

### 2. トークンポーリング

```java
@PostMapping("/token")
public DeviceTokenResponse pollForToken(@RequestBody TokenPollRequest request) {
    DeviceAuthSession session = deviceAuthService.getSession(request.getDeviceCode());
    
    if (session == null) {
        return DeviceTokenResponse.expired();
    }
    
    switch (session.getStatus()) {
        case "authorized":
            // JWTトークン生成
            String accessToken = jwtService.generateToken(session.getUser(), session.getScope());
            
            // セッション削除（使い捨て）
            deviceAuthService.deleteSession(request.getDeviceCode());
            
            return DeviceTokenResponse.authorized(accessToken, session.getUser());
            
        case "denied":
            deviceAuthService.deleteSession(request.getDeviceCode());
            return DeviceTokenResponse.denied();
            
        case "pending":
        default:
            return DeviceTokenResponse.pending();
    }
}
```

### 3. ブラウザ側の承認エンドポイント

```java
// backend/src/main/java/com/mirelplatform/web/CliAuthController.java
package com.mirelplatform.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/cli/auth")
@RequiredArgsConstructor
public class CliAuthController {
    
    private final DeviceAuthService deviceAuthService;
    
    // ユーザーコード入力画面
    @GetMapping
    public String showAuthPage(@RequestParam(required = false) String code, Model model) {
        model.addAttribute("userCode", code);
        return "cli-auth"; // templates/cli-auth.html
    }
    
    // 承認処理
    @PostMapping("/authorize")
    public String authorize(
        @RequestParam String userCode,
        @AuthenticationPrincipal User currentUser,
        Model model
    ) {
        DeviceAuthSession session = deviceAuthService.findByUserCode(userCode);
        
        if (session == null) {
            model.addAttribute("error", "Invalid or expired code");
            return "cli-auth-error";
        }
        
        // セッションを承認済みに更新
        session.setStatus("authorized");
        session.setUser(currentUser);
        deviceAuthService.updateSession(session);
        
        model.addAttribute("clientName", "mirel-cli");
        return "cli-auth-success"; // "✓ mirel-cli has been authorized"
    }
    
    // 拒否処理
    @PostMapping("/deny")
    public String deny(@RequestParam String userCode) {
        DeviceAuthSession session = deviceAuthService.findByUserCode(userCode);
        
        if (session != null) {
            session.setStatus("denied");
            deviceAuthService.updateSession(session);
        }
        
        return "cli-auth-denied";
    }
}
```

### 4. データモデル

```java
// DeviceAuthSession.java
@Data
@Builder
public class DeviceAuthSession {
    private String deviceCode;
    private String userCode;
    private String clientId;
    private String scope;
    private String status; // "pending", "authorized", "denied"
    private User user;
    private LocalDateTime createdAt;
}

// DeviceCodeResponse.java
@Data
@Builder
public class DeviceCodeResponse {
    private String deviceCode;
    private String userCode;
    private String verificationUri;
    private int expiresIn;
    private int interval;
}

// DeviceTokenResponse.java
@Data
@Builder
public class DeviceTokenResponse {
    private String status;
    private String accessToken;
    private String tokenType;
    private int expiresIn;
    private UserDto user;
    
    public static DeviceTokenResponse pending() {
        return DeviceTokenResponse.builder().status("pending").build();
    }
    
    public static DeviceTokenResponse authorized(String token, User user) {
        return DeviceTokenResponse.builder()
            .status("authorized")
            .accessToken(token)
            .tokenType("Bearer")
            .expiresIn(86400)
            .user(UserDto.from(user))
            .build();
    }
    
    public static DeviceTokenResponse denied() {
        return DeviceTokenResponse.builder().status("denied").build();
    }
    
    public static DeviceTokenResponse expired() {
        return DeviceTokenResponse.builder().status("expired").build();
    }
}
```

---

## フロントエンド実装 (React)

```tsx
// apps/frontend-v3/src/pages/CliAuthPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';

export default function CliAuthPage() {
  const [searchParams] = useSearchParams();
  const [userCode, setUserCode] = useState(searchParams.get('code') || '');
  const [status, setStatus] = useState<'input' | 'confirm' | 'success' | 'error'>('input');
  const [session, setSession] = useState<any>(null);

  // URLにコードがある場合、自動で確認画面へ
  useEffect(() => {
    if (userCode) {
      verifyCode(userCode);
    }
  }, []);

  const verifyCode = async (code: string) => {
    try {
      const response = await api.get(`/api/auth/device/verify?code=${code}`);
      setSession(response.data);
      setStatus('confirm');
    } catch (error) {
      setStatus('error');
    }
  };

  const handleAuthorize = async () => {
    try {
      await api.post('/cli/auth/authorize', { userCode });
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };

  const handleDeny = async () => {
    await api.post('/cli/auth/deny', { userCode });
    window.close();
  };

  if (status === 'input') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl font-bold">Authorize mirel-cli</h1>
          <p>Enter the code shown in your terminal:</p>
          <input
            type="text"
            value={userCode}
            onChange={(e) => setUserCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="w-full border p-2"
            maxLength={9}
          />
          <button onClick={() => verifyCode(userCode)}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (status === 'confirm') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl font-bold">Authorize mirel-cli</h1>
          <p>Do you want to authorize <strong>mirel-cli</strong> to access your account?</p>
          <div className="flex gap-4">
            <button onClick={handleAuthorize} className="btn-primary">
              Authorize
            </button>
            <button onClick={handleDeny} className="btn-secondary">
              Deny
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl font-bold text-green-600">✓ Authorized</h1>
          <p>mirel-cli has been authorized successfully.</p>
          <p className="text-sm text-gray-500">You can close this window and return to your terminal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>Invalid or expired code. Please try again.</p>
      </div>
    </div>
  );
}
```

---

## セキュリティ考慮事項

### 1. レート制限

```java
// ポーリングのレート制限
@PostMapping("/token")
@RateLimiter(name = "deviceTokenPolling", fallbackMethod = "rateLimitFallback")
public DeviceTokenResponse pollForToken(@RequestBody TokenPollRequest request) {
    // ...
}

private DeviceTokenResponse rateLimitFallback(TokenPollRequest request, Throwable t) {
    throw new TooManyRequestsException("Too many polling requests. Please wait.");
}
```

### 2. ユーザーコードの複雑性

- 8文字のランダムコード
- 紛らわしい文字を除外（0/O, 1/I など）
- 有効期限: 15分

### 3. CSRF対策

ブラウザ側の承認処理でCSRFトークンを使用

---

## GitHub CLI の実装参考

GitHub CLI (`gh`) の実際の実装:

```bash
# ソースコード
https://github.com/cli/cli/blob/trunk/pkg/cmd/auth/login/login.go

# 使用例
$ gh auth login
? What account do you want to log into? GitHub.com
? What is your preferred protocol for Git operations? HTTPS
? Authenticate Git with your GitHub credentials? Yes
? How would you like to authenticate GitHub CLI? Login with a web browser

! First copy your one-time code: XXXX-XXXX
Press Enter to open github.com in your browser... 
✓ Authentication complete.
- gh config set -h github.com git_protocol https
✓ Configured git protocol
✓ Logged in as username
```

---

**作成日**: 2025年12月2日
