import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { getCurrentUser } from '@/auth';

import {
  ClipboardList,
  Link,
  Upload,
  X,
  ChevronDown,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import "@/style/NovaOrdemServico.css";

type TipoOS = "manutencao" | "novo-projeto";

{/* variável dos equipamentos */}
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

interface NovaOrdemServicoProps {
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
}

function Obrigatorio() {
  return (
    <span className="text-danger ml-0.5 font-light"
      aria-hidden="true" >
      *
    </span>
  );
}

export default function NovaOrdemServico() {
  const navigate = useNavigate();

  const inputArquivo = useRef<HTMLInputElement>(null);

  const [cliente, setCliente] = useState("");
  const [projeto, setProjeto] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [titulo, setTitulo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [timeResponsavel, setTimeResponsavel] = useState("");

  const [prioridade, setPrioridade] = useState("Baixa");
  const [prioridadeAberta, setPrioridadeAberta] = useState(false);

  const [descricao, setDescricao] = useState("");

  const [buscaEquipamento, setBuscaEquipamento] = useState("");
  const [dropdownEquipamentoAberto, setDropdownEquipamentoAberto] = useState(false);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);

  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const user = getCurrentUser();

  const manutencao = user?.role === 'suporte';

  function adicionarEquipamento(nome: string) {
    setEquipamentos((prev) => {
      const existente = prev.find((eq) => eq.nome === nome);

      if (existente) {
        return prev.map((eq) =>
          eq.nome === nome ? { ...eq, quantidade: eq.quantidade + 1 } : eq,
        );
      }

      return [...prev, { nome, quantidade: 1 }];
    });

    setBuscaEquipamento("");
    setDropdownEquipamentoAberto(false);
  }

  function removerEquipamento(nome: string) {
    setEquipamentos((prev) => prev.filter((eq) => eq.nome !== nome));
  }

  function equipamentosFiltrados() {
    return EQUIPAMENTOS_DISPONIVEIS.filter((nome) =>
      nome.toLowerCase().includes(buscaEquipamento.toLowerCase()),
    );
  }

  function adicionarArquivos(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = event.target.files;

    if (!arquivos) {
      return;
    }

    const arquivosPDF = Array.from(arquivos).filter(
      (arquivo) => arquivo.type === "application/pdf",
    );

    const arquivosInvalidos = Array.from(arquivos).filter(
      (arquivo) => arquivo.type !== "application/pdf",
    );

    if (arquivosInvalidos.length > 0) {
      alert("Apenas arquivos PDF são permitidos.");
    }

    const novosAnexos = arquivosPDF.map((arquivo, index) => ({
      id: Date.now() + index,
      nome: arquivo.name,
      tamanho: formatarTamanho(arquivo.size),
    }));

    setAnexos((anterior) => [...anterior, ...novosAnexos]);

    event.target.value = "";
  }

  function removerAnexo(id: number) {
    setAnexos((anterior) =>
      anterior.filter((anexo) => anexo.id !== id),
    );
  }

  function formatarTamanho(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function selecionarPrioridade(valor: string) {
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

  async function enviarFormulario(event: FormEvent) {
    event.preventDefault();

    setErro(null);

    if (!timeResponsavel) {
      setErro("Selecione o time responsável.");
      return;
    }

    const token = localStorage.getItem("token");

    const payload = {
      os_titulo: titulo,
      os_descricao: descricao,
      prioridade: prioridade.toLowerCase(),
      data_limite: prazo,
      id_time_responsavel: Number(timeResponsavel),
      equipamentos,
    };

    setEnviando(true);

    try {
      const resposta = await fetch(`${API_URL}/api/os`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.message ??
            "Não foi possível abrir a ordem de serviço.",
        );
        return;
      }

      navigate("/dashboard");
    } catch {
      setErro(
        "Não foi possível conectar ao servidor. Tente novamente.",
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
                Nova Ordem de Serviço
              </h1>

              <p className="text-text-muted mt-2 text-sm leading-6">
                {manutencao
                  ? "Abra uma nova solicitação de manutenção para que o gestor possa direcioná-la à equipe responsável."
                  : "Abra uma nova solicitação de OS para que o gestor possa direcioná-la à equipe responsável."}
              </p>
            </div>
          </div>

          <p className="text-text-muted mt-4 text-xs">
            Campos marcados com{" "}
            <span className="text-red-500">*</span> são obrigatórios.
          </p>
        </div>

        {/* CAMPOS PRINCIPAIS */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

          {/* TÍTULO */}

          <div>
            <Input
              id="titulo"
              label="Título da solicitação"
              value={titulo}
              onChange={(event) =>
                setTitulo(event.target.value)
              }
              placeholder={
                manutencao
                  ? "Ex.: Manutenção de equipamento"
                  : "Ex.: Desenvolvimento de novo equipamento"
              }
              required
            />
          </div>

          {/* TIME RESPONSÁVEL */}

          <div>
            <Select
              id="timeResponsavel"
              label="Time responsável"
              value={timeResponsavel}
              onChange={(event) =>
                setTimeResponsavel(event.target.value)
              }
              required
            >
              <option value="" hidden>
                Selecione o time
              </option>

              {/* TODO: substituir por times reais vindos da API */}

              <option value="1">Time 1</option>
              <option value="2">Time 2</option>
              <option value="3">Time 3</option>
            </Select>
          </div>

          {/* PRAZO */}
          <div>
            <Input id="prazo" type="date"
              value={prazo}
              onChange={(event) =>
                setPrazo(event.target.value)
              }
              required
              label="Prazo desejado"
            />
          </div>

          {/* PROJETO */}

          {manutencao && (
            <div>
              <Select
                id="projeto"
                label="Projeto existente"
                value={projeto}
                onChange={(event) =>
                  setProjeto(event.target.value)
                }
                required
              >
                <option value="" hidden>
                  Selecione o projeto
                </option>

                <option value="1">Projeto 1</option>
                <option value="2">Projeto 2</option>
                <option value="3">Projeto 3</option>
              </Select>
            </div>
          )}

          {/* EQUIPAMENTO */}

          {manutencao && (
            <div>
              <Input
                id="equipamento"
                label="Equipamento / local"
                value={equipamento}
                onChange={(event) =>
                  setEquipamento(event.target.value)
                }
                placeholder="Informe o equipamento ou local"
                required
              />
            </div>
          )}

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
                  setPrioridadeAberta(!prioridadeAberta)
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
                      selecionarPrioridade("Baixa")
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
                      selecionarPrioridade("Media")
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
                      selecionarPrioridade("Alta")
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
                      selecionarPrioridade("Critica")
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
        </div>

        {/* DESCRIÇÃO */}

        <div className="mt-7">
          <Textarea
            id="descricao"
            label={
              manutencao
                ? "Descrição do problema"
                : "Descrição"
            }
            value={descricao}
            onChange={(event) =>
              setDescricao(event.target.value)
            }
            placeholder={
              manutencao
                ? "Descreva o problema, o relato do cliente e demais informações relevantes..."
                : "Descreva a solicitação, o que precisa ser desenvolvido e demais informações relevantes..."
            }
            required
          />
        </div>

        {/* EQUIPAMENTOS E ANEXOS */}

        <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Input
                id="equipamentos"
                type="text"
                label="Equipamentos e materiais"
                value={buscaEquipamento}
                onChange={(event) => {
                  setBuscaEquipamento(event.target.value);
                  setDropdownEquipamentoAberto(true);
                }}
                onFocus={() => setDropdownEquipamentoAberto(true)}
                onBlur={() =>
                  setTimeout(() => setDropdownEquipamentoAberto(false), 150)
                }
                placeholder="Buscar equipamentos e materiais"
              />

              {dropdownEquipamentoAberto && (
                <div className="border-border bg-bg absolute right-0 left-0 z-20 mt-1.5 max-h-56 overflow-y-auto rounded-lg border p-1.5 shadow-lg">
                  {equipamentosFiltrados().length === 0 ? (
                    <p className="text-text-muted px-2 py-1.5 text-sm">
                      Nenhum equipamento encontrado.
                    </p>
                  ) : (
                    equipamentosFiltrados().map((nome) => (
                      <button
                        key={nome}
                        type="button"
                        onClick={() => adicionarEquipamento(nome)}
                        className="hover:bg-bg-tertiary text-text flex w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm"
                      >
                        {nome}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {equipamentos.map((eq) => (
                <span
                  key={eq.nome}
                  className="bg-primary/15 text-primary flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {eq.quantidade}x {eq.nome}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removerEquipamento(eq.nome)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* linha que separa o campo de equipamento com anexo */}
          <div className="border-border hidden w-px border-l md:block" />

          <div>
            <div className="text-text-muted mb-3 flex items-center gap-2 text-sm font-semibold">
              <Link size={19} />

              <span>Anexos</span>

              <span className="font-normal text-slate-400">(opcional)</span>
            </div>

            {anexos.map((anexo) => (
              <div
                key={anexo.id}
                className="flex min-h-[34px] items-center justify-between py-1.5 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span>📄</span>

                  <span className="text-text-muted truncate">{anexo.nome}</span>

                  <span className="text-text-muted shrink-0">{anexo.tamanho}</span>
                </div>

                <button
                  type="button"
                  className="text-text-muted ml-2 shrink-0 p-1 hover:text-red-500"
                  onClick={() => removerAnexo(anexo.id)}
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
              onClick={() => inputArquivo.current?.click()}
            >
              <Upload size={18} />
              Upload
            </button>
          </div>
        </div>

        {/* BOTÕES */}

        <div className="mt-8 flex items-center justify-end gap-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate("/dashboard")}
          >
            Voltar
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
          >
            Solicitar O.S.
          </Button>
        </div>
      </form>
    </main>
  );
}