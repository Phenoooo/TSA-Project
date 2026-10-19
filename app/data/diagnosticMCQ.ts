const MCQS = [
  {
    question: "Solve: 3x+7=19",
    answers: ["x=4", "x=-4", "x=12", "x=6"],
    difficulty: 0.6,
    diagnosis: {
      A: "correct",
      B: "sign_error",
      C: "operation_error",
      D: "variable_isolation_error",
    },
  },
  {
    question: "Solve: 5x-8=17",
    answers: ["x=3", "x=5", "x=-5", "x=25"],
    difficulty: 0.6,
    diagnosis: {
      A: "operation_error",
      B: "correct",
      C: "sign_error",
      D: "variable_isolation_error",
    },
  },
  {
    question: "Simplify 4(x+3)",
    answers: ["4x+3", "4x+12", "x+12", "4x-12"],
    difficulty: 0.6,
    diagnosis: {
      A: "distribution_error",
      B: "correct",
      C: "operation_error",
      D: "sign_error",
    },
  },
  {
    question: "Simplify -3(x-5)",
    answers: ["-3x-15", "-3x+15", "3x+15", "-3x-5"],

    difficulty: 0.55,
    diagnosis: {
      A: "sign_error",
      B: "correct",
      C: "sign_error",
      D: "distribution_error",
    },
  },
  {
    question: "Simplify x^3 * x^4",
    answers: ["x^7", "x^12", "2x^7", "x"],
    difficulty: 0.55,
    diagnosis: {
      A: "correct",
      B: "exponent_rule_error",
      C: "operation_error",
      D: "exponent_rule_error",
    },
  },

  {
    question: "Simplify (x^8) / (x^3)",
    answers: ["x^5", "x^11", "x^24", "x^3"],
    difficulty: 0.6,
    diagnosis: {
      A: "correct",
      B: "exponent_rule_error",
      C: "exponent_rule_error",
      D: "operation_error",
    },
  },
  {
    question: "Simplify (x^2)^4",
    answers: ["x^6", "2x^4", "x^8", "x^16"],
    difficulty: 0.45,
    diagnosis: {
      A: "exponent_rule_error",
      B: "operation_error",
      C: "correct",
      D: "exponent_rule_error",
    },
  },
  {
    question: "Solve 2x+9=21",
    answers: ["x=6", "x=15", "x=-6", "x=12"],

    difficulty: 0.45,
    diagnosis: {
      A: "correct",
      B: "operation_error",
      C: "sign_error",
      D: "variable_isolation_error",
    },
  },
  {
    question: "Solve x/4+3 =8",
    answers: ["x=5", "x=20", "x=2", "x=-20"],

    difficulty: 0.45,
    diagnosis: {
      A: "variable_isolation_error",
      B: "correct",
      C: "operation_error",
      D: "sign_error",
    },
  },
  {
    question: "-4x=20",
    answers: ["x=5", "x=-5", "x=16", "x=-16"],

    difficulty: 0.4,
    diagnosis: {
      A: "sign_error",
      B: "correct",
      C: "operation_error",
      D: "operation_error",
    },
  },
  {
    question:
      "The area of a triangle is A=1/2bh, a triangle has base of 10 and height of 6, what is the area?",
    answers: ["60", "16", "30", "8"],

    difficulty: 0.4,
    diagnosis: {
      A: "formula_error",
      B: "operation_error",
      C: "correct",
      D: "formula_error",
    },
  },
  {
    question:
      "The distance formula is d=√((x2-x1)^2+(y2-y1)^2), what is the distance between (1,2) and (4,6)?",
    answers: ["5", "7", "√7", "25"],

    difficulty: 0.4,
    diagnosis: {
      A: "correct",
      B: "operation_error",
      C: "formula_error",
      D: "formula_error",
    },
  },
  {
    question:
      "A line has points ((0,2)) and ((3,8)). What is its (y)-intercept?",
    answers: ["0", "2", "3", "8"],

    difficulty: 0.45,
    diagnosis: {
      A: "graph_interpretation_error",
      B: "correct",
      C: "graph_interpretation_error",
      D: "graph_interpretation_error",
    },
  },
  {
    question:
      "A graph of (y=f(x)) passes through the point ((4,-3)). What is (f(4))?",
    answers: ["4", "-3", "3", "-4"],

    difficulty: 0.4,
    diagnosis: {
      A: "graph_interpretation_error",
      B: "correct",
      C: "sign_error",
      D: "graph_interpretation_error",
    },
  },
  {
    question:
      "A parabola has a vertex at ((2,-5)) and opens upward. Which statement is true?",
    answers: [
      "Its minimum value is -5",
      "Its maximum value is -5",
      "Its minimum value is 2",
      "Its y-intercept is -5",
    ],

    difficulty: 0.3,
    diagnosis: {
      A: "correct",
      B: "graph_interpretation_error",
      C: "graph_interpretation_error",
      D: "graph_interpretation_error",
    },
  },
  {
    question: "Solve x^2-7x+12=0",
    answers: ["x=3,4", "x=-3,-4", "x=-3,4", "x=7,12"],

    difficulty: 0.3,
    diagnosis: {
      A: "correct",
      B: "sign_error",
      C: "sign_error",
      D: "operation_error",
    },
  },
  {
    question: "Solve 3(x-2)=2x+5",
    answers: ["x=11", "x=-11", "x=1", "x=7"],

    difficulty: 0.25,
    diagnosis: {
      A: "correct",
      B: "sign_error",
      C: "distribution_error",
      D: "operation_error",
    },
  },
  {
    question: "(x^6y^4)/(x^2y)",
    answers: ["x^3y^3", "x^4y^3", "x^8y^5", "x^4y^4"],

    difficulty: 0.25,
    diagnosis: {
      A: "operation_error",
      B: "correct",
      C: "exponent_rule_error",
      D: "exponent_rule_error",
    },
  },
  {
    question:
      "3x+15=The equation for the area of a circle is A=pir^2. A circle has area (49\pi). What is its radius?",
    answers: ["7", "49", "√49pi", "14"],

    difficulty: 0.23,
    diagnosis: {
      A: "correct",
      B: "variable_isolation_error",
      C: "formula_error",
      D: "operation_error",
    },
  },
  {
    question:
      "A function is shown by the points: (-2,5),;(-1,2),;(0,1),;(1,2),;(2,5) At which (x)-value does the function reach its minimum?",
    answers: ["x=-2", "x=1", "x=0", "x=2"],

    difficulty: 0.23,
    diagnosis: {
      A: "graph_interpretation_error",
      B: "graph_interpretation_error",
      C: "correct",
      D: "graph_interpretation_error",
    },
  },
];
export default MCQS;
