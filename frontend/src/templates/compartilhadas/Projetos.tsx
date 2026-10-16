import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  ClipboardList,
  File,
  FileSignature,
  Link,
  MonitorCog,
  Package,
  ScrollText,
  UserRound,
  UserRoundCog,
  Users,
} from "lucide-react";

import { abrirAnexoProjeto, getProjetos } from "@/api";
import type { Projeto, ProjetoAnexo } from "@/api";

const PRIORIDADES: Record<Projeto["prioridade"], string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

function formatarData(data: string | null): string {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Campo({
  icone: Icone,
  rotulo,
  valor,
  className = "",
}: {
  icone: typeof UserRound;
  rotulo: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Icone className="text-text-muted shrink-0" size={22} />
      <div className="min-w-0">
        <span className="text-text-muted block text-xs">{rotulo}</span>
        <span className="text-text block text-sm break-words">{valor}</span>
      </div>
    </div>
  );
}

function ProjetoCard({ projeto }: { projeto: Projeto }) {
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);

  async function abrir(anexo: ProjetoAnexo) {
    setErroAnexo(null);
    try {
      await abrirAnexoProjeto(projeto.id, anexo);
    } catch (error) {
      setErroAnexo(
        error instanceof Error ? error.message : "Não foi possível abrir o anexo.",
      );
    }
  }

  return (
    <article>
      <div className="mb-4 flex items-center gap-4">
        <div className="bg-primary-muted text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
          <ClipboardList size={28} />
        </div>
        <div className="min-w-0">
          <h2 className="text-text m-0 text-2xl leading-tight font-bold break-words">
            {projeto.nome}
          </h2>
          <p className="text-text-muted mt-1 mb-0 text-sm">
            {projeto.tipo_sistema}
          </p>
        </div>
      </div>

      <section className="nova-os-card border-border grid overflow-hidden rounded-xl border shadow-sm md:grid-cols-3">
        {/* Dados do projeto */}
        <div className="border-border grid grid-cols-1 content-start gap-x-6 gap-y-5 border-b p-6 sm:grid-cols-2 md:border-r md:border-b-0">
          <Campo
            icone={UserRoundCog}
            rotulo="Vendedor Responsável"
            valor={projeto.responsavel ?? projeto.vendedor ?? "—"}
          />
          <Campo
            icone={FileSignature}
            rotulo="Data de assinatura do contrato"
            valor={formatarData(projeto.data_assinatura_contrato)}
          />
          <Campo
            icone={MonitorCog}
            rotulo="Tipo do sistema"
            valor={projeto.tipo_sistema}
          />
          <Campo
            icone={ScrollText}
            rotulo="Data de vencimento do contrato"
            valor={formatarData(projeto.data_vencimento_contrato)}
          />
          <Campo
            icone={ChartNoAxesCombined}
            rotulo="Prioridade"
            valor={PRIORIDADES[projeto.prioridade] ?? projeto.prioridade}
          />
          <Campo
            icone={Users}
            rotulo="Time responsável"
            valor={projeto.time?.nome ?? "—"}
          />
        </div>

        {/* Descrição e equipamentos */}
        <div className="border-border flex flex-col gap-6 border-b p-6 md:border-r md:border-b-0">
          <div className="flex gap-3">
            <ClipboardList className="text-text-muted mt-0.5 shrink-0" size={22} />
            <div className="min-w-0">
              <span className="text-text-muted block text-xs">Descrição</span>
              <p className="text-text mt-1 mb-0 text-sm break-words whitespace-pre-line">
                {projeto.descricao || "Sem descrição"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Package className="text-text-muted mt-0.5 shrink-0" size={22} />
            <div className="min-w-0">
              <span className="text-text-muted block text-xs">
                Equipamentos e materiais
              </span>
              {projeto.equipamentos.length ? (
                <ul className="text-text m-0 mt-1 list-none space-y-1 p-0 text-sm">
                  {projeto.equipamentos.map((item) => (
                    <li key={item.nome}>
                      {item.nome}{" "}
                      <span className="text-text-muted">× {item.quantidade}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text mt-1 mb-0 text-sm">Nenhum equipamento</p>
              )}
            </div>
          </div>
        </div>

        {/* Anexos */}
        <div className="p-6">
          <div className="text-text mb-4 flex items-center gap-2 font-semibold">
            <Link className="text-text-muted" size={19} />
            Anexos
          </div>

          {projeto.anexos.length ? (
            <ul className="m-0 list-none space-y-3 p-0">
              {projeto.anexos.map((anexo) => (
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
    </article>
  );
}

export default function Projetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await getProjetos();
        if (ativo) setProjetos(resposta.projetos);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os projetos.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <section className="mb-8 flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <ClipboardList size={32} />
          </div>
          <div>
            <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
              Projetos
            </h1>
            <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
              Acompanhe os projetos
            </p>
          </div>
        </section>

        {carregando ? (
          <p className="text-text-muted text-sm">Carregando projetos...</p>
        ) : erro ? (
          <p className="text-danger text-sm" role="alert">
            {erro}
          </p>
        ) : projetos.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhum projeto disponível.</p>
        ) : (
          <div className="flex flex-col gap-10">
            {projetos.map((projeto) => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}