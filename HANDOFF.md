# 寝坊ダッシュ：Cloudflare公開管理
- 状態：期間管理を実装・検証し、Cloudflareへ非公開で配置。Access組織の作成はユーザーが明示承認済み。接続トークンにAccess権限がないため追加認証待ち。認証設定が未完なので本番/adminは403。GitHub Pagesは保持。
- 正本：F:\Projects\色々な十字架_寝坊ダッシュ。ゲームv1.5.1。Cloudflare専用コード・設定・依存はcloudflare/。古いフォルダー／素材は移動しない。
- GitHub：https://github.com/lushlifelikenightflight-hue/iroirona-jujika-nebou-dash 。Pages：https://lushlifelikenightflight-hue.github.io/iroirona-jujika-nebou-dash/?v=1.5.1 。index/style/src/assetsと既存Pagesワークフローを今回変更していない。
- Cloudflare：https://nebo-dash-publication.bug-plus-opening.workers.dev 。本番D1：nebo-dash-publication / d852492f-d36c-42e0-8f6d-675aa6252f9a。初期enabled=0・日時なし。Worker version ad2e2f73-c2a4-49de-9ccd-32d780549ff5。
- 管理UI：/admin。日本時間で開始／終了、公開ON/OFF、期間外のメッセージ。保存済み終了日時まで今すぐ公開／即時停止。公開状態を10秒ごとに更新。保存中は入力を止め、revisionで別画面の更新を検知。
- 配信：全資産run_worker_first。D1 first-primaryで現状を確認。開始<=現在<終了のみ配信。ページ・画像・音声・JSの直接アクセスも拒否。no-store、DB障害は503。初期は非公開。
- プレイ中：Cloudflareパッケージだけにpublication-guard.mjsを追加。5秒ごとと期限にサーバーへ再確認して終了画面へ移動。通信不能でも停止。ブラウザのタイマーはラップして呼び出し、壁時計変更に依存せずperformanceで期限を計算。
- 認証：/admin以下のHTML/CSS/JS/APIすべてでAccess JWT署名・issuer・aud・exp・管理者メールを確認。ヘッダーのメールだけは拒否。変更APIは同一Origin JSON、8192B上限、日時と文字数検証。ローカル省略はlocal環境+localhostのみ。
- 本番認証の未設定：ACCESS_TEAM_DOMAIN / ACCESS_AUD / ADMIN_EMAILS。Cloudflare CLIは既存アカウントに接続済みだがAccess未有効。GET organizationsは403、appsはnot_enabled。
- 承認：ユーザーが「進めてよい」と明示承認。名前「寝坊ダッシュ 公開管理」、本人だけ、8h、/adminだけ、課金契約なし。組織POSTを再実行したがCloudflare APIが401 Authentication errorで拒否。作成されていない。自動承認審査による拒否ではなく、既存OAuthにAccess権限がないため。
- ブラウザ：ユーザーはスマホでCloudflareへGitHubログイン済み。PCのセッションには共有されない。Codex内とChromeではGitHubログインが必要だった。重複する未入力のログイン用タブは閉じた。パスワードをチャットへ要求しない。
- 検証：ゲーム44件、Cloudflare11件、TypeScript／Wrangler型生成合格。実ローカルWorker12項目：初期／予約／公開／停止／再公開／期限終了／資産拒否／CSRF拒否／競合409。設定は戻す。
- ブラウザ：管理UIで期間保存→ゲーム開始・移動・能力→即時停止→プレイ中終了。別途、実際の終了時刻までゲームを起動して自動終了を確認。390×844で入力／ボタンのはみ出しなし。新しい警告／エラーなし。
- 本番：7項目でclosed・ページ403・画像403・JS403・admin403・encoded admin403・no-storeを確認。公開ゲームへのアクセスはまだ有効化していない。管理者本人の本番ログインと期間変更は未検証。
- 起動：ゲームnpm start。Cloudflareはcloudflare/でnpm ci、local migration後npm run dev（127.0.0.1:8790/admin）。検証npm test / npm run typecheck、サーバー中npm run test:integration。npm run buildは元ゲームを保持してdistに80配信ファイルを作る。
- 配信：npm run deployは本番設定不足なら止まる。初回bootstrapだけ、DBがenabled=0であることを確認してWranglerから非公開配置した。新CI cloudflare-test.ymlはテストだけ。
- ゲーム継続：たかし／たける／ぽにて／べんぞー／きんぐ。全5面、闇／炎／雷／氷／光、走り・ペダル・しゃがみ、スティック、長押しメニュー、退出保護3秒、隠し家、バネ／滑り台、人数別結末、全員縦長ライブ絵、BGM8／SFX15。
- v1.5.1：タイトル5人を幅に合わせ左右12px余白、横画面は高さ94%。公開commit7c74ad4379221c302deb9d9edb0543a1090bae72、記録HEAD9a65df6b0bebfd35fa4c25407beee9a80cd7dc38。HTML/CSS公開SHA256一致。
- 限界：スマホ実機のタッチ／スピーカーは未検証。ダウンロード済みコピーと保持するGitHub PagesはCloudflareの制限対象外。
- 記録：チャットoutputsの公開管理プレビュー／スマホ画像／期限終了画像／Cloudflare配信検証JSON／成果物案内。依存と元素材は保持。
- 復旧：ゲームは直前HEAD9a65df6b0bebfd35fa4c25407beee9a80cd7dc38。CloudflareはWrangler rollback。D1の公開設定はコードrollbackとは別で保持される。
- 次：1)ユーザーからAccess設定用APIトークンのファイルを受け取る。2)既存組織の有無を確認し、なければ承認済みの組織を作成。3)本人だけのAccessアプリを/adminと配下に設定、vars反映、型確認・配信。4)本番ログイン→保存→期間制御を検証し、非公開初期状態を保つ。
- 保存・CI：source commit af28ada67c531f0045a5d8303e5826e526d28254。ゲームCI38144111983、Cloudflare CI38144111976が成功。認証設定後は本番管理者ログインを検証する。
- 整理：サーバー99612を停止。dist全80ファイルを正本とSHA256照合し、distとwork/dry-runの計18,549,841Bを削除。記録はチャットoutputsとcloudflare/work/cleanup-record.json。npm run buildで再生成。依存・ローカルD1・Cの小さな再開用補助ファイルを保持。

- 追加確認：Wrangler whoamiは成功、ゲーム配信のOAuthは有効。login --scopes-listにもAccess設定の権限がなく、Wranglerの再ログインでは解決しない。必要なのはAccount限定のAccess: Organizations, Identity Providers, and Groups Edit／Access: Apps and Policies Edit。期限1日程度の専用トークンをスマホで作成する手順をoutputsへ保存。
- API補助：本チャットwork/cf-access-enable.mjsはトークンファイルのパスを引数に取り、値を出力しない。まずGET組織、未存在だけPOST作成。秘密は公開ソース／成果物へ埋め込まない。

- 認証更新後にもAPIのGETで組織403 Authentication error、apps403 not_enabledを確認。権限不足／Access未有効が残っている。本番/adminは閉じたまま。ユーザー向け手順はoutputs/Cloudflare_認証設定を進めるための手順.md。
