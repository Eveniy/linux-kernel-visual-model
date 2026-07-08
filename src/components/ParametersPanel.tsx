import { AlertTriangle, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { kernelParameters } from "../data/parameters";
import { nodeById } from "../utils/model";

type ParametersPanelProps = {
  highlightedParameterId?: string;
  onNodeSelect: (nodeId: string) => void;
};

export function ParametersPanel({ highlightedParameterId, onNodeSelect }: ParametersPanelProps) {
  const [filter, setFilter] = useState("");
  const normalized = filter.trim().toLocaleLowerCase("ru");

  const grouped = useMemo(() => {
    const visible = kernelParameters.filter((parameter) => {
      if (!normalized) {
        return true;
      }
      return [
        parameter.name,
        parameter.subsystem,
        parameter.path,
        parameter.description,
        parameter.changes,
        parameter.risk,
        ...parameter.affects,
        ...parameter.viewCommands,
      ]
        .join(" ")
        .toLocaleLowerCase("ru")
        .includes(normalized);
    });

    return visible.reduce<Record<string, typeof kernelParameters>>((acc, parameter) => {
      acc[parameter.subsystem] = [...(acc[parameter.subsystem] ?? []), parameter];
      return acc;
    }, {});
  }, [normalized]);

  return (
    <section className="contentPanel parametersPanel">
      <div className="panelHero compactHero">
        <div>
          <span className="eyebrow">Каталог параметров</span>
          <h1>sysctl и cgroup v2</h1>
          <p>Справочник runtime-параметров, связанных с узлами графа и учебными сценариями.</p>
        </div>
        <div className="panelSearch">
          <Search size={17} aria-hidden="true" />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Фильтр: dirty_ratio, swappiness, pids..."
            aria-label="Поиск параметров"
          />
        </div>
      </div>

      <div className="sysctlWarning">
        <AlertTriangle size={18} aria-hidden="true" />
        <span>Изменение sysctl-параметров может повлиять на стабильность, производительность, сеть или безопасность системы.</span>
      </div>

      <div className="parameterGroups">
        {Object.entries(grouped).map(([group, parameters]) => (
          <section key={group} className="parameterGroup">
            <h2>
              <SlidersHorizontal size={18} aria-hidden="true" />
              {group}
              <span>{parameters.length}</span>
            </h2>
            <div className="parameterList">
              {parameters.map((parameter) => (
                <article
                  key={parameter.id}
                  className={parameter.id === highlightedParameterId ? "parameterCard highlighted" : "parameterCard"}
                >
                  <div className="parameterHeader">
                    <strong>{parameter.name}</strong>
                    <code>{parameter.path}</code>
                  </div>
                  <p>{parameter.description}</p>
                  <dl className="detailGrid">
                    <div>
                      <dt>Тип</dt>
                      <dd>{parameter.valueType}</dd>
                    </div>
                    <div>
                      <dt>Пример</dt>
                      <dd>{parameter.exampleValue}</dd>
                    </div>
                    <div>
                      <dt>Безопасный диапазон</dt>
                      <dd>{parameter.safeRange}</dd>
                    </div>
                    <div>
                      <dt>Что меняет</dt>
                      <dd>{parameter.changes}</dd>
                    </div>
                  </dl>

                  <div className="tagRow">
                    {parameter.affects.map((affect) => (
                      <span key={affect}>{affect}</span>
                    ))}
                  </div>

                  <div className="nodeChipRow">
                    {parameter.relatedNodes.map((nodeId) => (
                      <button key={nodeId} type="button" onClick={() => onNodeSelect(nodeId)}>
                        {nodeById.get(nodeId)?.title ?? nodeId}
                      </button>
                    ))}
                  </div>

                  <div className="commandColumns">
                    <div>
                      <h3>Просмотр</h3>
                      {parameter.viewCommands.map((command) => (
                        <code key={command}>{command}</code>
                      ))}
                    </div>
                    <div>
                      <h3>Изменение только как справка</h3>
                      {parameter.changeCommands.map((command) => (
                        <code key={command}>{command}</code>
                      ))}
                    </div>
                  </div>

                  <p className="riskText">{parameter.risk}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
