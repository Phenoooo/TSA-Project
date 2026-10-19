let correct = 0;
let sign_error = 0;
let operation_error = 0;
let variable_isolation_error = 0;
let distribution_error = 0;
let exponent_rule_error = 0;
let formula_error = 0;
let graph_interpretation_error = 0;

let correctTotal = 0;
let sign_errorTotal = 0;
let operation_errorTotal = 0;
let variable_isolation_errorTotal = 0;
let distribution_errorTotal = 0;
let exponent_rule_errorTotal = 0;
let formula_errorTotal = 0;
let graph_interpretation_errorTotal = 0;

let sign_errorDifficulty = 1;
let operation_errorDifficulty = 1;
let variable_isolation_errorDifficulty = 1;
let distribution_errorDifficulty = 1;
let exponent_rule_errorDifficulty = 1;
let formula_errorDifficulty = 1;
let graph_interpretation_errorDifficulty = 1;

function CalculateAnswers(
  selectedAnswer: string,
  difficulty: number,
  diagnosis: { A: string; B: string; C: string; D: string },
) {
  if (selectedAnswer == "B") {
    {
      if (diagnosis.B === "correct") {
        correct++;
      } else if (diagnosis.B == "sign_error") {
        sign_error++;
        if (sign_error > 0) {
          sign_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.B == "operation_error") {
        operation_error++;
        if (operation_error > 0) {
          operation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.B == "variable_isolation_error") {
        variable_isolation_error++;
        if (variable_isolation_error > 0) {
          variable_isolation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.B == "distribution_error") {
        distribution_error++;
        if (distribution_error > 0) {
          distribution_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.B == "exponent_rule_error") {
        exponent_rule_error++;
        if (exponent_rule_error > 0) {
          exponent_rule_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.B == "formula_error") {
        formula_error++;
        if (formula_error > 0) {
          formula_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.B == "graph_interpretation_error") {
        graph_interpretation_error++;
        if (graph_interpretation_error > 0) {
          graph_interpretation_errorDifficulty *= difficulty;
        }
      }
    }
  }
  if (selectedAnswer == "C") {
    {
      if (diagnosis.C === "correct") {
        correct++;
      } else if (diagnosis.C == "sign_error") {
        sign_error++;
        if (sign_error > 0) {
          sign_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.C == "operation_error") {
        operation_error++;
        if (operation_error > 0) {
          operation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.C == "variable_isolation_error") {
        variable_isolation_error++;
        if (variable_isolation_error > 0) {
          variable_isolation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.C == "distribution_error") {
        distribution_error++;
        if (distribution_error > 0) {
          distribution_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.C == "exponent_rule_error") {
        exponent_rule_error++;
        if (exponent_rule_error > 0) {
          exponent_rule_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.C == "formula_error") {
        formula_error++;
        if (formula_error > 0) {
          formula_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.C == "graph_interpretation_error") {
        graph_interpretation_error++;
        if (graph_interpretation_error > 0) {
          graph_interpretation_errorDifficulty *= difficulty;
        }
      }
    }
  }
  if (selectedAnswer == "A") {
    {
      if (diagnosis.A === "correct") {
        correct++;
      } else if (diagnosis.A == "sign_error") {
        sign_error++;
        if (sign_error > 0) {
          sign_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.A == "operation_error") {
        operation_error++;
        if (operation_error > 0) {
          operation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.A == "variable_isolation_error") {
        variable_isolation_error++;
        if (variable_isolation_error > 0) {
          variable_isolation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.A == "distribution_error") {
        distribution_error++;
        if (distribution_error > 0) {
          distribution_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.A == "exponent_rule_error") {
        exponent_rule_error++;
        if (exponent_rule_error > 0) {
          exponent_rule_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.A == "formula_error") {
        formula_error++;
        if (formula_error > 0) {
          formula_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.A == "graph_interpretation_error") {
        graph_interpretation_error++;
        if (graph_interpretation_error > 0) {
          graph_interpretation_errorDifficulty *= difficulty;
        }
      }
    }
  }
  if (selectedAnswer == "D") {
    {
      if (diagnosis.D === "correct") {
        correct++;
      } else if (diagnosis.D == "sign_error") {
        sign_error++;
        if (sign_error > 0) {
          sign_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.D == "operation_error") {
        operation_error++;
        if (operation_error > 0) {
          operation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.D == "variable_isolation_error") {
        variable_isolation_error++;
        if (variable_isolation_error > 0) {
          variable_isolation_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.D == "distribution_error") {
        distribution_error++;
        if (distribution_error > 0) {
          distribution_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.D == "exponent_rule_error") {
        exponent_rule_error++;
        if (exponent_rule_error > 0) {
          exponent_rule_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.D == "formula_error") {
        formula_error++;
        if (formula_error > 0) {
          formula_errorDifficulty *= difficulty;
        }
      } else if (diagnosis.D == "graph_interpretation_error") {
        graph_interpretation_error++;
        if (graph_interpretation_error > 0) {
          graph_interpretation_errorDifficulty *= difficulty;
        }
      }
    }
  }
}

function calculateTotal(diagnosis: {
  A: string;
  B: string;
  C: string;
  D: string;
}) {
  const diagnosisy = Object.values(diagnosis);

  for (const diagnostic of diagnosisy) {
    if (diagnostic === "correct") {
      correctTotal++;
    }
    if (diagnostic === "sign_error") {
      sign_errorTotal++;
    }
    if (diagnostic === "operation_error") {
      operation_errorTotal++;
    }
    if (diagnostic === "variable_isolation_error") {
      variable_isolation_errorTotal++;
    }
    if (diagnostic === "distribution_error") {
      distribution_errorTotal++;
    }
    if (diagnostic === "exponent_rule_error") {
      exponent_rule_errorTotal++;
    }
    if (diagnostic === "formula_error") {
      formula_errorTotal++;
    }
    if (diagnostic === "graph_interpretation_error") {
      graph_interpretation_errorTotal++;
    }
  }
}

function calculatePercentages() {
  sign_errorDifficulty / sign_error;

  return {
    sign_errorPercentage:
      (sign_error / sign_errorTotal) * sign_errorDifficulty * 1000,
    operation_errorPercentage:
      (operation_error / operation_errorTotal) *
      operation_errorDifficulty *
      100,
    variable_isolation_errorPercentage:
      (variable_isolation_error / variable_isolation_errorTotal) *
      variable_isolation_errorDifficulty *
      100,
    distribution_errorPercentage:
      (distribution_error / distribution_errorTotal) *
      distribution_errorDifficulty *
      100,
    exponent_rule_errorPercentage:
      (exponent_rule_error / exponent_rule_errorTotal) *
      exponent_rule_errorDifficulty *
      100,
    formula_errorPercentage:
      (formula_error / formula_errorTotal) * formula_errorDifficulty * 100,
    graph_interpretation_errorPercentage:
      (graph_interpretation_error / graph_interpretation_errorTotal) *
      graph_interpretation_errorDifficulty *
      100,
  };
}

export { calculatePercentages, calculateTotal };
export default CalculateAnswers;
