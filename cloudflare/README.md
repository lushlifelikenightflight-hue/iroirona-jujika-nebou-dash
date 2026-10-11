# 寝坊ダッシュ 公開管理

Cloudflare版だけに公開期間を適用します。既存のGitHub Pagesとゲームの元素材は保持します。

管理画面は `/admin`。日本時間で開始・終了日時、公開状態、期間外のメッセージを設定できます。「今すぐ公開」は保存済みの終了日時まで、「今すぐ停止」は期間の途中でも配信を止めます。初期状態は非公開です。

## 配信の仕組み

- Workerが全リクエストを処理し、D1の現在の設定をプライマリから確認してから静的資産を配信します。開始時刻を含み、終了時刻を含みません。
- ページ・画像・音声・JavaScriptへの直接アクセスにも同じ制限を適用。配信レスポンスは `no-store`。DB障害時は503で拒否します。
- プレイ中は5秒以内ごとと終了時刻に公開状態を確認し、停止・期限終了時は終了画面へ移動してゲームと音声を終了します。ネットワーク障害でも継続させません。
- 管理画面のHTML、CSS、JavaScript、APIはパスワードとD1のセッションで保護します。ログイン／初回登録画面だけは認証前に表示します。セッションは無作為の256ビット値で、DBにはダイジェストだけを保存。CookieはSecure、HttpOnly、SameSite=Strict、8時間で失効します。ログアウトはDB側でも失効させます。
- パスワードは16〜256文字。Cloudflareの秘密設定のpepperでHMACし、無作為のsaltとPBKDF2-SHA256（100,000回）で保存します。平文をDBや公開ソースへ保存しません。ログイン／登録は15分の固定窓ごとにIP単位6回、全体50回までに制限します。
- 設定変更は同じOriginからのJSONだけを受け付け、入力の長さ・日時を検証します。revisionが古いと409で拒否し、複数の画面による上書きを防ぎます。

ダウンロード済みのコピーや、保持するGitHub Pagesはこの制限の対象外です。

## 開発と検証

正本のこのフォルダーで `npm ci`。ローカルDBは `npx wrangler d1 migrations apply nebo-dash-publication-local --local --env local`。`npm run dev` で `http://127.0.0.1:8790/admin` を開きます。

ローカル検証だけは127.0.0.1／localhostとlocal環境の組み合わせでログインを省略します。本番ではこの設定を受け付けません。開発サーバーをインターネットに公開しないでください。

`npm test` で認証・期間境界・DB障害・終了監視を検証。`npm run typecheck` でWranglerが型を生成してTypeScriptを検査。サーバー起動中に `npm run test:integration` で実際のWorker／D1／静的資産を検証します。検証後は設定を元へ戻します。

`npm run test:auth` は8791ポートを使い、毎回新しいダミーDB／秘密設定で初回登録・ログイン・ログアウト・試行制限と公開期間の計22項目を検証します。本番の資格情報を使いません。サーバーは終了時に停止します。検証用状態は無視対象のwork/auth-qa-*に残ります。

`npm run build` は元のゲームのindex／style／src／assetsだけをdistへコピーし、Cloudflare版のindexに終了監視を追加します。元のゲームファイルは変更しません。distは再生成できます。

## 本番設定

初回設定では、専用D1を作成して `wrangler.jsonc` のdatabase_idへ反映し、remote migrationを適用します。DBは非公開で初期化されます。

管理URLは https://nebo-dash-publication.bug-plus-opening.workers.dev/admin 。Zero Trust／Accessの契約やカード登録は使いません。AUTH_MODEはpasswordです。ゲームは公開期間中だけログインなしで遊べます。

ADMIN_AUTH_SECRETはJSON形式の秘密設定で、無作為の64桁のtoken、無作為の64桁のpepper、登録期限expiresAt（ミリ秒）を保持します。Wranglerのsecretで登録し、コードやGitへ埋め込みません。今回の秘密設定ファイルは無視対象のwork/private/に保存しています。pepperを変更すると既存パスワードは使えなくなるため、登録後は保持してください。

本人が初回登録用の鍵と新しいパスワードを専用画面で入力して登録します。鍵は24時間以内かつ管理者未登録の場合だけ使え、登録完了後の再利用・上書きは拒否します。初回登録前も、鍵がない人は管理者になれません。期限切れ時はpepperを維持してtokenとexpiresAtだけを再発行します。パスワードを忘れた場合は、Cloudflare管理権限を持つ本人の依頼で資格情報とセッションだけを再設定します。公開期間は別テーブルなので保持できます。

`npm run deploy` は本番設定を検査してから配信します。秘密設定とremote migrationを先に適用してください。認証とゲーム公開は独立し、配信だけではゲームの公開を有効にしません。進捗とWorkerのバージョンはルートHANDOFF.mdに記録します。

復旧は前のWorkerバージョンへWrangler rollback。公開設定はコードと別のD1に保存されるため、rollbackだけで停止状態は変わりません。
