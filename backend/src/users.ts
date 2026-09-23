export type Role =
  | "superusuario"
  | "gestor"
  | "comercial"
  | "suporte"
  | "producao"
  | "software"
  | "implantacao";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  time_id: string | null;
}

export const users: User[] = [
  {
    id: "1",
    name: "Administrador do Sistema",
    email: "admin@empresa.com",
    password: "123456",
    role: "superusuario",
    active: true,
    time_id: null
  },
  {
    id: "2",
    name: "Gestor",
    email: "gestor@empresa.com",
    password: "123456",
    role: "gestor",
    active: true,
    time_id: null
  },
  {
    id: "3",
    name: "Comercial",
    email: "comercial@empresa.com",
    password: "123456",
    role: "comercial",
    active: true,
    time_id: "2"
  },
  {
    id: "4",
    name: "Suporte",
    email: "suporte@empresa.com",
    password: "123456",
    role: "suporte",
    active: true,
    time_id: null
  },
  {
    id: "5",
    name: "Produção",
    email: "producao@empresa.com",
    password: "123456",
    role: "producao",
    active: true,
    time_id: null
  },
  {
    id: "6",
    name: "Software",
    email: "software@empresa.com",
    password: "123456",
    role: "software",
    active: true,
    time_id: "1"
  },
  {
    id: "7",
    name: "Implantação",
    email: "implantacao@empresa.com",
    password: "123456",
    role: "implantacao",
    active: true,
    time_id: null
  }
];

export function publicUser(user: User) {
  const {
    password: _password,
    ...safeUser
  } = user;

  return safeUser;
}