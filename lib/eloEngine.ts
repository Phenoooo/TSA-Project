
export interface MathLevelInfo {
  score: number;
  tierName: string;
  topicFocus: string;
}

export function getMathLevelFromScore(score: number): MathLevelInfo {
  const s = Math.max(0, Math.min(1000, score));

  if (s < 100) {
    return {
      score: s,
      tierName: "Early Foundations (0-99)",
      topicFocus: "Arithmetic, fractions, decimals, percentages and number sense",
    };
  }

  if (s < 250) {
    return {
      score: s,
      tierName: "Pre-Algebra (100-249)",
      topicFocus: "Fractions, ratios, proportions and order of operations",
    };
  }

  if (s < 400) {
    return {
      score: s,
      tierName: "Algebra I (250-399)",
      topicFocus: "Linear equations, inequalities, slope and functions",
    };
  }

  if (s < 530) {
    return {
      score: s,
      tierName: "Geometry (400-529)",
      topicFocus: "Triangles, circles, similarity, area and volume",
    };
  }

  if (s < 650) {
    return {
      score: s,
      tierName: "Algebra II (530-649)",
      topicFocus: "Quadratics, polynomials, logarithms and complex numbers",
    };
  }

  if (s < 750) {
    return {
      score: s,
      tierName: "Statistics & Probability (650-749)",
      topicFocus: "Distributions, probability, statistics and combinatorics",
    };
  }

  if (s < 840) {
    return {
      score: s,
      tierName: "Trigonometry & Precalculus (750-839)",
      topicFocus: "Unit circle, trigonometric identities, sequences and functions",
    };
  }

  if (s < 920) {
    return {
      score: s,
      tierName: "Differential Calculus (840-919)",
      topicFocus: "Limits, continuity, derivatives and applications",
    };
  }

  if (s < 980) {
    return {
      score: s,
      tierName: "Integral Calculus (920-979)",
      topicFocus: "Definite integrals, substitution and applications",
    };
  }

  return {
    score: s,
    tierName: "Advanced Mathematics (980-1000)",
    topicFocus: "Advanced calculus, series, differential equations and proofs",
  };
}

export function calculateNewScore(
  currentScore: number,
  targetProblemScore: number,
  isCorrect: boolean,
  streak: number
): number {
  const current = Math.max(0, Math.min(1000, currentScore));
  const target = Math.max(0, Math.min(1000, targetProblemScore));

  // Estimate the probability of answering correctly.
  const expected =
    1 / (1 + Math.pow(10, (target - current) / 200));

  const actual = isCorrect ? 1 : 0;

  // ELO adjustment.
  const K = 32;
  const baseChange = K * (actual - expected);

  // Reward consecutive correct answers.
  const streakBonus = isCorrect
    ? Math.min(15, Math.max(0, streak) * 3)
    : 0;

  const change = Math.round(baseChange + streakBonus);

  return Math.max(0, Math.min(1000, current + change));
}
