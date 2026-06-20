## 日付

2026-06-21
A案の成功版 app_A_stage.html は残したまま、
少し難しい版 app_A_stage_plus.html を新規作成。

A+版では mode を A_PLUS とし、
Spreadsheet上でA案と区別できるようにした。

A+版の追加問題：
10x - 9x → x
8x - 9x → -x

GitHub Pages版で動作確認済み。
Spreadsheetにも mode:A_PLUS で記録成功。
index.html に A+案リンクを追加し、
A/B/Cリンクが壊れていないことも確認済み。# 開発ログ：文字式アプリ スプレッドシート記録機能


## 日付

2026年6月11日

## 対象アプリ

中1数学 文字式アプリ
`apps/math/junior1/mojishiki/normal-basic-input/`

## 今日できたこと

Google Apps Script と Google スプレッドシートを使って、教材アプリの結果を記録できるようにした。

構成：

GitHub Pages の教材アプリ
↓
Google Apps Script
↓
Google スプレッドシート

## 記録できる項目

* timestamp
* studentId
* appId
* mode
* totalQuestions
* correctCount
* allCorrect
* wrongProblems
* device
* note

## 成功確認

### A案 `app_A_stage.html`

GitHub Pages版で記録成功。

確認できたこと：

* 全10問中10問正解 → `correctCount: 10`, `allCorrect: TRUE`
* 1問間違い → `correctCount: 9`, `allCorrect: FALSE`
* 2問間違い → `correctCount: 8`, `wrongProblems` に2問分が記録された
* 間違えた問題文が `wrongProblems` に記録されることを確認

### B案 `app_B_quick.html`

GitHub Pages版で記録成功。

確認できたこと：

* `mode: B` として記録される
* B案は5問出題なので `totalQuestions: 5` と記録される
* 複数の間違い問題が `wrongProblems` に `/` 区切りで記録される
* 全問不正解の場合も `correctCount: 0` と正しく記録されるように修正済み

## 重要な発見

最初は「正解数」や「全問正解か」だけが記録できると思っていたが、実際には `wrongProblems` に間違えた問題文も記録できた。

これは、次の授業で「どの型につまずいたか」を見る材料になる。

例：

* `-3(4x - 5)`
* `7x + 3 + 5x + 2`
* `3x × (-8)`

単なる点数記録ではなく、次に出す問題を決めるための観察ログになった。

## PM視点の評価

今回の成功は、教材アプリに「観察窓」がついたこと。

生徒の画面には余計な送信結果やエラーを出さず、解く快感を邪魔しないまま、先生側には結果が残る。

これは、今後の「生徒ごとに小さな教材アプリを作る」方針と相性がよい。

## 今後の候補

* `app_C_check.html` にも記録機能を移植する
* `device` 表示を将来的に `PC / iPhone / Android / iPad` くらいに短くする
* 全問正解時に「今の気持ちは？」を選ぶ機能を追加する
* 将来的に `wrongType` や `wrongCount` を追加する可能性あり

## 現時点ではまだやらないこと

* 細かいクリック履歴の記録
* 1問ごとの秒数記録
* ランキング
* 生徒ログイン機能
* 保護者画面
* 巨大な学習管理システム化

まずは、A案・B案の結果ログが安定して記録できることを成功地点とする。
