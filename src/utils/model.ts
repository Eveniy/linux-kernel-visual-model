import { kernelEdges } from "../data/edges";
import { kernelNodes } from "../data/nodes";
import { kernelParameters } from "../data/parameters";
import { problemPatterns } from "../data/problems";
import { scenarios } from "../data/scenarios";
import type {
  AppSection,
  EdgeType,
  KernelEdge,
  KernelNode,
  Layer,
  MetricSnapshot,
  SearchResult,
  SystemSnapshot,
} from "../types";

export const layerNames: Record<Layer, string> = {
  hardware: "Hardware",
  kernel: "Kernel space",
  userspace: "Userspace",
  observability: "Observability",
};

export const layerColors: Record<Layer, string> = {
  hardware: "#22d3ee",
  kernel: "#f59e0b",
  userspace: "#34d399",
  observability: "#c084fc",
};

export const edgeTypeLabels: Record<EdgeType, string> = {
  consumes: "потребляет",
  controls: "управляет",
  exposes: "предоставляет",
  observes: "наблюдает",
  triggers: "вызывает",
  limits: "ограничивает",
  schedules: "планирует",
  mounts: "монтирует",
  isolates: "изолирует",
  logs: "логирует",
  depends_on: "зависит от",
  reports_to: "передает состояние",
  configures: "настраивает",
  throttles: "замедляет",
};

export const sectionLabels: Record<AppSection, string> = {
  map: "Карта Linux",
  parameters: "Параметры",
  diagnostics: "Диагностика",
  clarifications: "Уточнения",
};

export const nodeById = new Map(kernelNodes.map((node) => [node.id, node]));
export const parameterById = new Map(kernelParameters.map((parameter) => [parameter.id, parameter]));
export const edgeById = new Map(kernelEdges.map((edge) => [edge.id, edge]));

export const incomingEdgesFor = (nodeId: string): KernelEdge[] => kernelEdges.filter((edge) => edge.target === nodeId);

export const outgoingEdgesFor = (nodeId: string): KernelEdge[] => kernelEdges.filter((edge) => edge.source === nodeId);

export const relatedNodesFor = (nodeId: string): KernelNode[] => {
  const ids = new Set<string>();
  kernelEdges.forEach((edge) => {
    if (edge.source === nodeId) {
      ids.add(edge.target);
    }
    if (edge.target === nodeId) {
      ids.add(edge.source);
    }
  });
  return [...ids].map((id) => nodeById.get(id)).filter((node): node is KernelNode => Boolean(node));
};

const haystackIncludes = (query: string, values: string[]): boolean =>
  values.some((value) => value.toLocaleLowerCase("ru").includes(query));

export const searchModel = (rawQuery: string): SearchResult[] => {
  const query = rawQuery.trim().toLocaleLowerCase("ru");
  if (!query) {
    return [];
  }

  const nodeResults: SearchResult[] = kernelNodes
    .filter((node) =>
      haystackIncludes(query, [
        node.title,
        node.category,
        node.description,
        node.overloadBehavior,
        ...node.parameters,
        ...node.commands,
        ...node.files,
        ...node.relatedProblems,
      ]),
    )
    .map((node) => ({
      kind: "node",
      id: node.id,
      title: node.title,
      subtitle: `${layerNames[node.layer]} - ${node.category}`,
    }));

  const parameterResults: SearchResult[] = kernelParameters
    .filter((parameter) =>
      haystackIncludes(query, [
        parameter.name,
        parameter.subsystem,
        parameter.path,
        parameter.description,
        parameter.changes,
        parameter.risk,
        ...parameter.affects,
        ...parameter.viewCommands,
        ...parameter.changeCommands,
      ]),
    )
    .map((parameter) => ({
      kind: "parameter",
      id: parameter.id,
      title: parameter.name,
      subtitle: `${parameter.subsystem} - ${parameter.path}`,
    }));

  const scenarioResults: SearchResult[] = scenarios
    .filter((scenario) =>
      haystackIncludes(query, [
        scenario.title,
        scenario.summary,
        ...scenario.steps.flatMap((step) => [step.title, step.description, ...step.commands, ...step.changedParameters]),
      ]),
    )
    .map((scenario) => ({
      kind: "scenario",
      id: scenario.id,
      title: scenario.title,
      subtitle: scenario.summary,
    }));

  const problemResults: SearchResult[] = problemPatterns
    .filter((problem) =>
      haystackIncludes(query, [
        problem.title,
        ...problem.symptoms,
        ...problem.parametersToCheck,
        ...problem.commands,
        ...problem.nodesToInspect,
      ]),
    )
    .map((problem) => ({
      kind: "problem",
      id: problem.id,
      title: problem.title,
      subtitle: problem.symptoms.join("; "),
    }));

  return [...nodeResults, ...parameterResults, ...scenarioResults, ...problemResults].slice(0, 24);
};

