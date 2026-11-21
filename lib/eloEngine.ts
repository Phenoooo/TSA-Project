export interface MathLevelInfo {
  score: number;
  tierName: string;
  topicFocus: string;
}

export function getMathLevelFromScore(score: number): MathLevelInfo {
  if (score < 100) {
    return {
      score,
      tierName: "Early Foundations (0-99)",
      topicFocus: "Basic arithmetic, number sense, addition, subtraction, multiplication tables, and division",
    };
  }
  if (score < 250) {
    return {
      score,
      tierName: "Pre-Algebra (100-249)",
      topicFocus: "Fractions, decimals, percentages, ratios, negative integers, and order of operations",
    };
  }
  if (score < 400) {
    return {
      score,
      tierName: "Algebra I (250-399)",
      topicFocus: "Single-variable equations, linear inequalities, slope-intercept form, and coordinate graphing",
    };
  }
  if (score < 530) {
    return {
      score,
      tierName: "Geometry (400-529)",
      topicFocus: "Angle relationships, triangle congruence, Pythagorean theorem, perimeter, area, and volume",
    };
  }
  if (score < 650) {
    return {
      score,
      tierName: "Algebra II (530-649)",
      topicFocus: "Quadratic equations, polynomial factoring, radical expressions, and complex numbers",
    };
  }
  if (score < 750) {
    return {
      score,
      tierName: "Statistics & Probability (650-749)",
      topicFocus: "Data interpretation, mean/median/mode, permutations, combinations, and probability rules",
    };
  }
  if (score < 840) {
    return {
      score,
      tierName: "Trigonometry & Pre-Calc (750-839)",
      topicFocus: "Unit circle, trig identities, logarithmic functions, exponential growth, and matrices",
    };
  }
  if (score < 920) {
    return {
      score,
      tierName: "Differential Calculus (840-919)",
      topicFocus: "Limits, continuity, power rule, product/quotient rules, and basic derivatives",
    };
  }
  if (score < 980) {
    return {
      score,
      tierName: "Integral Calculus (920-979)",
      topicFocus: "Definite and indefinite integrals, u-substitution, and area under the curve",
    };
  }
  return {
    score,
    tierName: "Competition & Olympiad (980-1000)",
    topicFocus: "Advanced number theory, modular arithmetic, combinatorics, and proof-style reasoning",
  };
}

export function calculateNewScore(
  currentScore: number,
  targetProblemScore: number,
  isCorrect: boolean,
  streak: number
): number {
  const streakBonus = isCorrect ? Math.min(15, streak * 3) : 0;
  const baseDelta = isCorrect ? 30 : -20;
  
  const newScore = currentScore + baseDelta + streakBonus;
  return Math.max(0, Math.min(1000, newScore));
}