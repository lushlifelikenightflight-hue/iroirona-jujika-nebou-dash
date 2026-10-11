# 寝坊ダッシュの素材 v1.2

表示名：たかし・たける・ぽにて・べんぞー・きんぐ。提供された人物の衣装・髪型・顔を参照しています。

- assets/characters.png：同じ人物・衣装・ピクセル画風の基準。portrait.pngは提供集合絵、live.pngは既存ライブ絵。
- assets/sprites/run-*.png：左右各8コマ、5人で80。v1.1の走りを継続。
- assets/sprites/pedal-*.png：image_genで新規生成した、左右各8コマ、5人で80のペダル動作。膝・足・クランクと車輪が変化。人物ごとに同じ倍率で抽出し、車輪の地面への接触点をアンカーとして揃える。
- assets/sprites/crouch.png：5人の右・左しゃがみ10枚。自然に膝を曲げた新規画像。
- 全セル160×144、アンカー80×136。run/pedalは4×4、crouchは5×2。manifest.jsonに順序・ハッシュ・身体高CV。
- sources/spritesに採用原画6枚を追加、prompts-v12.jsonに実際のプロンプト。組み込みimage_genの透過画像を使用。tools/pack-actions.mjsとsprite-pack-utils.mjsは抽出・縮尺・配置のみ。生成された絵をコードで代用していません。
- 元の立ち／静止一輪車の左右アトラスも復旧用に保持。ゲームの一輪車表示はペダル画像へ置き換え。
- assets/artのSVGは既存の背景・敵・アイテム・能力。

BGMは導入済みローカル音声工房／ACE-Step 1.5 Turbo（8 steps）で8曲を新規生成。固定seed111200〜111207、歌なし、30秒指定、仕上げ後29.65秒。音量・低音／圧縮・ループを処理し、160kbps MP3へ書き出し。−16.00〜−16.59 LUFS、ピーク−1.51〜−4.97 dBTP。title、stage-1〜5、live、taxiの8曲。bgm-provenance.jsonにプロンプトと生成ID・測定結果。

SFX13種はローカル音声工房のプリセット合成を実行し、音量・厚みを仕上げ。jump、land、dark、fire、lightning、ice、beam、hit、kill、join、unicycle、clear、crouch。44.1kHz／16bit／mono WAV。sfx-provenance.jsonに生成ID・プリセット・設定と測定結果。SFXはプリセット合成で、BGMのAI推論とは生成方式が異なります。

再生成はtools/generate-bgm.mjs、generate-sfx.mjs。音声工房を起動して実行し、再開IDはwork/audio-v12-jobsへ保持。ゲームのBGMはHTMLAudio、SFXはWebAudioで、タップで両方を有効化。元音・完成WAV・設定は音声工房libraryに保持。v1.1の音源はGit履歴に保持。

提供素材の権利は各権利者に帰属し、人物画像に対する再配布ライセンスは付与していません。
