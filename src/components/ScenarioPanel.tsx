import { ListChecks } from "lucide-react";
import type { Scenario, ScenarioStep } from "../types";

type ScenarioPanelProps = {
  scenario: Scenario;
  currentStep?: ScenarioStep;
};

export function ScenarioPanel({ scenario, currentStep }: ScenarioPanelProps) {
  return (
    <section className="scenarioPanel">
      <div className="panelTitleRow">
        <h2>
          <ListChecks size={18} aria-hidden="true" />
          Сценарии
        </h2>
        <span>{scenario.steps.length} шагов</span>
      </div>
      <h3>{scenario.title}</h3>
      <p>{scenario.summary}</p>

      {currentStep ? (
        <div className="currentStepBox">
          <time>{currentStep.time}</time>
          <strong>{currentStep.title}</strong>
          <span>{currentStep.description}</span>
          <div className="tagRow">
            {currentStep.changedParameters.map((parameter) => (
              <span key={parameter}>{parameter}</span>
            ))}
          </div>
          <div className="commandStack">
            {currentStep.commands.map((command) => (
              <code key={command}>{command}</code>
            ))}
          </div>
        </div>
      ) : (
        <p className="mutedLine">Запустите сценарий или выберите шаг на timeline.</p>
      )}
    </section>
  );
}
