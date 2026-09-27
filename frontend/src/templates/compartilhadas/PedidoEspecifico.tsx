import {
  ChartNoAxesCombined,
  CirclePlus,
  ClipboardList,
  File,
  FileSignature,
  Link,
  MonitorCog,
  Pencil,
  ScrollText,
  UserRound,
  UserRoundCog,
  Wrench,
  CalendarDays,
} from "lucide-react";

import { getCurrentUser } from '@/auth';

const user = getCurrentUser();

const manutencao = user?.role === 'suporte';

const ordens = [
  { prioridade: "Alta", status: "Teste" },
  { prioridade: "Alta", status: "Aberta" },
  { prioridade: "Baixa", status: "Review" },
  { prioridade: "Baixa", status: "Review" },
  { prioridade: "Alta", status: "Teste" },
  { prioridade: "Alta", status: "Aberta" },
  { prioridade: "Baixa", status: "Review" },
  { prioridade: "Baixa", status: "Review" },
];

function OrdemCard({
  prioridade,
  status,
}: {
  prioridade: string;
  status: string;
}) {
  return (
    <article className="nova-os-card border-border rounded-xl border shadow-sm">
      <h3 className="border-border text-text m-0 border-b px-5 py-3 text-xl font-bold">
        OS Título
      </h3>

      <div className="text-text space-y-1 px-5 py-2 text-sm">
        <p className="m-0">
          <strong>Time:</strong> Lumina
        </p>
        <p className="m-0">
          <strong>Departamento:</strong> Software
        </p>
        <p className="m-0">
          <strong>Prioridade:</strong>{" "}
          <span className={`badge prioridade-${prioridade.toLowerCase()}`}>
            {prioridade}
          </span>
        </p>
        <p className="m-0">
          <strong>Status:</strong>{" "}
          <span
            className={`rounded px-1.5 py-0.5 text-xs ${
              status === "Review"
                ? "bg-pink-200 text-pink-900"
                : status === "Teste"
                  ? "bg-sky-200 text-sky-900"
                  : "bg-slate-200 text-slate-800"
            }`}
          >
            {status}
          </span>
        </p>
      </div>
    </article>
  );
}

export default function ProjetoEspecifico() {
  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* Cabeçalho do projeto */}
        <section className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <ClipboardList size={32} />
            </div>

            <div>
              <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
                {manutencao ? 'Titulo de manutenção' :  'Título do projeto'}
              </h1>
              <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
                {manutencao ? 'Veja os detalhes' :  'Acompanhe e gerencie os projetos'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="bg-primary hover:bg-primary-hover flex shrink-0 items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white transition"
          >
            <Pencil size={18} />
            Editar
          </button>
        </section>

        {/* Informações do projeto */}
        <section className="nova-os-card border-border grid overflow-hidden rounded-xl border shadow-sm md:grid-cols-3">
          {manutencao ? (
  <div className="border-border grid grid-cols-1 gap-x-6 gap-y-5 border-b p-6 sm:grid-cols-2 md:border-r md:border-b-0">
    <div className="flex items-center gap-3">
      <UserRoundCog
        className="text-text-muted shrink-0"
        size={22}
      />
      <div>
        <span className="text-text-muted block text-xs">
          Responsável
        </span>
        <span className="text-text text-sm">Roberval Silva</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <CalendarDays
        className="text-text-muted shrink-0"
        size={22}
      />
      <div>
        <span className="text-text-muted block text-xs">
          Data de início do problema
        </span>
        <span className="text-text text-sm">26/11/2026</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <Wrench
        className="text-text-muted shrink-0"
        size={22}
      />
      <div>
        <span className="text-text-muted block text-xs">
          Tipo de manutenção
        </span>
        <span className="text-text text-sm">João Silva</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <ChartNoAxesCombined
        className="text-text-muted shrink-0"
        size={22}
      />
      <div>
        <span className="text-text-muted block text-xs">
          Prioridade
        </span>
        <span className="text-text text-sm">Crítica</span>
      </div>
    </div>
  </div>
) : (
  <div className="border-border grid grid-cols-1 gap-x-6 gap-y-5 border-b p-6 sm:grid-cols-2 md:border-r md:border-b-0">
    <div className="flex items-center gap-3">
      <UserRoundCog
        className="text-text-muted shrink-0"
        size={22}
      />
      <div>
        <span className="text-text-muted block text-xs">
          Responsável
        </span>
        <span className="text-text text-sm">Roberval Silva</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <FileSignature
        className="text-text-muted shrink-0"
        size={22}
      />
      <div>
        <span className="text-text-muted block text-xs">
          Data de assinatura do contrato
        </span>
        <span className="text-text text-sm">26/11/2026</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <UserRound className="text-text-muted shrink-0" size={22} />
      <div>
        <span className="text-text-muted block text-xs">Vendedor</span>
        <span className="text-text text-sm">João Silva</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <ScrollText className="text-text-muted shrink-0" size={22} />
      <div>
        <span className="text-text-muted block text-xs">
          Data de vencimento do contrato
        </span>
        <span className="text-text text-sm">26/11/2028</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <MonitorCog className="text-text-muted shrink-0" size={22} />
      <div>
        <span className="text-text-muted block text-xs">
          Tipo do sistema
        </span>
        <span className="text-text text-sm">Harpia</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <ChartNoAxesCombined
        className="text-text-muted shrink-0"
        size={22}
      />
      <div>
        <span className="text-text-muted block text-xs">Prioridade</span>
        <span className="text-text text-sm">Crítica</span>
      </div>
    </div>
  </div>
)}

          <div className="border-border flex gap-3 border-b p-6 md:border-r md:border-b-0">
            <ClipboardList
              className="text-text-muted mt-0.5 shrink-0"
              size={22}
            />
            <div>
              <span className="text-text-muted block text-xs">Descrição</span>
              <p className="text-text mt-1 mb-0 text-sm">
                Descrição do projeto
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="text-text mb-4 flex items-center gap-2 font-semibold">
              <Link className="text-text-muted" size={19} />
              Anexos
            </div>

            <div className="text-text-muted flex items-center gap-3 text-sm">
              <File size={17} />
              <span className="text-text">Contrato.pdf</span>
              <span className="ml-auto text-xs">2,4 MB</span>
              <button
                type="button"
                className="hover:text-danger ml-2"
                aria-label="Remover anexo"
              >
                ×
              </button>
            </div>
          </div>
        </section>

        {/* Ordens de serviço */}
        <section className="mt-9">
          <div className="mb-7 flex items-center gap-4">
            <div className="bg-primary-muted text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
              <ClipboardList size={29} />
            </div>

            <div>
              <h2 className="text-text m-0 text-2xl font-bold md:text-[28px]">
                Ordens de serviço
              </h2>
              <p className="text-text-muted m-0 text-sm">
                Acompanhe e gerencie as OS
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {ordens.map((ordem, index) => (
              <OrdemCard key={index} {...ordem} />
            ))}
          </div>
        </section>
      </div>

      {/* Botão flutuante */}
      <button
        type="button"
        className="bg-primary hover:bg-primary-hover fixed right-6 bottom-6 flex items-center gap-2 rounded-lg px-5 py-3.5 font-semibold text-white shadow-lg transition"
      >
        <CirclePlus size={20} />
        Nova OS
      </button>
    </main>
  );
}