export type PathResult = {
  nodeIds: string[];
  edgeIds: string[];
  explanation: string[];
};

type PathStep = {
  nodeId: string;
  edge: KernelEdge;
  reversed: boolean;
};

const reconstructPath = (target: string, previous: Map<string, PathStep>): PathResult => {
  const nodeIds: string[] = [target];
  const edgeIds: string[] = [];
  const explanation: string[] = [];
  let current = target;

  while (previous.has(current)) {
    const item = previous.get(current);
    if (!item) {
      break;
    }
    const sourceNode = nodeById.get(item.nodeId);
    const targetNode = nodeById.get(current);
    const edgeSource = nodeById.get(item.edge.source);
    const edgeTarget = nodeById.get(item.edge.target);
    const detail = item.reversed
      ? `связь используется в обратном направлении; на карте она задана как ${edgeSource?.title ?? item.edge.source} -> ${
          edgeTarget?.title ?? item.edge.target
        }`
      : item.edge.description;
    nodeIds.unshift(item.nodeId);
    edgeIds.unshift(item.edge.id);
    explanation.unshift(`${sourceNode?.title ?? item.nodeId} -> ${targetNode?.title ?? current}: ${detail}`);
    current = item.nodeId;
  }

  return { nodeIds, edgeIds, explanation };
};

export const findLearningPath = (startId: string, endId: string): PathResult | null => {
  if (startId === endId) {
    const node = nodeById.get(startId);
    return {
      nodeIds: [startId],
      edgeIds: [],
      explanation: [`${node?.title ?? startId}: начальный и конечный узел совпадают.`],
    };
  }

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const previous = new Map<string, PathStep>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const nextEdges = kernelEdges.filter((edge) => edge.source === current);
    for (const edge of nextEdges) {
      if (visited.has(edge.target)) {
        continue;
      }
      visited.add(edge.target);
      previous.set(edge.target, { nodeId: current, edge, reversed: false });
      if (edge.target === endId) {
        return reconstructPath(endId, previous);
      }
      queue.push(edge.target);
    }
  }

  const undirectedQueue: string[] = [startId];
  const undirectedVisited = new Set<string>([startId]);
  const undirectedPrevious = new Map<string, PathStep>();

  while (undirectedQueue.length > 0) {
    const current = undirectedQueue.shift();
    if (!current) {
      continue;
    }

    const connectedEdges = kernelEdges.filter((edge) => edge.source === current || edge.target === current);
    for (const edge of connectedEdges) {
      const nextNode = edge.source === current ? edge.target : edge.source;
      if (undirectedVisited.has(nextNode)) {
        continue;
      }
      undirectedVisited.add(nextNode);
      undirectedPrevious.set(nextNode, { nodeId: current, edge, reversed: edge.target === current });
      if (nextNode === endId) {
        return reconstructPath(endId, undirectedPrevious);
      }
      undirectedQueue.push(nextNode);
    }
  }

  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

