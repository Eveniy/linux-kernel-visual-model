import { Info } from "lucide-react";
import { clarifications } from "../data/clarifications";

export function ClarificationsPanel() {
  return (
    <section className="contentPanel clarificationsPanel">
      <div className="panelHero">
        <div>
          <span className="eyebrow">Важные уточнения</span>
          <h1>Эта модель учебная</h1>
          <p>
            Она показывает причинно-следственные связи и типовую динамику, но не пытается быть точным эмулятором ядра Linux.
          </p>
        </div>
      </div>

      <div className="clarificationList">
        {clarifications.map((item) => (
          <article key={item} className="clarificationItem">
            <Info size={19} aria-hidden="true" />
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
