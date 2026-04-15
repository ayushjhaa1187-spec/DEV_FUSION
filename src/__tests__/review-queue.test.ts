import { describe, it, expect } from 'vitest';
import {
  calculateEaseFactor,
  calculateNextInterval,
} from '@/lib/review-queue';

describe('Review Queue - SM-2 Algorithm', () => {
  describe('calculateEaseFactor', () => {
    it('should decrease ease factor for low scores', () => {
      // Score 40% (0.4) is below 60%, should decrease ease
      const result = calculateEaseFactor(2.5, 0.4);
      expect(result).toBeLessThan(2.5);
      expect(result).toBeGreaterThanOrEqual(1.3); // minimum bound
    });

    it('should maintain or increase ease factor for good scores', () => {
      // Score 80% (0.8) is above 60%, should increase ease
      const result = calculateEaseFactor(2.5, 0.8);
      expect(result).toBeGreaterThan(2.5);
    });

    it('should enforce minimum ease factor of 1.3', () => {
      // Very low score should not go below 1.3
      const result = calculateEaseFactor(1.3, 0.0);
      expect(result).toBe(1.3);
    });

    it('should handle edge case of 60% score', () => {
      // At exactly 60%, formula should be neutral
      const result = calculateEaseFactor(2.5, 0.6);
      expect(result).toBeCloseTo(2.6, 1); // slight increase
    });

    it('should increase significantly for perfect score', () => {
      // 100% score should increase ease substantially
      const result = calculateEaseFactor(2.5, 1.0);
      expect(result).toBeGreaterThan(2.8);
    });
  });

  describe('calculateNextInterval', () => {
    it('should return 1 day for first repetition', () => {
      const interval = calculateNextInterval(0, 2.5);
      expect(interval).toBe(1);
    });

    it('should return 3 days for second repetition', () => {
      const interval = calculateNextInterval(1, 2.5);
      expect(interval).toBe(3);
    });

    it('should multiply by ease factor for subsequent repetitions', () => {
      // 3rd repetition with ease 2.5 and previous interval 3
      const interval = calculateNextInterval(2, 2.5, 3);
      expect(interval).toBe(Math.round(2.5 * 3)); // 8 days
    });

    it('should grow exponentially with good ease factors', () => {
      const day1 = calculateNextInterval(0, 2.5);
      const day2 = calculateNextInterval(1, 2.5);
      const day3 = calculateNextInterval(2, 2.5, day2);
      const day4 = calculateNextInterval(3, 2.5, day3);

      expect(day1).toBe(1);
      expect(day2).toBe(3);
      expect(day3).toBe(8); // 3 * 2.5 ≈ 8
      expect(day4).toBeGreaterThan(day3); // continues to grow
    });

    it('should round to nearest integer', () => {
      const interval = calculateNextInterval(2, 1.5, 3);
      expect(Number.isInteger(interval)).toBe(true);
    });

    it('should handle minimum ease factor intervals', () => {
      // With ease=1.3 (minimum), growth should slow
      const interval = calculateNextInterval(2, 1.3, 3);
      expect(interval).toBe(Math.round(1.3 * 3)); // around 4-5 days
    });
  });

  describe('SM-2 Workflow', () => {
    it('should follow realistic learning sequence', () => {
      let ease = 2.5;
      let interval = 1;

      // First attempt: 50% (weak)
      ease = calculateEaseFactor(ease, 0.5);
      interval = calculateNextInterval(0, ease);
      expect(interval).toBe(1); // review tomorrow
      expect(ease).toBeLessThan(2.5);

      // Second attempt: 75% (improving)
      ease = calculateEaseFactor(ease, 0.75);
      interval = calculateNextInterval(1, ease);
      expect(interval).toBe(3); // 3 days later
      expect(ease).toBeGreaterThan(2.0); // improved ease

      // Third attempt: 90% (strong)
      ease = calculateEaseFactor(ease, 0.9);
      interval = calculateNextInterval(2, ease, 3);
      expect(interval).toBeGreaterThan(3); // further apart
      expect(ease).toBeGreaterThan(2.3);
    });

    it('should handle repeated failures', () => {
      let ease = 2.5;

      // Multiple low scores
      for (let i = 0; i < 3; i++) {
        ease = calculateEaseFactor(ease, 0.3);
      }

      expect(ease).toBe(1.3); // hits minimum
    });

    it('should recover from failures with successful attempts', () => {
      let ease = 1.3; // at minimum

      // Good score brings back up
      ease = calculateEaseFactor(ease, 0.85);
      expect(ease).toBeGreaterThan(1.3);

      // Continued success grows ease
      ease = calculateEaseFactor(ease, 0.95);
      expect(ease).toBeGreaterThan(1.5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero score', () => {
      const ease = calculateEaseFactor(2.5, 0);
      expect(ease).toBeGreaterThanOrEqual(1.3);
      expect(ease).toBeLessThan(2.5);
    });

    it('should handle perfect score', () => {
      const ease = calculateEaseFactor(2.5, 1.0);
      expect(ease).toBeGreaterThan(2.5);
      expect(Number.isFinite(ease)).toBe(true);
    });

    it('should handle very small ease factors', () => {
      const ease = calculateEaseFactor(1.3, 0.5);
      expect(ease).toBe(1.3); // stays at minimum
    });

    it('should handle very large ease factors', () => {
      let ease = 2.5;
      // Build up a large ease factor
      for (let i = 0; i < 5; i++) {
        ease = calculateEaseFactor(ease, 0.95);
      }
      expect(ease).toBeGreaterThan(2.5);
      expect(Number.isFinite(ease)).toBe(true);
    });
  });
});
