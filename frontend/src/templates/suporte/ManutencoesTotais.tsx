import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

interface Manutencao {
    id: string;
    resumo: string;
    responsavel: string;
    prioridade: "Baixa" | "Media" | "Alta" | "Critica";
    tipoManutencao: "Corretiva" | "Preventiva" | "Adaptativa" | "Evolutiva";
}

interface ManutencoesTotaisProps {
    tipo: "manutencao" | "instalacao";
}

{/* prioridade com cor padrão */}
const prioridadeStyles: Record<Manutencao["prioridade"], string> = {
    Baixa: "bg-success-alt text-success-alt-inverted",
    Media: "bg-warning-alt text-warning-alt-inverted",
    Alta: "bg-laranja-alt text-laranja-alt-inverted",
    Critica: "bg-danger-alt text-danger-alt-inverted",
};

{/* status com cor padrão */}
const TipoManutencaoStyles: Record<Manutencao["tipoManutencao"], string> = {
    Corretiva: "bg-success-alt text-success-alt-inverted",
    Preventiva: "bg-warning-alt text-warning-alt-inverted",
    Evolutiva: "bg-laranja-alt text-laranja-alt-inverted",
    Adaptativa: "bg-danger-alt text-danger-alt-inverted",
};

export default function ManutencoesTotais({ tipo }: ManutencoesTotaisProps) {
    const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function fetchManutencoes() {
            try {
                setCarregando(true);
                // TODO: trocar pela chamada real, ex:
                // const res = await api.get(`/manutencoes?tipo=${tipo}`);
                // setManutencoes(res.data);

                // exemplo de manutenções criadas
                setManutencoes([
                    { id: "1", resumo: "Resumo", responsavel: "Marcos Santos", prioridade: "Alta", tipoManutencao: "Preventiva" },
                    { id: "2", resumo: "Resumo", responsavel: "Kelwin Rocha", prioridade: "Baixa", tipoManutencao: "Corretiva" },
                ]);
            } finally {
                setCarregando(false);
            }
        }

        fetchManutencoes();
    }, [tipo]);

    return (
        <div className="page">
            <div className="content">
                <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
                    <Wrench className="text-primary" size={30} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-text">Manutenções</h1>
                    <p className="text-sm text-text-muted">Acompanhe todas as manutenções que você participa</p>
                </div>
                </div>

                {carregando ? ( <p className="text-sm text-text-muted">Carregando manutenções...</p> ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {manutencoes.map((manutencao) => (
                    <div key={manutencao.id}
                        className="card hover:shadow-md transition-shadow cursor-pointer p-4">

                        <h3 className="font-bold text-text mb-2">{manutencao.resumo}</h3>

                        <p className="text-sm text-text-muted mb-1">
                        <span className="font-medium text-text">Responsável:</span> {manutencao.responsavel}
                        </p>

                        <div className="text-sm text-text-muted mb-1 flex items-center gap-1">
                            <span className="font-medium text-text">Prioridade:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadeStyles[manutencao.prioridade]}`} >
                                {manutencao.prioridade}
                            </span>
                        </div>

                        <div className="text-sm text-text-muted flex items-center gap-1">
                            <span className="font-medium text-text">Tipo:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TipoManutencaoStyles[manutencao.tipoManutencao]}`}>
                                {manutencao.tipoManutencao}
                            </span>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </div>
    );
}