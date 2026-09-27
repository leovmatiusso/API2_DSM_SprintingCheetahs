# Integração US06 — Front-end, Back-end e MySQL

Esta versão conecta os fluxos existentes de autenticação, usuários, times e criação/consulta de O.S. ao MySQL.

## 1. Banco de dados

Execute `script.sql` em uma instância MySQL vazia. O script cria o banco `API2`, as tabelas e os dados iniciais de desenvolvimento.

## 2. Backend

1. Copie `backend/.env.example` para `backend/.env`.
2. Preencha `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
3. Execute:

```cmd
cd backend
npm install
npm run build
npm start
```

A API ficará em `http://localhost:3001`.

## 3. Front-end

1. Copie `frontend/.env.example` para `frontend/.env` se a API estiver em outro endereço.
2. Execute:

```cmd
cd frontend
npm install
npm run build
npm run dev
```

## 4. Conta de teste

As contas iniciais usam a senha `123456`:

- `admin@empresa.com`
- `gestor@empresa.com`
- `comercial@empresa.com`
- `suporte@empresa.com`
- `producao@empresa.com`
- `software@empresa.com`
- `implantacao@empresa.com`

Troque as credenciais de desenvolvimento antes de disponibilizar o banco em produção.

## 5. AWS

Na AWS, o banco pode ser criado em Amazon RDS for MySQL. O backend deve receber as mesmas variáveis de ambiente apontando para o endpoint privado/público configurado no RDS, sem gravar credenciais no código.

## 6. Principais correções

- Login, usuários e alteração de senha consultam e gravam no MySQL.
- Usuários e times deixaram de ser armazenados em arrays em memória.
- CRUD de times mantém os vínculos entre usuários e responsáveis.
- O.S. usa o campo `os_cliente` também no banco, alinhando schema, API e formulário.
- Sessões continuam temporárias em memória; os dados de negócio ficam persistidos no banco.
- Token usado pelas telas de O.S. passa a ser o mesmo token salvo pelo módulo de autenticação.
- `VITE_API_URL` e variáveis do backend ficam configuráveis por ambiente.
- O layout e a estrutura visual existentes não foram redesenhados.
