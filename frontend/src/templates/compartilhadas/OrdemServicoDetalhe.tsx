import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardList, Download, History, File, Link, X, Upload, ExternalLink } from "lucide-react";

import {
  ApiError,
  abrirAnexoOS,
  atualizarOrdemServico,
  atualizarStatusOS,
  abrirRelatorioOS,
  enviarRelatorioOS,
  getHistoricoOS,
  getRelatoriosOS,
  excluirOrdemServico,
  getOrdem,
  getResumoOS,
  registrarResumoOS,
  registrarVerificacaoOS,
} from "@/api";
import type {
  HistoricoAtividadeItem,
  OrdemServicoDetalhe as Ordem,
  OrdemStatus,
  ProjetoAnexo,
  RelatorioOS,
} from "@/api";

import Button from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { mostrarAvisoOS } from "@/components/ui/Notification/mostrarAvisoOS";
import { getCurrentUser } from "@/auth";

import SeletorStatusOS from "./SeletorStatusOS";
import SeletorPrioridade from "../compartilhadas/SeletorPrioridade";
import type { PrioridadeValor } from "../compartilhadas/SeletorPrioridade";
import CampoEquipamentos, { equipamentosParaPayload, nomeEquipamento } from "../compartilhadas/CampoEquipamentos";
import type { EquipamentoForm } from "../compartilhadas/CampoEquipamentos";

import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
  formatarData,
  formatarTamanho,
  isTimeMonitoramento,
} from "./osEstilos";

const ROTA_LISTA_OS = "/os/disponiveis";
const MENSAGEM_MOTIVO_OBRIGATORIO = "O motivo do bloqueio é obrigatório";
const LIMITE_RESUMO_OS = 500;

