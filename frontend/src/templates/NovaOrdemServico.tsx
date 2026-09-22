import { ChangeEvent, FormEvent, useRef, useState } from "react";

import { ClipboardList, Link, Upload, X, ChevronDown } from "lucide-react";

import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";

import "../style/NovaOrdemServico.css";

type TipoOS = "manutencao" | "novo-projeto";

interface NovaOrdemServicoProps {
  tipo: TipoOS;
}

interface Anexo {
  id: number;
  nome: string;
  tamanho: string;
}

export default function NovaOrdemServico({ tipo }: NovaOrdemServicoProps) {
  const navigate = useNavigate();

  const inputArquivo = useRef<HTMLInputElement>(null);

  const [cliente, setCliente] = useState("");
  const [projeto, setProjeto] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [titulo, setTitulo] = useState("");
  const [prazo, setPrazo] = useState("");

  const [prioridade, setPrioridade] = useState("Critica");

  const [prioridadeAberta, setPrioridadeAberta] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [itens, setItens] = useState("");

  const [anexos, setAnexos] = useState<Anexo[]>([]);

  const manutencao = tipo === "manutencao";

  function adicionarArquivos(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = event.target.files;

    if (!arquivos) {
      return;
    }

    const arquivosPDF = Array.from(arquivos).filter(
      (arquivo) => arquivo.type === "application/pdf",
    );

    const novosAnexos = arquivosPDF.map((arquivo, index) => ({
      id: Date.now() + index,
      nome: arquivo.name,
      tamanho: formatarTamanho(arquivo.size),
    }));

    setAnexos((anterior) => [...anterior, ...novosAnexos]);

    event.target.value = "";
  }

  function removerAnexo(id: number) {
    setAnexos((anterior) => anterior.filter((anexo) => anexo.id !== id));
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

  function enviarFormulario(event: FormEvent) {
    event.preventDefault();

    /*
      Front-end apenas.

      O envio real poderá ser conectado
      ao back-end posteriormente.
    */
  }

  return (
    <main
      className="
      page
      nova-os-page
      min-h-full
      p-5
      md:p-8
    "
    >
      <form
        className="
          nova-os-card
          mx-auto
          w-full
          max-w-[1140px]
          rounded-xl
          border
          border-slate-200
          p-6
          shadow-sm
          md:p-9
        "
        onSubmit={enviarFormulario}
      >
        {/* CABEÇALHO */}

        <div className="mb-8">
          <div
            className="
            flex
            items-center
            gap-4
          "
          >
            <div
              className="
              flex
              h-16
              w-16
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-blue-50
              text-blue-700
            "
            >
              <ClipboardList size={30} />
            </div>

            <div>
              <h1
                className="
                m-0
                text-2xl
                font-bold
                leading-tight
                text-text
                md:text-[28px]
              "
              >
                Nova Ordem de Serviço
              </h1>

              <p
                className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
              >
                {manutencao
                  ? "Abra uma nova solicitação de manutenção para que o gestor possa direcioná-la à equipe responsável."
                  : "Abra uma nova solicitação de projeto para que o gestor possa direcioná-la à equipe responsável."}
              </p>
            </div>
          </div>
        </div>

        {/* CAMPOS */}

        <div
          className="
          grid
          grid-cols-1
          gap-x-7
          gap-y-5
          md:grid-cols-2
          xl:grid-cols-4
        "
        >
          {/* TÍTULO */}

          <div className="xl:col-span-2">
            <label
              htmlFor="titulo"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-text-muted
              "
            >
              Título da solicitação
            </label>

            <input
              id="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder={
                manutencao
                  ? "Ex.: Manutenção de equipamento"
                  : "Ex.: Desenvolvimento de novo equipamento"
              }
              required
              className="
                nova-os-input
                h-[46px]
                w-full
                rounded-lg
                border
                border-slate-300
                px-3
                text-sm
                outline-none
                transition
                placeholder:text-slate-400
              "
            />
          </div>

          {/* CLIENTE */}

          <div>
            <label
              htmlFor="cliente"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-text-muted
              "
            >
              Cliente
            </label>

            <select
              id="cliente"
              value={cliente}
              onChange={(event) => setCliente(event.target.value)}
              required
              className="
                nova-os-input
                h-[46px]
                w-full
                rounded-lg
                border
                border-slate-300
                px-3
                text-sm
                outline-none
              "
            >
              <option value="">Selecione o cliente</option>

              <option value="cliente-1">Cliente 1</option>

              <option value="cliente-2">Cliente 2</option>

              <option value="cliente-3">Cliente 3</option>
            </select>
          </div>

          {/* PRAZO */}

          <div>
            <label
              htmlFor="prazo"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-text-muted
              "
            >
              Prazo desejado
            </label>

            <input
              id="prazo"
              type="date"
              value={prazo}
              onChange={(event) => setPrazo(event.target.value)}
              required
              className="
                nova-os-input
                h-[46px]
                w-full
                rounded-lg
                border
                border-slate-300
                px-3
                text-sm
                outline-none
              "
            />
          </div>

          {/* PROJETO */}

          {manutencao && (
            <div>
              <label
                htmlFor="projeto"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-text-muted
                "
              >
                Projeto existente
              </label>

              <select
                id="projeto"
                value={projeto}
                onChange={(event) => setProjeto(event.target.value)}
                required
                className="
                  nova-os-input
                  h-[46px]
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-3
                  text-sm
                  outline-none
                "
              >
                <option value="">Selecione o projeto</option>

                <option value="projeto-1">Projeto 1</option>

                <option value="projeto-2">Projeto 2</option>

                <option value="projeto-3">Projeto 3</option>
              </select>
            </div>
          )}

          {/* EQUIPAMENTO */}

          {manutencao && (
            <div>
              <label
                htmlFor="equipamento"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-text-muted
                "
              >
                Equipamento / local
              </label>

              <input
                id="equipamento"
                value={equipamento}
                onChange={(event) => setEquipamento(event.target.value)}
                placeholder="Informe o equipamento ou local"
                required
                className="
                  nova-os-input
                  h-[46px]
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-3
                  text-sm
                  outline-none
                  placeholder:text-slate-400
                "
              />
            </div>
          )}

          {/* PRIORIDADE */}

          <div>
            <label
              className="
              mb-2
              block
              text-sm
              font-semibold
              text-text-muted
            "
            >
              Prioridade
            </label>

            <div
              className="
              relative
              w-full
            "
            >
              <button
                type="button"
                className="
                  prioridade-select
                  flex
                  h-[46px]
                  w-full
                  items-center
                  justify-between
                  rounded-lg
                  border
                  border-slate-300
                  px-3
                  outline-none
                  transition
                  hover:border-slate-400
                "
                onClick={() => setPrioridadeAberta(!prioridadeAberta)}
              >
                <span
                  className={`
                    prioridade-badge
                    prioridade-${prioridade.toLowerCase()}
                  `}
                >
                  {nomePrioridade()}
                </span>

                <ChevronDown
                  size={18}
                  className="
                    text-slate-500
                  "
                />
              </button>

              {prioridadeAberta && (
                <div
                  className="
                  prioridade-menu
                  absolute
                  left-0
                  right-0
                  z-20
                  mt-1.5
                  rounded-lg
                  border
                  border-slate-200
                  p-1.5
                  shadow-lg
                "
                >
                  <button
                    type="button"
                    onClick={() => selecionarPrioridade("Baixa")}
                    className="
                      flex
                      w-full
                      rounded-md
                      p-1.5
                      hover:bg-slate-50
                    "
                  >
                    <span
                      className="
                      prioridade-badge
                      prioridade-baixa
                    "
                    >
                      Baixa
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarPrioridade("Media")}
                    className="
                      flex
                      w-full
                      rounded-md
                      p-1.5
                      hover:bg-slate-50
                    "
                  >
                    <span
                      className="
                      prioridade-badge
                      prioridade-media
                    "
                    >
                      Média
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarPrioridade("Alta")}
                    className="
                      flex
                      w-full
                      rounded-md
                      p-1.5
                      hover:bg-slate-50
                    "
                  >
                    <span
                      className="
                      prioridade-badge
                      prioridade-alta
                    "
                    >
                      Alta
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarPrioridade("Critica")}
                    className="
                      flex
                      w-full
                      rounded-md
                      p-1.5
                      hover:bg-slate-50
                    "
                  >
                    <span
                      className="
                      prioridade-badge
                      prioridade-critica
                    "
                    >
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
          <label
            htmlFor="descricao"
            className="
              mb-2
              block
              text-sm
              font-semibold
              text-text-muted
            "
          >
            {manutencao ? "Descrição do problema" : "Descrição"}
          </label>

          <textarea
            id="descricao"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder={
              manutencao
                ? "Descreva o problema, o relato do cliente e demais informações relevantes..."
                : "Descreva a solicitação, o que precisa ser desenvolvido e demais informações relevantes..."
            }
            required
            className="
              nova-os-input
              min-h-[132px]
              w-full
              resize-y
              rounded-lg
              border
              border-slate-300
              p-3.5
              text-sm
              leading-6
              outline-none
              placeholder:text-slate-400
            "
          />
        </div>

        {/* ITENS */}

        {!manutencao && (
          <div className="mt-7">
            <label
              htmlFor="itens"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-text-muted
              "
            >
              Itens inicialmente necessários
            </label>

            <textarea
              id="itens"
              value={itens}
              onChange={(event) => setItens(event.target.value)}
              placeholder="Informe os produtos, peças, serviços ou recursos inicialmente necessários..."
              className="
                nova-os-input
                min-h-[110px]
                w-full
                resize-y
                rounded-lg
                border
                border-slate-300
                p-3.5
                text-sm
                leading-6
                outline-none
                placeholder:text-slate-400
              "
            />
          </div>
        )}

        {/* ANEXOS */}

        <div
          className="
          mt-7
          ml-auto
          w-full
          md:max-w-[360px]
        "
        >
          <div
            className="
            mb-3
            flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-text-muted
          "
          >
            <Link size={19} />

            <span>Anexos</span>
          </div>

          {anexos.map((anexo) => (
            <div
              key={anexo.id}
              className="
                flex
                min-h-[34px]
                items-center
                justify-between
                py-1.5
                text-xs
              "
            >
              <div
                className="
                flex
                min-w-0
                items-center
                gap-2
              "
              >
                <span>📄</span>

                <span
                  className="
                  truncate
                  text-text-muted
                "
                >
                  {anexo.nome}
                </span>

                <span
                  className="
                  shrink-0
                  text-slate-500
                "
                >
                  {anexo.tamanho}
                </span>
              </div>

              <button
                type="button"
                className="
                  ml-2
                  shrink-0
                  p-1
                  text-slate-500
                  hover:text-red-500
                "
                onClick={() => removerAnexo(anexo.id)}
              >
                <X size={15} />
              </button>
            </div>
          ))}

          <input
            ref={inputArquivo}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            hidden
            onChange={adicionarArquivos}
          />

          <button
            type="button"
            className="
              mt-3
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-blue-200
              bg-blue-50
              px-3
              py-2.5
              text-sm
              font-medium
              text-blue-700
              transition
              hover:border-blue-300
              hover:bg-blue-100
            "
            onClick={() => inputArquivo.current?.click()}
          >
            <Upload size={18} />
            Upload
          </button>
        </div>

        {/* BOTÕES */}

        <div
          className="
          mt-8
          flex
          items-center
          justify-end
          gap-6
        "
        >
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/dashboard")}
          >
            Voltar
          </Button>

          <Button type="submit" variant="primary" size="lg">
            Solicitar O.S.
          </Button>
        </div>
      </form>
    </main>
  );
}
