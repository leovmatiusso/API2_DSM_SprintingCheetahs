import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ChartNoAxesCombined,
  ClipboardList,
  FileSignature,
  MonitorCog,
  ScrollText,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";

import { abrirAnexoProjeto, atualizarProjeto, getProjeto, getVendedores } from "@/api";
import type { Projeto, ProjetoAnexo } from "@/api";
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

const TIPOS_SISTEMA = ["Sistema de Torres", "Sistema de Embarcação", "Sistema de Sonda"];

export default function ProjetoDetalhe() {
  const { projetoId } = useParams<{ projetoId: string }>();
  const navigate = useNavigate();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Estados para o Modal de Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [prioridade, setPrioridade] = useState<PrioridadeValor | "">("media");
  const [tipoSistema, setTipoSistema] = useState("");
  const [dataAssinatura, setDataAssinatura] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equipamentosEdit, setEquipamentosEdit] = useState<EquipamentoForm[]>([]);

  // Listas auxiliares para selects do modal
  const [vendedores, setVendedores] = useState<{ id_usuario: number; nome: string }[]>([]);
  const [carregandoVendedores, setCarregandoVendedores] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!projetoId) return;
      try {
        const resposta = await getProjeto(projetoId);
        if (ativo && resposta?.projeto) {
          const p = resposta.projeto as any;
          setProjeto(p);
          setTitulo(p.nome || "");
          setVendedor(p.vendedor || "");
          setPrioridade(p.prioridade || "media");
          setTipoSistema(p.tipo_sistema || "");
          setDataAssinatura(p.data_assinatura_contrato ? p.data_assinatura_contrato.split("T")[0] : "");
          setDataVencimento(p.data_vencimento_contrato ? p.data_vencimento_contrato.split("T")[0] : "");
          setDataLimite(p.data_limite ? p.data_limite.split("T")[0] : "");
          setDescricao(p.descricao || "");
          setEquipamentosEdit(
            (p.equipamentos || []).map((eq: any) => ({
              nome: eq.nome,
              quantidade: eq.quantidade,
            }))
          );
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o projeto.",
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
  }, [projetoId]);

  const abrirModalEdicao = async () => {
    setModalAberto(true);
    if (vendedores.length === 0) {
      setCarregandoVendedores(true);
      try {
        const respostaVendedores = await getVendedores();
        setVendedores(respostaVendedores.vendedores);
      } catch (e) {
        console.error("Erro ao carregar dados auxiliares para edição", e);
      } finally {
        setCarregandoVendedores(false);
      }
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projetoId) return;

    if (!prioridade) {
      setErroEdicao("Selecione a prioridade.");
      return;
    }

    try {
      setSalvando(true);
      setErroEdicao(null);

      const dadosAtualizadosPayload = {
        nome: titulo.trim(),
        vendedor_nome: vendedor,
        prioridade,
        tipo_sistema: tipoSistema,
        data_assinatura_contrato: dataAssinatura,
        data_vencimento_contrato: dataVencimento,
        data_limite: dataLimite,
        descricao: descricao.trim(),
        equipamentos: equipamentosParaPayload(equipamentosEdit),
      };

      await atualizarProjeto(projetoId, dadosAtualizadosPayload);

      const resposta = await getProjeto(projetoId);
      setProjeto(resposta.projeto);
      
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
          <p className="text-text-muted text-sm">Carregando projeto...</p>
        ) : erro || !projeto ? (
          <div>
            <p className="text-danger mb-4 text-sm" role="alert">
              {erro ?? "Projeto não encontrado."}
            </p>
            <Button variant="outline" onClick={() => navigate("/projetos-totais")}>
              Voltar
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary-muted text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
                  <ClipboardList size={28} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-text m-0 text-2xl leading-tight font-bold break-words md:text-[32px]">
                    {projeto.nome}
                  </h1>
                  <p className="text-text-muted mt-1 mb-0 text-sm">
                    Veja os detalhes e acompanhe as OS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={abrirModalEdicao}>
                  Editar Projeto
                </Button>
                <Button variant="outline" onClick={() => navigate("/projetos-totais")}>
                  Voltar
                </Button>
              </div>
            </div>

            <DetalhePainel
              campos={[
                {
                  icone: UserRoundCog,
                  rotulo: "Responsável",
                  valor: projeto.responsavel ?? "—",
                },
                {
                  icone: FileSignature,
                  rotulo: "Data de assinatura do contrato",
                  valor: formatarData(projeto.data_assinatura_contrato),
                },
                {
                  icone: UserRound,
                  rotulo: "Vendedor",
                  valor: projeto.vendedor ?? "—",
                },
                {
                  icone: ScrollText,
                  rotulo: "Data de vencimento do contrato",
                  valor: formatarData(projeto.data_vencimento_contrato),
                },
                {
                  icone: Calendar,
                  rotulo: "Data limite",
                  valor: formatarData(projeto.data_limite),
                },
                {
                  icone: MonitorCog,
                  rotulo: "Tipo do sistema",
                  valor: projeto.tipo_sistema,
                },
                {
                  icone: ChartNoAxesCombined,
                  rotulo: "Prioridade",
                  valor: PRIORIDADE_LABEL[projeto.prioridade] ?? projeto.prioridade,
                },
              ]}
              descricao={projeto.descricao}
              equipamentos={projeto.equipamentos}
              anexos={projeto.anexos}
              abrirAnexo={(anexo: ProjetoAnexo) => abrirAnexoProjeto(projeto.id, anexo)}
            />

            <OrdensDoItem
              ordens={projeto.ordens}
              novaOsPath={`/os/nova-os?projeto=${projeto.id}`}
            />
          </>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
{modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-bg text-text w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-text text-xl font-bold">Editar Projeto</h2>
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
              {/* LINHA 1: Título, Vendedor, Prioridade */}
              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <Input
                    id="edit-titulo"
                    label="Título do projeto"
                    value={titulo}
                    onChange={(event) => setTitulo(event.target.value)}
                    placeholder="Ex.: Desenvolvimento de novo equipamento"
                    maxLength={150}
                    required
                  />
                </div>

                <Select
                  id="edit-vendedor"
                  label="Vendedor"
                  value={vendedor}
                  onChange={(event) => setVendedor(event.target.value)}
                  disabled={carregandoVendedores}
                  required
                >
                  <option value="" hidden>
                    {carregandoVendedores ? "Carregando..." : "Selecione o vendedor"}
                  </option>
                  {vendedores.map((v) => (
                    <option key={v.id_usuario} value={v.nome}>
                      {v.nome}
                    </option>
                  ))}
                </Select>

                <SeletorPrioridade value={prioridade} onChange={setPrioridade} />
              </div>

              {/* LINHA 2: Tipo de sistema e Datas */}
              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
                <Select
                  id="edit-tipo-sistema"
                  label="Tipo de sistema"
                  value={tipoSistema}
                  onChange={(event) => setTipoSistema(event.target.value)}
                  required
                >
                  <option value="" hidden>
                    Selecione o tipo de sistema
                  </option>
                  {TIPOS_SISTEMA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </Select>

                <Input
                  id="edit-data-assinatura"
                  type="date"
                  label="Assinatura contratual"
                  value={dataAssinatura}
                  onChange={(event) => setDataAssinatura(event.target.value)}
                  required
                />

                <Input
                  id="edit-data-vencimento"
                  type="date"
                  label="Vencimento contratual"
                  value={dataVencimento}
                  onChange={(event) => setDataVencimento(event.target.value)}
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
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="border-border bg-bg text-text w-full rounded-lg border p-3.5 text-sm leading-6 focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={4}
                  placeholder="Descreva a solicitação, o que precisa ser desenvolvido e demais informações relevantes..."
                />
              </div>

              {/* EQUIPAMENTOS E MATERIAIS */}
              <div>
                <CampoEquipamentos value={equipamentosEdit} onChange={setEquipamentosEdit} />
              </div>

              {/* BOTÕES DE AÇÃO DO MODAL */}
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
