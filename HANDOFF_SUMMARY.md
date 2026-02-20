# 決断スコア - Claude 引き継ぎサマリー

## プロジェクト概要

**アプリ名**: 決断スコア（汎用型意思決定スコアリングアプリ）

**説明**: ユーザーが比較対象と評価基準を自由に設定し、ドラッグ&ドロップで強制的な相対評価を行うことで、100点満点のスコアで優柔不断を数値化して解決するアプリ

**対応プラットフォーム**: iOS 14.0+、Android 8.0+

**技術スタック**: React Native (Expo 54)、TypeScript、NativeWind (Tailwind CSS)

---

## 現在の状態

**チェックポイント**: `1266a52b`

**実装済み機能**:
- ✅ プロジェクト管理（作成・一覧・削除・履歴表示）
- ✅ 3ステップ入力フロー（テーマ設定 → 候補入力 → 評価項目設定）
- ✅ ドラッグ&ドロップ並び替えUI（react-native-gesture-handler + reanimated）
- ✅ スコア計算ロジック（ランキングポイント方式）
- ✅ 結果表示画面（円形スコア、カウントアップアニメーション）
- ✅ 確信度メッセージ表示
- ✅ 課金UIモーダル（月額300円/買い切り980円）
- ✅ 設定画面（プレミアム状態トグル）
- ✅ テンプレート機能（飲食店・就職先・住居・旅行先・商品比較）
- ✅ ハプティクスフィードバック
- ✅ ユニットテスト（14個、全て通過）

**ビルド状態**: TypeScript エラーなし、依存関係 OK

---

## 報告された問題

### 🔴 バグ: ドラッグ&ドロップ並び替えの挙動がおかしい

**症状**: 
- ドラッグ&ドロップ並び替え画面で候補を並び替えた後、結果表示画面の順位が正しく反映されていない

**影響を受けるファイル**:
- `app/ranking.tsx` - ドラッグ&ドロップUI実装
- `app/result.tsx` - スコア計算・結果表示
- `lib/storage.ts` - スコア計算ロジック

**根本原因の推定**:
- `ranking.tsx` の `SortableList` コンポーネント内の位置追跡ロジックが複雑で、ドラッグ中に位置情報が不正確になる
- `DraggableItem` の `currentPosition.current` 管理が不正確
- 複数アイテムの連続ドラッグで状態が累積的に破損する可能性

**詳細**: `DEBUG_HANDOFF.md` を参照

---

## ファイル構成

```
/home/ubuntu/decision-score-app/
├── app/
│   ├── _layout.tsx              ← ルートレイアウト + ProjectProvider
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← タブバー設定（ホーム・設定）
│   │   ├── index.tsx            ← ホーム画面（プロジェクト一覧）
│   │   └── settings.tsx         ← 設定画面
│   ├── new-project.tsx          ← テーマ設定画面
│   ├── candidates.tsx           ← 候補入力画面
│   ├── criteria.tsx             ← 評価項目設定画面
│   ├── ranking.tsx              ← ドラッグ&ドロップ並び替え画面 ⚠️ 問題箇所
│   ├── result.tsx               ← 結果表示画面
│   └── history-detail.tsx       ← 履歴詳細画面
├── lib/
│   ├── storage.ts               ← データモデル・スコア計算ロジック
│   ├── project-context.tsx      ← グローバル状態管理
│   ├── utils.ts                 ← ユーティリティ
│   └── __tests__/
│       └── storage.test.ts      ← ユニットテスト（14個通過）
├── components/
│   ├── screen-container.tsx     ← SafeArea ラッパー
│   ├── themed-view.tsx          ← テーマ対応 View
│   └── ui/
│       └── icon-symbol.tsx      ← アイコン管理
├── hooks/
│   ├── use-colors.ts            ← テーマカラーフック
│   ├── use-color-scheme.ts      ← ダークモード検出
│   └── use-auth.ts              ← 認証フック（未使用）
├── assets/images/
│   ├── icon.png                 ← アプリアイコン（800x800）
│   ├── splash-icon.png          ← スプラッシュアイコン（512x512）
│   ├── favicon.png              ← ファビコン（256x256）
│   └── android-icon-*.png       ← Android アダプティブアイコン
├── app.config.ts                ← Expo 設定
├── tailwind.config.js           ← Tailwind 設定
├── theme.config.js              ← テーマカラー定義
├── package.json                 ← 依存関係
├── design.md                    ← UI/UX 設計ドキュメント
├── todo.md                      ← タスクリスト（全て完了）
├── DEBUG_HANDOFF.md             ← デバッグ指示書
└── HANDOFF_SUMMARY.md           ← このファイル
```

---

## スコア計算ロジック（正常に動作）

**方式**: ランキングポイント方式

```
各評価項目について:
  1位の候補 → n ポイント（n = 候補数）
  2位の候補 → n-1 ポイント
  ...
  最下位の候補 → 1 ポイント

全項目のポイントを合計し、最大ポイント（criteria.length × n）で除算して 100 点満点に正規化
```

