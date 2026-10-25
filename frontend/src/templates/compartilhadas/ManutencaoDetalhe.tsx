import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ChartNoAxesCombined,
  ClipboardList,
  ChevronDown,
  Clock,
  File,
  FileSignature,
  Link,
  Wrench,
  X,
} from "lucide-react";

import {
  abrirAnexoManutencao,
  atualizarManutencao,
  getManutencao,
  getProjetosParaManutencao,
} from "@/api";
import type { Manutencao, ManutencaoAnexo } from "@/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

import DetalhePainel from "./DetalhePainel";
import OrdensDoItem from "./OrdensDoItem";
import { PRIORIDADE_LABEL, formatarData } from "./osEstilos";
import SeletorPrioridade from "../compartilhadas/SeletorPrioridade";
import type { PrioridadeValor } from "../compartilhadas/SeletorPrioridade";
import CampoEquipamentos, { equipamentosParaPayload } from "../compartilhadas/CampoEquipamentos";
import type { EquipamentoForm } from "../compartilhadas/CampoEquipamentos";
import SeletorStatusManutencao, { STATUS_MANUTENCAO_LABEL, type StatusManutencaoValor } from "../compartilhadas/SeletorStatusManutencao";

const TIPOS_MANUTENCAO = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "adaptativa", label: "Adaptativa" },
  { value: "evolutiva", label: "Evolutiva" },
];