export const parseSnapshot = (text: string): { snapshot?: SystemSnapshot; error?: string } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Не удалось разобрать JSON. Проверьте синтаксис файла." };
  }

  if (!isRecord(parsed)) {
    return { error: "Snapshot должен быть JSON-объектом." };
  }

  const snapshot: SystemSnapshot = {};
  if (typeof parsed.hostname === "string") {
    snapshot.hostname = parsed.hostname;
  }
  if (typeof parsed.kernel === "string") {
    snapshot.kernel = parsed.kernel;
  }

  if (isRecord(parsed.metrics)) {
    const loadAverageRaw = parsed.metrics.loadAverage;
    snapshot.metrics = {
      memTotalMb: toNumber(parsed.metrics.memTotalMb),
      memAvailableMb: toNumber(parsed.metrics.memAvailableMb),
      swapUsedMb: toNumber(parsed.metrics.swapUsedMb),
      processCount: toNumber(parsed.metrics.processCount),
      loadAverage: Array.isArray(loadAverageRaw)
        ? loadAverageRaw.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
        : undefined,
    };
  }

  if (Array.isArray(parsed.services)) {
    snapshot.services = parsed.services
      .filter(isRecord)
      .filter((service) => typeof service.name === "string" && typeof service.state === "string")
      .map((service) => ({ name: String(service.name), state: String(service.state) }));
  }

  if (isRecord(parsed.sysctl)) {
    snapshot.sysctl = Object.fromEntries(
      Object.entries(parsed.sysctl).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  }

  return { snapshot };
};

// base задаёт опорную точку (обычно initialMetrics), чтобы импорт снапшота был
// идемпотентным: повторный импорт того же файла даёт тот же результат, а cpuUsage/
// oomEvents не "накапливаются" от предыдущего состояния.
export const applySnapshotToMetrics = (base: MetricSnapshot, snapshot: SystemSnapshot): MetricSnapshot => {
  const metrics = snapshot.metrics;
  const failedService = snapshot.services?.find((service) => service.state === "failed");
  const memTotal = metrics?.memTotalMb ?? base.ramTotalMb;
  // memAvailable не может превышать общий объём RAM — иначе в UI появятся
  // противоречивые значения (доступно больше, чем всего).
  const memAvailable = Math.min(metrics?.memAvailableMb ?? base.memAvailableMb, memTotal);
  const swapUsed = metrics?.swapUsedMb ?? base.swapUsedMb;
  const loadAverage = metrics?.loadAverage?.[0] ?? base.loadAverage;
  const processCount = metrics?.processCount ?? base.processCount;

  return {
    ...base,
    ramTotalMb: memTotal,
    memAvailableMb: memAvailable,
    ramUsedMb: Math.max(0, memTotal - memAvailable),
    swapUsedMb: swapUsed,
    loadAverage,
    processCount,
    cpuUsage: loadAverage > 4 ? Math.min(98, base.cpuUsage + 28) : base.cpuUsage,
    oomEvents: failedService ? Math.max(base.oomEvents, 1) : base.oomEvents,
    serviceState: failedService ? `${failedService.name}: failed` : base.serviceState,
  };
};

export const nodesAffectedBySnapshot = (snapshot: SystemSnapshot): string[] => {
  const affected = new Set<string>(["proc", "sys", "memory-management"]);

  if ((snapshot.metrics?.memAvailableMb ?? 999999) < 1024) {
    ["ram", "reclaim", "swap", "oom-killer"].forEach((nodeId) => affected.add(nodeId));
  }
  if ((snapshot.metrics?.swapUsedMb ?? 0) > 0) {
    affected.add("swap");
  }
  if ((snapshot.metrics?.loadAverage?.[0] ?? 0) > 2) {
    ["cpu", "scheduler", "thread", "top-htop"].forEach((nodeId) => affected.add(nodeId));
  }
  if (snapshot.services?.some((service) => service.state === "failed")) {
    ["systemd", "service", "journald", "journalctl"].forEach((nodeId) => affected.add(nodeId));
  }
  if (snapshot.sysctl) {
    Object.keys(snapshot.sysctl).forEach((name) => {
      const parameter = parameterById.get(name);
      parameter?.relatedNodes.forEach((nodeId) => affected.add(nodeId));
    });
  }

  return [...affected];
};
