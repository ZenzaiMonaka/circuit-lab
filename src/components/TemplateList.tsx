import { groupByCategory } from "../templates";
import { CATEGORY_LABELS } from "../templates/types";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplateList({ selectedId, onSelect }: Props) {
  return (
    <ul className="template-list">
      {groupByCategory().map(([category, templates]) => (
        <li key={category}>
          <h2>{CATEGORY_LABELS[category]}</h2>
          <ul>
            {templates.map((template) => (
              <li key={template.id}>
                <a
                  href={`#/${template.id}`}
                  aria-current={template.id === selectedId ? "page" : undefined}
                  onClick={() => onSelect(template.id)}
                >
                  {template.title}
                </a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