export default function ManutencaoDetalhe() {
  const { manutencaoId } = useParams<{ manutencaoId: string }>();
  const navigate = useNavigate();

  const [manutencao, setManutencao] = useState<Manutencao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const [atualizandoStatusRapido, setAtualizandoStatusRapido] = useState(false);

  const handleMudarStatusDireto = async (novoStatus: StatusManutencaoValor) => {
    if (!manutencaoId || !manutencao) return;
    try {
      setAtualizandoStatusRapido(true);
      await atualizarManutencao(manutencaoId, { status_manutencao: novoStatus } as any);
      setManutencao((prev: any) => (prev ? { ...prev, status_manutencao: novoStatus } : null));
      setStatusManutencao(novoStatus);
    } catch (e) {
      console.error("Erro ao atualizar status", e);
    } finally {
      setAtualizandoStatusRapido(false);
    }
  };

  // Estados do Modal de Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [resumo, setResumo] = useState("");
  const [tipoManutencao, setTipoManutencao] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [prioridade, setPrioridade] = useState<PrioridadeValor | "">("media");
  const [dataInicioProblema, setDataInicioProblema] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equipamentosEdit, setEquipamentosEdit] = useState<EquipamentoForm[]>([]);
  const [statusManutencao, setStatusManutencao] = useState<StatusManutencaoValor | "">("aberta");

  // Listas auxiliares
  const [projetos, setProjetos] = useState<{ id_projeto: number; nome: string }[]>([]);
  const [carregandoAux, setCarregandoAux] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!manutencaoId) return;
      try {
        const resposta = await getManutencao(manutencaoId);
        if (ativo && resposta?.manutencao) {
          const m = resposta.manutencao;
          setManutencao(m);
          setResumo(m.resumo || "");
          setTipoManutencao(m.tipo_manutencao || "");
          setProjetoId(m.projeto?.id || "");
          setPrioridade(m.prioridade || "media");
          setDataInicioProblema(m.data_inicio_problema ? m.data_inicio_problema.split("T")[0] : "");
          setDataLimite(m.data_limite ? m.data_limite.split("T")[0] : "");
          setDescricao(m.descricao || "");
          setEquipamentosEdit(
            m.equipamentos.map((eq) => ({
              nome: eq.nome,
              quantidade: eq.quantidade,
            }))
          );
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error ? error.message : "Não foi possível carregar a manutenção.",
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
  }, [manutencaoId]);

  const abrirModalEdicao = async () => {
    setModalAberto(true);
    if (projetos.length === 0) {
      setCarregandoAux(true);
      try {
        const respProj = await getProjetosParaManutencao();
        setProjetos(respProj.projetos);
      } catch (e) {
        console.error("Erro ao carregar dados auxiliares", e);
      } finally {
        setCarregandoAux(false);
      }
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manutencaoId) return;

    if (!prioridade) {
      setErroEdicao("Selecione a prioridade.");
      return;
    }

    try {
      setSalvando(true);
      setErroEdicao(null);

      await atualizarManutencao(manutencaoId, {
        resumo: resumo.trim(),
        tipo_manutencao: tipoManutencao as any,
        projeto_id: projetoId ? projetoId : null,
        prioridade: prioridade as any,
        data_inicio_problema: dataInicioProblema,
        data_limite: dataLimite,
        descricao_situacao: descricao.trim(),
        equipamentos: equipamentosParaPayload(equipamentosEdit),
      });

      const resposta = await getManutencao(manutencaoId);
      setManutencao(resposta.manutencao);
      setModalAberto(false);
    } catch (error) {
      setErroEdicao(
        error instanceof Error ? error.message : "Erro ao salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        {carregando ? (
          <p className="text-text-muted text-sm">Carregando manutenção...</p>
        ) : erro || !manutencao ? (
          <div>
            <p className="text-danger mb-4 text-sm" role="alert">
              {erro ?? "Manutenção não encontrada."}
            </p>
            <Button variant="outline" onClick={() => navigate("/manutencoes")}>
              Voltar
            </Button>
          </div>
        ) : (
          <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-muted text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
                <Wrench size={28} />
              </div>
              <div className="min-w-0">
                <h1 className="text-text m-0 text-2xl leading-tight font-bold break-words md:text-[32px]">
                  {manutencao.resumo}
                </h1>
                <p className="text-text-muted mt-1 mb-0 text-sm">
                  Detalhes da manutenção e ordens de serviço associadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={abrirModalEdicao}>
                Editar Manutenção
              </Button>
              <Button variant="outline" onClick={() => navigate("/manutencoes")}>
                Voltar
              </Button>
            </div>
          </div>

            <DetalhePainel
              campos={[
                {
                  icone: FileSignature,
                  rotulo: "Tipo",
                  valor: manutencao.tipo_manutencao,
                },
                {
                  icone: Clock,
                  rotulo: "Status",
                  valor: (
                    <div className="relative inline-block w-full max-w-[160px]">
                      <select
                        value={(manutencao as any).status_manutencao || "aberta"}
                        onChange={(e) => handleMudarStatusDireto(e.target.value as StatusManutencaoValor)}
                        disabled={atualizandoStatusRapido}
                        className="border-border bg-primary-muted text-primary w-full appearance-none rounded-lg px-3 py-1.5 pr-8 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                      >
                        {Object.entries(STATUS_MANUTENCAO_LABEL).map(([val, label]) => (
                          <option key={val} value={val} className="bg-bg text-text">
                            {label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-primary">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  ),
                },
                {
                  icone: Calendar,
                  rotulo: "Início do problema",
                  valor: formatarData(manutencao.data_inicio_problema),
                },
                {
                  icone: Calendar,
                  rotulo: "Data limite",
                  valor: formatarData(manutencao.data_limite),
                },
                {
                  icone: ClipboardList,
                  rotulo: "Projeto vinculado",
                  valor: manutencao.projeto?.nome ?? "—",
                },
                {
                  icone: ChartNoAxesCombined,
                  rotulo: "Prioridade",
                  valor: PRIORIDADE_LABEL[manutencao.prioridade] ?? manutencao.prioridade,
                },
              ]}
              descricao={manutencao.descricao}
              equipamentos={manutencao.equipamentos}
              anexos={manutencao.anexos}
              abrirAnexo={(anexo: ManutencaoAnexo) => abrirAnexoManutencao(manutencao.id, anexo)}
            />

            <OrdensDoItem
              ordens={manutencao.ordens}
              novaOsPath={`/os/nova-os?manutencao=${manutencao.id}`}
            />
          </>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-bg text-text w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-text text-xl font-bold">Editar Manutenção</h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-text-muted hover:text-text cursor-pointer bg-transparent"
              >
                <X size={20} />
              </button>
            </div>

            {erroEdicao && (
              <div
                className="border-danger/30 bg-danger/10 text-danger mb-6 rounded-lg border px-4 py-3 text-sm"
                role="alert"
              >
                {erroEdicao}
              </div>
            )}

            <form onSubmit={handleSalvarEdicao} className="space-y-6">
              {/* LINHA 1: Resumo, Tipo e Prioridade */}
              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <Input
                    id="edit-resumo"
                    label="Resumo"
                    value={resumo}
                    onChange={(event) => setResumo(event.target.value)}
                    placeholder="Resumo da manutenção"
                    maxLength={255}
                    required
                  />
                </div>

                <Select
                  id="edit-tipo"
                  label="Tipo de manutenção"
                  value={tipoManutencao}
                  onChange={(event) => setTipoManutencao(event.target.value)}
                  required
                >
                  <option value="" hidden>
                    Selecione o tipo
                  </option>
                  {TIPOS_MANUTENCAO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>

                <SeletorPrioridade value={prioridade} onChange={setPrioridade} />
              </div>

              {/* LINHA 2: Projeto vinculado */}
              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
                <Select
                  id="edit-projeto"
                  label="Projeto vinculado (Opcional)"
                  value={projetoId}
                  onChange={(event) => setProjetoId(event.target.value)}
                  disabled={carregandoAux}
                >
                  <option value="">Nenhum projeto</option>
                  {projetos.map((p) => (
                    <option key={p.id_projeto} value={p.id_projeto}>
                      {p.nome}
                    </option>
                  ))}
                </Select>
              </div>
              {/* LINHA 3: Datas */}
              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
                <Input
                  id="edit-data-inicio"
                  type="date"
                  label="Início do problema"
                  value={dataInicioProblema}
                  onChange={(event) => setDataInicioProblema(event.target.value)}
                  required
                />

                <Input
                  id="edit-data-limite"
                  type="date"
                  label="Data limite"
                  value={dataLimite}
                  onChange={(event) => setDataLimite(event.target.value)}
                  required
                />
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="text-text mb-1.5 block text-sm font-semibold">
                  Descrição da situação
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="border-border bg-bg text-text w-full rounded-lg border p-3.5 text-sm leading-6 focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={4}
                  placeholder="Descreva detalhadamente a situação e os procedimentos..."
                  required
                />
              </div>

              {/* EQUIPAMENTOS */}
              <div>
                <CampoEquipamentos value={equipamentosEdit} onChange={setEquipamentosEdit} />
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
