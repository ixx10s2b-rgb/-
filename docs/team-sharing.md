# メンバー全員で使うための公開手順

このアプリはFirebase Hostingに公開すると、メンバー全員が同じURLから利用できます。Firebase保存設定も入れると、下書き、登録した歯イラスト、クライアントごとの作業状態を共有できます。

## 全体像

```text
GitHub
  ↓ mainに反映
GitHub Actions
  ↓ 自動ビルド
Firebase Hosting
  ↓ URL共有
メンバー全員がブラウザで利用
```

保存データはFirebaseのFirestoreとStorageに入ります。アプリ本体はGitHubに保存され、公開URLはFirebase Hostingから配信されます。

## 1. Firebaseで有効化するもの

Firebase Consoleで以下を有効にします。

- Authentication
- Firestore Database
- Storage
- Hosting

Authenticationはまず匿名ログインで運用できます。メンバー別に権限を分けたい場合は、あとからGoogleログインやメールログインに変更できます。

## 2. GitHubに登録するSecrets

GitHubのリポジトリで `Settings` → `Secrets and variables` → `Actions` を開き、以下を登録します。

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT
VITE_FIREBASE_CONFIG
VITE_TEAM_ID
```

`VITE_FIREBASE_CONFIG` はFirebase Webアプリ設定を1行のJSONで入れます。

```json
{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
```

`VITE_TEAM_ID` はチーム共有の保存場所名です。例:

```text
story-team
```

## 3. Firebase Service Accountの作り方

Firebase Consoleで `Project settings` → `Service accounts` を開きます。

1. `Generate new private key` を押します
2. JSONファイルをダウンロードします
3. JSONの中身をすべてコピーします
4. GitHub Secretsの `FIREBASE_SERVICE_ACCOUNT` に貼り付けます

## 4. 初回公開

設定後、GitHubの `Actions` → `Firebase Hosting Deploy` を開き、`Run workflow` を押します。

成功するとFirebase HostingのURLが発行されます。そのURLをメンバーに共有してください。

## 5. 以後の更新

アプリを修正したら、GitHubへ反映します。

```bash
npm run backup "変更内容"
```

`main` に反映されると、GitHub Actionsが自動でビルドしてFirebase Hostingへ公開します。

## 6. メンバーへの案内文

共有するときは、以下のように送れます。

```text
ストーリーズ作成アプリはこちらです。
URL: https://xxxxx.web.app

ChromeまたはSafariで開いてください。
よく使う場合は、ブラウザメニューから「アプリをインストール」または「ホーム画面に追加」をすると便利です。
```

## 7. クライアントを増やすとき

クライアント追加はアプリのコードにテンプレートを追加して、GitHubへ反映します。公開後はメンバー全員の画面に新しいクライアントが表示されます。

詳しい追加手順は `docs/client-template-guide.md` を見てください。
