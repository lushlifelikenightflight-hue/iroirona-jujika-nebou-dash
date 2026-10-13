# 寝坊ダッシュ：開発・公開状態

- 状態：v1.9.3をCloudflareとGitHub Pagesへ公開済み。各面を少し延長しギミックを広範囲へ適用、実装／検証／公開を完了。最初の読み込み進捗％とバーも追加済み。正本F:\Projects\色々な十字架_寝坊ダッシュ。既存フォルダーとリポジトリ名を維持。
- Cloudflare：https://nebo-dash-publication.bug-plus-opening.workers.dev/?v=1.9.3 。GitHub：https://lushlifelikenightflight-hue.github.io/iroirona-jujika-nebou-dash/?v=1.9.3 。管理画面はCloudflareの/admin。
- 検証・配信ソース8c50b205d1b745c0baae97de7bf29f1d54f8a030。Pages CI38200707974成功。Worker 56589c9b-8cf0-4d71-b139-defbdc008ec9。後続の記録変更は公開ゲームを変更しない。
- 公開日時：2026/10/12 0:00〜10/13 0:00 JST、startsAt1791730800000、endsAt1791817200000を保持。GitHub Pagesは期間制限対象外。

## アクセス集計（2026/10/13）
- b9a4f99で管理画面へ累計／今日／直近30日日別PV追加。/と/index.htmlのGETのみ、200ゲームと期間外拒否を別計測。再訪・通常ボット・検証GETを含む表示数。HEAD・先読み・資産・管理・API除外、IP保存なし、GitHub Pages対象外。
- D1 0003適用済み、atomic upsert＋開始日時、ctx.waitUntil保存失敗は表示を止めない。認証必須GET /admin/api/analytics。更新時の未保存設定保持。Worker d4eb80c7-7de6-44bc-b788-7e647104d373へ配信。
- Cloudflare24／型／ローカルWorker12／ブラウザー日別集計と入力保持合格。本番root410／匿名analytics403／素材410、D1期間外1件（検証GET）記録、日時revision1保持確認。期限は終了中、資格情報維持。
- 過去ログ：本人のChrome再ログイン後に10/12のHTTPS GET /・/index.html・HTTP200を1,932件確認。0004でaccess_dailyの10/12へ取り込み済み。access_importsで根拠・条件・日時を保持、INSERT OR IGNOREで再実行重複防止、集計開始1791730800000。未記録・先読み等の差異は未検証。API OAuth権限は変更なし。
- outputsにアクセス集計案内／ローカル画面／本番確認。Cのwork/v194に補助。rollbackコード25f711e、Worker56589c9b-8cf0-4d71-b139-defbdc008ec9。追加テーブル／日時／認証は保持する。

## 公開アクセス表示（2026/10/13）
- Cloudflareのゲーム全画面上部と期間外画面へ表示。GET /api/access-countは合計・ゲーム／期間外・開始日時だけ公開、管理認証は維持。counter mjs/cssだけ期間外にも配信、ゲーム資産410維持。10/12の保存ログ1,932件と10/13以降を合算。
- 30秒／表示復帰・onlineで更新、失敗は直前値保持、未取得は取得不可。GitHubゲーム本体v1.9.3は変更せずCloudflare buildで注入。0004適用、公開日時・認証維持。
- Worker2c4b1775-1e3e-4667-b2d9-f2ac2e406f5b配信。Cloudflare27／型／ローカル12／ブラウザータイトル・プレイ・終了／本番終了表示合格。公開集計とcounter2資産SHA一致、ゲーム410・管理403・期限維持。
- outputsにアクセス表示_本番終了画面.png／本番確認JSON／ゲーム検証PNG／案内。Cのwork/v195に補助、ローカル設定復元済み。rollback cf2e005／Worker d4eb80c7-7de6-44bc-b788-7e647104d373。

- 最新Worker7958e9b6-689f-47fc-a185-82b05711d787。28試験合格、本番ゲーム表示1,932／期間外12／10/12日別1932と期間保持をブラウザー・D1・APIで確認。rollback表示は78311c6／Worker2c4b1775-1e3e-4667-b2d9-f2ac2e406f5b。データはコードrollback後も合算維持。Cのwork/v196に検証補助、outputsに合算確認・画面・案内。

