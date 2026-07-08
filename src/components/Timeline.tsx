import { ChevronDown, ChevronUp } from "lucide-react";
import type { ScenarioStep } from "../types";

type TimelineProps = {
  steps: ScenarioStep[];
  currentStepIndex: number;
  onStepSelect: (index: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Timeline({ steps, currentStepIndex, onStepSelect, collapsed, onToggleCollapse }: TimelineProps) {
  return (
    <section className={["timeline", collapsed ? "collapsed" : ""].filter(Boolean).join(" ")} aria-label="Временная шкала событий">
      <div className="panelTitleRow">
        <button
          type="button"
          className="collapseToggle"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          title={collapsed ? "Развернуть таймлайн" : "Свернуть таймлайн"}
        >
          {collapsed ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          <h2>Timeline</h2>
        </button>
        <span>{currentStepIndex >= 0 ? `${currentStepIndex + 1}/${steps.length}` : "сценарий не запущен"}</span>
      </div>
      {!collapsed && (
        <div className="timelineScroller">
          {steps.map((step, index) => {
            const isCurrent = index === currentStepIndex;
            const isPast = currentStepIndex >= index;
            return (
              <button
                key={step.id}
                type="button"
                className={["timelineItem", isCurrent ? "current" : "", isPast ? "past" : ""].filter(Boolean).join(" ")}
                onClick={() => onStepSelect(index)}
              >
                <time>{step.time}</time>
                <strong>{step.title}</strong>
                <span>{step.description}</span>
                <small>Узлы: {step.affectedNodes.join(", ")}</small>
                <small>Команды: {step.commands.slice(0, 3).join(", ")}</small>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
