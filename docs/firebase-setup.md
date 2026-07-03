# Firebase保存先の設定

このアプリはFirebase設定を入れると、下書きと歯イラスト素材をチーム共有の保存先に同期できます。設定がない場合は、今まで通りブラウザ内保存だけで動きます。

## 1. Firebaseプロジェクトを作成

Firebase Consoleで新規プロジェクトを作成します。

有効化する機能:

- Authentication
- Firestore Database
- Storage

Authenticationでは「匿名ログイン」を有効にしてください。メンバーごとのメールログインにしたい場合は、あとからEmail/PasswordやGoogleログインに切り替えられます。

## 2. Webアプリを追加

Firebaseプロジェクト内でWebアプリを追加し、表示される設定値を控えます。

必要な値:

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```

## 3. 環境変数を設定

ローカルでは `.env.local` を作成します。

```env
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
VITE_TEAM_ID=your-team-name
```

VercelやNetlifyに公開する場合は、同じ値を管理画面のEnvironment Variablesに登録してください。

## 4. 保存されるデータ

Firestore:

- `teams/{teamId}/clients/{clientKey}/drafts/current`
- `teams/{teamId}/clients/{clientKey}/artworks/{artworkId}`

Storage:

- `teams/{teamId}/clients/{clientKey}/artworks/{artworkId}.png`

## 5. セキュリティルール

まずは社内利用の簡易運用なら、ログイン済みユーザーだけ読み書き可能にします。

Firestore:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{teamId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Storage:

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /teams/{teamId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

将来的にクライアント別・メンバー別に権限を分ける場合は、`teamId` とユーザーUIDを紐づけたルールに変更します。

## 6. 動作確認

1. アプリを起動
2. 画面右上が「クラウド保存中」になることを確認
3. 歯イラストを登録
4. 別ブラウザ、または別PCで同じURLを開く
5. 同じクライアントを選んで、登録素材と下書きが表示されることを確認
