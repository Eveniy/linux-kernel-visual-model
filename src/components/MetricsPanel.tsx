import { Activity, Database, Gauge, HardDrive, Network, ServerCrash } from "lucide-react";
import type { MetricSnapshot } from "../types";

type MetricsPanelProps = {
  metrics: MetricSnapshot;
  snapshotLabel?: string;
};

const mb = (value: number): string => `${Math.round(value).toLocaleString("ru-RU")} МБ`;

export function MetricsPanel({ metrics, snapshotLabel }: MetricsPanelProps) {
  const memoryPercent = Math.min(100, Math.round((metrics.ramUsedMb / metrics.ramTotalMb) * 100));
  const cpuStatus = metrics.cpuUsage > 85 ? "danger" : metrics.cpuUsage > 65 ? "warn" : "ok";
  const memoryStatus = memoryPercent > 88 ? "danger" : memoryPercent > 72 ? "warn" : "ok";
  const ioStatus = metrics.ioWait > 15 ? "danger" : metrics.ioWait > 6 ? "warn" : "ok";
  const serviceStatus = metrics.serviceState.includes("failed") ? "danger" : "ok";

  return (
    <section className="metricsPanel" aria-label="Метрики">
      <div className="panelTitleRow">
        <h2>Метрики</h2>
        {snapshotLabel && <span className="snapshotLabel">{snapshotLabel}</span>}
      </div>

      <div className="metricGrid">
        <article className={`metricTile ${cpuStatus}`}>
          <Gauge size={18} aria-hidden="true" />
          <span>CPU usage</span>
          <strong>{metrics.cpuUsage}%</strong>
        </article>
        <article className={`metricTile ${cpuStatus}`}>
          <Activity size={18} aria-hidden="true" />
          <span>Load average</span>
          <strong>{metrics.loadAverage.toFixed(2)}</strong>
        </article>
        <article className={`metricTile ${cpuStatus}`}>
          <Activity size={18} aria-hidden="true" />
          <span>Runnable tasks</span>
          <strong>{metrics.runnableTasks}</strong>
        </article>
        <article className="metricTile">
          <Activity size={18} aria-hidden="true" />
          <span>Context switches</span>
          <strong>{metrics.contextSwitches.toLocaleString("ru-RU")}/s</strong>
        </article>
        <article className={`metricTile ${memoryStatus}`}>
          <Database size={18} aria-hidden="true" />
          <span>RAM used</span>
          <strong>
            {mb(metrics.ramUsedMb)} · {memoryPercent}%
          </strong>
        </article>
        <article className={`metricTile ${memoryStatus}`}>
          <Database size={18} aria-hidden="true" />
          <span>MemAvailable</span>
          <strong>{mb(metrics.memAvailableMb)}</strong>
        </article>
        <article className="metricTile">
          <Database size={18} aria-hidden="true" />
          <span>Page cache</span>
          <strong>{mb(metrics.pageCacheMb)}</strong>
        </article>
        <article className={metrics.dirtyPagesMb > 1200 ? "metricTile warn" : "metricTile"}>
          <Database size={18} aria-hidden="true" />
          <span>Dirty pages</span>
          <strong>{mb(metrics.dirtyPagesMb)}</strong>
        </article>
        <article className={metrics.swapUsedMb > 700 ? "metricTile warn" : "metricTile"}>
          <Database size={18} aria-hidden="true" />
          <span>Swap used</span>
          <strong>{mb(metrics.swapUsedMb)}</strong>
        </article>
        <article className="metricTile">
          <Database size={18} aria-hidden="true" />
          <span>Page faults</span>
          <strong>
            {metrics.majorPageFaults} maj / {metrics.minorPageFaults.toLocaleString("ru-RU")} min
          </strong>
        </article>
        <article className={`metricTile ${ioStatus}`}>
          <HardDrive size={18} aria-hidden="true" />
          <span>Disk R/W</span>
          <strong>
            {mb(metrics.diskReadMb)} / {mb(metrics.diskWriteMb)}
          </strong>
        </article>
        <article className={`metricTile ${ioStatus}`}>
          <HardDrive size={18} aria-hidden="true" />
          <span>I/O wait</span>
          <strong>{metrics.ioWait.toFixed(1)}%</strong>
        </article>
        <article className="metricTile">
          <Network size={18} aria-hidden="true" />
          <span>Network RX/TX</span>
          <strong>
            {mb(metrics.networkRxMb)} / {mb(metrics.networkTxMb)}
          </strong>
        </article>
        <article className="metricTile">
          <Activity size={18} aria-hidden="true" />
          <span>Process / threads</span>
          <strong>
            {metrics.processCount} / {metrics.threadCount}
          </strong>
        </article>
        <article className={metrics.oomEvents > 0 ? "metricTile danger" : "metricTile"}>
          <ServerCrash size={18} aria-hidden="true" />
          <span>OOM events</span>
          <strong>{metrics.oomEvents}</strong>
        </article>
        <article className={`metricTile ${serviceStatus}`}>
          <ServerCrash size={18} aria-hidden="true" />
          <span>Service state</span>
          <strong>{metrics.serviceState}</strong>
        </article>
      </div>
    </section>
  );
}
