import { describe, it, expect } from "vitest";
import { calculateScores } from "../storage";

/**
 * Integration tests for the ranking and scoring flow
 * These tests simulate the complete user journey:
 * 1. User arranges candidates in ranking screen
 * 2. Rankings are saved for each criterion
 * 3. Scores are calculated based on rankings
 * 4. Results are displayed correctly
 */

describe("Ranking Integration Tests", () => {
  describe("Scenario 1: Simple 2-candidate, 1-criterion case", () => {
    it("should calculate correct scores when A is ranked 1st and B is ranked 2nd", () => {
      const candidates = ["A", "B"];
      const criteria = ["criterion1"];
      const rankings = {
        criterion1: ["A", "B"], // A is 1st, B is 2nd
      };

      const scores = calculateScores(candidates, criteria, rankings);

      // A: 2 points (1st place), max = 1 criterion * 2 candidates = 2
      // Score: 2/2 * 100 = 100
      expect(scores["A"]).toBe(100);

      // B: 1 point (2nd place)
      // Score: 1/2 * 100 = 50
      expect(scores["B"]).toBe(50);
    });

    it("should calculate correct scores when B is ranked 1st and A is ranked 2nd", () => {
      const candidates = ["A", "B"];
      const criteria = ["criterion1"];
      const rankings = {
        criterion1: ["B", "A"], // B is 1st, A is 2nd
      };

      const scores = calculateScores(candidates, criteria, rankings);

      expect(scores["B"]).toBe(100);
      expect(scores["A"]).toBe(50);
    });
  });

  describe("Scenario 2: 3-candidate, 2-criterion case", () => {
    it("should correctly rank when same candidate is 1st in both criteria", () => {
      const candidates = ["X", "Y", "Z"];
      const criteria = ["criterion1", "criterion2"];
      const rankings = {
        criterion1: ["X", "Y", "Z"], // X=3pts, Y=2pts, Z=1pt
        criterion2: ["X", "Y", "Z"], // X=3pts, Y=2pts, Z=1pt
      };

      const scores = calculateScores(candidates, criteria, rankings);

      // X: (3+3) / (2*3) = 6/6 = 100
      expect(scores["X"]).toBe(100);

      // Y: (2+2) / 6 = 4/6 ≈ 67
      expect(scores["Y"]).toBe(67);

      // Z: (1+1) / 6 = 2/6 ≈ 33
      expect(scores["Z"]).toBe(33);
    });

    it("should correctly rank when candidates have different rankings in each criterion", () => {
      const candidates = ["A", "B", "C"];
      const criteria = ["criterion1", "criterion2"];
      const rankings = {
        criterion1: ["A", "B", "C"], // A=3pts, B=2pts, C=1pt
        criterion2: ["C", "A", "B"], // C=3pts, A=2pts, B=1pt
      };

      const scores = calculateScores(candidates, criteria, rankings);

      // A: (3+2) / 6 = 5/6 ≈ 83
      expect(scores["A"]).toBe(83);

      // B: (2+1) / 6 = 3/6 = 50
      expect(scores["B"]).toBe(50);

      // C: (1+3) / 6 = 4/6 ≈ 67
      expect(scores["C"]).toBe(67);

      // Verify sorting order
      const sorted = ["A", "B", "C"].sort(
        (a, b) => (scores[b] || 0) - (scores[a] || 0)
      );
      expect(sorted[0]).toBe("A"); // 1st place
      expect(sorted[1]).toBe("C"); // 2nd place
      expect(sorted[2]).toBe("B"); // 3rd place
    });
  });

  describe("Scenario 3: Complex 3-candidate, 3-criterion case", () => {
    it("should handle complex ranking with multiple criteria", () => {
      const candidates = ["Restaurant A", "Restaurant B", "Restaurant C"];
      const criteria = ["price", "taste", "atmosphere"];
      const rankings = {
        price: ["Restaurant A", "Restaurant B", "Restaurant C"],
        taste: ["Restaurant B", "Restaurant A", "Restaurant C"],
        atmosphere: ["Restaurant A", "Restaurant C", "Restaurant B"],
      };

      const scores = calculateScores(candidates, criteria, rankings);

      // Restaurant A: (3+2+3) / (3*3) = 8/9 ≈ 89
      expect(scores["Restaurant A"]).toBe(89);

      // Restaurant B: (2+3+1) / 9 = 6/9 ≈ 67
      expect(scores["Restaurant B"]).toBe(67);

      // Restaurant C: (1+1+2) / 9 = 4/9 ≈ 44
      expect(scores["Restaurant C"]).toBe(44);

      // Verify winner
      const sorted = candidates.sort(
        (a, b) => (scores[b] || 0) - (scores[a] || 0)
      );
      expect(sorted[0]).toBe("Restaurant A");
    });
  });

  describe("Scenario 4: Edge cases", () => {
    it("should handle single candidate", () => {
      const candidates = ["A"];
      const criteria = ["criterion1"];
      const rankings = {
        criterion1: ["A"],
      };

      const scores = calculateScores(candidates, criteria, rankings);

      // A: 1 point / 1 max = 100
      expect(scores["A"]).toBe(100);
    });

    it("should handle empty rankings", () => {
      const candidates = ["A", "B"];
      const criteria = ["criterion1"];
      const rankings = {}; // No rankings provided

      const scores = calculateScores(candidates, criteria, rankings);

      // Both should be 0
      expect(scores["A"]).toBe(0);
      expect(scores["B"]).toBe(0);
    });

    it("should handle missing ranking for a criterion", () => {
      const candidates = ["A", "B"];
      const criteria = ["criterion1", "criterion2"];
      const rankings = {
        criterion1: ["A", "B"], // Only criterion1 has ranking
        // criterion2 is missing
      };

      const scores = calculateScores(candidates, criteria, rankings);

      // A: 2 / (2 criteria * 2 candidates) = 2/4 = 50 (criterion2 is missing, so 0 points)
      expect(scores["A"]).toBe(50);
      expect(scores["B"]).toBe(25);
    });
  });

  describe("Scenario 5: Verify sorting order matches ranking order", () => {
    it("should produce sorted results that match the ranking order", () => {
      const candidates = ["X", "Y", "Z"];
      const criteria = ["criterion1"];
      const rankings = {
        criterion1: ["X", "Y", "Z"], // X should be 1st, Y 2nd, Z 3rd
      };

      const scores = calculateScores(candidates, criteria, rankings);
      const sorted = candidates.sort(
        (a, b) => (scores[b] || 0) - (scores[a] || 0)
      );

      // Verify the sorted order matches the ranking order
      expect(sorted[0]).toBe("X");
      expect(sorted[1]).toBe("Y");
      expect(sorted[2]).toBe("Z");

      // Verify scores are in descending order
      expect(scores[sorted[0]]).toBeGreaterThanOrEqual(scores[sorted[1]]);
      expect(scores[sorted[1]]).toBeGreaterThanOrEqual(scores[sorted[2]]);
    });

    it("should correctly reverse order when ranking is reversed", () => {
      const candidates = ["X", "Y", "Z"];
      const criteria = ["criterion1"];
      const rankings = {
        criterion1: ["Z", "Y", "X"], // Z should be 1st, Y 2nd, X 3rd
      };

      const scores = calculateScores(candidates, criteria, rankings);
      const sorted = candidates.sort(
        (a, b) => (scores[b] || 0) - (scores[a] || 0)
      );

      expect(sorted[0]).toBe("Z");
      expect(sorted[1]).toBe("Y");
      expect(sorted[2]).toBe("X");
    });
  });
});
