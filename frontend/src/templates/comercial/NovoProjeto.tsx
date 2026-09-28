import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ClipboardList,
  Link,
  Upload,
  X,
  ChevronDown,
  CalendarArrowUp,
  CalendarArrowDown,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  createOrdemServico,
  createProjeto,
  getTimes,
  getTimesParaProjeto,
} from "@/api";

import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type TipoOS = "manutencao" | "novo-projeto";

interface NovoProjetoProps {
  tipo: TipoOS;
}

interface Equipamento {
  nome: string;
  quantidade: number;
}

interface Anexo {
  id: number;
  nome: string;
  tamanho: string;
  arquivo: File;
}

interface Time {
  id: string;
  nome_time: string;
}

function Obrigatorio() {
  return (
    <span
      className="text-danger ml-0.5 font-light"
      aria-hidden="true"
    >
      *
    </span>
  );
}

const EQUIPAMENTOS_DISPONIVEIS = [
  "Aerostato",
  "Torre",
  "Câmera óptica",
  "Câmera térmica",
  "Switch",
  "Roteador",
  "Cabo de rede",
  "Conector RJ45",
  "Patch Cord",
  "Sensor de movimento",
];

export default function NovoProjeto({
  tipo,
}: NovoProjetoProps) {
  const navigate = useNavigate();

  const inputArquivo =
    useRef<HTMLInputElement>(null);

  const [projeto, setProjeto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [dataAssinatura, setDataAssinatura] =
    useState("");
  const [dataVencimento, setDataVencimento] =
    useState("");
  const [responsavel, setResponsavel] =
    useState("");
  const [vendedor, setVendedor] =
    useState("");

  const [prioridade, setPrioridade] =
    useState("Baixa");

  const [prioridadeAberta, setPrioridadeAberta] =
    useState(false);

  const [buscaEquipamento, setBuscaEquipamento] =
    useState("");

  const [equipamentos, setEquipamentos] =
    useState<Equipamento[]>([]);

  const [
    dropdownEquipamentoAberto,
    setDropdownEquipamentoAberto,
  ] = useState(false);

  const [anexos, setAnexos] =
    useState<Anexo[]>([]);

  const [times, setTimes] =
    useState<Time[]>([]);

  const [carregandoTimes, setCarregandoTimes] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState<string | null>(null);

  const manutencao =
    tipo === "manutencao";

  useEffect(() => {
    async function carregarTimes() {
      setErro(null);

      try {
        if (manutencao) {
          const resposta = await getTimes();
          setTimes(
            resposta.times.map((time) => ({
              id: String(time.id),
              nome_time: time.nome_time,
            })),
          );
        } else {
          const resposta = await getTimesParaProjeto();
          setTimes(
            resposta.times.map((time) => ({
              id: String(time.id_time),
              nome_time: time.nome_time,
            })),
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar times:",
          error,
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os times.",
        );
      } finally {
        setCarregandoTimes(false);
      }
    }

    carregarTimes();
  }, []);

  function removerEquipamento(nome: string) {
    setEquipamentos((prev) =>
      prev.filter(
        (equipamento) =>
          equipamento.nome !== nome,
      ),
    );
  }

  function adicionarEquipamento(nome: string) {
    setEquipamentos((prev) => {
      const existente = prev.find(
        (equipamento) =>
          equipamento.nome === nome,
      );

      if (existente) {
        return prev.map((equipamento) =>
          equipamento.nome === nome
            ? {
                ...equipamento,
                quantidade:
                  equipamento.quantidade + 1,
              }
            : equipamento,
        );
      }

      return [
        ...prev,
        {
          nome,
          quantidade: 1,
        },
      ];
    });

    setBuscaEquipamento("");
    setDropdownEquipamentoAberto(false);
  }

  function equipamentosFiltrados() {
    return EQUIPAMENTOS_DISPONIVEIS.filter(
      (nome) =>
        nome
          .toLowerCase()
          .includes(
            buscaEquipamento.toLowerCase(),
          ),
    );
  }

  function adicionarArquivos(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const arquivos = event.target.files;

    if (!arquivos) {
      return;
    }

    const arquivosPDF = Array.from(
      arquivos,
    ).filter(
      (arquivo) =>
        arquivo.type === "application/pdf",
    );

    const arquivosInvalidos = Array.from(
      arquivos,
    ).filter(
      (arquivo) =>
        arquivo.type !== "application/pdf",
    );

    if (arquivosInvalidos.length > 0) {
      alert(
        "Apenas arquivos PDF são permitidos.",
      );
    }

    const novosAnexos = arquivosPDF.map(
      (arquivo, index) => ({
        id: Date.now() + index,
        nome: arquivo.name,
        tamanho: formatarTamanho(
          arquivo.size,
        ),
        arquivo,
      }),
    );

    setAnexos((anterior) => [
      ...anterior,
      ...novosAnexos,
    ]);

    event.target.value = "";
  }

  function removerAnexo(id: number) {
    setAnexos((anterior) =>
      anterior.filter(
        (anexo) => anexo.id !== id,
      ),
    );
  }

  function formatarTamanho(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function selecionarPrioridade(
    valor: string,
  ) {
    setPrioridade(valor);
    setPrioridadeAberta(false);
  }

  function nomePrioridade() {
    if (prioridade === "Media") {
      return "Média";
    }

    if (prioridade === "Critica") {
      return "Crítica";
    }

    return prioridade;
  }

  async function enviarFormulario(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (enviando) {
      return;
    }

    setErro(null);

    if (!titulo.trim()) {
      setErro(
        "Informe o título do projeto.",
      );
      return;
    }

    if (!responsavel) {
      setErro(
        "Selecione o time responsável.",
      );
      return;
    }

    if (!manutencao && !vendedor.trim()) {
      setErro("Informe o vendedor cadastrado.");
      return;
    }

    if (!dataAssinatura) {
      setErro(
        "Informe a data de assinatura.",
      );
      return;
    }

    if (!dataVencimento) {
      setErro(
        "Informe a data de vencimento.",
      );
      return;
    }

    if (!projeto) {
      setErro(
        "Selecione o tipo de sistema.",
      );
      return;
    }

    const tiposSistema: Record<string, string> = {
      "1": "Sistema de Torres",
      "2": "Sistema de Embarcação",
      "3": "Sistema de Sonda",
    };

    if (!manutencao && !tiposSistema[projeto]) {
      setErro("Selecione um tipo de sistema válido.");
      return;
    }

    setEnviando(true);

    try {
      if (manutencao) {
        const prioridadeBanco = prioridade.toLowerCase() as
          | "baixa"
          | "media"
          | "alta"
          | "critica";
        const descricaoOS = `Solicitação de novo projeto: ${titulo.trim()}`;

        const resposta = await createOrdemServico({
          os_titulo: titulo.trim(),
          os_descricao: descricaoOS,
          prioridade: prioridadeBanco,
          data_limite: dataVencimento,
          id_time_responsavel: responsavel,
        });

        alert(resposta.message || "Ordem de serviço aberta com sucesso!");
      } else {
        const anexosPayload = await Promise.all(
          anexos.map(
            (anexo) =>
              new Promise<{
                nome_anexo: string;
                anexo_tipo: string;
                anexo_tamanho: number;
                conteudo_arquivo_base64: string;
              }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const resultado = String(reader.result ?? "");
                  const separador = resultado.indexOf(",");
                  resolve({
                    nome_anexo: anexo.arquivo.name,
                    anexo_tipo: anexo.arquivo.type || "application/pdf",
                    anexo_tamanho: anexo.arquivo.size,
                    conteudo_arquivo_base64:
                      separador >= 0 ? resultado.slice(separador + 1) : resultado,
                  });
                };
                reader.onerror = () => reject(new Error(`Não foi possível ler ${anexo.nome}.`));
                reader.readAsDataURL(anexo.arquivo);
              }),
          ),
        );

        const resposta = await createProjeto({
          nome: titulo.trim(),
          data_assinatura_contrato: dataAssinatura,
          data_vencimento_contrato: dataVencimento,
          tipo_sistema: tiposSistema[projeto],
          id_time_responsavel: Number(responsavel),
          vendedor_nome: vendedor.trim(),
          equipamentos: equipamentos.map(({ nome, quantidade }) => ({
            nome_equipamento: nome,
            quantidade,
          })),
          anexos: anexosPayload,
        });

        alert(resposta.message || "Projeto criado com sucesso!");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error(
        manutencao ? "Erro ao abrir ordem de serviço:" : "Erro ao criar projeto:",
        error,
      );

      setErro(
        error instanceof Error
          ? error.message
          : manutencao
            ? "Não foi possível abrir a ordem de serviço."
            : "Não foi possível criar o projeto.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="page nova-os-page min-h-full p-5 md:p-8">
      <form
        className="nova-os-card border-border mx-auto w-full max-w-[1140px] rounded-xl border p-6 shadow-sm md:p-9"
        onSubmit={enviarFormulario}
      >
        {/* CABEÇALHO */}

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <ClipboardList size={30} />
            </div>

            <div>
              <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[28px]">
                Novo projeto
              </h1>

              <p className="text-text-muted mt-2 text-sm leading-6">
                {manutencao
                  ? "Crie um novo projeto e atribua OS a ele após criação."
                  : "Abra uma nova solicitação de projeto para que o gestor possa direcioná-la à equipe responsável."}
              </p>
            </div>
          </div>

          <p className="text-text-muted mt-4 text-xs">
            Campos marcados com{" "}
            <span className="text-red-500">
              *
            </span>{" "}
            são obrigatórios.
          </p>
        </div>

        {/* ERRO */}

        {erro && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {/* CAMPOS */}

        <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2 xl:grid-cols-4">
          {/* TÍTULO */}

          <div className="xl:col-span-2">
            <Input
              id="titulo"
              label="Título do Projeto"
              value={titulo}
              onChange={(event) =>
                setTitulo(
                  event.target.value,
                )
              }
              placeholder={
                !manutencao
                  ? "Ex.: Manutenção de equipamento"
                  : "Ex.: Desenvolvimento de novo equipamento"
              }
              required
            />
          </div>

          {/* RESPONSÁVEL */}

          <div>
            <label className="text-text-muted mb-2 block text-sm font-semibold">
              Time responsável
              <Obrigatorio />
            </label>

            <select
              id="responsavel"
              value={responsavel}
              onChange={(event) =>
                setResponsavel(
                  event.target.value,
                )
              }
              disabled={carregandoTimes}
              required
              className="border-border bg-bg text-text h-11 w-full rounded-lg border px-3 outline-none"
            >
              <option value="">
                {carregandoTimes
                  ? "Carregando times..."
                  : "Selecione o time responsável"}
              </option>

              {times.map((time) => (
                <option
                  key={time.id}
                  value={time.id}
                >
                  {time.nome_time}
                </option>
              ))}
            </select>
          </div>

          {/* VENDEDOR */}

          <div>
            <Input
              id="vendedor"
              label="Vendedor"
              value={vendedor}
              onChange={(event) =>
                setVendedor(
                  event.target.value,
                )
              }
              placeholder="Ex.: João Silva"
              required
            />
          </div>

          {/* DATA DE ASSINATURA */}

          <div>
            <Input
              id="data-assinatura"
              type="date"
              value={dataAssinatura}
              onChange={(event) =>
                setDataAssinatura(
                  event.target.value,
                )
              }
              required
              iconRight={CalendarArrowUp}
              label="Data de assinatura"
            />
          </div>

          {/* DATA DE VENCIMENTO */}

          <div>
            <Input
              id="data-vencimento"
              type="date"
              value={dataVencimento}
              onChange={(event) =>
                setDataVencimento(
                  event.target.value,
                )
              }
              required
              iconRight={CalendarArrowDown}
              label="Data de vencimento"
            />
          </div>

          {/* PRIORIDADE */}

          <div>
            <label className="text-text-muted mb-2 block text-sm font-semibold">
              Prioridade
              <Obrigatorio />
            </label>

            <div className="relative w-full">
              <button
                type="button"
                className="prioridade-select border-border hover:border-border-hover flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-3 transition outline-none"
                onClick={() =>
                  setPrioridadeAberta(
                    !prioridadeAberta,
                  )
                }
              >
                <span
                  className={`badge prioridade-${prioridade.toLowerCase()}`}
                >
                  {nomePrioridade()}
                </span>

                <ChevronDown
                  size={18}
                  className="text-text-muted"
                />
              </button>

              {prioridadeAberta && (
                <div className="prioridade-menu border-border absolute right-0 left-0 z-20 mt-1.5 rounded-lg border p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() =>
                      selecionarPrioridade(
                        "Baixa",
                      )
                    }
                    className="hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5"
                  >
                    <span className="badge prioridade-baixa">
                      Baixa
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selecionarPrioridade(
                        "Media",
                      )
                    }
                    className="hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5"
                  >
                    <span className="badge prioridade-media">
                      Média
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selecionarPrioridade(
                        "Alta",
                      )
                    }
                    className="hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5"
                  >
                    <span className="badge prioridade-alta">
                      Alta
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selecionarPrioridade(
                        "Critica",
                      )
                    }
                    className="hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5"
                  >
                    <span className="badge prioridade-critica">
                      Crítica
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TIPO DE SISTEMA */}

          <div>
            <Select
              id="tipo-sistema"
              label="Tipo de sistema"
              value={projeto}
              onChange={(event) =>
                setProjeto(
                  event.target.value,
                )
              }
              required
            >
              <option value="" hidden>
                Selecione o tipo de sistema
              </option>

              <option value="1">
                Sistema de Torres
              </option>

              <option value="2">
                Sistema de Embarcação
              </option>

              <option value="3">
                Sistema de Sonda
              </option>
            </Select>
          </div>

          {/* EQUIPAMENTOS E ANEXOS */}

          <div className="col-span-4 mt-8 grid grid-cols-[1fr_auto_1fr] gap-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Input
                  type="text"
                  value={buscaEquipamento}
                  onChange={(event) => {
                    setBuscaEquipamento(
                      event.target.value,
                    );

                    setDropdownEquipamentoAberto(
                      true,
                    );
                  }}
                  onFocus={() =>
                    setDropdownEquipamentoAberto(
                      true,
                    )
                  }
                  onBlur={() =>
                    setTimeout(
                      () =>
                        setDropdownEquipamentoAberto(
                          false,
                        ),
                      150,
                    )
                  }
                  placeholder="Buscar equipamentos e materiais"
                  label="Equipamentos e materiais"
                />

                {dropdownEquipamentoAberto && (
                  <div className="border-border bg-bg absolute right-0 left-0 z-20 mt-1.5 max-h-56 overflow-y-auto rounded-lg border p-1.5 shadow-lg">
                    {equipamentosFiltrados()
                      .length === 0 ? (
                      <p className="text-text-muted px-2 py-1.5 text-sm">
                        Nenhum equipamento encontrado.
                      </p>
                    ) : (
                      equipamentosFiltrados().map(
                        (nome) => (
                          <button
                            key={nome}
                            type="button"
                            onClick={() =>
                              adicionarEquipamento(
                                nome,
                              )
                            }
                            className="hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-text"
                          >
                            {nome}
                          </button>
                        ),
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {equipamentos.map(
                  (equipamento) => (
                    <span
                      key={equipamento.nome}
                      className="bg-primary/15 text-primary flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {equipamento.quantidade}x{" "}
                      {equipamento.nome}

                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          removerEquipamento(
                            equipamento.nome,
                          )
                        }
                      />
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="border-border w-px border-l" />

            <div className="ml-auto h-full w-full">
              <div className="text-text-muted mb-3 flex items-center gap-2 text-sm font-semibold">
                <Link size={19} />

                <span>Anexos</span>

                <span className="font-normal text-slate-400">
                  (opcional)
                </span>
              </div>

              {anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="flex min-h-[34px] items-center justify-between py-1.5 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span>📄</span>

                    <span className="text-text-muted truncate">
                      {anexo.nome}
                    </span>

                    <span className="text-text-muted shrink-0">
                      {anexo.tamanho}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="text-text-muted ml-2 shrink-0 p-1 hover:text-red-500"
                    onClick={() =>
                      removerAnexo(
                        anexo.id,
                      )
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}

              <input
                ref={inputArquivo}
                id="arquivopdf"
                type="file"
                multiple
                accept=".pdf,application/pdf"
                hidden
                onChange={adicionarArquivos}
              />

              <button
                type="button"
                className="border-primary bg-primary-muted text-primary hover:border-primary-hover hover:bg-primary/25 mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition"
                onClick={() =>
                  inputArquivo.current?.click()
                }
              >
                <Upload size={18} />
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* BOTÕES */}

        <div className="mt-8 flex items-center justify-end gap-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Voltar
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
          >
            {enviando
              ? "Enviando..."
              : "Solicitar O.S."}
          </Button>
        </div>
      </form>
    </main>
  );
}