# GitHubバックアップ設定

このアプリでは、役割を分けて保存するのがおすすめです。

- GitHub: アプリ本体、クライアント別テンプレート、レイアウト調整の履歴
- Firebase: 企画文、登録素材、作成途中データなど日々の運用データ

## 1. GitHubにリポジトリを作る

GitHubで新しいリポジトリを作成します。

おすすめ設定:

- Repository name: `story-creative-studio` など
- Visibility: メンバーだけで使うなら `Private`
- README、.gitignore、license は追加しない

作成後、HTTPSのURLをコピーします。

```text
https://github.com/USER/REPO.git
```

## 2. このアプリとGitHubを接続する

プロジェクトフォルダで以下を実行します。

```bash
git remote add origin https://github.com/USER/REPO.git
```

初回だけ、現在のアプリをGitHubへ保存します。

```bash
git add -A
git commit -m "Initial story creative studio app"
git push -u origin main
```

## 3. 変更後にGitHubへ保存する

アプリやテンプレートを修正したあと、以下を実行します。

```bash
bash scripts/github-backup.sh "変更内容メモ"
```

例:

```bash
bash scripts/github-backup.sh "Add kanou dental template"
```

`package.json` のスクリプトから実行する場合:

```bash
npm run backup -- "Add kanou dental template"
```

## 4. Codexで運用する場合

Codexに作業を依頼したあと、最後に以下のように伝えると安全です。

```text
この変更をGitHubに保存して
```

毎回の作業完了時にGitHubへ保存しておけば、もしローカルの画面や素材が消えても、アプリ本体とテンプレートはGitHubから戻せます。

## 注意

`.env`、`.env.local`、Firebaseの秘密情報はGitHubに保存しない設定にしています。

登録した歯イラストや作成途中データは、GitHubではなくFirebase側に保存されます。
