import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, CalendarDays, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getRegistrosHistorico, type RegistroHistorico } from "@/api";

const acoes = { criado: "Criado", atualizado: "Atualizado", deletado: "Excluído" };
const entidades: Record<string, string> = {
  os: "Ordem de serviço", projetos: "Projeto", manutencoes: "Manutenção",
  usuarios: "Usuário", time: "Equipe", equipamentos: "Equipamento",
  anexo: "Anexo", notificacoes: "Notificação", notificacao_leituras: "Leitura de notificação",
  item_equipamento_os: "Equipamento da OS", item_equipamento_projeto: "Equipamento do projeto",
  item_equipamento_manutencao: "Equipamento da manutenção",
};

function dadosObjeto(raw: RegistroHistorico["dados"]): Record<string, unknown> {
  if (typeof raw !== "string") return raw ?? {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

function destino(item: RegistroHistorico, dados: Record<string, unknown>): string | null {
  const tabela = item.tabela;
  if (tabela === "os" || tabela === "item_equipamento_os") {
    const id = dados.os_id ?? (tabela === "os" ? item.registro_id : undefined);
    return id ? `/os/disponiveis/${id}` : null;
  }
  if (tabela === "projetos" || tabela === "item_equipamento_projeto") {
    const id = dados.projeto_id ?? (tabela === "projetos" ? item.registro_id : undefined);
    return id ? `/projetos-totais/${id}` : null;
  }
  if (tabela === "manutencoes" || tabela === "item_equipamento_manutencao") {
    const id = dados.manutencao_id ?? (tabela === "manutencoes" ? item.registro_id : undefined);
    return id ? `/manutencoes-totais/${id}` : null;
  }
  return null;
}

export default function HistoricoAtividade() {
  const navigate = useNavigate();
  const [data, setData] = useState("");
  const [registros, setRegistros] = useState<RegistroHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");
    getRegistrosHistorico(data || undefined)
      .then(({ registros: itens }) => { if (ativo) setRegistros(itens); })
      .catch((error: unknown) => { if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar o histórico."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [data]);

  return (
    <main className="page min-h-full p-4 sm:p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <section className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
          <div className="bg-primary-muted text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16"><Activity size={28} /></div>
          <div><h1 className="text-text m-0 text-xl leading-tight font-bold sm:text-2xl md:text-[32px]">Histórico de atividade</h1><p className="text-text-muted mt-1 mb-0 text-sm md:text-base">Alterações registradas no sistema. Selecione um registro para abrir o item relacionado.</p></div>
        </section>
        <Card className="overflow-hidden rounded-lg border-0 p-0 shadow-none">
          <div className="border-border flex flex-col items-start gap-2 border-b px-3 py-4 sm:px-4">
            <label htmlFor="filtro-data-atividade" className="text-text-muted m-0 text-sm">Filtrar pela data da alteração:</label>
            <div className="relative w-52"><CalendarDays size={18} aria-hidden="true" className="text-primary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" /><input id="filtro-data-atividade" type="date" value={data} onChange={(event) => setData(event.target.value)} className="border-primary/30 bg-primary-muted text-text focus:border-primary focus:ring-primary/20 w-full rounded-lg border py-2 pr-3 pl-10 text-sm outline-none focus:ring-2" /></div>
          </div>
          <div className="border-border w-full overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead><tr className="bg-primary-muted text-text border-primary border"><th className="px-3 py-3">Data e hora</th><th className="px-3 py-3">Registro</th><th className="px-3 py-3">Ação</th><th className="px-3 py-3">Acessar</th></tr></thead>
              <tbody className="text-text">
                {carregando ? <tr><td colSpan={4} className="px-3 py-6 text-center">Carregando histórico…</td></tr>
                  : erro ? <tr><td colSpan={4} role="alert" className="px-3 py-6 text-center">{erro}</td></tr>
                  : registros.length === 0 ? <tr><td colSpan={4} className="px-3 py-6 text-center">Nenhuma alteração encontrada.</td></tr>
                  : registros.map((item) => {
                    const dados = dadosObjeto(item.dados);
                    const href = destino(item, dados);
                    const nome = String(dados.nome ?? dados.nome_time ?? dados.os_titulo ?? dados.resumo ?? "");
                    return <tr key={item.historico_id} className="border-border border-b last:border-b-0">
                      <td className="px-3 py-3">{item.data_historico}</td><td className="px-3 py-3">{entidades[item.tabela] ?? item.tabela}{nome ? ` · ${nome}` : ""}</td><td className="px-3 py-3">{acoes[item.tipo_acao]}</td>
                      <td className="px-3 py-3">{href ? <button type="button" onClick={() => navigate(href)} className="text-primary inline-flex items-center gap-1 rounded bg-transparent font-semibold hover:underline">Abrir <ExternalLink size={14} /></button> : <span className="text-text-muted">—</span>}</td>
                    </tr>;
                  })}
              </tbody>
            </table>
          </div>
          <p className="text-text-muted px-3 py-2 text-xs">Exibindo até 500 registros mais recentes.</p>
        </Card>
      </div>
    </main>
  );
}
