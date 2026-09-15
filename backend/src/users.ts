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
}

// Dados temporários apenas para testes. Tudo é perdido quando o backend reinicia.
export const users: User[] = [
  { id: "1", name: "Administrador do Sistema", email: "admin@empresa.com", password: "123456", role: "superusuario", active: true },
  { id: "2", name: "Gestor", email: "gestor@empresa.com", password: "123456", role: "gestor", active: true },
  { id: "3", name: "Comercial", email: "comercial@empresa.com", password: "123456", role: "comercial", active: true },
  { id: "4", name: "Suporte", email: "suporte@empresa.com", password: "123456", role: "suporte", active: true },
  { id: "5", name: "Produção", email: "producao@empresa.com", password: "123456", role: "producao", active: true },
  { id: "6", name: "Software", email: "software@empresa.com", password: "123456", role: "software", active: true },
  { id: "7", name: "Implantação", email: "implantacao@empresa.com", password: "123456", role: "implantacao", active: true }
];

export function publicUser(user: User) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
