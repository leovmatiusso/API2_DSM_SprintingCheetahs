import { useRef } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { File as ArquivoIcone, Link, Upload, X } from "lucide-react";

export interface AnexoForm {
  id: number;
  nome: string;
  tamanho: string;
  arquivo: File;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

// Converte os arquivos escolhidos no formato esperado pelo backend (base64)
export function anexosParaPayload(anexos: AnexoForm[]) {
  return Promise.all(
    anexos.map(
      (anexo) =>
        new Promise<{
          nome_anexo: string;
          anexo_tipo: string;
          anexo_tamanho: number;
          conteudo_arquivo_base64: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resultado = String(reader.result ?? "");
            const separador = resultado.indexOf(",");
            resolve({
              nome_anexo: anexo.arquivo.name,
              anexo_tipo: anexo.arquivo.type || "application/pdf",
              anexo_tamanho: anexo.arquivo.size,
              conteudo_arquivo_base64:
                separador >= 0 ? resultado.slice(separador + 1) : resultado,
            });
          };
          reader.onerror = () =>
            reject(new Error(`Não foi possível ler ${anexo.nome}.`));
          reader.readAsDataURL(anexo.arquivo);
        }),
    ),
  );
}

// Lista de anexos + botão Upload (somente PDF). "acoes" aparece à direita do Upload.
export default function CampoAnexos({
  anexos,
  onChange,
  acoes,
}: {
  anexos: AnexoForm[];
  onChange: (anexos: AnexoForm[]) => void;
  acoes?: ReactNode;
}) {
  const inputArquivo = useRef<HTMLInputElement>(null);

  function adicionar(event: ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(event.target.files ?? []);
    const pdfs = escolhidos.filter((arquivo) => arquivo.type === "application/pdf");

    if (pdfs.length !== escolhidos.length) {
      alert("Apenas arquivos PDF são permitidos.");
    }

    onChange([
      ...anexos,
      ...pdfs.map((arquivo, index) => ({
        id: Date.now() + index,
        nome: arquivo.name,
        tamanho: formatarTamanho(arquivo.size),
        arquivo,
      })),
    ]);

    event.target.value = "";
  }

  return (
    <div>
      <div className="text-text mb-3 flex items-center gap-2 text-base font-semibold">
        <Link size={18} className="text-text-muted" />
        Anexos
        <span className="text-text-muted text-xs font-normal">(opcional)</span>
      </div>

      {anexos.map((anexo) => (
        <div
          key={anexo.id}
          className="flex min-h-[34px] items-center gap-3 py-1 text-sm"
        >
          <ArquivoIcone size={18} className="text-text-muted shrink-0" />
          <span className="text-text min-w-0 truncate">{anexo.nome}</span>
          <span className="text-text-muted ml-6 shrink-0 text-xs">{anexo.tamanho}</span>
          <button
            type="button"
            className="text-text-muted shrink-0 cursor-pointer p-1 hover:text-red-500"
            onClick={() => onChange(anexos.filter((item) => item.id !== anexo.id))}
            aria-label={`Remover ${anexo.nome}`}
          >
            <X size={15} />
          </button>
        </div>
      ))}

      <input
        ref={inputArquivo}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        hidden
        onChange={adicionar}
      />

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <button
          type="button"
          className="border-primary bg-primary-muted text-primary hover:border-primary-hover hover:bg-primary/25 flex min-w-60 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition"
          onClick={() => inputArquivo.current?.click()}
        >
          <Upload size={18} />
          Upload
        </button>

        {acoes && <div className="ml-auto flex items-center gap-6">{acoes}</div>}
      </div>
    </div>
  );
}
