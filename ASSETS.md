# 寝坊ダッシュの素材 v1.6

表示名：たかし・たける・ぽにて・べんぞー・きんぐ。提供された人物の衣装・髪型・顔を参照しています。

- assets/characters.png：同じ人物・衣装・ピクセル画風の基準。portrait.pngは提供集合絵、live.pngは既存ライブ絵。
- assets/sprites/run-*.png：v1.6で5人を新しく生成。右向き8コマから決定的に左向きを反転し、合計80コマ。脚が開く接地、膝の通過、蹴り出しの連続動作。18fps相当で移動速度に追随し、走りの浮き沈みは0〜3px。
- assets/sprites/pedal-*.png：image_genで新規生成した、左右各8コマ、5人で80のペダル動作。膝・足・クランクと車輪が変化。人物ごとに同じ倍率で抽出し、車輪の地面への接触点をアンカーとして揃える。
- assets/sprites/crouch.png：5人の右・左しゃがみ10枚。自然に膝を曲げた新規画像。
- 全セル160×144、アンカー80×136。run/pedalは4×4、crouchは5×2。manifest.jsonに順序・ハッシュ・身体高CV。
- sources/spritesに採用原画6枚を追加、prompts-v12.jsonに実際のプロンプト。組み込みimage_genの透過画像を使用。tools/pack-actions.mjsとsprite-pack-utils.mjsは抽出・縮尺・配置のみ。生成された絵をコードで代用していません。
- 元の立ち／静止一輪車の左右アトラスも復旧用に保持。ゲームの一輪車表示はペダル画像へ置き換え。
- assets/artのSVGは既存の背景・敵・アイテム・能力。

BGMは導入済みローカル音声工房／ACE-Step 1.5 Turbo（8 steps）で8曲を新規生成。固定seed111200〜111207、歌なし、30秒指定、仕上げ後29.65秒。音量・低音／圧縮・ループを処理し、160kbps MP3へ書き出し。−16.00〜−16.59 LUFS、ピーク−1.51〜−4.97 dBTP。title、stage-1〜5、live、taxiの8曲。bgm-provenance.jsonにプロンプトと生成ID・測定結果。

SFX15種はローカル音声工房のプリセット合成を実行し、音量・厚みを仕上げ。jump、land、dark、fire、lightning、ice、beam、hit、kill、join、unicycle、clear、crouch。44.1kHz／16bit／mono WAV。sfx-provenance.jsonに生成ID・プリセット・設定と測定結果。SFXはプリセット合成で、BGMのAI推論とは生成方式が異なります。

再生成はtools/generate-bgm.mjs、generate-sfx.mjs。音声工房を起動して実行し、再開IDはwork/audio-v12-jobsへ保持。ゲームのBGMはHTMLAudio、SFXはWebAudioで、タップで両方を有効化。元音・完成WAV・設定は音声工房libraryに保持。v1.1の音源はGit履歴に保持。

提供素材の権利は各権利者に帰属し、人物画像に対する再配布ライセンスは付与していません。

v1.3：既存のSVG画風に合わせたspring.svg／slide.svg／room-door.svgを追加。バネ・滑走の2効果音を音声工房のconfirm／slashプリセットで生成、仕上げ、44.1kHz PCMへ出力。元音と設定は音声工房library、再開IDはwork/audio-v13-jobs。再生成はtools/generate-gimmick-sfx.mjs。

v1.4：assets/live.pngを参照し、組み込みimagegenで縦長の5人ライブ絵assets/live-portrait.pngを生成。人物と楽器を前後3段に配置。顔・髪型・衣装・ピクセル画風を確認。縦画面は新画像、横画面は既存画像を使用し、object-fit:containで切り抜きなし。制作記録はsources/live-portrait.json。

v1.6：参照は採用済みassets/sprites/idle-right.pngの各人物。5枚の原画、実際のプロンプトと参照記録はsources/sprites/v16/へ保存。組み込みimagegenを使用し、立ち・しゃがみ・ペダル素材は保持。tools/pack-run-v16.mjsは透明度の清掃、抽出、足元／骨盤の整列、共通倍率、反転、アトラス化だけを処理。体高は104px、縮尺CV0.004〜0.011、左右16コマは人物ごとに異なるハッシュ。出力の透明余白と切れを検証し、原画から同じPNGを再現することをSHA256で確認。旧走り素材はGitのea16880以前と旧原画に保持。