**例**: 3候補 (A, B, C)、2評価項目 (項目1, 項目2)
- 項目1: [A, B, C] → A=3pt, B=2pt, C=1pt
- 項目2: [B, A, C] → B=3pt, A=2pt, C=1pt
- 合計: A=5pt, B=5pt, C=2pt
- 最大: 6pt
- スコア: A=83点, B=83点, C=33点

**実装**: `lib/storage.ts` の `calculateScores()` 関数

---

## ドラッグ&ドロップ実装の詳細

**使用ライブラリ**:
- `react-native-gesture-handler` - ジェスチャー検出
- `react-native-reanimated` - アニメーション

**現在の実装フロー**:
1. ユーザーが 150ms 以上長押し → ドラッグ開始
2. `DraggableItem` が `positions.current` を更新
3. `SortableList` の `updateOrder()` が呼ばれて `currentOrder` を更新
4. `ranking.tsx` の `handleNext()` で `rankings[criterion]` に保存

**問題の可能性**:
- `positions.current` の管理が複雑
- `currentPosition.current` の更新タイミングが不正確
- Swap ロジックが複数アイテムの連続ドラッグに対応していない

---

## 無料版・プレミアム版の制限

**無料版**:
- 比較候補: 3個まで
- 評価項目: 5個まで
- プロジェクト保存: 3個まで

**プレミアム版** (月額 ¥300 / 買い切り ¥980):
- 比較候補: 10個まで
- 評価項目: 無制限
- プロジェクト保存: 無制限
- 重み付け機能（未実装）
- レーダーチャート表示（未実装）

**実装**: `lib/storage.ts` の `FREE_LIMITS` / `PREMIUM_LIMITS`、`lib/project-context.tsx` で制限チェック

---

## テスト状況

**ユニットテスト**: 14個、全て通過 ✅

```
✓ calculateScores (4 tests)
  ✓ should calculate correct scores for 3 candidates and 4 criteria
  ✓ should calculate correct scores for 2 candidates
  ✓ should handle 5 candidates
  ✓ should return 0 for empty criteria

✓ getConfidenceMessage (4 tests)
  ✓ should return correct message for 15+ point diff
  ✓ should return correct message for 10-14 point diff
  ✓ should return correct message for 5-9 point diff
  ✓ should return correct message for 1-4 point diff

✓ getScoreColor (4 tests)
  ✓ should return gold for 90+
  ✓ should return green for 75-89
  ✓ should return indigo for 60-74
  ✓ should return gray for below 60

✓ generateId (2 tests)
  ✓ should generate a valid UUID format
  ✓ should generate unique IDs
```

**実装テスト**: 未実施（ドラッグ&ドロップの複雑性のため）

---

## 修正の推奨方針

### 方針A: 位置追跡ロジックの簡潔化（推奨）

`positions.current` の管理を単純化し、ドラッグ終了時に視覚的な順序を直接再構成

**メリット**: 実装が単純で、バグが少ない
**デメリット**: 現在のコードを大幅に書き直す必要がある

### 方針B: 状態管理の統一

`positions.current` を削除し、`order` (useState) を単一の真実の源とする

**メリット**: React の標準的なパターン
**デメリット**: アニメーション性能に影響する可能性

### 方針C: テスト駆動修正

ユニットテストで期待される動作を定義してから修正

**メリット**: 修正後の動作が保証される
**デメリット**: 時間がかかる

---

## デバッグ手順

1. **ログ出力を追加** → `ranking.tsx` の `handleNext()` と `lib/storage.ts` の `calculateScores()` にコンソールログを追加
2. **テストシナリオを実行** → 2候補1項目の簡単なケースから開始
3. **ログを確認** → 並び替え時の位置情報とスコア計算結果を比較
4. **問題箇所を特定** → ログから不正確な位置情報を発見
5. **修正を実装** → 推奨方針に従って修正
6. **テストケースを追加** → 修正後の動作を検証
7. **チェックポイント保存** → 修正完了後に保存

詳細は `DEBUG_HANDOFF.md` を参照

---

## 開発環境

**プロジェクトパス**: `/home/ubuntu/decision-score-app`

**開発サーバー**: 
- Metro: `https://8081-igux6smxmg75kh5v84gvj-fe3ecc4e.sg1.manus.computer`
- API: `http://127.0.0.1:3000`
- QR: `exps://8081-igux6smxmg75kh5v84gvj-fe3ecc4e.sg1.manus.computer`

**コマンド**:
```bash
# 開発サーバー起動
pnpm dev

# テスト実行
pnpm test

# ビルド
pnpm build

# 型チェック
pnpm check

# リント
pnpm lint
```

---

## 次のステップ（Claude 向け）

1. ✅ `DEBUG_HANDOFF.md` を熟読
2. ✅ ログ出力を追加して実行
3. ✅ テストシナリオで問題を再現
4. ✅ 問題箇所を特定
5. ✅ 修正を実装
6. ✅ テストケースを追加
7. ✅ チェックポイント保存
8. ✅ ユーザーに報告

---

**作成日**: 2026-02-17
**プロジェクト**: 決断スコア（汎用型意思決定スコアリングアプリ）
**チェックポイント**: 1266a52b
**ステータス**: ドラッグ&ドロップ並び替えバグ修正待ち