## 音声切り替え（v1.9.3）
- 音声開始専用の「音を聴く」と初期ON表示を、共通ON／OFF処理へ変更。タイトル／ポーズ／HUDが現在状態を表示。OFFはMediaをpauseしmaster gainを0、SFX新規再生も抑止。
- cross-nebou-mutedに設定保存。ゲーム開始／再開／タイトル／再読み込み後もOFF維持。破損したゲーム保存データにミュート設定を巻き込まない。OFFでの新規開始は不要な音声起動を行わない。
- starting／failedとactivationIdで準備中・失敗・古い非同期完了を区別。準備中でもOFF可能、古い完了で新しいON／OFFを上書きしない。再生失敗をONと表示しない。ボタン名は「音声をONにする／OFFにする」。音声ボタン44px以上。
- 今回ゲーム78／素材61／音声DOM17／画面進行DOM回帰23が合格。音源・ステージ内容・公開制御・認証は保持。公開35ファイルSHA一致、期間保持、匿名管理API403。Node試験はtests/audio-toggle.test.mjs。
- ブラウザー接続は一覧が空。実端末のタップ／スピーカー未確認。DOMのMedia／Context代替を実際の再生検証と混同しない。tests/audio-toggle.htmlで接続復帰後に実再生と表示を確認する。

## 画面進行修正（v1.9.2の継続仕様）
- 原因再現：初回許可後の一時通信失敗で直ちに画面を閉じる。BGM.playの同期例外でmodeだけintroに変わりクリア表示が残る。非プレイ時もSpaceをpreventDefaultしてボタン入力を奪う。実ユーザー端末のログは取得できず、同じコードで停止ケースを再現して修正。
- 次面はmode clearから1回だけ進む。音声jobをcatchし、音声の同期エラー／拒否／resume待機が画面移動を止めない。非プレイ時のゲームキーをpreventしない。クリア後の離脱・復帰も確認。
- 公開制御：一時失敗は既に確認済みの期限まで再試行、5秒ごと＋online／画面復帰で再確認。再接続の案内はpointer-events:noneで操作を覆わない。独立した期限タイマーにより通信確認が応答しなくても停止、終了後の遅いレスポンスで再開しない。未確認の初回失敗は従来どおり閉じる。サーバーのallowed:falseは即座に閉じる。期限・認証・Worker設定は変更なし。
- v1.9.2時にゲーム74／公開制御21／素材61／型／buildが合格。DOM環境で実main.mjsを動かす画面遷移23ケースが合格、5面の次画面・通信断・音声エラー・連打・離脱復帰・期限停止を確認。本番35ファイルSHA一致、期間保持、匿名管理API403。
- ブラウザー操作への接続がなく、実ブラウザーでの表示／タップ／音声再確認は未実施。Cuaの一覧は空。DOM検証と混同しない。tests/transitions.htmlは接続復帰後の再確認用、tests/transitions.test.mjsとcloudflare/tests/client-connection.test.mjsはCIに含む。

## 読み込み表示（v1.9.1の継続仕様）
- 0〜100％＋progressバー。画像37＋manifest1＋音源23＝61素材の成功完了数を集計、全完了後にタイトル。renderer.load／audio.preloadの任意コールバックで集計、失敗素材を完了に数えない。
- tests/loading.test.mjsで進捗の途中更新／manifest解析完了／全素材通知／失敗時に100％にならないことを検証。検証用サーバーの音源待ち／DOM観測はCのwork/loading-preview-server.mjsのみで本番には配信しない。

## 地形と検証
- 全5面と家・隠し経路・一輪車・敵数・720秒は維持。地形仕様と検証の詳細はREADMEとtests/update-v19.htmlを参照。

