import { useEffect, useState } from "react";
import { Activity, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getHistorico, type HistoricoAtividadeItem } from "@/api";

const itensPorPagina = 15;

const nomesAcao: Record<HistoricoAtividadeItem["tipo_acao"], string> = {
  criado: "Criou a OS",
  atualizado: "Atualizou a OS",
  deletado: "Excluiu a OS",
};

function formatarData(data: string): string {
  if (!data) return "—";
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function HistoricoAtividade() {
  const [data, setData] = useState("");
  const [historico, setHistorico] = useState<HistoricoAtividadeItem[]>([]);
  const [pagina, setPagina] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");

    getHistorico(data || undefined)
      .then(({ historico: itens }) => {
        if (ativo) setHistorico(itens);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar o histórico.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [data]);

  useEffect(() => setPagina(0), [data]);

  const totalPaginas = Math.ceil(historico.length / itensPorPagina);
  const atividadesVisiveis = historico.slice(
    pagina * itensPorPagina,
    (pagina + 1) * itensPorPagina,
  );

  return (
    <main className="page min-h-full p-4 sm:p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <section className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
          <div className="bg-primary-muted text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16">
            <Activity size={26} className="sm:hidden" />
            <Activity size={32} className="hidden sm:block" />
          </div>
          <div>
            <h1 className="text-text m-0 text-xl leading-tight font-bold sm:text-2xl md:text-[32px]">
              Histórico de atividade
            </h1>
            <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
              Acompanhe as alterações registradas nas ordens de serviço.
            </p>
          </div>
        </section>
        <Card className="overflow-hidden rounded-lg border-0 p-0 shadow-none">
          <div className="border-border flex flex-col items-start gap-2 border-b px-3 py-4 sm:px-4">
            <label htmlFor="filtro-data-atividade" className="text-text-muted m-0 text-sm md:text-base">
              Filtrar pelo prazo da OS:
            </label>
            <div className="relative w-44">
              <CalendarDays
                size={18}
                aria-hidden="true"
                className="text-primary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              />
              <input
                id="filtro-data-atividade"
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                className="border-primary/30 bg-primary-muted text-text focus:border-primary focus:ring-primary/20 w-full rounded-lg border py-2 pr-3 pl-10 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>
          <div className="border-border w-full overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] table-fixed border-collapse text-left text-[13px] sm:text-sm">
              <thead>
                <tr className="bg-primary-muted text-text border-primary border">
                  <th scope="col" className="w-[13%] px-2 py-3 font-semibold sm:px-3">OS</th>
                  <th scope="col" className="w-[30%] px-2 py-3 font-semibold sm:px-3">Título</th>
                  <th scope="col" className="w-[20%] px-2 py-3 font-semibold sm:px-3">Ação</th>
                  <th scope="col" className="w-[20%] px-2 py-3 font-semibold sm:px-3">Equipe</th>
                  <th scope="col" className="w-[17%] px-2 py-3 font-semibold sm:px-3">Status / prazo</th>
                </tr>
              </thead>
              <tbody className="text-text">
                {carregando ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center">Carregando histórico…</td></tr>
                ) : erro ? (
                  <tr><td colSpan={5} role="alert" className="px-3 py-6 text-center">{erro}</td></tr>
                ) : atividadesVisiveis.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center">Nenhum registro de histórico encontrado.</td></tr>
                ) : atividadesVisiveis.map((item) => (
                  <tr key={item.historico_id} className="border-border border-b last:border-b-0">
                    <td className="break-words px-2 py-3 align-top sm:px-3">#{item.os_id}</td>
                    <td className="break-words px-2 py-3 align-top sm:px-3">{item.os_titulo}</td>
                    <td className="break-words px-2 py-3 align-top sm:px-3">{nomesAcao[item.tipo_acao]}</td>
                    <td className="break-words px-2 py-3 align-top sm:px-3">{item.nome_time ?? "Sem equipe"}</td>
                    <td className="break-words px-2 py-3 align-top sm:px-3">
                      {item.os_status} · {formatarData(item.data_limite)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <nav
              aria-label="Paginação do histórico de atividade"
              className="text-text-muted flex items-center justify-center gap-4 py-3 text-sm"
            >
              <button
                type="button"
                onClick={() => setPagina((atual) => atual - 1)}
                disabled={pagina === 0}
                aria-label="Página anterior"
                className="text-primary rounded bg-transparent px-2 py-1 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >&lt;</button>
              <span aria-live="polite">Página {pagina + 1} de {totalPaginas}</span>
              <button
                type="button"
                onClick={() => setPagina((atual) => atual + 1)}
                disabled={pagina >= totalPaginas - 1}
                aria-label="Próxima página"
                className="text-primary rounded bg-transparent px-2 py-1 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >&gt;</button>
            </nav>
          )}
        </Card>
      </div>
    </main>
  );
}
