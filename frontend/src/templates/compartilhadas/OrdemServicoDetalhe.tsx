import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ClipboardList, File, Link } from "lucide-react";

import { abrirAnexoOS, atualizarStatusOS, getOrdem } from "@/api";
import type { OrdemServicoDetalhe as Ordem, OrdemStatus, ProjetoAnexo } from "@/api";
import Button from "@/components/ui/Button";
import { getCurrentUser } from "@/auth";

import SeletorStatusOS from "./SeletorStatusOS";

import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
  formatarData,
  formatarTamanho,
} from "./osEstilos";

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

  const podeConcluir = currentUser?.role !== undefined && currentUser.role !== "superusuario";

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!osId) return;
      try {
        const resposta = await getOrdem(osId);
        if (ativo) setOrdem(resposta.ordem);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar a ordem de serviço.",
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
  }, [osId]);

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
      await atualizarStatusOS(ordem.id, status);
      const resposta = await getOrdem(osId);
      setOrdem(resposta.ordem);
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
      setOrdem({ ...ordem, status: "concluida" });
      setConfirmarConclusao(false);
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch (error) {
      setErroStatus(
        error instanceof Error ? error.message : "Não foi possível concluir a ordem de serviço.",
      );
    } finally {
      setAtualizandoStatus(false);
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
            <div className="mb-8 flex items-center gap-4">
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

            {/* Status, departamento, time e prioridade */}
            <div className="mb-6 flex flex-wrap gap-x-8 gap-y-4">
              <CampoCaixa rotulo="Status">
                <SeletorStatusOS
                  status={ordem.status}
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
                  {podeConcluir && ordem.status !== "concluida" && (
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

      {confirmarConclusao && ordem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !atualizandoStatus) {
              setConfirmarConclusao(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-conclusao-titulo"
            className="border-border bg-bg w-full max-w-md rounded-xl border p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="bg-warning-alt text-warning-alt-inverted flex size-10 shrink-0 items-center justify-center rounded-full">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 id="confirmar-conclusao-titulo" className="text-text m-0 text-lg font-semibold">
                  Concluir ordem de serviço?
                </h2>
                <p className="text-text-muted mt-2 mb-0 text-sm leading-5">
                  Confirma a conclusão de <span className="text-text font-medium">{ordem.titulo}</span>?
                  Essa ação atualizará o status para Concluída.
                </p>
              </div>
            </div>
            {erroStatus && <p className="text-danger mt-4 mb-0 text-sm" role="alert">{erroStatus}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" disabled={atualizandoStatus} onClick={() => setConfirmarConclusao(false)}>
                Cancelar
              </Button>
              <Button variant="primary" disabled={atualizandoStatus} onClick={concluirOS}>
                {atualizandoStatus ? "Concluindo..." : "Confirmar conclusão"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