## 継続仕様・認証
- たかし／たける／ぽにて／べんぞー／きんぐ、5面、走り・ペダル・しゃがみ歩き、スティック、しゃがむ上の単一交代ボタン、長押しメニュー、退出3秒保護、隠し家、バネ／滑り台、人数別結末、縦長5人ライブ、BGM8／SFX15を維持。
- 光は前後斜め上下4本、1発射1敵へのダメージ1回、水平420／幅64／再使用0.45／寿命0.6。氷は前方85／130×150／寿命2／再使用1.2、移動・向き・ジャンプ・しゃがみ・交代後も追従。ボス得点2500をtoast／HUD／結果で共用。
- 3〜5面の終盤に飛行射撃、0.45秒予兆、弾速180/205/230、射撃間隔3/2.6/2.2。1/2面は接触。敵数7/9/12/15/19。走り原画sources/sprites/v16、再処理tools/pack-run-v16.mjsを保持。左右80コマ、走行距離に比例する時計、通常18fps相当、0〜3px浮沈。
- Cloudflare専用コード・依存cloudflare/。Worker nebo-dash-publication。D1 nebo-dash-publication / d852492f-d36c-42e0-8f6d-675aa6252f9a。カード不要AUTH_MODE=password。管理者本人登録済み。秘密／パスワードをチャットやGitに保存しない。
- Zero Trust契約未確定、Access組織／アプリ未作成。Wrangler OAuthは既存アカウントへ接続済み。0002_admin_password.sql適用済み。初回鍵256ビット・24時間・1回、PBKDF2-SHA256100,000回＋salt＋pepper、8h Secure/HttpOnly/SameSiteStrict CookieとD1失効管理。
- 試行制限15分ごとIP6／全体50。変更API同一Origin JSON／8192B。ADMIN_AUTH_SECRET復旧コピーcloudflare/work/private/admin-auth-secret.jsonはGit無視で保持。pepperを変更しない。資格情報再設定は本人依頼のみ、新パスワードは本人が入力する。
- 全資産run_worker_first、D1 first-primary、開始<=現在<終了、no-store、DB障害503。プレイ中5秒＋独立期限タイマー。通信失敗は直前に確認した期限まで再試行、期限を勝手に延長しない。管理UIはJST日時・ON/OFF・即時公開／停止・期間外文・revision競合検知。今回認証コード／設定変更なし。
- 既存認証検証：ユニット15／型／隔離Worker認証10＋期間12／本番匿名10合格、本人の登録と設定保存確認済み。ローカル試験設定は本番へ持ち込まない。

## 保存・復旧・次の作業
- 起動：正本npm start→127.0.0.1:4186。検証npm test／npm run check、ブラウザーtests/update-v19.html（今回）／tests/browser.html（既存）。Cloudflareはnpm ci／npm test／npm run typecheck／npm run test:auth。buildとpreflight後wrangler deploy --env=。認証／設定コードは今回変更なし。
- outputsにv1.9.3更新案内／音声DOM17／遷移回帰23／公開SHA照合／整理記録。v1.9.2原因再現と更新案内も保持。v1.9.1読み込み画像と観測記録も保持。v1.9の操作28／描画／地形プレビューも保持。C:\Users\lushl\Documents\Codex\2026-10-11\new-chat-2\outputs。入口は成果物案内.md。旧成果物保持。
- 最新整理：dist86ファイル17,923,190Bを正本SHA一致確認後削除。cloudflare/npm run buildで復旧。ローカル8790サーバーと今回の検証タブ終了、設定復元済み。素材・原画・音源・依存・秘密・ローカルDB・Cのwork/v195検証補助を保持。
- work/v193に音声検証／修正補助、work/v192に原因再現／DOM検証補助とjsdomの検証環境を保持。過去work/v191およびworkの読み込み検証／修正補助は再開用に保持。過去のwork/v16/v17/v18/v19も保持。コピーは正本より古い場合があるため正本へ上書きしない。
- rollback：改修前ソース5bc79c1、Worker16195304-246c-4ce8-8178-e7c8711d99ad。D1日時と資格情報はコードrollbackとは別に保持。
- 次：アクセス集計とゲーム／終了画面表示の公開は完了。次はブラウザー接続復帰後にtests/audio-toggle.htmlとtests/transitions.htmlで実タップと音声を再確認する。期間変更は本人依頼時のみ。次の変更はこの記録と正本を照合し、ユーザー保存データ／無関係な素材を保持。
