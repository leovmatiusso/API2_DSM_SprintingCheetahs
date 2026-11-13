import { useState } from "react";
import { Activity, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";

const itensPorPagina = 15;

const atividadesExemplo = [
  ["12/12/2026 às 12:12", "João Silva", "Editou o título de uma OS"],
  ["12/12/2026 às 12:12", "João Silva", "Editou o título de uma OS"],
  ["10/10/2026 às 10:10", "Lavinia Linda", "Adicionou um equipamento a uma OS"],
  ["09/09/2026 às 09:09", "Vinícius de Souza", "Criou uma manutenção"],
  ["11/11/2026 às 11:11", "Gustavo Azevedo", "Editou a descrição de um projeto"],
  ["11/11/2026 às 11:11", "Gustavo Azevedo", "Editou a descrição de um projeto"],
  ["11/11/2026 às 11:11", "Gustavo Azevedo", "Editou a descrição de um projeto"],
  ["10/11/2026 às 16:42", "Mariana Costa", "Atualizou o status de uma OS"],
  ["10/11/2026 às 15:18", "Carlos Mendes", "Atribuiu uma OS a uma equipe"],
  ["09/11/2026 às 14:03", "Ana Beatriz", "Editou os dados de um equipamento"],
  ["08/11/2026 às 11:27", "Rafael Lima", "Criou um projeto"],
  ["07/11/2026 às 09:51", "João Silva", "Adicionou um comentário em uma OS"],
  ["06/11/2026 às 17:36", "Lavinia Linda", "Concluiu uma manutenção"],
  ["05/11/2026 às 13:20", "Gustavo Azevedo", "Alterou a prioridade de uma OS"],
  ["04/11/2026 às 10:05", "Vinícius de Souza", "Editou os dados de um projeto"],
  ["03/11/2026 às 08:44", "Mariana Costa", "Criou uma ordem de serviço"],
  ["02/11/2026 às 16:10", "Carlos Mendes", "Atualizou o status de um projeto"],
  ["01/11/2026 às 12:32", "Ana Beatriz", "Removeu um equipamento de uma OS"],
  ["31/10/2026 às 10:14", "Rafael Lima", "Editou a descrição de uma manutenção"],
  ["30/10/2026 às 09:02", "João Silva", "Atribuiu uma OS a um usuário"],
  ["29/10/2026 às 15:45", "Lavinia Linda", "Atualizou os dados de um projeto"],
  ["28/10/2026 às 11:19", "Gustavo Azevedo", "Criou uma manutenção"],
  ["27/10/2026 às 14:56", "Vinícius de Souza", "Alterou a prioridade de um projeto"],
  ["26/10/2026 às 08:30", "Mariana Costa", "Editou o título de uma OS"],
  ["25/10/2026 às 17:08", "Carlos Mendes", "Concluiu uma ordem de serviço"],
  ["24/10/2026 às 13:41", "Ana Beatriz", "Adicionou um equipamento a um projeto"],
  ["23/10/2026 às 09:17", "Rafael Lima", "Atualizou o status de uma manutenção"],
  ["22/10/2026 às 16:23", "João Silva", "Editou os dados de uma equipe"],
  ["21/10/2026 às 10:38", "Lavinia Linda", "Criou uma ordem de serviço"],
  ["20/10/2026 às 11:55", "Gustavo Azevedo", "Editou a descrição de um projeto"],
];

export default function HistoricoAtividade() {
  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.ceil(atividadesExemplo.length / itensPorPagina);
  const atividadesVisiveis = atividadesExemplo.slice(
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
              Acompanhe as atividades realizadas no sistema.
            </p>
          </div>
        </section>
        <Card className="overflow-hidden rounded-lg border-0 p-0 shadow-none">
          <div className="border-border flex flex-col items-start gap-2 border-b px-3 py-4 sm:px-4">
            <label htmlFor="filtro-data-atividade" className="text-text-muted m-0 text-sm md:text-base">
              Escolha um dia:
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
                className="border-primary/30 bg-primary-muted text-text focus:border-primary focus:ring-primary/20 w-full rounded-lg border py-2 pr-3 pl-10 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>
          <div className="border-border w-full overflow-hidden rounded-lg border">
            <table className="w-full table-fixed border-collapse text-left text-[13px] sm:text-sm">
              <thead>
                <tr className="bg-primary-muted text-text border-primary border">
                  <th scope="col" className="w-[31%] px-2 py-3 text-left font-semibold sm:px-3">
                    Data e hora
                  </th>
                  <th scope="col" className="w-[25%] px-2 py-3 text-left font-semibold sm:px-3">
                    Usuário
                  </th>
                  <th scope="col" className="w-[44%] px-2 py-3 text-left font-semibold sm:px-3">
                    Evento
                  </th>
                </tr>
              </thead>
              <tbody className="text-text">
                {atividadesVisiveis.map(([dataHora, usuario, evento], index) => (
                  <tr key={`${dataHora}-${usuario}-${index}`} className="border-border border-b last:border-b-0">
                    <td className="break-words px-2 py-3 align-top sm:px-3">{dataHora}</td>
                    <td className="break-words px-2 py-3 align-top sm:px-3">{usuario}</td>
                    <td className="break-words px-2 py-3 align-top sm:px-3">{evento}</td>
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
              >
                &lt;
              </button>
              <span aria-live="polite">Página {pagina + 1} de {totalPaginas}</span>
              <button
                type="button"
                onClick={() => setPagina((atual) => atual + 1)}
                disabled={pagina >= totalPaginas - 1}
                aria-label="Próxima página"
                className="text-primary rounded bg-transparent px-2 py-1 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                &gt;
              </button>
            </nav>
          )}
        </Card>
      </div>
    </main>
  );
}