function ModalConfirmacao({
  titulo,
  descricao,
  confirmar,
  enviando,
  erro,
  perigo = false,
  textoEnviando = "Salvando...",
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  descricao: string;
  confirmar: string;
  enviando: boolean;
  perigo?: boolean;
  textoEnviando?: string;
  erro: string | null;
  
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="border-border bg-bg text-text w-full max-w-md rounded-xl border p-6 shadow-2xl"
      >
        <h2 className="text-text m-0 text-xl font-bold">{titulo}</h2>
        <p className="text-text-muted mt-2 mb-0 text-sm leading-6">{descricao}</p>
        {erro && (
          <p className="text-danger mt-3 mb-0 text-xs" role="alert">
            {erro}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant={perigo ? "danger" : "primary"} onClick={onConfirmar} disabled={enviando}>
            {enviando ? textoEnviando : confirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CampoCaixa({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-text mb-1.5 block text-base font-semibold">{rotulo}</span>
      <div className="border-border inline-flex min-h-9 items-center rounded-lg border px-2.5 py-1">
        {children}
      </div>
    </div>
  );
}

const itensPorPaginaHistorico = 2;
const itensPorPaginaHistoricoModal = 7;

function tituloHistorico(item: HistoricoAtividadeItem): string {
  if (item.tipo_acao === "criado") return "Ordem de serviço criada";
  if (item.tipo_acao === "deletado") return "Ordem de serviço removida";
  return "Ordem de serviço atualizada";
}

function dataHistorico(valor: string): string {
  if (!valor) return "Data indisponível";
  const [data, hora] = valor.split(" ");
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}${hora ? ` às ${hora}` : ""}`;
}

function CartaoHistorico({
  tipo,
  titulo,
  descricao,
  usuario,
  data,
}: {
  tipo: string;
  titulo: string;
  descricao: string;
  usuario: string;
  data: string;
}) {
  const corDaFaixa: Record<string, string> = {
    criado: "bg-success",
    atualizado: "bg-primary",
    deletado: "bg-danger",
  };

  return (
    <Card className="w-full overflow-hidden !p-0">
      <div className="flex items-stretch">
        <div className={`w-1 shrink-0 ${corDaFaixa[tipo] ?? "bg-primary"}`} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-4 px-7 py-3">
          <div>
            <CardTitle className="text-base">{titulo}</CardTitle>
            <p className="text-text-muted mt-2 mb-0 text-sm">{descricao}</p>
          </div>
          <div className="text-right">
            <p className="text-text m-0 text-sm font-medium">{usuario}</p>
            <p className="text-text-muted mt-1 mb-0 text-xs">{data}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PaginacaoHistorico({
  pagina,
  totalPaginas,
  onMudarPagina,
}: {
  pagina: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <nav aria-label="Paginação do histórico" className="text-text-muted mt-4 flex items-center justify-center gap-4 text-sm">
      <button
        type="button"
        onClick={() => onMudarPagina(pagina - 1)}
        disabled={pagina === 0}
        aria-label="Página anterior"
        className="text-primary rounded bg-transparent px-2 py-1 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        &lt;
      </button>
      <span aria-live="polite">Página {pagina + 1} de {totalPaginas}</span>
      <button
        type="button"
        onClick={() => onMudarPagina(pagina + 1)}
        disabled={pagina >= totalPaginas - 1}
        aria-label="Próxima página"
        className="text-primary rounded bg-transparent px-2 py-1 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        &gt;
      </button>
    </nav>
  );
}

export default function OrdemServicoDetalhe() {
  const { osId } = useParams<{ osId: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const [erroStatus, setErroStatus] = useState<string | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [resumoOS, setResumoOS] = useState("");
  const [salvandoResumo, setSalvandoResumo] = useState(false);
  const [modalFeedbackResumo, setModalFeedbackResumo] = useState<{ tipo: "success" | "error"; mensagem: string } | null>(null);

  // Estados da verificação pelo monitoramento
  const [confirmarAprovacao, setConfirmarAprovacao] = useState(false);
  const [reprovando, setReprovando] = useState(false);
  const [motivoReprovacao, setMotivoReprovacao] = useState("");
  const [erroMotivo, setErroMotivo] = useState<string | null>(null);
  const [erroVerificacao, setErroVerificacao] = useState<string | null>(null);
  const [enviandoVerificacao, setEnviandoVerificacao] = useState(false);
   // Exclusão da O.S.
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [confirmarConclusao, setConfirmarConclusao] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [paginaHistorico, setPaginaHistorico] = useState(0);
  const [paginaHistoricoModal, setPaginaHistoricoModal] = useState(0);
  const [eventosHistorico, setEventosHistorico] = useState<HistoricoAtividadeItem[]>([]);
  const [erroHistorico, setErroHistorico] = useState("");

  const totalPaginasHistorico = Math.ceil(eventosHistorico.length / itensPorPaginaHistorico);
  const eventosPrevia = eventosHistorico.slice(
    paginaHistorico * itensPorPaginaHistorico,
    (paginaHistorico + 1) * itensPorPaginaHistorico,
  );
  const totalPaginasHistoricoModal = Math.ceil(eventosHistorico.length / itensPorPaginaHistoricoModal);
  const eventosModal = eventosHistorico.slice(
    paginaHistoricoModal * itensPorPaginaHistoricoModal,
    (paginaHistoricoModal + 1) * itensPorPaginaHistoricoModal,
  );

  // Estados para o Modal de Edição da O.S.
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [tituloEdit, setTituloEdit] = useState("");
  const [descricaoEdit, setDescricaoEdit] = useState("");
  const [prioridadeEdit, setPrioridadeEdit] = useState<PrioridadeValor | "">("media");
  const [dataLimiteEdit, setDataLimiteEdit] = useState("");
  const [timeResponsavelIdEdit, setTimeResponsavelIdEdit] = useState("");
  const [equipamentosEdit, setEquipamentosEdit] = useState<EquipamentoForm[]>([]);
  const [times, setTimes] = useState<{ id: string; nome_time: string }[]>([]);
  const [carregandoTimes, setCarregandoTimes] = useState(false);

  const [pdfs, setPdfs] = useState<RelatorioOS[]>([]);
  const [carregandoPdfs, setCarregandoPdfs] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [feedbackPdf, setFeedbackPdf] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const responsavelDoTime = Boolean(
    currentUser?.id && ordem?.time?.responsavel_id != null &&
      Number(ordem.time.responsavel_id) === Number(currentUser.id),
  );
  
  const podeGerenciarPdfs = currentUser?.role === "monitoramento";

  const timeMonitoramento = isTimeMonitoramento(ordem?.departamento);
  const perfisQueExcluem = ordem?.projeto_id ? ["gestor", "comercial", "superusuario"] : ["gestor", "suporte", "superusuario"];
  const podeExcluir = Boolean(
      ordem &&
      currentUser &&
      perfisQueExcluem.includes(currentUser.role) &&
      ordem.status !== "concluida" &&
      ordem.status !== "verificacao",
  );
  const podeVerificar = currentUser?.role === "monitoramento" && ordem?.status === "verificacao";
  const emVerificacao = ordem?.status === "verificacao";
  // Aprovada pelo monitoramento: voltou ao time em Review, aguardando o resumo do líder.
  const aprovadaNaVerificacao = ordem?.status === "review" && Boolean(ordem?.aprovada_verificacao);
  // O resumo só aparece para o líder do time, depois da aprovação. Registrá-lo conclui a O.S.
  // (O.S. do próprio monitoramento não passa por verificação e libera o resumo direto em Review.)
  const resumoLiberado = ordem?.status === "review" && (aprovadaNaVerificacao || timeMonitoramento);
  const osConcluida = ordem?.status === "concluida";
  const podeEditarResumo = responsavelDoTime && resumoLiberado;
  const podeVerResumo = responsavelDoTime && (resumoLiberado || osConcluida);

  // Carrega o resumo já registrado para a O.S.
  useEffect(() => {
    if (!ordem?.id || !podeVerResumo) return;
    let ativo = true;
    getResumoOS(ordem.id)
      .then((resposta) => {
        if (ativo) setResumoOS(resposta.resumo);
      })
      .catch((erroResumo) => console.error("Erro ao carregar o resumo da O.S.:", erroResumo));
    return () => {
      ativo = false;
    };
  }, [ordem?.id, podeVerResumo]);

  useEffect(() => {
    let ativo = true;
    let redirecionando = false;

    async function carregar() {
      if (!osId) return;
      try {
        const resposta = await getOrdem(osId);
        if (ativo && resposta?.ordem) {
          const o = resposta.ordem;
          setOrdem(o);
          setTituloEdit(o.titulo || "");
          setDescricaoEdit(o.descricao || "");
          setPrioridadeEdit(o.prioridade || "media");
          setDataLimiteEdit(o.data_limite ? o.data_limite.split("T")[0] : "");
          setTimeResponsavelIdEdit(o.time?.id || "");
          setEquipamentosEdit(
            o.equipamentos.map((eq) => ({
              nome: eq.nome,
              quantidade: eq.quantidade,
            }))
          );
          setCarregandoPdfs(true);
          void getRelatoriosOS(osId)
            .then((resposta) => {
              if (ativo) setPdfs(resposta.relatorios);
            })
            .catch((erroRelatorios) => {
              if (ativo) {
                setFeedbackPdf({
                  type: "error",
                  message: erroRelatorios instanceof Error
                    ? erroRelatorios.message
                    : "Não foi possível carregar os relatórios.",
                });
              }
            })
            .finally(() => {
              if (ativo) setCarregandoPdfs(false);
            });
        }
      } catch (error) {
        if (!ativo) return;
        if (error instanceof ApiError && error.status === 410) {
          redirecionando = true;
          mostrarAvisoOS("success", "O.S. já verificada", error.message);
          navigate(ROTA_LISTA_OS, { replace: true });
          return;
        }
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a ordem de serviço.",
        );
      } finally {
        if (ativo && !redirecionando) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [osId, navigate]);

  useEffect(() => {
    let ativo = true;
    if (!osId) return;
    getHistoricoOS(osId)
      .then(({ historico }) => { if (ativo) setEventosHistorico(historico); })
      .catch((error: unknown) => {
        if (ativo) setErroHistorico(error instanceof Error ? error.message : "Não foi possível carregar o histórico da OS.");
      });
    return () => { ativo = false; };
  }, [osId]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !osId) return;

    setUploadingPdf(true);
    setFeedbackPdf(null);

    try {
      const resposta = await enviarRelatorioOS(osId, file);
      const atualizados = await getRelatoriosOS(osId);
      setPdfs(atualizados.relatorios);
      setFeedbackPdf({ type: "success", message: resposta.message });
    } catch (erroUpload) {
      setFeedbackPdf({
        type: "error",
        message: erroUpload instanceof Error ? erroUpload.message : "Não foi possível enviar o relatório.",
      });
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const abrirRelatorio = async (relatorio: RelatorioOS, baixar = false) => {
    if (!osId) return;
    try {
      await abrirRelatorioOS(osId, relatorio, baixar);
    } catch (erroRelatorio) {
      setFeedbackPdf({
        type: "error",
        message: erroRelatorio instanceof Error ? erroRelatorio.message : "Não foi possível abrir o relatório.",
      });
    }
  };

  const abrirModalEdicao = async () => {
    if (ordem) {
      setTimeResponsavelIdEdit(ordem.time?.id || "");
      setEquipamentosEdit(
        ordem.equipamentos.map((eq) => ({
          nome: eq.nome,
          quantidade: eq.quantidade,
        }))
      );
    }
    setModalEdicaoAberto(true);
    
    if (times.length === 0) {
      setCarregandoTimes(true);
      try {
        const { getTimes } = await import("@/api");
        const respostaTimes = await getTimes();
        setTimes(respostaTimes.times.filter((time) => !isTimeMonitoramento(time.departamento)));
      } catch (e) {
        console.error("Erro ao carregar times", e);
      } finally {
        setCarregandoTimes(false);
      }
    }
  };

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!osId || !ordem) return;

    if (!prioridadeEdit) {
      setErroEdicao("Selecione a prioridade.");
      return;
    }

    try {
      setSalvandoEdicao(true);
      setErroEdicao(null);

      await atualizarOrdemServico(osId, {
        os_titulo: tituloEdit.trim(),
        os_descricao: descricaoEdit.trim(),
        prioridade: prioridadeEdit as any,
        data_limite: dataLimiteEdit,
        id_time_responsavel: timeResponsavelIdEdit,
        equipamentos: equipamentosParaPayload(equipamentosEdit),
      });

      window.dispatchEvent(new Event("notifications:refresh"));

      const timeMudou = timeResponsavelIdEdit !== (ordem.time?.id ?? "");
      if (timeMudou) {
        const nomeTime = times.find((time) => time.id === timeResponsavelIdEdit)?.nome_time;
        mostrarAvisoOS(
          "success",
          "O.S. encaminhada",
          `A O.S. foi encaminhada para o time ${nomeTime ?? "selecionado"}.`,
        );
      }

      try {
        const resposta = await getOrdem(osId);
        setOrdem(resposta.ordem);
        setModalEdicaoAberto(false);
      } catch (error) {
        if (timeMudou && error instanceof ApiError && error.status === 404) {
          navigate(ROTA_LISTA_OS, { replace: true });
          return;
        }
        setModalEdicaoAberto(false);
        setErro(
          error instanceof Error ? error.message : "Não foi possível recarregar a ordem de serviço.",
        );
      }
    } catch (error) {
      setErroEdicao(
        error instanceof Error ? error.message : "Não foi possível atualizar a ordem de serviço.",
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function abrir(anexo: ProjetoAnexo) {
    if (!ordem) return;
    setErroAnexo(null);
    try {
      await abrirAnexoOS(ordem.id, anexo);
    } catch (error) {
      setErroAnexo(
        error instanceof Error ? error.message : "Não foi possível abrir o anexo.",
      );
    }
  }

  async function alterarStatus(status: OrdemStatus) {
    if (!ordem || !osId) return;
    setErroStatus(null);
    setAtualizandoStatus(true);
    try {
      const resposta = await atualizarStatusOS(ordem.id, status);
      setOrdem({ ...ordem, status: resposta?.os?.status ?? status });
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch (error) {
      setErroStatus(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o status da ordem de serviço.",
      );
    } finally {
      setAtualizandoStatus(false);
    }
  }
  async function excluirOS() {
    if (!ordem || !podeExcluir || excluindo) return;

    setErroExclusao(null);
    setExcluindo(true);
    try {
      const resposta = await excluirOrdemServico(ordem.id);
      window.dispatchEvent(new Event("notifications:refresh"));
      mostrarAvisoOS("success", "O.S. excluída", resposta.message);
      navigate(ROTA_LISTA_OS, { replace: true });
    } catch (error) {
      setErroExclusao(error instanceof Error ? error.message : "Não foi possível excluir a ordem de serviço.");
      setExcluindo(false);
    }
  }

  async function salvarResumoOS() {
    if (!ordem || !podeEditarResumo || salvandoResumo) return;

    const resumo = resumoOS.trim();
    if (!resumo) {
      mostrarFeedbackResumo("error", "O resumo da OS é obrigatório");
      return;
    }
    if (resumo.length > LIMITE_RESUMO_OS) {
      mostrarFeedbackResumo("error", `O resumo pode ter até ${LIMITE_RESUMO_OS} caracteres.`);
      return;
    }
    if (!resumoLiberado) {
      mostrarFeedbackResumo("error", "O resumo só pode ser registrado depois que a O.S. for aprovada na verificação do monitoramento.");
      return;
    }

    setSalvandoResumo(true);
    try {
      const resposta = await registrarResumoOS(ordem.id, resumo);
      setResumoOS(resposta.resumo);
      // Registrar o resumo concluiu a O.S.
      setOrdem({ ...ordem, status: resposta.os.status, aprovada_verificacao: null });
      window.dispatchEvent(new Event("notifications:refresh"));
      mostrarFeedbackResumo("success", resposta.message);
    } catch (error) {
      mostrarFeedbackResumo("error", error instanceof Error ? error.message : "Não foi possível registrar o resumo.");
    } finally {
      setSalvandoResumo(false);
    }
  }

  function mostrarFeedbackResumo(tipo: "success" | "error", mensagem: string) {
    setModalFeedbackResumo({ tipo, mensagem });
  }

  async function enviarVerificacao(resultado: "aprovada" | "reprovada") {
    if (!ordem || !podeVerificar) return;

    const motivo = motivoReprovacao.trim();
    if (resultado === "reprovada" && !motivo) {
      setErroMotivo(MENSAGEM_MOTIVO_OBRIGATORIO);
      return;
    }

    setErroMotivo(null);
    setErroVerificacao(null);
    setEnviandoVerificacao(true);
    try {
      const resposta = await registrarVerificacaoOS(
        ordem.id,
        resultado,
        resultado === "reprovada" ? motivo : undefined,
      );
      window.dispatchEvent(new Event("notifications:refresh"));
      mostrarAvisoOS(
        "success",
        resultado === "aprovada" ? "Verificação aprovada" : "Verificação reprovada",
        resposta.message,
      );
      navigate(ROTA_LISTA_OS);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        mostrarAvisoOS("success", "O.S. já verificada", error.message);
        navigate(ROTA_LISTA_OS, { replace: true });
        return;
      }
      setErroVerificacao(
        error instanceof Error ? error.message : "Não foi possível registrar a verificação.",
      );
      setEnviandoVerificacao(false);
    }
  }

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1140px]">
        {carregando ? (
          <p className="text-text-muted text-sm">Carregando ordem de serviço...</p>
        ) : erro || !ordem ? (
          <div>
            <p className="text-danger mb-4 text-sm" role="alert">
              {erro ?? "Ordem de serviço não encontrada."}
            </p>
            <Button variant="outline" onClick={() => navigate('/os/disponiveis')}>
              Voltar
            </Button>
          </div>
        ) : (
          <section className="nova-os-card border-border rounded-xl border p-6 shadow-sm md:p-9">
            {/* Cabeçalho */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
                  <ClipboardList size={30} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-text m-0 text-2xl leading-tight font-bold break-words md:text-[28px]">
                    {ordem.titulo}
                  </h1>
                  <p className="text-text-muted mt-1 mb-0 text-sm">
                    Veja os detalhes da OS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!emVerificacao && (
                  <Button variant="outline" onClick={abrirModalEdicao}>
                    Editar O.S.
                  </Button>
                )}
                {podeExcluir && (
                  <Button variant="danger" onClick={() => setConfirmarExclusao(true)}>
                    Excluir O.S.
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Voltar
                </Button>
              </div>
            </div>

            {/* Status, departamento, time e prioridade */}
            <div className="my-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 [&>*>*]:w-full">
              <CampoCaixa rotulo="Status">
                <SeletorStatusOS
                  status={ordem.status}
                  responsavelDoTime={responsavelDoTime}
                  timeMonitoramento={timeMonitoramento}
                  superusuario={currentUser?.role === "superusuario"}
                  aprovadaNaVerificacao={aprovadaNaVerificacao}
                  disabled={atualizandoStatus}
                  onChange={alterarStatus}
                />
              </CampoCaixa>
              <CampoCaixa rotulo="Departamento">
                <span className="text-text text-sm">{ordem.departamento ?? "—"}</span>
              </CampoCaixa>
              <CampoCaixa rotulo="Time">
                <span className="text-text text-sm">{ordem.time?.nome ?? "—"}</span>
              </CampoCaixa>
              <CampoCaixa rotulo="Prioridade">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORIDADE_CLASSE[ordem.prioridade]}`}
                >
                  {PRIORIDADE_LABEL[ordem.prioridade] ?? ordem.prioridade}
                </span>
              </CampoCaixa>
              <CampoCaixa rotulo="Prazo">
                <span className="text-text text-sm">{formatarData(ordem.data_limite)}</span>
              </CampoCaixa>
            </div>

            {/* Motivo da última reprovação na verificação */}
            {ordem.ultima_reprovacao && (
              <div className="border-danger/30 bg-danger/10 mb-8 rounded-lg border p-4">
                <div className="text-danger flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle size={17} aria-hidden="true" />
                  Reprovada na verificação do monitoramento
                </div>
                <p className="text-text mt-2 mb-2 text-sm leading-6 break-words whitespace-pre-line">
                  {ordem.ultima_reprovacao.justificativa}
                </p>
                <p className="text-text-muted m-0 text-xs">
                  {ordem.ultima_reprovacao.usuario ?? "Monitoramento"} em{" "}
                  {ordem.ultima_reprovacao.data}
                </p>
              </div>
            )}

            {/* Indicativo: aprovada pelo monitoramento, aguardando o resumo do líder */}
            {aprovadaNaVerificacao && ordem.aprovada_verificacao && (
              <div className="border-success/30 bg-success/10 mb-8 rounded-lg border p-4" role="status">
                <div className="text-success flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Aprovada na verificação do monitoramento
                </div>
                <p className="text-text mt-2 mb-2 text-sm leading-6">
                  {responsavelDoTime
                    ? "Registre o resumo das atividades abaixo para concluir esta O.S."
                    : "O líder do time deve registrar o resumo das atividades para concluir esta O.S."}
                </p>
                <p className="text-text-muted m-0 text-xs">
                  {ordem.aprovada_verificacao.usuario ?? "Monitoramento"} em {ordem.aprovada_verificacao.data}
                </p>
              </div>
            )}

            {podeVerResumo && (
              <section aria-labelledby="resumo-os" className="border-border mb-8 rounded-lg border p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 id="resumo-os" className="text-text m-0 text-base font-bold">Resumo das atividades</h2>
                    <p className="text-text-muted mt-1 mb-0 text-sm">
                      {osConcluida
                        ? "Resumo registrado. Esta O.S. já foi concluída."
                        : "Registre em poucas palavras o trabalho realizado pela equipe. Ao registrar o resumo, a O.S. será concluída."}
                    </p>
                  </div>
                  <span className="text-text-muted text-xs">{resumoOS.length}/{LIMITE_RESUMO_OS}</span>
                </div>
                <Textarea
                  id="resumo-atividades-os"
                  label="Resumo da conclusão"
                  value={resumoOS}
                  onChange={(event) => setResumoOS(event.target.value)}
                  maxLength={LIMITE_RESUMO_OS}
                  placeholder="Descreva brevemente as atividades realizadas"
                  readOnly={!podeEditarResumo}
                  disabled={salvandoResumo}
                />
                {podeEditarResumo && (
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button variant="primary" onClick={salvarResumoOS} disabled={salvandoResumo}>
                      {salvandoResumo ? "Registrando..." : "Registrar Resumo"}
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* Decisão da verificação (somente monitoramento) */}
            {podeVerificar && (
              <section
                aria-labelledby="verificacao-os"
                className="border-primary bg-primary-muted mb-8 rounded-lg border p-4 md:p-5"
              >
                <h2 id="verificacao-os" className="text-text m-0 text-base font-bold">
                  Esta O.S. aguarda a sua verificação
                </h2>
                <p className="text-text-muted mt-1 mb-4 text-sm">
                  Aprove para devolver a O.S. à equipe, que registrará o resumo e a concluirá, ou reprove para bloqueá-la.
                </p>

                {reprovando ? (
                  <form
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      enviarVerificacao("reprovada");
                    }}
                  >
                    <Textarea
                      id="motivo-reprovacao"
                      label="Motivo da reprovação"
                      required
                      value={motivoReprovacao}
                      onChange={(event) => {
                        setMotivoReprovacao(event.target.value);
                        setErroMotivo(null);
                      }}
                      maxLength={5000}
                      placeholder="Explique o que a equipe responsável precisa corrigir"
                      aria-required="true"
                      aria-invalid={Boolean(erroMotivo)}
                      aria-describedby={erroMotivo ? "erro-motivo-reprovacao" : undefined}
                      disabled={enviandoVerificacao}
                    />
                    {erroMotivo && (
                      <p id="erro-motivo-reprovacao" className="text-danger mt-1.5 mb-0 text-xs" role="alert">
                        {erroMotivo}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                      <Button
                        variant="outline"
                        disabled={enviandoVerificacao}
                        onClick={() => {
                          setReprovando(false);
                          setErroMotivo(null);
                          setErroVerificacao(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="danger" disabled={enviandoVerificacao}>
                        {enviandoVerificacao ? "Enviando..." : "Confirmar reprovação"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        setErroVerificacao(null);
                        setConfirmarAprovacao(true);
                      }}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setErroVerificacao(null);
                        setReprovando(true);
                      }}
                    >
                      Reprovar
                    </Button>
                  </div>
                )}

                {erroVerificacao && !confirmarAprovacao && (
                  <p className="text-danger mt-3 mb-0 text-xs" role="alert">
                    {erroVerificacao}
                  </p>
                )}
              </section>
            )}

            {/* Descrição */}
            <div className="mb-8">
              <span className="text-text mb-1.5 block text-base font-semibold">
                Descrição
              </span>
              <div className="border-border text-text min-h-33 rounded-lg border p-3.5 text-sm leading-6 break-words whitespace-pre-line">
                {ordem.descricao || "Sem descrição"}
              </div>
            </div>

            {/* Equipamentos e anexos */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr]">
              <div>
                <span className="text-text mb-3 block text-base font-semibold">
                  Equipamentos e materiais
                </span>
                {ordem.equipamentos.length ? (
                  <div className="flex flex-wrap gap-2">
                    {ordem.equipamentos.map((item) => (
                      <span
                        key={item.nome}
                        className="bg-primary/15 text-primary rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {item.quantidade}x {nomeEquipamento(item.nome)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted m-0 text-sm">Nenhum equipamento</p>
                )}
              </div>

              <div className="border-border hidden w-px border-l md:block" />

              <div>
                <div className="text-text mb-3 flex items-center gap-2 font-semibold">
                  <Link className="text-text-muted" size={19} />
                  Anexos
                </div>

                {ordem.anexos.filter((anexo) => anexo.tipo.toLowerCase().split(";")[0] !== "application/pdf").length ? (
                  <ul className="m-0 list-none space-y-3 p-0">
                    {ordem.anexos
                      .filter((anexo) => anexo.tipo.toLowerCase().split(";")[0] !== "application/pdf")
                      .map((anexo) => (
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
            </div>

            {/* ========================================================================= */}
            {/* 🚀 [US27] - SEÇÃO DE RELATÓRIOS DE TESTE (PDF) COM RESTRIÇÃO DE PERMISSÃO */}
            {/* ========================================================================= */}
            <div className="border-border bg-bg-secondary rounded-xl border p-4 sm:p-6 mb-8 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-text">Relatórios de Teste (PDF)</h3>
                  <p className="text-sm text-muted mt-0.5">Histórico de laudos e resultados vinculados a esta Ordem de Serviço.</p>
                </div>

                {/* O botão de anexar só aparece se o usuário tiver permissão para gerenciar */}
                {podeGerenciarPdfs && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePdfUpload}
                      accept=".pdf"
                      disabled={uploadingPdf}
                      className="hidden"
                      id="pdf-upload-input-detalhe"
                    />
                    <label
                      htmlFor="pdf-upload-input-detalhe"
                      className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-text-inverted transition-all shadow-sm cursor-pointer ${
                        uploadingPdf 
                          ? 'bg-primary/50 cursor-not-allowed' 
                          : 'bg-primary hover:bg-primary-hover active:scale-[0.98]'
                      }`}
                    >
                      {uploadingPdf ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-text-inverted" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando PDF...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Anexar Relatório PDF
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {feedbackPdf && (
                <div className={feedbackPdf.type === 'success' ? 'success flex items-center justify-between' : 'error flex items-center justify-between'}>
                  <span>{feedbackPdf.message}</span>
                  <button onClick={() => setFeedbackPdf(null)} className="text-lg font-bold leading-none">&times;</button>
                </div>
              )}

              {carregandoPdfs ? (
                <p className="text-text-muted m-0 text-sm" role="status">Carregando relatórios...</p>
              ) : pdfs.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 bg-bg">
                  <p className="text-sm font-semibold text-text">Nenhum relatório PDF anexado</p>
                  <p className="text-xs text-muted">Envie o resultado dos testes para orientar as próximas equipes.</p>
                </div>
              ) : (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-bg">
                  {pdfs.map((pdf) => (
                    <div key={pdf.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-bg-secondary transition-colors">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-danger-muted text-danger font-bold text-xs flex items-center justify-center shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text truncate" title={pdf.nome}>
                            {pdf.nome}
                          </p>
                          <p className="text-xs text-muted">
                            Enviado em {pdf.data_envio} • <span className="font-medium text-text">{formatarTamanho(pdf.tamanho)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 sm:ml-4">
                        <button
                          type="button"
                          onClick={() => void abrirRelatorio(pdf)}
                          className="px-3 py-1.5 text-xs font-semibold text-text bg-secondary hover:bg-secondary-hover border border-border rounded-md transition shadow-sm inline-flex items-center gap-1.5"
                        >
                          Visualizar <ExternalLink size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void abrirRelatorio(pdf, true)}
                          className="px-3 py-1.5 text-xs font-semibold text-text bg-secondary hover:bg-secondary-hover border border-border rounded-md transition shadow-sm inline-flex items-center gap-1.5"
                        >
                          Baixar <Download size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detalhes */}
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="text-text mb-1.5 block text-base font-semibold">
                  Detalhes
                </span>
                <div className="bg-primary-muted border-border rounded-lg border p-4 text-sm leading-6">
                  <p className="text-text m-0">
                    <span className="font-semibold">Criador:</span> {ordem.criador ?? "—"}
                  </p>
                  <p className="text-text m-0">
                    <span className="font-semibold">Data de criação:</span>{" "}
                    {formatarData(ordem.data_criacao)}
                  </p>
                  <p className="text-text m-0">
                    <span className="font-semibold">Data limite:</span>{" "}
                    {ordem.pedido_pai?.data_limite
                      ? formatarData(ordem.pedido_pai.data_limite)
                      : "-"}
                  </p>
                  <p className="text-text m-0">
                    <span className="font-semibold">Pedido pai:</span>{" "}
                    {ordem.pedido_pai?.titulo ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col items-end gap-2 sm:w-auto">
                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
                    Voltar
                  </Button>
                </div>

                {erroStatus && (
                  <p className="text-danger m-0 text-xs" role="alert">
                    {erroStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Histórico da O.S. */}
            <section className="mt-8 w-full">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-muted text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                    <History size={22} />
                  </div>
                  <h2 className="text-text m-0 text-xl font-bold">Histórico de alterações</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoricoAberto(true)}
                  className="text-primary hover:text-primary/80 inline-flex items-center gap-1 rounded-md bg-transparent px-2 py-1 text-sm font-semibold transition"
                >
                  Ver todas <span aria-hidden="true">&gt;</span>
                </button>
              </div>
              <div className="space-y-3">
                {erroHistorico ? <p role="alert" className="text-danger text-sm">{erroHistorico}</p>
                  : eventosPrevia.length === 0 ? <p className="text-text-muted text-sm">Nenhuma alteração registrada ainda.</p>
                  : eventosPrevia.map((item) => (
                  <CartaoHistorico
                    key={item.historico_id}
                    tipo={item.tipo_acao}
                    titulo={tituloHistorico(item)}
                    descricao={`Status: ${item.os_status}${item.nome_time ? ` · Equipe: ${item.nome_time}` : ""}${item.data_limite ? ` · Prazo: ${formatarData(item.data_limite)}` : ""}`}
                    usuario={item.usuario_email ?? "E-mail não identificado"}
                    data={dataHistorico(item.data_historico)}
                  />
                ))}
              </div>
              <PaginacaoHistorico
                pagina={paginaHistorico}
                totalPaginas={totalPaginasHistorico}
                onMudarPagina={setPaginaHistorico}
              />
            </section>
          </section>
        )}
      </div>

      {modalFeedbackResumo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-feedback-resumo" className="border-border bg-bg text-text w-full max-w-md rounded-xl border p-6 shadow-2xl">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${modalFeedbackResumo.tipo === "success" ? "bg-primary-muted text-primary" : "bg-danger/10 text-danger"}`}>
              {modalFeedbackResumo.tipo === "success" ? <ClipboardList size={22} aria-hidden="true" /> : <AlertTriangle size={22} aria-hidden="true" />}
            </div>
            <h2 id="titulo-feedback-resumo" className="text-text m-0 text-xl font-bold">{modalFeedbackResumo.tipo === "success" ? "Resumo salvo" : "Não foi possível salvar"}</h2>
            <p className={`${modalFeedbackResumo.tipo === "success" ? "text-text-muted" : "text-danger"} mt-2 mb-0 text-sm leading-6`} role={modalFeedbackResumo.tipo === "error" ? "alert" : "status"}>{modalFeedbackResumo.mensagem}</p>
            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={() => setModalFeedbackResumo(null)}>Entendi</Button>
            </div>
          </div>
        </div>
      )}
      {confirmarExclusao && ordem && (
        <ModalConfirmacao
          titulo="Excluir ordem de serviço"
          descricao={`Tem certeza que deseja excluir a O.S. "${ordem.titulo}"? Esta ação não pode ser desfeita. Os anexos, equipamentos e o histórico de verificações dela também serão excluídos.`}
          confirmar="Excluir"
          textoEnviando="Excluindo..."
          perigo
          enviando={excluindo}
          erro={erroExclusao}
          onConfirmar={excluirOS}
          onCancelar={() => {
            setConfirmarExclusao(false);
            setErroExclusao(null);
          }}
        />
      )}

      {confirmarAprovacao && (
        <ModalConfirmacao
          titulo="Aprovar verificação"
          descricao="A O.S. voltará para a equipe responsável (Review) como aprovada. O líder do time registrará o resumo das atividades para concluí-la."
          confirmar="Aprovar"
          enviando={enviandoVerificacao}
          erro={erroVerificacao}
          onConfirmar={() => enviarVerificacao("aprovada")}
          onCancelar={() => {
            setConfirmarAprovacao(false);
            setErroVerificacao(null);
          }}
        />
      )}

      {historicoAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setHistoricoAberto(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="historico-modal-titulo"
            className="border-border bg-bg text-text w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border p-6 shadow-2xl md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-muted text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                  <History size={22} />
                </div>
                <h2 id="historico-modal-titulo" className="text-text m-0 text-xl font-bold">
                  Histórico de alterações
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar histórico"
                onClick={() => setHistoricoAberto(false)}
                className="text-text-muted hover:text-text cursor-pointer rounded bg-transparent p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {erroHistorico ? <p role="alert" className="text-danger text-sm">{erroHistorico}</p>
                : eventosModal.length === 0 ? <p className="text-text-muted text-sm">Nenhuma alteração registrada ainda.</p>
                : eventosModal.map((item) => (
                  <CartaoHistorico
                    key={item.historico_id}
                    tipo={item.tipo_acao}
                    titulo={tituloHistorico(item)}
                    descricao={`Status: ${item.os_status}${item.nome_time ? ` · Equipe: ${item.nome_time}` : ""}${item.data_limite ? ` · Prazo: ${formatarData(item.data_limite)}` : ""}`}
                    usuario={item.usuario_email ?? "E-mail não identificado"}
                    data={dataHistorico(item.data_historico)}
                  />
                ))}
            </div>
            <PaginacaoHistorico
              pagina={paginaHistoricoModal}
              totalPaginas={totalPaginasHistoricoModal}
              onMudarPagina={setPaginaHistoricoModal}
            />
          </section>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DA O.S. */}
      {modalEdicaoAberto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-bg text-text w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-text text-xl font-bold">Editar Ordem de Serviço</h2>
              <button
                onClick={() => setModalEdicaoAberto(false)}
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
              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input
                    id="edit-os-titulo"
                    label="Título da O.S."
                    value={tituloEdit}
                    onChange={(event) => setTituloEdit(event.target.value)}
                    placeholder="Ex.: Configuração de equipamentos"
                    maxLength={150}
                    required
                  />
                </div>

                <SeletorPrioridade value={prioridadeEdit} onChange={setPrioridadeEdit} />
              </div>

              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
                <Select
                  id="edit-os-time"
                  label="Time responsável"
                  value={timeResponsavelIdEdit}
                  onChange={(event) => setTimeResponsavelIdEdit(event.target.value)}
                  disabled={carregandoTimes}
                  required
                >
                  <option value="" hidden>
                    {carregandoTimes ? "Carregando..." : "Selecione o time responsável"}
                  </option>
                  {times.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome_time}
                    </option>
                  ))}
                </Select>

                <Input
                  id="edit-os-prazo"
                  type="date"
                  label="Prazo / Data limite"
                  value={dataLimiteEdit}
                  onChange={(event) => setDataLimiteEdit(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-text mb-1.5 block text-sm font-semibold">
                  Descrição
                </label>
                <textarea
                  value={descricaoEdit}
                  onChange={(e) => setDescricaoEdit(e.target.value)}
                  className="border-border bg-bg text-text w-full rounded-lg border p-3.5 text-sm leading-6 focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={4}
                  placeholder="Descreva detalhadamente as instruções para a O.S..."
                  required
                />
              </div>

              <div>
                <CampoEquipamentos value={equipamentosEdit} onChange={setEquipamentosEdit} />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalEdicaoAberto(false)}
                  disabled={salvandoEdicao}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvandoEdicao}>
                  {salvandoEdicao ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
