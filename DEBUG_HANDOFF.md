# 決断スコア - ドラッグ&ドロップ並び替えバグ デバッグ指示書

## 問題概要

**症状**: ドラッグ&ドロップ並び替え画面で候補を並び替えた後、結果表示画面の順位が正しく反映されていない

**影響範囲**:
- `app/ranking.tsx` - ドラッグ&ドロップUI
- `app/result.tsx` - スコア計算・結果表示
- `lib/storage.ts` - スコア計算ロジック

---

## 問題の根本原因（推定）

### 1. ranking.tsx の位置追跡ロジックの複雑性

**問題箇所**: `SortableList` コンポーネント内の `updateOrder` 関数（189-209行目）

```typescript
const updateOrder = useCallback(
  (newPositions: number[]) => {
    setOrder([...newPositions]);
    const reordered = newPositions.map((pos) => items[pos]);
    // ここのロジックが複雑で、位置の対応関係が不正確
    const result: string[] = [];
    for (let visualPos = 0; visualPos < items.length; visualPos++) {
      const originalIndex = newPositions.findIndex((p) => p === visualPos);
      if (originalIndex >= 0) {
        result.push(items[originalIndex]);
      }
    }
    onReorder(result.length === items.length ? result : items);
  },
  [items, onReorder]
);
```

**問題点**:
- `positions.current[index]` と `newPositions` の対応関係が不明確
- ドラッグ中の複数回の更新で、位置情報が累積的に破損する可能性
- `currentPosition.current` の更新タイミングが不正確

### 2. DraggableItem での位置計算の不正確性

**問題箇所**: `DraggableItem` コンポーネント（228-359行目）

```typescript
.onUpdate((event) => {
  const newY = currentPosition.current * TOTAL_ITEM_HEIGHT + event.translationY;
  translateY.value = Math.max(0, Math.min(newY, (itemCount - 1) * TOTAL_ITEM_HEIGHT));

  // Calculate new position
  const newPos = Math.round(translateY.value / TOTAL_ITEM_HEIGHT);
  const clampedPos = Math.max(0, Math.min(newPos, itemCount - 1));

  if (clampedPos !== positions.current[index]) {
    // Swap logic
    const oldPos = positions.current[index];
    const otherIndex = positions.current.findIndex((p) => p === clampedPos);
    if (otherIndex >= 0) {
      positions.current[otherIndex] = oldPos;
    }
    positions.current[index] = clampedPos;
    runOnJS(onReorder)([...positions.current]);
  }
})
```

**問題点**:
- `currentPosition.current` が初期値 `index` で固定されたまま、ドラッグ終了時にしか更新されない
- 複数アイテムの連続ドラッグで位置情報が不整合になる
- Swap ロジックが単純すぎて、複数アイテムの並び替え時に正しく機能しない

### 3. 状態管理の分散

**問題箇所**: `SortableList` と `DraggableItem` 間の状態同期

- `positions.current` (useRef) - 各アイテムの現在位置を追跡
- `order` (useState) - ビジュアル順序
- `currentPosition.current` (useRef) - ドラッグ中のアイテムの位置

これら3つの状態が完全に同期されていない可能性

---

## 期待される動作

1. **ユーザーが候補 A, B, C を [A, B, C] の順序で並び替える**
   - 最初の状態: `[A, B, C]`
   - ユーザーが B を下にドラッグして C の下に移動
   - 期待される結果: `[A, C, B]`

2. **スコア計算時**
   - `rankings["評価項目"] = [A, C, B]` が正しく保存される
   - A は1位（n点）、C は2位（n-1点）、B は3位（n-2点）を獲得

3. **結果表示時**
   - スコア計算が正しい順位を反映
   - 並び替え画面での順序 = 結果画面の順位

---

## デバッグ手順

### ステップ1: ログ出力を追加

**ranking.tsx の handleNext 関数に追加**:

```typescript
const handleNext = useCallback(() => {
  // ... existing code ...
  
  const updatedRankings = {
    ...rankings,
    [currentCriterion]: [...currentOrder],
  };
  
  // DEBUG: Log the current order
  console.log(`[DEBUG] Criterion: ${currentCriterion}`);
  console.log(`[DEBUG] Current Order:`, currentOrder);
  console.log(`[DEBUG] Updated Rankings:`, updatedRankings);
  
  setRankings(updatedRankings);
  // ... rest of code ...
}, [/* dependencies */]);
```

### ステップ2: スコア計算ロジックの検証

**lib/storage.ts の calculateScores にログを追加**:

```typescript
export function calculateScores(
  candidates: string[],
  criteria: string[],
  rankings: Record<string, string[]>
): Record<string, number> {
  const n = candidates.length;
  const rawScores: Record<string, number> = {};

  for (const c of candidates) {
    rawScores[c] = 0;
  }

  // DEBUG
  console.log(`[DEBUG CALC] Candidates:`, candidates);
  console.log(`[DEBUG CALC] Criteria:`, criteria);
  console.log(`[DEBUG CALC] Rankings:`, rankings);

  for (const criterion of criteria) {
    const ordered = rankings[criterion];
    console.log(`[DEBUG CALC] Criterion "${criterion}":`, ordered);
    
    if (!ordered) continue;
    for (let i = 0; i < ordered.length; i++) {
      const candidate = ordered[i];
      const rankPoint = n - i;
      rawScores[candidate] = (rawScores[candidate] || 0) + rankPoint;
      console.log(`  ${candidate}: +${rankPoint} (total: ${rawScores[candidate]})`);
    }
  }

  const maxRaw = criteria.length * n;
  const scores: Record<string, number> = {};
  for (const c of candidates) {
    scores[c] = maxRaw > 0 ? Math.round((rawScores[c] / maxRaw) * 100) : 0;
  }

  console.log(`[DEBUG CALC] Final Scores:`, scores);
  return scores;
}
```

