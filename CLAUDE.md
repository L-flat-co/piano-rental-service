# CLAUDE.md — ピアノレンタル管理システム 運用ルール

## ⚠️ 仕様書の参照先（最重要）

**このプロジェクトの仕様書は必ず以下を参照すること：**

```
/Users/kosuke/Desktop/piano-rental-service/ピアノレンタル管理システム_仕様書_v1.3.docx
```

- `~/.claude/plans/SPEC.md` は**別プロジェクト（音楽教室予約システム）の仕様書**であり、このプロジェクトには無関係
- セッション中に仕様を確認する場合は、必ず上記 docx ファイルを読むこと

---

## 毎セッション開始時に必ず読むファイル
1. `CHANGELOG.md` — 変更・仕様履歴
2. `TODO.md` — タスク状況
3. `CONVERSATION_LOG.md` — 過去の会話・決定事項
4. `ピアノレンタル管理システム_仕様書_v1.3.docx` — システム仕様書（最新・必読）

## 必須ルール

### 1. 実装前に計画を確認する
- コードに触れる前に変更方針を日本語で説明し、承認を得る
- EnterPlanMode を使って計画を立ててから進める
- ユーザーが「ok」「進めて」など明示的に承認した後に実装する

### 2. 完了後は必ず記録する
- 機能追加・変更・設計決定後は `CHANGELOG.md` の末尾に追記
- TODO の完了タスクは `TODO.md` でステータスを `[x]` に更新
- 重要な会話・決定事項は `CONVERSATION_LOG.md` に追記

### 3. 仕様変更は仕様書と同期する
- 仕様変更が確定したら `CONVERSATION_LOG.md` に記録
- 必要に応じてユーザーに仕様書（docx）の更新を促す

## プロジェクト情報

- **場所:** `/Users/kosuke/Desktop/piano-rental-service/`
- **参照プロジェクト:** `~/Desktop/music-room-booking`（同一技術スタック・アカウント共有）
- **Supabase/Vercel/Resend:** music-room-booking で既存アカウント済み

## その他のルール

- 日本語で会話する
- SQL は必ずコピペ可能なコードブロック（```sql ... ```）で提示する
- npx は使えない（Node.js / npm は PATH に入っていない場合がある）
- テキストでの保存を好む（README、計画ファイル等）
