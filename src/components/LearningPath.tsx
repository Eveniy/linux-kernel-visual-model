import { GitBranch, Route } from "lucide-react";
import { kernelNodes } from "../data/nodes";
import type { PathResult } from "../utils/model";

type LearningPathProps = {
  path: PathResult | null;
  onExplainPath: (startId: string, endId: string) => void;
};

const examples = [
  ["process", "oom-killer"],
  ["process", "disk"],
  ["service", "memory-management"],
  ["sysctl", "memory-management"],
  ["cgroups", "process"],
  ["user-socket", "nic"],
] as const;

export function LearningPath({ path, onExplainPath }: LearningPathProps) {
  return (
    <section className="learningPanel">
      <div className="panelTitleRow">
        <h2>
          <Route size={18} aria-hidden="true" />
          Объяснить путь
        </h2>
      </div>

      <div className="pathSelectors">
        <select id="path-start" defaultValue="process" aria-label="Начальный узел">
          {kernelNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.title}
            </option>
          ))}
        </select>
        <select id="path-end" defaultValue="oom-killer" aria-label="Конечный узел">
          {kernelNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="iconTextButton"
          onClick={() => {
            const start = document.getElementById("path-start");
            const end = document.getElementById("path-end");
            if (start instanceof HTMLSelectElement && end instanceof HTMLSelectElement) {
              onExplainPath(start.value, end.value);
            }
          }}
        >
          <GitBranch size={16} aria-hidden="true" />
          <span>Показать</span>
        </button>
      </div>

      <div className="examplePaths">
        {examples.map(([startId, endId]) => {
          const start = kernelNodes.find((node) => node.id === startId);
          const end = kernelNodes.find((node) => node.id === endId);
          return (
            <button key={`${startId}-${endId}`} type="button" onClick={() => onExplainPath(startId, endId)}>
              {start?.title ?? startId}
              {" -> "}
              {end?.title ?? endId}
            </button>
          );
        })}
      </div>

      {path ? (
        <ol className="pathExplanation">
          {path.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      ) : (
        <p className="mutedLine">Выберите два узла, чтобы подсветить причинную цепочку.</p>
      )}
    </section>
  );
}
