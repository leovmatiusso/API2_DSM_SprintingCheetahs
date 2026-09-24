import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, CircleAlert, Wrench, Users, Paperclip, Upload, X, ChevronDown } from "lucide-react";

import { getCurrentUser, logout } from "@/auth";

import Button from "@/components/ui/Button";

{/* imports para o formulário */}
import { FormEvent, useEffect, useState } from "react";

import "@/style/NovaManutencao.css";

{/* variáveis para os campos */}
const tiposManutencao = [
    { value: "preventiva", label: "Preventiva" },
    { value: "corretiva", label: "Corretiva" },
    { value: "adaptativa", label: "Adaptativa" },
    { value: "evolutiva", label: "Evolutiva" },
];

const prioridades = [
    { value: "baixa", label: "Baixa" },
    { value: "media", label: "Média" },
    { value: "alta", label: "Alta" },
    { value: "critica", label: "Crítica" },
];

{/* interfaces que definem o tipo dos objetos aceitos pelo form */}
interface Equipamento {
    nome: string
    quantidade: number
}

interface Anexo {
    nome: string
    tamanho: string
    arquivo: File
}

export default function NovaManutencao() {
    const navigate = useNavigate();

    const user = getCurrentUser();

    if (!user) return null;

    function sair() {
        logout();
        navigate("/login", { replace: true });
    }

    {/* variaveis dos campos do form */}
    const [tipoManutencao, setTipoManutencao]= useState("")
    const [responsavel, setResponsavel]= useState("")
    const [dataInicio, setDataInicio]= useState("")
    const [prioridade, setPrioridade]= useState("")
    const [prioridadeAberta, setPrioridadeAberta] = useState(false)

    const [descricao, setDescricao]= useState("")

    const [buscaEquipamento, setBuscaEquipamento]= useState("")
    const [equipamentos, setEquipamentos]= useState<Equipamento[]>([])

    const [anexos, setAnexos] = useState<Anexo[]>([])

    {/* função de remover equipamento */}
    function removerEquipamento(nome: string) {
        setEquipamentos((prev) => prev.filter((eq) => eq.nome !== nome));
    }
    
    {/* função de upload do arquivo */}
    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        const novosAnexos: Anexo[] = Array.from(files).map((file) => ({
        nome: file.name,
        tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        arquivo: file,
        }));

        setAnexos((prev) => [...prev, ...novosAnexos]);
        e.target.value = "";
    }


    {/* função para remover anexo */}
    function removerAnexo(nome: string) {
        setAnexos((prev) => prev.filter((a) => a.nome !== nome))
    }


    {/* função para submeter o form */}
    function handleSubmit(e: FormEvent) {
        e.preventDefault()

        const payload = {
            tipoManutencao, 
            responsavel, 
            dataInicio, 
            prioridade, 
            descricao, 
            equipamentos, 
            anexos: anexos.map((a) => a.arquivo)
        }
    }

  return ( 
    <main className="page"> 
        <div className="content"> 
            <section className="card"> 
                <form onSubmit={handleSubmit}> 
 
                    {/* Título */} 
                    <div className="mb-8 flex items-start gap-4"> 
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15"> 
                            <ClipboardList className="size-6 text-primary" /> 
                        </div> 
                        <div> 
                            <h1 className="text-2xl font-semibold">Resumo</h1> 
                            <p className="muted text-sm"> 
                            Crie uma nova manutenção e atribua OS a ela após criação 
                            </p> 
                        </div> 
                    </div> 
 
                    {/* Campos principais */} 
                    <div className="grid grid-cols-4 gap-4 mb-8"> 
 
                        <label>Tipo de Manutenção 
                            <select value={tipoManutencao} onChange={(e) => setTipoManutencao(e.target.value)} > 
                                <option value="" className="font-thin">Selecione</option> 
                                    {tiposManutencao.map((tipo) => ( 
                                <option key={tipo.value} value={tipo.value}> 
                                {tipo.label} </option> 
                            ))} 
                            </select> 
                        </label> 
 
                        <label> 
                            Responsável 
                            <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome do responsável" /> 
                        </label> 
 
                        <label> 
                            Data de início do problema 
                            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /> 
                        </label> 
 
                        {/* PRIORIDADE ESTILIZADA */}
                        <div>
                            <label className="text-text-muted mb-2 block text-sm font-semibold">
                                Prioridade
                            </label>

                            <div className="relative w-full">
                                <button
                                    type="button"
                                    className="prioridade-select border-border hover:border-border-hover flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-3 transition outline-none"
                                    onClick={() => setPrioridadeAberta(!prioridadeAberta)}
                                >
                                    <span className={`badge prioridade-${prioridade || "baixa"}`}>
                                        {prioridade
                                            ? prioridades.find((p) => p.value === prioridade)?.label
                                            : "Selecione"}
                                    </span>

                                    <ChevronDown
                                        size={18}
                                        className="text-text-muted"
                                    />
                                </button>

                                {prioridadeAberta && (
                                    <div className="prioridade-menu border-border absolute right-0 left-0 z-20 mt-1.5 rounded-lg border p-1.5 shadow-lg">
                                        {prioridades.map((p) => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => {
                                                    setPrioridade(p.value);
                                                    setPrioridadeAberta(false);
                                                }}
                                                className="hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5"
                                            >
                                                <span className={`badge prioridade-${p.value}`}>
                                                    {p.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div> 
                     
                    <div className="mb-8"> 
                        <label className=""> Descrição 
                            <div className="relative"> 
                                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} 
                                placeholder="Descreva a solicitação, o que precisa ser desenvolvido e demais informações relevantes..." 
                                rows={5} 
                                className="bg-bg border-border focus:ring-primary w-full resize-none rounded-lg border p-3 font-normal focus:outline-none focus:ring-2" /> 
                                <button type="button" 
                                className="border-border bg-primary/15 text-primary absolute bottom-3 right-3 flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"> 
                                     
                                <ClipboardList className="size-3.5" /> 
                                Usar modelo de descrição 
                                </button> 
                            </div> 
                        </label> 
                    </div> 
                     
                    {/* Campo de equipamento e anexos */} 
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-6"> 
                        <div className="flex flex-col gap-4"> 
                            <label> Equipamentos e materiais </label> 
                            <input type="text" value={buscaEquipamento} onChange={(e) => setBuscaEquipamento(e.target.value)} placeholder="Buscar equipamentos e materiais" /> 
                             
                            <div className="flex flex-wrap gap-2"> 
                            {equipamentos.map((eq) => ( 
                                <span key={eq.nome} className="bg-primary/15 text-primary flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" > 
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
                        <div className="border-border w-px border-l" /> 
 
                        <div> 
                            <p className="mb-3 flex items-center gap-1"> 
                                <Paperclip className="h-4 w-4" /> Anexos 
                            </p> 
 
                            <div className="mb-4 space-y-2"> 
                                {anexos.map((anexo) => ( 
                                    <div key={anexo.nome} className="flex items-center justify-between text-sm" > 
                                        <span className="flex items-center gap-2"> 
                                            <ClipboardList className="text-text/50 h-4 w-4" /> 
                                            {anexo.nome} 
                                        </span> 
                                        <span className="muted flex items-center gap-3"> 
                                            {anexo.tamanho} 
                                            <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => removerAnexo(anexo.nome)} /> 
                                        </span> 
                                    </div> 
                                ))} 
                            </div> 
 
                            <label className="border-border bg-primary/15 text-primary flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium"> 
                                <Upload className="h-4 w-4" /> 
                                Upload 
                                <input type="file" multiple className="hidden" onChange={handleUpload} /> 
                            </label> 
 
                        </div> 
                    </div> 
 
 
                    {/* Botões */} 
                    <div className="mt-8 flex justify-end gap-3"> 
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}> 
                            Voltar 
                        </Button> 
                        <Button type="submit" variant="primary"> 
                            Criar manutenção 
                        </Button> 
                    </div> 
 
                </form> 
            </section> 
        </div> 
    </main> 
  ); 
}