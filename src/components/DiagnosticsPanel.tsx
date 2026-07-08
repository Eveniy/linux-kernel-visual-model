import { Crosshair, Search, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import { problemPatterns } from "../data/problems";
import type { ProblemPattern } from "../types";
import { nodeById } from "../utils/model";

type DiagnosticsPanelProps = {
  highlightedProblemId?: string;
  onActivatePattern: (pattern: ProblemPattern) => void;
};

export function DiagnosticsPanel({ highlightedProblemId, onActivatePattern }: DiagnosticsPanelProps) {
  const [filter, setFilter] = useState("");
  const normalized = filter.trim().toLocaleLowerCase("ru");

  const problems = useMemo(
    () =>
      problemPatterns.filter((problem) => {
        if (!normalized) {
          return true;
        }
        return [
          problem.title,
          ...problem.symptoms,
          ...problem.nodesToInspect,
          ...problem.parametersToCheck,
          ...problem.commands,
        ]
          .join(" ")
          .toLocaleLowerCase("ru")
          .includes(normalized);
      }),
    [normalized],
  );

  return (
    <section className="contentPanel diagnosticsPanel">
      <div className="panelHero compactHero">
        <div>
          <span className="eyebrow">Диагностические карточки</span>
          <h1>От симптома к подсистеме</h1>
          <p>Карточки показывают, какие узлы смотреть, какие параметры проверить и какие связи подсветить.</p>
        </div>
        <div className="panelSearch">
          <Search size={17} aria-hidden="true" />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Фильтр: OOM, D state, conntrack..."
            aria-label="Поиск диагностических карточек"
          />
        </div>
      </div>

      <div className="diagnosticGrid">
        {problems.map((problem) => (
          <article key={problem.id} className={problem.id === highlightedProblemId ? "diagnosticCard highlighted" : "diagnosticCard"}>
            <div className="diagnosticTitle">
              <Stethoscope size={18} aria-hidden="true" />
              <h2>{problem.title}</h2>
            </div>

            <section>
              <h3>Симптомы</h3>
              <ul>
                {problem.symptoms.map((symptom) => (
                  <li key={symptom}>{symptom}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Узлы графа</h3>
              <div className="nodeChipRow">
                {problem.nodesToInspect.map((nodeId) => (
                  <span key={nodeId}>{nodeById.get(nodeId)?.title ?? nodeId}</span>
                ))}
              </div>
            </section>

            <section>
              <h3>Параметры</h3>
              <div className="tagRow">
                {problem.parametersToCheck.map((parameter) => (
                  <span key={parameter}>{parameter}</span>
                ))}
              </div>
            </section>

            <section>
              <h3>Команды</h3>
              <div className="commandStack">
                {problem.commands.map((command) => (
                  <code key={command}>{command}</code>
                ))}
              </div>
            </section>

            <button type="button" className="iconTextButton" onClick={() => onActivatePattern(problem)}>
              <Crosshair size={17} aria-hidden="true" />
              <span>Подсветить на карте</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
