import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { ClipboardList, File, Link, Package } from "lucide-react";

import type { ProjetoAnexo } from "@/api";

import { formatarTamanho } from "./osEstilos";

export interface CampoDetalhe {
  icone: ComponentType<{ className?: string; size?: number }>;
  rotulo: string;
  valor: ReactNode;
}

function Campo({ icone: Icone, rotulo, valor }: CampoDetalhe) {
  return (
    <div className="flex items-center gap-3">
      <Icone className="text-text-muted shrink-0" size={22} />
      <div className="min-w-0">
        <span className="text-text-muted block text-xs">{rotulo}</span>
        <span className="text-text block text-sm break-words">{valor}</span>
      </div>
    </div>
  );
}

// Painel de 3 colunas (dados | descrição e equipamentos | anexos)
// usado na tela expandida de projetos e manutenções.
export default function DetalhePainel({
  campos,
  descricao,
  equipamentos,
  anexos,
  abrirAnexo,
}: {
  campos: CampoDetalhe[];
  descricao: string;
  equipamentos: { nome: string; quantidade: number }[];
  anexos: ProjetoAnexo[];
  abrirAnexo: (anexo: ProjetoAnexo) => Promise<void>;
}) {
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);

  async function abrir(anexo: ProjetoAnexo) {
    setErroAnexo(null);
    try {
      await abrirAnexo(anexo);
    } catch (error) {
      setErroAnexo(
        error instanceof Error ? error.message : "Não foi possível abrir o anexo.",
      );
    }
  }

  return (
    <section className="nova-os-card border-border grid overflow-hidden rounded-xl border shadow-sm md:grid-cols-3">
      {/* Dados */}
      <div className="border-border grid grid-cols-1 content-start gap-x-6 gap-y-5 border-b p-6 sm:grid-cols-2 md:border-r md:border-b-0">
        {campos.map((campo) => (
          <Campo key={campo.rotulo} {...campo} />
        ))}
      </div>

      {/* Descrição e equipamentos */}
      <div className="border-border flex flex-col gap-6 border-b p-6 md:border-r md:border-b-0">
        <div className="flex gap-3">
          <ClipboardList className="text-text-muted mt-0.5 shrink-0" size={22} />
          <div className="min-w-0">
            <span className="text-text-muted block text-xs">Descrição</span>
            <p className="text-text mt-1 mb-0 text-sm break-words whitespace-pre-line">
              {descricao || "Sem descrição"}
            </p>
          </div>
        </div>

        {/* Equipamentos: só aparecem se existirem (agora ficam nas O.S.) */}
        {equipamentos.length > 0 && (
          <div className="flex gap-3">
            <Package className="text-text-muted mt-0.5 shrink-0" size={22} />
            <div className="min-w-0">
              <span className="text-text-muted block text-xs">
                Equipamentos e materiais
              </span>
              <ul className="text-text m-0 mt-1 list-none space-y-1 p-0 text-sm">
                {equipamentos.map((item) => (
                  <li key={item.nome}>
                    {item.nome}{" "}
                    <span className="text-text-muted">× {item.quantidade}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Anexos */}
      <div className="p-6">
        <div className="text-text mb-4 flex items-center gap-2 font-semibold">
          <Link className="text-text-muted" size={19} />
          Anexos
        </div>

        {anexos.length ? (
          <ul className="m-0 list-none space-y-3 p-0">
            {anexos.map((anexo) => (
              <li
                key={anexo.id}
                className="text-text-muted flex items-center gap-3 text-sm"
              >
                <File size={17} className="shrink-0" />
                <button
                  type="button"
                  onClick={() => abrir(anexo)}
                  className="text-text hover:text-primary min-w-0 cursor-pointer truncate bg-transparent p-0 text-left underline-offset-2 hover:underline"
                  title={anexo.nome}
                >
                  {anexo.nome}
                </button>
                <span className="ml-auto shrink-0 text-xs">
                  {formatarTamanho(anexo.tamanho)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted m-0 text-sm">Nenhum anexo</p>
        )}

        {erroAnexo && (
          <p className="text-danger mt-3 mb-0 text-xs" role="alert">
            {erroAnexo}
          </p>
        )}
      </div>
    </section>
  );
}
