import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CirclePlus } from "lucide-react";

import { createProjeto, getVendedores } from "@/api";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

import CampoAnexos, { anexosParaPayload } from "../compartilhadas/CampoAnexos";
import type { AnexoForm } from "../compartilhadas/CampoAnexos";
import CampoDescricao from "../compartilhadas/CampoDescricao";
import CampoEquipamentos, { equipamentosParaPayload } from "../compartilhadas/CampoEquipamentos";
import type { EquipamentoForm } from "../compartilhadas/CampoEquipamentos"; //arranquei o campo, mas possivelmente ele pode voltar por causa de uma ideia que ainda tem q ser validada
import SeletorPrioridade from "../compartilhadas/SeletorPrioridade";
import type { PrioridadeValor } from "../compartilhadas/SeletorPrioridade";

const TIPOS_SISTEMA = ["Sistema de Torres", "Sistema de Embarcação", "Sistema de Sonda"];

const MODELO_DESCRICAO = "Objetivo:\n\nEscopo e entregas:\n\nObservações:";

export default function NovoProjeto() {
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [prioridade, setPrioridade] = useState<PrioridadeValor | "">("");
  const [tipoSistema, setTipoSistema] = useState("");
  const [dataAssinatura, setDataAssinatura] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equipamentos, setEquipamentos] = useState<EquipamentoForm[]>([]); //arranquei o campo, mas possivelmente ele pode voltar por causa de uma ideia que ainda tem q ser validada
  const [anexos, setAnexos] = useState<AnexoForm[]>([]);

  const [vendedores, setVendedores] = useState<{ id_usuario: number; nome: string }[]>([]);
  const [carregandoVendedores, setCarregandoVendedores] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const respostaVendedores = await getVendedores();
        setVendedores(respostaVendedores.vendedores);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os vendedores.",
        );
      } finally {
        setCarregandoVendedores(false);
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

    setEnviando(true);

    try {
      const resposta = await createProjeto({
        nome: titulo.trim(),
        vendedor_nome: vendedor,
        prioridade,
        tipo_sistema: tipoSistema,
        data_assinatura_contrato: dataAssinatura,
        data_vencimento_contrato: dataVencimento,
        data_limite: dataLimite,
        descricao: descricao.trim(),
        equipamentos: equipamentosParaPayload(equipamentos),
        anexos: await anexosParaPayload(anexos),
      });

      // abre o projeto criado, onde as O.S. podem ser atribuídas
      navigate(`/projetos-totais/${resposta.projeto.projeto_id}`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível criar o projeto.",
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
              Novo projeto
            </h1>
            <p className="text-text-muted mt-1 mb-0 text-sm">
              Crie um novo projeto e atribua OS a ele após criação
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

        {/* LINHA 1: título, vendedor, prioridade */}
        <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <Input
              id="titulo"
              label="Título do projeto"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ex.: Desenvolvimento de novo equipamento"
              maxLength={150}
              required
            />
          </div>

          <Select
            id="vendedor"
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

        {/* LINHA 2: tipo de sistema e datas */}
        <div className="mt-6 grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
          <Select
            id="tipo-sistema"
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
            id="data-assinatura"
            type="date"
            label="Assinatura contratual"
            value={dataAssinatura}
            onChange={(event) => setDataAssinatura(event.target.value)}
            required
          />

          <Input
            id="data-vencimento"
            type="date"
            label="Vencimento contratual"
            value={dataVencimento}
            onChange={(event) => setDataVencimento(event.target.value)}
            required
          />

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
                  {enviando ? "Criando..." : "Criar projeto"}
                </Button>
              </>
            }
          />
        </div>
      </form>
    </main>
  );
}
