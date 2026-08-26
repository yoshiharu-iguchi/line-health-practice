# LINE体調報告アプリ（練習用）

## 目的

HTML、CSS、JavaScriptを使って、学生の体調報告と教員の確認作業を学ぶための試作です。
実在する氏名・連絡先・体調情報は入力しません。

## 開き方

ローカルサーバーを起動して、ブラウザで `http://localhost:3000` を開きます。

```bash
cd "/Users/iguchi/Documents/ChatGPT/New project/line-health-practice"
node server.js
```

停止するときは、ターミナルで `Control + C` を押します。

## ファイルの役割

- `index.html`：画面の構造
- `style.css`：画面の見た目
- `app.js`：ボタンなどの動き
- `server.js`：ローカルサーバーと練習用API
- `db.js`：匿名練習報告をSQLiteへ保存・取得する処理
- `data/line-health-practice.sqlite`：匿名練習データの保存先（GitHubへは送らない）
- `.gitignore`：Gitに保存しない対象の設定

## 匿名練習データの保存

サーバー側の匿名練習報告は、PC内の `data/line-health-practice.sqlite` に保存されます。そのため、サーバーを再起動しても練習報告は残ります。

このSQLiteファイルは `.gitignore` によりGitHubへ送られません。実在する氏名・連絡先・体調情報は入力しません。

## 今後の予定

1. 匿名練習データを使って、ブラウザ・サーバー・SQLiteの流れを学ぶ
2. 教員用の認証と権限管理を設計する
3. 本番運用のルールを確認してから、LINE連携を検討する
