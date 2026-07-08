import { PanelLeftOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HelpModal, type HelpTab } from "./components/HelpModal";
import { Inspector } from "./components/Inspector";
import { LearningPath } from "./components/LearningPath";
import { LinuxMap } from "./components/LinuxMap";
import { MetricsPanel } from "./components/MetricsPanel";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { Timeline } from "./components/Timeline";
import { TopBar } from "./components/TopBar";
import { kernelEdges } from "./data/edges";
import { initialMetrics } from "./data/metrics";
import { kernelParameters } from "./data/parameters";
import { problemPatterns } from "./data/problems";
import { scenarios } from "./data/scenarios";
import type { MetricSnapshot, ProblemPattern, SearchResult } from "./types";
import {
  applySnapshotToMetrics,
  edgeById,
  findLearningPath,
  nodeById,
  nodesAffectedBySnapshot,
  parseSnapshot,
  searchModel,
  type PathResult,
} from "./utils/model";

const unique = (values: string[]): string[] => [...new Set(values)];

function App() {
  const [selectedNodeId, setSelectedNodeId] = useState("memory-management");
  const [selectedScenarioId, setSelectedScenarioId] = useState("memory-pressure");
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metrics, setMetrics] = useState<MetricSnapshot>(initialMetrics);
  const [query, setQuery] = useState("");
  const [highlightedParameterId, setHighlightedParameterId] = useState<string | undefined>();
  const [highlightedProblemId, setHighlightedProblemId] = useState<string | undefined>();
  const [problemNodeIds, setProblemNodeIds] = useState<string[]>([]);
  const [problemEdgeIds, setProblemEdgeIds] = useState<string[]>([]);
  const [snapshotNodeIds, setSnapshotNodeIds] = useState<string[]>([]);
  const [snapshotLabel, setSnapshotLabel] = useState<string | undefined>();
  const [notice, setNotice] = useState("Готово к демонстрации: выберите сценарий или узел на карте.");
  const [learningPath, setLearningPath] = useState<PathResult | null>(null);

  // Справочные разделы (параметры, диагностика, о модели) вынесены в модалку,
  // чтобы не занимать место отдельными пунктами меню.
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>("clarifications");

  // Сворачивание боковой и нижней панелей, чтобы канвас был в центре внимания.
  const [inspectorCollapsed, setInspectorCollapsed] = useState<boolean>(
    () => typeof window !== "undefined" && window.localStorage.getItem("ui.inspectorCollapsed") === "1",
  );
  const [timelineCollapsed, setTimelineCollapsed] = useState<boolean>(
    () => typeof window !== "undefined" && window.localStorage.getItem("ui.timelineCollapsed") === "1",
  );

  useEffect(() => {
    window.localStorage.setItem("ui.inspectorCollapsed", inspectorCollapsed ? "1" : "0");
  }, [inspectorCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("ui.timelineCollapsed", timelineCollapsed ? "1" : "0");
  }, [timelineCollapsed]);

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0];
  const currentStep = currentStepIndex >= 0 ? selectedScenario.steps[currentStepIndex] : undefined;
  const searchResults = useMemo(() => searchModel(query), [query]);

  const metricsForStep = useCallback(
    (index: number): MetricSnapshot =>
      selectedScenario.steps.slice(0, index + 1).reduce<MetricSnapshot>(
        (snapshot, step) => ({
          ...snapshot,
          ...step.metrics,
        }),
        initialMetrics,
      ),
    [selectedScenario],
  );

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (currentStepIndex >= selectedScenario.steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentStepIndex((index) => Math.min(index + 1, selectedScenario.steps.length - 1));
    }, 1300);

    return () => window.clearTimeout(timer);
  }, [currentStepIndex, isPlaying, selectedScenario.steps.length]);

  // Единственный источник истины для метрик шага сценария.
  useEffect(() => {
    if (currentStepIndex >= 0) {
      setMetrics(metricsForStep(currentStepIndex));
    }
  }, [currentStepIndex, metricsForStep]);

  const scenarioNodeIds = useMemo(() => {
    if (currentStepIndex < 0) {
      return [];
    }
    return unique(selectedScenario.steps.slice(0, currentStepIndex + 1).flatMap((step) => step.affectedNodes));
  }, [currentStepIndex, selectedScenario]);

  const scenarioEdgeIds = useMemo(() => {
    const active = new Set(scenarioNodeIds);
    return kernelEdges.filter((edge) => active.has(edge.source) && active.has(edge.target)).map((edge) => edge.id);
  }, [scenarioNodeIds]);

  const activeNodeIds = useMemo(
    () => unique([...scenarioNodeIds, ...snapshotNodeIds, ...problemNodeIds, ...(learningPath?.nodeIds ?? [])]),
    [learningPath, problemNodeIds, scenarioNodeIds, snapshotNodeIds],
  );

  const activeEdgeIds = useMemo(
    () => unique([...scenarioEdgeIds, ...problemEdgeIds, ...(learningPath?.edgeIds ?? [])]),
    [learningPath, problemEdgeIds, scenarioEdgeIds],
  );

  const clearTransientHighlights = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setProblemNodeIds([]);
    setProblemEdgeIds([]);
    setHighlightedProblemId(undefined);
    setSnapshotNodeIds([]);
    setSnapshotLabel(undefined);
  };

  const openHelp = (tab: HelpTab) => {
    setHelpTab(tab);
    setHelpOpen(true);
  };

  const selectScenarioStep = (index: number) => {
    setLearningPath(null);
    setCurrentStepIndex(index);
    setIsPlaying(false);
  };

  const runScenario = () => {
    setProblemNodeIds([]);
    setProblemEdgeIds([]);
    setHighlightedProblemId(undefined);
    setLearningPath(null);

    if (currentStepIndex < 0 || currentStepIndex >= selectedScenario.steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
    setNotice(`Сценарий запущен: ${selectedScenario.title}`);
  };

  const resetScenario = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setMetrics(initialMetrics);
    setSnapshotNodeIds([]);
    setSnapshotLabel(undefined);
    setLearningPath(null);
    setNotice("Сценарий сброшен. Метрики вернулись к учебной базовой линии.");
  };

  const changeScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setCurrentStepIndex(-1);
    setIsPlaying(false);
    setMetrics(initialMetrics);
    setLearningPath(null);
    setNotice("Выбран новый сценарий. Запустите его, чтобы увидеть динамику.");
  };

  const selectParameter = (parameterId: string) => {
    setHighlightedParameterId(parameterId);
    const relatedNode = kernelParameters.find((parameter) => parameter.id === parameterId)?.relatedNodes[0];
    if (relatedNode) {
      setSelectedNodeId(relatedNode);
    }
    openHelp("parameters");
  };

  const activatePattern = (pattern: ProblemPattern) => {
    setHighlightedProblemId(pattern.id);
    setProblemNodeIds(pattern.nodesToInspect);
    setProblemEdgeIds(pattern.edgesToHighlight);
    setLearningPath(null);
    setSelectedNodeId(pattern.nodesToInspect[0] ?? selectedNodeId);
    setHelpOpen(false);
    setNotice(`Подсвечена диагностическая цепочка: ${pattern.title}`);
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    setQuery("");
    if (result.kind === "node") {
      setSelectedNodeId(result.id);
      return;
    }
    if (result.kind === "parameter") {
      selectParameter(result.id);
      return;
    }
    if (result.kind === "scenario") {
      changeScenario(result.id);
      return;
    }
    const problem = problemPatterns.find((item) => item.id === result.id);
    if (problem) {
      setHighlightedProblemId(problem.id);
      openHelp("diagnostics");
    }
  };

  const handleSnapshotText = (text: string) => {
    const result = parseSnapshot(text);
    if (result.error || !result.snapshot) {
      setNotice(result.error ?? "Snapshot не импортирован.");
      return;
    }

    const snapshot = result.snapshot;
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    // Считаем от initialMetrics — импорт идемпотентен и не зависит от прошлого состояния.
    setMetrics(applySnapshotToMetrics(initialMetrics, snapshot));
    setSnapshotNodeIds(nodesAffectedBySnapshot(snapshot));
    setSnapshotLabel([snapshot.hostname, snapshot.kernel].filter(Boolean).join(" · ") || "snapshot JSON");
    setProblemNodeIds([]);
    setProblemEdgeIds([]);
    setHighlightedProblemId(undefined);
    setLearningPath(null);
    setNotice("Snapshot импортирован: метрики обновлены, связанные узлы подсвечены.");
  };

  const explainPath = (startId: string, endId: string) => {
    const path = findLearningPath(startId, endId);
    clearTransientHighlights();
    setMetrics(initialMetrics);
    setLearningPath(path);
    if (path?.nodeIds[0]) {
      setSelectedNodeId(path.nodeIds[0]);
    }
    setNotice(path ? "Путь найден и подсвечен на карте." : "Путь не найден в текущей модели.");
  };

  const highlightRelation = (edgeId: string, focusNodeId: string) => {
    const edge = edgeById.get(edgeId);
    if (!edge) {
      return;
    }

    const sourceTitle = nodeById.get(edge.source)?.title ?? edge.source;
    const targetTitle = nodeById.get(edge.target)?.title ?? edge.target;
    clearTransientHighlights();
    setMetrics(initialMetrics);
    setLearningPath({
      nodeIds: [edge.source, edge.target],
      edgeIds: [edge.id],
      explanation: [`${sourceTitle} -> ${targetTitle}: ${edge.description}`],
    });
    setSelectedNodeId(focusNodeId);
    setNotice(`Связь подсвечена: ${sourceTitle} -> ${targetTitle}.`);
  };

  return (
    <div className="appShell">
      <div className="workspace">
        <TopBar
          query={query}
          searchResults={searchResults}
          selectedScenarioId={selectedScenario.id}
          isPlaying={isPlaying}
          onQueryChange={setQuery}
          onScenarioChange={changeScenario}
          onRunScenario={runScenario}
          onPauseScenario={() => setIsPlaying(false)}
          onResetScenario={resetScenario}
          onSearchResultSelect={handleSearchResultSelect}
          onSnapshotText={handleSnapshotText}
          onSnapshotError={setNotice}
          onOpenHelp={() => openHelp("clarifications")}
        />
        <div className="noticeBar">
          <span>{notice}</span>
          {nodeById.has(selectedNodeId) && <strong>Выбран узел: {nodeById.get(selectedNodeId)?.title}</strong>}
        </div>
        <main className={["mainGrid", inspectorCollapsed ? "inspectorHidden" : ""].filter(Boolean).join(" ")}>
          {inspectorCollapsed ? (
            <button
              type="button"
              className="inspectorReopen"
              onClick={() => setInspectorCollapsed(false)}
              title="Показать панель описания"
            >
              <PanelLeftOpen size={18} aria-hidden="true" />
            </button>
          ) : (
            <Inspector
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onParameterSelect={selectParameter}
              onRelationSelect={highlightRelation}
              onCollapse={() => setInspectorCollapsed(true)}
            />
          )}
          <div className="centerColumn">
            <LinuxMap
              selectedNodeId={selectedNodeId}
              activeNodeIds={activeNodeIds}
              activeEdgeIds={activeEdgeIds}
              pathNodeIds={learningPath?.nodeIds ?? []}
              onSelectNode={setSelectedNodeId}
            />
            <div className="mapPanels">
              <ScenarioPanel scenario={selectedScenario} currentStep={currentStep} />
              <MetricsPanel metrics={metrics} snapshotLabel={snapshotLabel} />
              <LearningPath path={learningPath} onExplainPath={explainPath} />
            </div>
            <Timeline
              steps={selectedScenario.steps}
              currentStepIndex={currentStepIndex}
              onStepSelect={selectScenarioStep}
              collapsed={timelineCollapsed}
              onToggleCollapse={() => setTimelineCollapsed((value) => !value)}
            />
          </div>
        </main>
      </div>

      {helpOpen && (
        <HelpModal
          tab={helpTab}
          onTabChange={setHelpTab}
          onClose={() => setHelpOpen(false)}
          highlightedParameterId={highlightedParameterId}
          highlightedProblemId={highlightedProblemId}
          onNodeSelect={(nodeId) => {
            setSelectedNodeId(nodeId);
            setHelpOpen(false);
          }}
          onActivatePattern={activatePattern}
        />
      )}
    </div>
  );
}

export default App;
