import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CirclePlus } from "lucide-react";

import { createManutencao, getProjetosParaManutencao } from "@/api";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

import CampoAnexos, { anexosParaPayload } from "../compartilhadas/CampoAnexos";
import type { AnexoForm } from "../compartilhadas/CampoAnexos";
import CampoDescricao from "../compartilhadas/CampoDescricao";
import CampoEquipamentos, { equipamentosParaPayload } from "../compartilhadas/CampoEquipamentos"; //arranquei o campo, mas possivelmente ele pode voltar por causa de uma ideia que ainda tem q ser validada
import type { EquipamentoForm } from "../compartilhadas/CampoEquipamentos";
import SeletorPrioridade from "../compartilhadas/SeletorPrioridade";
import type { PrioridadeValor } from "../compartilhadas/SeletorPrioridade";

const TIPOS_MANUTENCAO = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "adaptativa", label: "Adaptativa" },
  { value: "evolutiva", label: "Evolutiva" },
] as const;

type TipoManutencao = (typeof TIPOS_MANUTENCAO)[number]["value"];

const MODELO_DESCRICAO = "Problema:\n\nImpacto para o cliente:\n\nObservações:";

export default function NovaManutencao() {
  const navigate = useNavigate();

  const [resumo, setResumo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [prioridade, setPrioridade] = useState<PrioridadeValor | "">("");
  const [tipo, setTipo] = useState<TipoManutencao | "">("");
  const [projetoId, setProjetoId] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equipamentos, setEquipamentos] = useState<EquipamentoForm[]>([]); //arranquei o campo, mas possivelmente ele pode voltar por causa de uma ideia que ainda tem q ser validada
  const [anexos, setAnexos] = useState<AnexoForm[]>([]);

  const [projetos, setProjetos] = useState<
    { id_projeto: number; nome: string }[]
  >([]);
  const [carregandoProjetos, setCarregandoProjetos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const respostaProjetos = await getProjetosParaManutencao();
        setProjetos(respostaProjetos.projetos);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os projetos.",
        );
      } finally {
        setCarregandoProjetos(false);
      }
    }

    carregar();
  }, []);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (enviando) return;
    setErro(null);

    if (!prioridade) {
      setErro("Selecione a prioridade.");
      return;
    }
    if (!tipo) {
      setErro("Selecione o tipo de manutenção.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await createManutencao({
        resumo: resumo.trim(),
        data_inicio_problema: dataInicio,
        prioridade,
        tipo_manutencao: tipo,
        projeto_id: projetoId || null,
        data_limite: dataLimite,
        descricao_situacao: descricao.trim(),
        equipamentos: equipamentosParaPayload(equipamentos),
        anexos: await anexosParaPayload(anexos),
      });

      // abre a manutenção criada, onde as O.S. podem ser atribuídas
      navigate(`/manutencoes-totais/${resposta.manutencao.manutencao_id}`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível criar a manutenção.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="page nova-os-page min-h-full p-5 md:p-8">
      <form
        className="nova-os-card border-border mx-auto w-full max-w-[1140px] rounded-xl border p-6 shadow-sm md:p-9"
        onSubmit={enviar}
      >
        {/* CABEÇALHO */}
        <div className="mb-8 flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <CirclePlus size={30} />
          </div>
          <div>
            <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[28px]">
              Nova manutenção
            </h1>
            <p className="text-text-muted mt-1 mb-0 text-sm">
              Crie uma nova manutenção e atribua OS a ela após criação
            </p>
          </div>
        </div>

        {erro && (
          <div
            className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {erro}
          </div>
        )}

        {/* LINHA 1: resumo e data de início */}
        <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <Input
              id="resumo"
              label="Resumo da manutenção"
              value={resumo}
              onChange={(event) => setResumo(event.target.value)}
              placeholder="Ex.: Falha na câmera térmica da torre 2"
              maxLength={255}
              required
            />
          </div>

          <Input
            id="data-inicio"
            type="date"
            label="Data de início do problema"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            required
          />
        </div>

        {/* LINHA 2: prioridade, tipo, projeto e data limite */}
        <div className="mt-6 grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
          <SeletorPrioridade value={prioridade} onChange={setPrioridade} />

          <Select
            id="tipo-manutencao"
            label="Tipo de manutenção"
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoManutencao | "")}
            required
          >
            <option value="" hidden>
              Selecione
            </option>
            {TIPOS_MANUTENCAO.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>

          <Select
            id="projeto"
            label="Projeto"
            value={projetoId}
            onChange={(event) => {
              const id = event.target.value;
              setProjetoId(id);
            }}
            disabled={carregandoProjetos}
          >
            <option value="">
              {carregandoProjetos ? "Carregando..." : "Sem projeto vinculado"}
            </option>
            {projetos.map((projeto) => (
              <option key={projeto.id_projeto} value={String(projeto.id_projeto)}>
                {projeto.nome}
              </option>
            ))}
          </Select>

          <Input
            id="data-limite"
            type="date"
            label="Data limite"
            value={dataLimite}
            onChange={(event) => setDataLimite(event.target.value)}
            required
          />
        </div>

        {/* DESCRIÇÃO */}
        <div className="mt-6">
          <CampoDescricao
            id="descricao"
            value={descricao}
            onChange={setDescricao}
            placeholder="Descreva a solicitação, o que precisa ser desenvolvido e demais informações relevantes..."
            modelo={MODELO_DESCRICAO}
            required
          />
        </div>


        {/* ANEXOS + AÇÕES */}
        <div className="mt-8">
          <CampoAnexos
            anexos={anexos}
            onChange={setAnexos}
            acoes={
              <>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
                  Voltar
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={enviando}>
                  {enviando ? "Criando..." : "Criar manutenção"}
                </Button>
              </>
            }
          />
        </div>
      </form>
    </main>
  );
}
