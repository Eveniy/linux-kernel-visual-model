import { Activity, CircleHelp, Pause, Play, RotateCcw, Search } from "lucide-react";
import { scenarios } from "../data/scenarios";
import type { SearchResult } from "../types";
import { ImportSnapshot } from "./ImportSnapshot";

type TopBarProps = {
  query: string;
  searchResults: SearchResult[];
  selectedScenarioId: string;
  isPlaying: boolean;
  onQueryChange: (query: string) => void;
  onScenarioChange: (scenarioId: string) => void;
  onRunScenario: () => void;
  onPauseScenario: () => void;
  onResetScenario: () => void;
  onSearchResultSelect: (result: SearchResult) => void;
  onSnapshotText: (text: string) => void;
  onSnapshotError?: (message: string) => void;
  onOpenHelp: () => void;
};

const resultKindLabels: Record<SearchResult["kind"], string> = {
  node: "Узел",
  parameter: "Параметр",
  scenario: "Сценарий",
  problem: "Проблема",
};

export function TopBar({
  query,
  searchResults,
  selectedScenarioId,
  isPlaying,
  onQueryChange,
  onScenarioChange,
  onRunScenario,
  onPauseScenario,
  onResetScenario,
  onSearchResultSelect,
  onSnapshotText,
  onSnapshotError,
  onOpenHelp,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbarBrand" title="Интерактивная модель ядра Linux">
        <Activity size={20} aria-hidden="true" />
        <strong>Карта Linux</strong>
      </div>

      <div className="searchBox">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск: oom, swappiness, cgroup, iowait, socket..."
          aria-label="Глобальный поиск"
        />
        {searchResults.length > 0 && (
          <div className="searchResults" role="listbox">
            {searchResults.map((result) => (
              <button
                key={`${result.kind}-${result.id}`}
                type="button"
                className="searchResult"
                onClick={() => onSearchResultSelect(result)}
              >
                <span>{resultKindLabels[result.kind]}</span>
                <strong>{result.title}</strong>
                <small>{result.subtitle}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <select
        className="scenarioSelect"
        value={selectedScenarioId}
        onChange={(event) => onScenarioChange(event.target.value)}
        aria-label="Выбор сценария"
      >
        {scenarios.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.title}
          </option>
        ))}
      </select>

      <div className="toolbar">
        <button
          type="button"
          className="iconTextButton primary"
          onClick={isPlaying ? onPauseScenario : onRunScenario}
          title={isPlaying ? "Пауза" : "Запустить сценарий"}
        >
          {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          <span>{isPlaying ? "Пауза" : "Запустить"}</span>
        </button>
        <button type="button" className="iconButton" onClick={onResetScenario} title="Сбросить сценарий">
          <RotateCcw size={17} aria-hidden="true" />
        </button>
        <ImportSnapshot onSnapshotText={onSnapshotText} onError={onSnapshotError} />
        <button type="button" className="iconButton" onClick={onOpenHelp} title="Справка: параметры, диагностика, о модели">
          <CircleHelp size={17} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
