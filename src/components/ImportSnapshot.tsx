import { Upload } from "lucide-react";
import { useRef } from "react";

const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024; // 2 МБ — снапшот это компактный JSON

type ImportSnapshotProps = {
  onSnapshotText: (text: string) => void;
  onError?: (message: string) => void;
};

export function ImportSnapshot({ onSnapshotText, onError }: ImportSnapshotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_SNAPSHOT_BYTES) {
      onError?.(`Файл слишком большой (${Math.round(file.size / 1024)} КБ). Ожидается JSON до 2 МБ.`);
      resetInput();
      return;
    }

    try {
      const text = await file.text();
      onSnapshotText(text);
    } catch {
      onError?.("Не удалось прочитать файл. Проверьте, что это текстовый JSON.");
    } finally {
      resetInput();
    }
  };

  return (
    <>
      <button
        type="button"
        className="iconTextButton"
        onClick={() => inputRef.current?.click()}
        title="Импортировать снимок системы"
      >
        <Upload size={17} aria-hidden="true" />
        <span>Импорт</span>
      </button>
      <input
        ref={inputRef}
        className="visuallyHidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />
    </>
  );
}
