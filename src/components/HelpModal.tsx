import { Info, SlidersHorizontal, Stethoscope, X } from "lucide-react";
import { useEffect } from "react";
import type { ProblemPattern } from "../types";
import { ClarificationsPanel } from "./ClarificationsPanel";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { ParametersPanel } from "./ParametersPanel";

export type HelpTab = "clarifications" | "parameters" | "diagnostics";

type HelpModalProps = {
  tab: HelpTab;
  onTabChange: (tab: HelpTab) => void;
  onClose: () => void;
  highlightedParameterId?: string;
  highlightedProblemId?: string;
  onNodeSelect: (nodeId: string) => void;
  onActivatePattern: (pattern: ProblemPattern) => void;
};

const tabs: { id: HelpTab; label: string; icon: typeof Info }[] = [
  { id: "clarifications", label: "О модели", icon: Info },
  { id: "parameters", label: "Параметры", icon: SlidersHorizontal },
  { id: "diagnostics", label: "Диагностика", icon: Stethoscope },
];

export function HelpModal({
  tab,
  onTabChange,
  onClose,
  highlightedParameterId,
  highlightedProblemId,
  onNodeSelect,
  onActivatePattern,
}: HelpModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Справка" onClick={onClose}>
      <div className="modalCard" onClick={(event) => event.stopPropagation()}>
        <header className="modalHeader">
          <div className="modalTabs" role="tablist">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={tab === item.id ? "modalTab active" : "modalTab"}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="collapseIconButton" onClick={onClose} title="Закрыть справку">
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="modalBody">
          {tab === "clarifications" && <ClarificationsPanel />}
          {tab === "parameters" && (
            <ParametersPanel highlightedParameterId={highlightedParameterId} onNodeSelect={onNodeSelect} />
          )}
          {tab === "diagnostics" && (
            <DiagnosticsPanel highlightedProblemId={highlightedProblemId} onActivatePattern={onActivatePattern} />
          )}
        </div>
      </div>
    </div>
  );
}
