import { describe, it, expect } from "vitest";
import {
  calculateScores,
  getConfidenceMessage,
  getScoreColor,
  generateId,
} from "../storage";

describe("calculateScores", () => {
  it("should calculate correct scores for 3 candidates and 4 criteria", () => {
    const candidates = ["A店", "B店", "C店"];
    const criteria = ["価格", "味", "雰囲気", "接客"];
    const rankings: Record<string, string[]> = {
      "価格": ["A店", "B店", "C店"],     // A=3, B=2, C=1
      "味": ["B店", "A店", "C店"],       // B=3, A=2, C=1
      "雰囲気": ["A店", "C店", "B店"],   // A=3, C=2, B=1
      "接客": ["A店", "B店", "C店"],     // A=3, B=2, C=1
    };

    const scores = calculateScores(candidates, criteria, rankings);

    // A店: 3+2+3+3 = 11, max = 4*3 = 12, score = round(11/12*100) = 92
    expect(scores["A店"]).toBe(92);
    // B店: 2+3+1+2 = 8, score = round(8/12*100) = 67
    expect(scores["B店"]).toBe(67);
    // C店: 1+1+2+1 = 5, score = round(5/12*100) = 42
    expect(scores["C店"]).toBe(42);
  });

  it("should calculate correct scores for 2 candidates", () => {
    const candidates = ["X", "Y"];
    const criteria = ["速さ", "安さ"];
    const rankings: Record<string, string[]> = {
      "速さ": ["X", "Y"],  // X=2, Y=1
      "安さ": ["Y", "X"],  // Y=2, X=1
    };

    const scores = calculateScores(candidates, criteria, rankings);

    // X: 2+1 = 3, max = 2*2 = 4, score = round(3/4*100) = 75
    expect(scores["X"]).toBe(75);
    // Y: 1+2 = 3, max = 4, score = 75
    expect(scores["Y"]).toBe(75);
  });

  it("should handle 5 candidates", () => {
    const candidates = ["A", "B", "C", "D", "E"];
    const criteria = ["項目1"];
    const rankings: Record<string, string[]> = {
      "項目1": ["A", "B", "C", "D", "E"],
    };

    const scores = calculateScores(candidates, criteria, rankings);

    // A: 5, max = 1*5 = 5, score = 100
    expect(scores["A"]).toBe(100);
    // E: 1, max = 5, score = 20
    expect(scores["E"]).toBe(20);
  });

  it("should return 0 for empty criteria", () => {
    const candidates = ["A", "B"];
    const scores = calculateScores(candidates, [], {});
    expect(scores["A"]).toBe(0);
    expect(scores["B"]).toBe(0);
  });
});

describe("getConfidenceMessage", () => {
  it("should return correct message for 15+ point diff", () => {
    expect(getConfidenceMessage(15)).toBe("圧倒的で迷わず選べます");
    expect(getConfidenceMessage(20)).toBe("圧倒的で迷わず選べます");
  });

  it("should return correct message for 10-14 point diff", () => {
    expect(getConfidenceMessage(10)).toBe("明確な差があります");
    expect(getConfidenceMessage(14)).toBe("明確な差があります");
  });

  it("should return correct message for 5-9 point diff", () => {
    expect(getConfidenceMessage(5)).toBe("やや優勢です");
    expect(getConfidenceMessage(9)).toBe("やや優勢です");
  });

  it("should return correct message for 1-4 point diff", () => {
    expect(getConfidenceMessage(1)).toBe("僅差でした");
    expect(getConfidenceMessage(4)).toBe("僅差でした");
    expect(getConfidenceMessage(0)).toBe("僅差でした");
  });
});

describe("getScoreColor", () => {
  it("should return green for 90+ (1st place)", () => {
    expect(getScoreColor(90)).toBe("#22C55E");
    expect(getScoreColor(100)).toBe("#22C55E");
  });

  it("should return orange for 75-89 (2nd place)", () => {
    expect(getScoreColor(75)).toBe("#F59E0B");
    expect(getScoreColor(89)).toBe("#F59E0B");
  });

  it("should return red for 60-74 (last place)", () => {
    expect(getScoreColor(60)).toBe("#EF4444");
    expect(getScoreColor(74)).toBe("#EF4444");
  });

  it("should return gray for below 60", () => {
    expect(getScoreColor(59)).toBe("#8E8EA0");
    expect(getScoreColor(0)).toBe("#8E8EA0");
  });
});

describe("generateId", () => {
  it("should generate a valid UUID format", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("should generate unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