### ステップ3: ドラッグ&ドロップの位置追跡を検証

**ranking.tsx の DraggableItem に追加**:

```typescript
const gesture = Gesture.Pan()
  .activateAfterLongPress(150)
  .onStart(() => {
    console.log(`[DRAG START] Item: ${item}, Index: ${index}, Current Pos: ${currentPosition.current}`);
    isActive.value = true;
    zIdx.value = 100;
    runOnJS(triggerHaptic)();
  })
  .onUpdate((event) => {
    const newY = currentPosition.current * TOTAL_ITEM_HEIGHT + event.translationY;
    translateY.value = Math.max(0, Math.min(newY, (itemCount - 1) * TOTAL_ITEM_HEIGHT));

    const newPos = Math.round(translateY.value / TOTAL_ITEM_HEIGHT);
    const clampedPos = Math.max(0, Math.min(newPos, itemCount - 1));

    if (clampedPos !== positions.current[index]) {
      console.log(`[DRAG UPDATE] Item: ${item}, New Pos: ${clampedPos}, Positions:`, positions.current);
      // ... rest of swap logic ...
    }
  })
  .onEnd(() => {
    console.log(`[DRAG END] Item: ${item}, Final Pos: ${positions.current[index]}`);
    // ... rest of code ...
  })
  .runOnJS(true);
```

---

## 推奨される修正方針

### 方針A: 位置追跡ロジックの簡潔化（推奨）

**目標**: `positions.current` の管理を単純化

```typescript
// 現在の複雑なロジックを廃止
// 代わりに、各ドラッグ終了時に「現在の視覚的な順序」を直接 items から再構成

const handleDragEnd = () => {
  // positions.current から items の新しい順序を直接計算
  const newOrder = positions.current.map(pos => items[pos]);
  onReorder(newOrder);
};
```

### 方針B: 状態管理の統一

**目標**: `positions.current` と `order` を同期させる

- `positions.current` を削除
- `order` (useState) を単一の真実の源とする
- ドラッグ時に `order` を直接更新

### 方針C: テスト駆動修正

**目標**: ユニットテストで期待される動作を定義

```typescript
// lib/__tests__/ranking.test.ts
describe("Ranking Logic", () => {
  it("should correctly reorder items when dragging", () => {
    // Test: [A, B, C] → drag B below C → [A, C, B]
    const items = ["A", "B", "C"];
    const positions = [0, 1, 2]; // initial positions
    
    // Simulate dragging B (index 1) to position 2
    // Expected: positions = [0, 2, 1]
    // Expected order: [A, C, B]
  });

  it("should calculate correct scores from reordered rankings", () => {
    const candidates = ["A", "B", "C"];
    const criteria = ["criterion1"];
    const rankings = {
      criterion1: ["A", "C", "B"], // A=1st, C=2nd, B=3rd
    };
    
    const scores = calculateScores(candidates, criteria, rankings);
    expect(scores["A"]).toBe(100); // 3 points / 3 max = 100%
    expect(scores["C"]).toBe(67);  // 2 points / 3 max ≈ 67%
    expect(scores["B"]).toBe(33);  // 1 point / 3 max ≈ 33%
  });
});
```

---

## テスト用シナリオ

### シナリオ1: 2候補、1評価項目

1. テーマ: "テスト"
2. 候補: ["A", "B"]
3. 評価項目: ["項目1"]
4. 並び替え: A を B より上に配置 → [A, B]
5. **期待される結果**: A が 100点、B が 50点

### シナリオ2: 3候補、2評価項目

1. テーマ: "テスト"
2. 候補: ["X", "Y", "Z"]
3. 評価項目: ["項目1", "項目2"]
4. 項目1の並び替え: [X, Y, Z]
5. 項目2の並び替え: [Z, X, Y]
6. **期待される結果**:
   - X: (3+2) / 6 = 83点
   - Y: (2+1) / 6 = 50点
   - Z: (1+3) / 6 = 67点

---

## ファイル構成

```
/home/ubuntu/decision-score-app/
├── app/
│   ├── ranking.tsx          ← ドラッグ&ドロップUI（問題箇所）
│   ├── result.tsx           ← 結果表示・スコア計算呼び出し
│   └── ...
├── lib/
│   ├── storage.ts           ← スコア計算ロジック
│   └── __tests__/
│       └── storage.test.ts  ← 既存テスト（14個通過）
└── DEBUG_HANDOFF.md         ← このファイル
```

---

## 次のステップ

1. **ログ出力を追加して実行** → 並び替え時の位置情報を確認
2. **期待値と実際値を比較** → どの段階で不正確になるか特定
3. **修正方針を選択** → 方針A/B/C のいずれかを実装
4. **テストケースを追加** → 修正後の動作を検証
5. **チェックポイント保存** → 修正完了後に保存

---

## 参考資料

- **ranking.tsx**: ドラッグ&ドロップ実装（react-native-gesture-handler + reanimated）
- **storage.ts**: スコア計算ロジック（ランキングポイント方式）
- **result.tsx**: スコア計算の呼び出し元

---

**作成日**: 2026-02-17
**プロジェクト**: 決断スコア（汎用型意思決定スコアリングアプリ）
**チェックポイント**: 1266a52b
