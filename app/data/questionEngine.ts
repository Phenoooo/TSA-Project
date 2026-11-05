// correct, sign, operation, varaible isolation, distribution, exponent, formula, graph interpretation

const answerDifficultyData = [1, 1, 1, 1, 1, 1, 1];

const errorCategoryIndex: Record<string, number> = {
  sign_error: 1,
  operation_error: 2,
  variable_isolation_error: 3,
  distribution_error: 4,
  exponent_rule_error: 5,
  formula_error: 6,
  graph_interpretation_error: 7,
};

export interface QuestionAnswer {
  error: string;
  questionID: number;
  difficulty: number;
  correct: boolean;
}

class NewQuestion implements QuestionAnswer {
  error: string;
  questionID: number;
  difficulty: number;
  correct: boolean;

  constructor(
    error: string,
    questionID: number,
    difficulty: number,
    correct: boolean,
  ) {
    this.error = error;
    this.questionID = questionID;
    this.difficulty = difficulty;
    this.correct = correct;
  }
}
// the idea is that the graph holds the question id / tells u which question that you got wrong, still have to figure out
// a page that shows the question you got wrong

function saveAnswers(object: NewQuestion) {
  const existingQuestions = JSON.parse(
    localStorage.getItem("questionArray") || "[]",
  );
  existingQuestions.push(object);
  localStorage.setItem("questionArray", JSON.stringify(existingQuestions));
}

function CalculateAnswers(array: NewQuestion[]) {
  const answerCalculationData = [0, 0, 0, 0, 0, 0, 0, 0];
  const correct = array.map((object) => {
    if (object.correct) {
      answerCalculationData[0]++;
      return 1;
    }

    const index = errorCategoryIndex[object.error];
    if (index !== undefined) {
      answerCalculationData[index]++;
    }

    return 0;
  });

  localStorage.setItem(
    "answerCalculationData",
    JSON.stringify(answerCalculationData),
  );
  localStorage.setItem(
    "answerDifficultyData",
    JSON.stringify(answerDifficultyData),
  );
  localStorage.setItem("correct", JSON.stringify(correct));
}

function calculateTotal(items: { diagnosis: object }[]) {
  const answerTotalData = [0, 0, 0, 0, 0, 0, 0, 0];
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
    sign_errorPercentage: Math.round(
      (answerCalculationData[1] /
        answerTotalData[1] /
        answerDifficultyData[0]) *
        100,
    ),
    operation_errorPercentage: Math.round(
      (answerCalculationData[2] / answerTotalData[2]) *
        answerDifficultyData[1] *
        100,
    ),
    variable_isolation_errorPercentage: Math.round(
      (answerCalculationData[3] / answerTotalData[3]) *
        answerDifficultyData[2] *
        100,
    ),
    distribution_errorPercentage: Math.round(
      (answerCalculationData[4] / answerTotalData[4]) *
        answerDifficultyData[3] *
        100,
    ),
    exponent_rule_errorPercentage: Math.round(
      (answerCalculationData[5] / answerTotalData[5]) *
        answerDifficultyData[4] *
        100,
    ),
    formula_errorPercentage: Math.round(
      (answerCalculationData[6] / answerTotalData[6]) *
        answerDifficultyData[5] *
        100,
    ),
    graph_interpretation_errorPercentage: Math.round(
      (answerCalculationData[7] / answerTotalData[7]) *
        answerDifficultyData[6] *
        100,
    ),
  };
}

export {
  calculatePercentages,
  calculateTotal,
  NewQuestion,
  saveAnswers,
  CalculateAnswers,
};
export default CalculateAnswers;
