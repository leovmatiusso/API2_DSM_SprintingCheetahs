import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

interface Projeto {
    id: string;
    titulo: string;
    responsavel: string;
    prioridade: "Baixa" | "Media" | "Alta" | "Critica";
    status: "Nao iniciado" | "Em andamento" | "Concluido";
}

interface ProjetosTotaisProps {
    tipo: "projeto" | "manutencao";
}

const prioridadeStyles: Record<Projeto["prioridade"], string> = {
    Baixa: "bg-success-alt text-success-alt-inverted",
    Media: "bg-warning-alt text-warning-alt-inverted",
    Alta: "bg-laranja-alt text-laranja-alt-inverted",
    Critica: "bg-danger-alt text-danger-alt-inverted",
};

const statusStyles: Record<Projeto["status"], string> = {
    "Nao iniciado": "bg-secondary text-text",
    "Em andamento": "bg-success-alt text-success-alt-inverted",
    "Concluido": "bg-primary-muted text-primary",
};

export default function ProjetosTotais({ tipo }: ProjetosTotaisProps) {
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function fetchProjetos() {
            try {
                setCarregando(true);
                // TODO: trocar pela chamada real, ex:
                // const res = await api.get(`/projetos?tipo=${tipo}`);
                // setProjetos(res.data);

                // exemplo de projetos criadas
                setProjetos([
                    { id: "1", titulo: "Título", responsavel: "Marcos Santos", prioridade: "Alta", status: "Em andamento" },
                    { id: "2", titulo: "Título", responsavel: "Kelwin Felipe", prioridade: "Baixa", status: "Nao iniciado" },
                ]);
            } finally {
                setCarregando(false);
            }
        }

    fetchProjetos();
  }, [tipo]);

  return (
    <div className="page">
        <div className="content">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-muted p-2 rounded-lg">
                    <ClipboardList className="text-primary" size={24} />
                </div>

                <div>
                    <h1 className="text-title font-bold text-text">Projetos</h1>
                    <p className="text-small text-text-muted">Acompanhe e gerencie todos os projetos</p>
                </div>
            </div>

        {carregando ? (
            <p className="text-small text-text-muted">Carregando projetos...</p>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {projetos.map((projeto) => (
                <div key={projeto.id} className="card p-4 hover:border-border-hover transition-colors cursor-pointer">
                    <h3 className="font-bold text-text mb-2">{projeto.titulo}</h3>

                    <p className="text-small text-text-muted mb-1">
                    <span className="font-medium text-text">Responsável:</span> {projeto.responsavel}
                    </p>

                    <div className="text-small text-text-muted mb-1 flex items-center gap-1">
                        <span className="font-medium text-text">Prioridade:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadeStyles[projeto.prioridade]}`}>
                            {projeto.prioridade}
                        </span>
                    </div>

                    <div className="text-small text-text-muted flex items-center gap-1">
                        <span className="font-medium text-text">Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[projeto.status]}`}>
                            {projeto.status}
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