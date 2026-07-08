export type Layer = "hardware" | "kernel" | "userspace" | "observability";

export type EdgeType =
  | "consumes"
  | "controls"
  | "exposes"
  | "observes"
  | "triggers"
  | "limits"
  | "schedules"
  | "mounts"
  | "isolates"
  | "logs"
  | "depends_on"
  | "reports_to"
  | "configures"
  | "throttles";

export type KernelNode = {
  id: string;
  title: string;
  layer: Layer;
  category: string;
  description: string;
  parameters: string[];
  commands: string[];
  files: string[];
  relatedProblems: string[];
  overloadBehavior: string;
};

export type KernelEdge = {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  description: string;
};

export type KernelParameter = {
  id: string;
  name: string;
  subsystem: string;
  path: string;
  valueType: string;
  exampleValue: string;
  safeRange: string;
  description: string;
  changes: string;
  affects: string[];
  relatedNodes: string[];
  relatedScenarios: string[];
  viewCommands: string[];
  changeCommands: string[];
  risk: string;
};

export type MetricSnapshot = {
  cpuUsage: number;
  loadAverage: number;
  runnableTasks: number;
  contextSwitches: number;
  ramTotalMb: number;
  ramUsedMb: number;
  memAvailableMb: number;
  pageCacheMb: number;
  dirtyPagesMb: number;
  swapUsedMb: number;
  majorPageFaults: number;
  minorPageFaults: number;
  diskReadMb: number;
  diskWriteMb: number;
  ioWait: number;
  networkRxMb: number;
  networkTxMb: number;
  processCount: number;
  threadCount: number;
  oomEvents: number;
  serviceState: string;
};

export type ScenarioStep = {
  id: string;
  time: string;
  title: string;
  description: string;
  affectedNodes: string[];
  changedParameters: string[];
  commands: string[];
  metrics: Partial<MetricSnapshot>;
};

export type Scenario = {
  id: string;
  title: string;
  summary: string;
  steps: ScenarioStep[];
};

export type ProblemPattern = {
  id: string;
  title: string;
  symptoms: string[];
  nodesToInspect: string[];
  parametersToCheck: string[];
  commands: string[];
  edgesToHighlight: string[];
};

export type ImportedService = {
  name: string;
  state: string;
};

export type SystemSnapshot = {
  hostname?: string;
  kernel?: string;
  metrics?: {
    memTotalMb?: number;
    memAvailableMb?: number;
    swapUsedMb?: number;
    loadAverage?: number[];
    processCount?: number;
  };
  services?: ImportedService[];
  sysctl?: Record<string, string>;
};

export type SearchResult =
  | {
      kind: "node";
      id: string;
      title: string;
      subtitle: string;
    }
  | {
      kind: "parameter";
      id: string;
      title: string;
      subtitle: string;
    }
  | {
      kind: "scenario";
      id: string;
      title: string;
      subtitle: string;
    }
  | {
      kind: "problem";
      id: string;
      title: string;
      subtitle: string;
    };

export type AppSection = "map" | "parameters" | "diagnostics" | "clarifications";
