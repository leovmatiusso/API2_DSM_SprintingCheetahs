import {useState, FormEvent} from 'react'
import type { Role } from "../types";
import { getCurrentUser, logout } from "../auth";
import { useNavigate } from "react-router-dom";
import Button from '@/components/ui/Button';

const labels: Record<Role, string> = {
    superusuario: "Superusuário", gestor: "Gestor", comercial: "Comercial", suporte: "Suporte",
    producao: "Produção", software: "Software", implantacao: "Implantação"
};

type TabType = 'usuario' | 'time';

//tipo de dado que os forms aceitam
interface NovoUsuarioForm {
    primeiroNome: string
    sobrenome: string
    email: string
    timeUsuario: string
    cargoUsuario: string
}

interface NovoTimeForm {
    nomeTime: string
    pessoaResponsavel: string
    email: string
    pessoasVinculadas: string
    equipeRelacionada: string
}

//Aba (cadastrar usuário | cadastrar time)
export default function Cadastro() {
    const navigate = useNavigate();
    const user = getCurrentUser()
    const [activeTab, setActiveTab] = useState<TabType> ('usuario')
    
    //função de logout
    if (!user) return null;
    function sair() {
        logout();
        navigate("/login", { replace: true });
    }
    
    return (
        <>
        <header className="topbar">
        <div>
        <strong>Sistema de O.S.</strong>
        <span className="role-badge">{labels[user.role]}</span>
        </div>
        <nav className="nav-actions">
        
        <Button variant="secondary" onClick={() => navigate("/minha-conta")}>
        Minha conta
        </Button>
        <Button variant="secondary" onClick={sair}>
        Sair
        </Button>
        </nav>
        </header>
        
        <main className = "p-10">
            <div className="flex ">
                <TabButton 
                label = "Cadastrar usuário"
                isActive = {activeTab === 'usuario'}
                onClick = {() => setActiveTab('usuario')}/>
            
                <TabButton 
                label = "Cadastrar time"
                isActive = {activeTab === 'time'}
                onClick = {() => setActiveTab('time')}/>
            </div>
        
            {/*Form*/}
            <div className="bg-white rounded-b-2xl rounded-tr-2xl p-18 border border-gray-300">
                {activeTab === 'usuario' ? <CadastrarUsuarioForm /> : <CadastrarTimeForm />}
            </div>
        </main>
        </>
        
    )
}

//botão da tab/aba     
function TabButton({
    label,
    isActive,
    onClick,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button type="button"
        onClick={onClick}
        className={`px-6 py-3 rounded-t-xl border border-gray-200 text-sm font-medium transition-colors ${ isActive
            ? 'bg-white text-slate-900'
            : 'bg-gray-100 text-slate-500 hover:text-slate-700'
        }`}> {label} </button>
    );
}

//formulario reutilizável
function Field({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string
    value: string
    onChange: (v: string) => void
    type?: string
}) {
    return (
        <div> 
            <label className="block text-slate-900 ">{label} </label>
            <input type={type} 
            value = {value}
            onChange = {(e) => onChange(e.target.value)} 
            className="w-full border border-transparent px-3 py-1 -mt-3 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:bg-white"/>
        </div>
    );
}

//Formulário de novo usuário
function CadastrarUsuarioForm() {
    const [form, setForm] = useState <NovoUsuarioForm> ({
        primeiroNome: '',
        sobrenome: '',
        email: '',
        timeUsuario: '',
        cargoUsuario: '',
    })
    
    const setField = (key: keyof NovoUsuarioForm) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e: FormEvent) => {
        //faz com que n recarregue a página ao enviar o form
        e.preventDefault()

        //Chamar a api pra realmente cadastrar
        console.log('Novo usuário: ', form)
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Novo usuário</h2>
 
            <div className="grid grid-cols-2 gap-x-24 gap-y-2">
                <Field label="Primeiro nome" value={form.primeiroNome} onChange={setField('primeiroNome')} />
                <Field label="Time do usuário" value={form.timeUsuario} onChange={setField('timeUsuario')} />
 
                <Field label="Sobrenome" value={form.sobrenome} onChange={setField('sobrenome')} />
                <Field label="Cargo do usuário" value={form.cargoUsuario} onChange={setField('cargoUsuario')} />
 
                <Field label="Email" value={form.email} onChange={setField('email')} type="email" />
            </div>
 
            <div className="flex justify-end mt-3">
                <button
                type="submit"
                 className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"> Cadastrar
                </button>
            </div>
 
            <div className="flex justify-end mt-12">
                <button
                type="button"
                className="bg-indigo-950 hover:bg-indigo-900 text-white font-medium px-6 py-2 rounded-lg transition-colors">Visualizar todos os usuários
                </button>
            </div>
        </form>
    )
}

//Formulário de novo time
function CadastrarTimeForm() {
    const [form, setForm] = useState <NovoTimeForm> ({
        nomeTime: '',
        pessoaResponsavel: '',
        email: '',
        pessoasVinculadas: '',
        equipeRelacionada: '',
    })
    
    const setField = (key: keyof NovoTimeForm) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e: FormEvent) => {
        //faz com que n recarregue a página ao enviar o form
        e.preventDefault()

        //Chamar a api pra realmente cadastrar o time
        console.log('Novo usuário: ', form)
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Novo time</h2>
 
            <div className="grid grid-cols-2 gap-x-24 gap-y-2">
                <Field label="Nome do time" value={form.nomeTime} onChange={setField('nomeTime')} />
                <Field label="Pessoas Vinculadas" value={form.pessoasVinculadas} onChange={setField('pessoasVinculadas')} />
 
                <Field label="Pessoa Responsável" value={form.pessoaResponsavel} onChange={setField('pessoaResponsavel')} />
                <Field label="Equipe relacionada" value={form.equipeRelacionada} onChange={setField('equipeRelacionada')} />
 
                <Field label="Email" value={form.email} onChange={setField('email')} type="email" />
            </div>
 
            <div className="flex justify-end mt-3">
                <button
                type="submit"
                 className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"> Cadastrar
                </button>
            </div>
 
            <div className="flex justify-end mt-12">
                <button
                type="button"
                className="bg-indigo-950 hover:bg-indigo-900 text-white font-medium px-6 py-2 rounded-lg transition-colors">Visualizar todos os usuários
                </button>
            </div>
        </form>
    )
}
