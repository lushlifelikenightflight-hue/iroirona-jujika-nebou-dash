# 寝坊ダッシュ 公開管理

Cloudflare版だけに公開期間を適用します。既存のGitHub Pagesとゲームの元素材は保持します。

管理画面は `/admin`。日本時間で開始・終了日時、公開状態、期間外のメッセージを設定できます。「今すぐ公開」は保存済みの終了日時まで、「今すぐ停止」は期間の途中でも配信を止めます。初期状態は非公開です。

## 配信の仕組み

- Workerが全リクエストを処理し、D1の現在の設定をプライマリから確認してから静的資産を配信します。開始時刻を含み、終了時刻を含みません。
- ページ・画像・音声・JavaScriptへの直接アクセスにも同じ制限を適用。配信レスポンスは `no-store`。DB障害時は503で拒否します。
- プレイ中は5秒以内ごとと終了時刻に公開状態を確認し、停止・期限終了時は終了画面へ移動してゲームと音声を終了します。ネットワーク障害でも継続させません。
- 管理画面のHTML、CSS、JavaScript、APIはすべてAccessで保護します。WorkerでもJWT署名・issuer・audience・有効期限・管理者メールを検証します。メールのヘッダーだけを信用しません。
- 設定変更は同じOriginからのJSONだけを受け付け、入力の長さ・日時を検証します。revisionが古いと409で拒否し、複数の画面による上書きを防ぎます。

ダウンロード済みのコピーや、保持するGitHub Pagesはこの制限の対象外です。

## 開発と検証

正本のこのフォルダーで `npm ci`。ローカルDBは `npx wrangler d1 migrations apply nebo-dash-publication-local --local --env local`。`npm run dev` で `http://127.0.0.1:8790/admin` を開きます。

ローカル検証だけは127.0.0.1／localhostとlocal環境の組み合わせでログインを省略します。本番ではこの設定を受け付けません。開発サーバーをインターネットに公開しないでください。

`npm test` で認証・期間境界・DB障害・終了監視を検証。`npm run typecheck` でWranglerが型を生成してTypeScriptを検査。サーバー起動中に `npm run test:integration` で実際のWorker／D1／静的資産を検証します。検証後は設定を元へ戻します。

`npm run build` は元のゲームのindex／style／src／assetsだけをdistへコピーし、Cloudflare版のindexに終了監視を追加します。元のゲームファイルは変更しません。distは再生成できます。

## 本番設定

初回設定では、専用D1を作成して `wrangler.jsonc` のdatabase_idへ反映し、remote migrationを適用します。DBは非公開で初期化されます。

Cloudflare Accessにこのゲーム用のアプリを作り、公開ホストの `/admin` とその配下だけを保護してください。本人の管理者メールだけを許可し、8時間のセッションを設定します。ゲーム全体をログイン必須にはしません。

AccessのチームURLとアプリAUDを設定します。管理者メールはWorkerの `ADMIN_EMAILS` に設定します。秘密値・個人設定はソースへ埋め込まず、Wranglerのsecretまたは無視対象の本番設定ファイルを使ってください。認証設定が未完なら管理画面は403を返します。

`npm run deploy` は本番設定を検査してから配信します。初回の非公開配置だけは、DBがenabled=0・日時なしであることを確認したうえでWranglerから配置しました。初回認証設定の進捗と配置URLはルートHANDOFF.mdに記録します。

復旧は前のWorkerバージョンへWrangler rollback。公開設定はコードと別のD1に保存されるため、rollbackだけで停止状態は変わりません。
