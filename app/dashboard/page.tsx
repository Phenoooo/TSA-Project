"use client";

import { calculatePercentages } from "../data/questionEngine";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [percentages, setPercentages] = useState({
    sign_errorPercentage: 0,
    operation_errorPercentage: 0,
    variable_isolation_errorPercentage: 0,
    distribution_errorPercentage: 0,
    exponent_rule_errorPercentage: 0,
    formula_errorPercentage: 0,
    graph_interpretation_errorPercentage: 0,
  });

  useEffect(() => {
    const answerCalculationData = JSON.parse(
      localStorage.getItem("answerCalculationData") || "[]",
    );
    const answerTotalData = JSON.parse(
      localStorage.getItem("answerTotalData") || "[]",
    );
    const answerDifficultyData = JSON.parse(
      localStorage.getItem("answerDifficultyData") || "[]",
    );
    const results = calculatePercentages(
      answerCalculationData,
      answerTotalData,
      answerDifficultyData,
    );
    setPercentages(results);
  }, []);

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Sign error: {percentages.sign_errorPercentage}%</p>
      <p>Operation error: {percentages.operation_errorPercentage}%</p>
      <p>
        Variable isolation error:{" "}
        {percentages.variable_isolation_errorPercentage}%
      </p>
      <p>Distribution error: {percentages.distribution_errorPercentage}%</p>
      <p>Exponent rule error: {percentages.exponent_rule_errorPercentage}%</p>
      <p>Formula error: {percentages.formula_errorPercentage}%</p>
      <p>
        Graph interpretation error:{" "}
        {percentages.graph_interpretation_errorPercentage}%
      </p>
    </main>
  );
}
