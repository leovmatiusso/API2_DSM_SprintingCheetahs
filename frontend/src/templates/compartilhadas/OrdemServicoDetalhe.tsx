import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ClipboardList, File, Link, X } from "lucide-react";

import {
  ApiError,
  abrirAnexoOS,
  atualizarOrdemServico,
  atualizarStatusOS,
  getOrdem,
  registrarVerificacaoOS,
} from "@/api";
import type { OrdemServicoDetalhe as Ordem, OrdemStatus, ProjetoAnexo } from "@/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { mostrarAvisoOS } from "@/components/ui/Notification/mostrarAvisoOS";
import { getCurrentUser } from "@/auth";

import SeletorStatusOS from "./SeletorStatusOS";
import SeletorPrioridade from "../compartilhadas/SeletorPrioridade";
import type { PrioridadeValor } from "../compartilhadas/SeletorPrioridade";
import CampoEquipamentos, { equipamentosParaPayload } from "../compartilhadas/CampoEquipamentos";
import type { EquipamentoForm } from "../compartilhadas/CampoEquipamentos";

import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
  ROTA_APOS_CONCLUIR_OS,
  formatarData,
  formatarTamanho,
  isTimeMonitoramento,
} from "./osEstilos";

const ROTA_LISTA_OS = "/os/disponiveis";
const MENSAGEM_MOTIVO_OBRIGATORIO = "O motivo do bloqueio é obrigatório";

function ModalConfirmacao({
  titulo,
  descricao,
  confirmar,
  enviando,
  erro,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  descricao: string;
  confirmar: string;
  enviando: boolean;
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
          <Button onClick={onConfirmar} disabled={enviando}>
            {enviando ? "Salvando..." : confirmar}
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
  const [confirmarConclusao, setConfirmarConclusao] = useState(false);

  // Estados da verificação pelo monitoramento
  const [confirmarAprovacao, setConfirmarAprovacao] = useState(false);
  const [reprovando, setReprovando] = useState(false);
  const [motivoReprovacao, setMotivoReprovacao] = useState("");
  const [erroMotivo, setErroMotivo] = useState<string | null>(null);
  const [erroVerificacao, setErroVerificacao] = useState<string | null>(null);
  const [enviandoVerificacao, setEnviandoVerificacao] = useState(false);

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

  const responsavelDoTime = Boolean(
    currentUser?.id && ordem?.time?.responsavel_id === currentUser.id,
  );
  const podeDecidirReview = responsavelDoTime && ordem?.status === "review";
  const timeMonitoramento = isTimeMonitoramento(ordem?.departamento);
  // Toda O.S. é concluída pela aprovação do monitoramento (exceto as do próprio monitoramento).
  const podeConcluir = podeDecidirReview && timeMonitoramento;
  const podeVerificar = currentUser?.role === "monitoramento" && ordem?.status === "verificacao";
  const emVerificacao = ordem?.status === "verificacao";

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
        }
      } catch (error) {
        if (!ativo) return;
        // O.S. que já saiu da verificação: volta para a lista com um aviso, sem tela de erro.
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

 const abrirModalEdicao = async () => {
  if (ordem) {
    // Descarta um time escolhido em uma edição cancelada antes.
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

      // Recarrega os dados completos da O.S. para atualizar a tela sem falhas
      try {
        const resposta = await getOrdem(osId);
        setOrdem(resposta.ordem);
        setModalEdicaoAberto(false);
      } catch (error) {
        // A edição já foi salva: quem era do time anterior deixa de ver a O.S. e volta para a lista.
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

  async function concluirOS() {
    if (!ordem || !podeConcluir) return;
    setAtualizandoStatus(true);
    setErroStatus(null);
    try {
      await atualizarStatusOS(ordem.id, "concluida");
      window.dispatchEvent(new Event("notifications:refresh"));
      mostrarAvisoOS("success", "O.S. concluída", "A ordem de serviço foi concluída com sucesso.");
      navigate(ROTA_APOS_CONCLUIR_OS);
    } catch (error) {
      setErroStatus(
        error instanceof Error ? error.message : "Não foi possível concluir a ordem de serviço.",
      );
      setAtualizandoStatus(false);
    }
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
      navigate(resultado === "aprovada" ? ROTA_APOS_CONCLUIR_OS : ROTA_LISTA_OS);
    } catch (error) {
      // Outra pessoa do monitoramento decidiu antes: não há mais o que fazer nesta tela.
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
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Voltar
                </Button>
              </div>
            </div>

            {/* Status, departamento, time e prioridade */}
            <div className="my-6 grid grid-cols-5 gap-x-4 gap-y-6 [&>*>*]:w-full">
              <CampoCaixa rotulo="Status">
                <SeletorStatusOS
                  status={ordem.status}
                  responsavelDoTime={responsavelDoTime}
                  timeMonitoramento={timeMonitoramento}
                  superusuario={currentUser?.role === "superusuario"}
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
                  Aprove para concluir a O.S. ou reprove para devolvê-la à equipe responsável.
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
                        {item.quantidade}x {item.nome}
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

                {ordem.anexos.length ? (
                  <ul className="m-0 list-none space-y-3 p-0">
                    {ordem.anexos.map((anexo) => (
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

              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
                    Voltar
                  </Button>
                  {podeConcluir && (
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={atualizandoStatus}
                      onClick={() => setConfirmarConclusao(true)}
                    >
                      Concluir O.S.
                    </Button>
                  )}
                </div>

                {erroStatus && (
                  <p className="text-danger m-0 text-xs" role="alert">
                    {erroStatus}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {confirmarConclusao && (
        <ModalConfirmacao
          titulo="Concluir O.S."
          descricao="Depois de concluída, a O.S. não pode voltar para outra etapa."
          confirmar="Concluir O.S."
          enviando={atualizandoStatus}
          erro={erroStatus}
          onConfirmar={concluirOS}
          onCancelar={() => {
            setConfirmarConclusao(false);
            setErroStatus(null);
          }}
        />
      )}

      {confirmarAprovacao && (
        <ModalConfirmacao
          titulo="Aprovar verificação"
          descricao="A O.S. será concluída e não poderá voltar para outra etapa."
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

      {/* MODAL DE EDIÇÃO DA O.S. (Fundo sólido/opaco garantido para Light e Dark) */}
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
              {/* LINHA 1: Título e Prioridade */}
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

              {/* LINHA 2: Time responsável e Data limite */}
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

              {/* DESCRIÇÃO */}
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

              {/* EQUIPAMENTOS E MATERIAIS */}
              <div>
                <CampoEquipamentos value={equipamentosEdit} onChange={setEquipamentosEdit} />
              </div>

              {/* BOTÕES DE AÇÃO DO MODAL */}
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
