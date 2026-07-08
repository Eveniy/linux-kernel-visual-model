import {
  ArrowDownLeft,
  ArrowUpRight,
  Cpu,
  FileText,
  Link2,
  PanelLeftClose,
  ShieldQuestion,
  TerminalSquare,
  TriangleAlert,
} from "lucide-react";
import {
  edgeTypeLabels,
  incomingEdgesFor,
  layerColors,
  layerNames,
  nodeById,
  outgoingEdgesFor,
  parameterById,
  relatedNodesFor,
} from "../utils/model";

type InspectorProps = {
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onParameterSelect: (parameterId: string) => void;
  onRelationSelect: (edgeId: string, focusNodeId: string) => void;
  onCollapse: () => void;
};

const EmptyLine = ({ text }: { text: string }) => <span className="mutedLine">{text}</span>;

export function Inspector({ selectedNodeId, onSelectNode, onParameterSelect, onRelationSelect, onCollapse }: InspectorProps) {
  const node = nodeById.get(selectedNodeId) ?? nodeById.get("memory-management");
  if (!node) {
    return <aside className="inspector">Узел не найден.</aside>;
  }

  const incoming = incomingEdgesFor(node.id);
  const outgoing = outgoingEdgesFor(node.id);
  const relatedNodes = relatedNodesFor(node.id);

  return (
    <aside className="inspector">
      <div className="inspectorHeader">
        <span className="layerPill" style={{ borderColor: layerColors[node.layer], color: layerColors[node.layer] }}>
          {layerNames[node.layer]}
        </span>
        <span className="modelBadge">упрощённая модель</span>
        <button type="button" className="collapseIconButton" onClick={onCollapse} title="Свернуть панель">
          <PanelLeftClose size={16} aria-hidden="true" />
        </button>
      </div>

      <h2>{node.title}</h2>

      <div className="roleMeta">
        <span>
          Слой: <strong>{layerNames[node.layer]}</strong>
        </span>
        <span>
          Категория: <strong>{node.category}</strong>
        </span>
      </div>

      <section className="inspectorSection roleSection">
        <h3>
          <ShieldQuestion size={15} aria-hidden="true" />
          За что отвечает
        </h3>
        <p>{node.description}</p>
      </section>

      <section className="inspectorSection">
        <h3>
          <Cpu size={15} aria-hidden="true" />
          Основные параметры
        </h3>
        {node.parameters.length === 0 ? (
          <EmptyLine text="Нет связанных параметров." />
        ) : (
          <div className="tokenList">
            {node.parameters.map((parameterId) => {
              const parameter = parameterById.get(parameterId);
              return (
                <button
                  key={parameterId}
                  type="button"
                  className="tokenButton"
                  onClick={() => onParameterSelect(parameterId)}
                  title={parameter?.description ?? parameterId}
                >
                  {parameterId}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="inspectorSection">
        <h3>
          <ArrowDownLeft size={15} aria-hidden="true" />
          Как сюда приходят данные
        </h3>
        {incoming.length === 0 ? (
          <EmptyLine text="Нет входящих связей в модели." />
        ) : (
          <ul className="relationList">
            {incoming.slice(0, 10).map((edge) => {
              const sourceTitle = nodeById.get(edge.source)?.title ?? edge.source;
              return (
                <li key={edge.id}>
                  <button
                    type="button"
                    className="relationButton"
                    onClick={() => onRelationSelect(edge.id, edge.source)}
                    title="Подсветить и проиграть связь на карте"
                  >
                    <span className="relationPhrase">
                      <strong>{sourceTitle}</strong>
                      <em>{edgeTypeLabels[edge.type]}</em>
                      <strong>{node.title}</strong>
                    </span>
                    <span className="relationDesc">{edge.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="inspectorSection">
        <h3>
          <ArrowUpRight size={15} aria-hidden="true" />
          На что влияет дальше
        </h3>
        {outgoing.length === 0 ? (
          <EmptyLine text="Нет исходящих связей в модели." />
        ) : (
          <ul className="relationList">
            {outgoing.slice(0, 10).map((edge) => {
              const targetTitle = nodeById.get(edge.target)?.title ?? edge.target;
              return (
                <li key={edge.id}>
                  <button
                    type="button"
                    className="relationButton"
                    onClick={() => onRelationSelect(edge.id, edge.target)}
                    title="Подсветить и проиграть связь на карте"
                  >
                    <span className="relationPhrase">
                      <strong>{node.title}</strong>
                      <em>{edgeTypeLabels[edge.type]}</em>
                      <strong>{targetTitle}</strong>
                    </span>
                    <span className="relationDesc">{edge.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="inspectorSection">
        <h3>
          <FileText size={15} aria-hidden="true" />
          Файлы и интерфейсы
        </h3>
        <ul className="compactList">
          {node.files.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </section>

      <section className="inspectorSection">
        <h3>
          <TerminalSquare size={15} aria-hidden="true" />
          Команды диагностики
        </h3>
        <ul className="commandList">
          {node.commands.map((command) => (
            <li key={command}>
              <code>{command}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="inspectorSection">
        <h3>
          <Link2 size={15} aria-hidden="true" />
          Связанные подсистемы
        </h3>
        <div className="relatedGrid">
          {relatedNodes.slice(0, 12).map((relatedNode) => (
            <button key={relatedNode.id} type="button" onClick={() => onSelectNode(relatedNode.id)}>
              {relatedNode.title}
            </button>
          ))}
        </div>
      </section>

      <section className="inspectorSection warningSection">
        <h3>
          <TriangleAlert size={15} aria-hidden="true" />
          Что происходит под нагрузкой
        </h3>
        <p>{node.overloadBehavior}</p>
        {node.relatedProblems.length > 0 && (
          <ul className="compactList">
            {node.relatedProblems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
