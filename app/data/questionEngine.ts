// correct, sign, operation, varaible isolation, distribution, exponent, formula, graph interpretation

let answerCalculationData = [0, 0, 0, 0, 0, 0, 0, 0];

let answerTotalData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let answerDifficultyData = [1, 1, 1, 1, 1, 1, 1];

//Make a class that is used to create objects for the questions
//Do this later Hari Singh

function CalculateAnswers(
  difficulty: number,

  item: string,
) {
  if (item == "correct") {
    answerCalculationData[0]++;
  }
  if (item == "sign_error") {
    answerCalculationData[1]++;
    answerDifficultyData[1] /= difficulty;
  }
  if (item == "operation_error") {
    answerCalculationData[2]++;
    answerDifficultyData[2] /= difficulty;
  }
  if (item == "variable_isolation_error") {
    answerCalculationData[3]++;
    answerDifficultyData[3] /= difficulty;
  }
  if (item == "distribution_error") {
    answerCalculationData[4]++;
    answerDifficultyData[4] /= difficulty;
  }
  if (item == "exponent_rule_error") {
    answerCalculationData[5]++;
    answerDifficultyData[5] /= difficulty;
  }
  if (item == "formula_error") {
    answerCalculationData[6]++;
    answerDifficultyData[6] /= difficulty;
  }
  if (item == "graph_interpretation_error") {
    answerCalculationData[7]++;
    answerDifficultyData[7] /= difficulty;
  }
  localStorage.setItem(
    "answerCalculationData",
    JSON.stringify(answerCalculationData),
  );
  localStorage.setItem(
    "answerDifficultyData",
    JSON.stringify(answerDifficultyData),
  );
}

function calculateTotal(items: { diagnosis: object }[]) {
  const answers = items.flatMap((item) => Object.values(item.diagnosis));

  for (const answer of answers) {
    if (answer === "correct") {
      answerTotalData[0]++;
    }
    if (answer === "sign_error") {
      answerTotalData[1]++;
    }
    if (answer === "operation_error") {
      answerTotalData[2]++;
    }
    if (answer === "variable_isolation_error") {
      answerTotalData[3]++;
    }
    if (answer === "distribution_error") {
      answerTotalData[4]++;
    }
    if (answer === "exponent_rule_error") {
      answerTotalData[5]++;
    }
    if (answer === "formula_error") {
      answerTotalData[6]++;
    }
    if (answer === "graph_interpretation_error") {
      answerTotalData[7]++;
    }
  }
  localStorage.setItem("answerTotalData", JSON.stringify(answerTotalData));
}

function calculatePercentages(
  answerCalculationData: number[],
  answerTotalData: number[],
  answerDifficultyData: number[],
) {
  return {
    sign_errorPercentage:
      (answerCalculationData[1] / answerTotalData[1]) * answerDifficultyData[0],
    operation_errorPercentage:
      (answerCalculationData[2] / answerTotalData[2]) *
      answerDifficultyData[1] *
      100,
    variable_isolation_errorPercentage:
      (answerCalculationData[3] / answerTotalData[3]) *
      answerDifficultyData[2] *
      100,
    distribution_errorPercentage:
      (answerCalculationData[4] / answerTotalData[4]) *
      answerDifficultyData[3] *
      100,
    exponent_rule_errorPercentage:
      (answerCalculationData[5] / answerTotalData[5]) *
      answerDifficultyData[4] *
      100,
    formula_errorPercentage:
      (answerCalculationData[6] / answerTotalData[6]) *
      answerDifficultyData[5] *
      100,
    graph_interpretation_errorPercentage:
      (answerCalculationData[7] / answerTotalData[7]) *
      answerDifficultyData[6] *
      100,
  };
}

export { calculatePercentages, calculateTotal };
export default CalculateAnswers;
