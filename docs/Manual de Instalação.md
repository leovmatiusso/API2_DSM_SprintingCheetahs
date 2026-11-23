# <div align="center"> Manual de Instalação </div>

Sistema de Ordens de Serviço (O.S.) com **Front-End** (React + Vite + TypeScript), **Back-End** (Node.js + Express + TypeScript) e banco de dados **MySQL**.

---

## 1. Pré-requisitos

| Ferramenta | Versão recomendada | Observação |
| --- | --- | --- |
| [Git](https://git-scm.com/) | Qualquer versão recente | Para clonar o repositório |
| [Node.js](https://nodejs.org/) | 20 ou superior (testado com 22) | Já inclui o `npm` |
| [MySQL](https://dev.mysql.com/downloads/) | 8.x | Local, ou remoto (ex.: Amazon Web Services (AWS) ) |

Verifique as versões instaladas:

```bash
git --version
node -v
npm -v
mysql --version
```

---

## 2. Clonar o repositório

```bash
git clone https://github.com/leovmatiusso/API2_DSM_SprintingCheetahs.git
cd API2_DSM_SprintingCheetahs
```

---

## 3. Instalar as dependências

Na **raiz** do projeto, rode um único comando que instala as dependências da raiz, do `frontend` e do `backend`:

```bash
npm run install:all
```

---

## 4. Configurar as variáveis de ambiente

O projeto tem **dois** arquivos `.env.example`, um no Back-End e outro no Front-End.

### 4.1. Back-End (obrigatório)

Crie o arquivo `backend/.env` a partir do exemplo:

```bash
# Linux / macOS / Git Bash
cp backend/.env.example backend/.env

# Windows (CMD)
copy backend\.env.example backend\.env
```

Edite `backend/.env` com as credenciais do **seu** banco de dados:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=API2
DB_CONNECTION_LIMIT=10
```

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `PORT` | Porta em que o Back-End vai rodar | `3001` |
| `CORS_ORIGIN` | Origem(ns) do Front-End autorizadas a acessar a API | `http://localhost:5173` |
| `DB_HOST` | Endereço do MySQL (`localhost` se for local, ou o endpoint do RDS) | — (obrigatória) |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_USER` | Usuário do MySQL | — (obrigatória) |
| `DB_PASSWORD` | Senha do MySQL | — (obrigatória) |
| `DB_NAME` | Nome do banco de dados | `API2` |
| `DB_CONNECTION_LIMIT` | Máximo de conexões simultâneas no pool | `10` |
| `PDF_REPORT_MAX_SIZE_MB` | *(opcional)* tamanho máximo do PDF de laudo enviado | `10` |

### 4.2. Front-End (opcional)

O Front-End já usa `http://localhost:3001/api` como padrão. Só é necessário criar o `frontend/.env` se o Back-End estiver em outro endereço ou porta:

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:3001/api
```

Se você alterar a `PORT` do Back-End, ajuste também o `VITE_API_URL`.

---

## 5. Preparar o banco de dados

### 5.1. Subir o MySQL

Se for usar um banco **local**, inicie o serviço do MySQL antes de continuar:

```bash
# Linux (systemd)
sudo systemctl start mysql

# macOS (Homebrew)
brew services start mysql

# Windows: inicie o serviço "MySQL80" em Serviços, ou pelo MySQL Workbench
```

Se for usar um banco **remoto** (ex.: AWS), basta apontar o `DB_HOST` para o endpoint e liberar o acesso (Security Group) para o seu IP.

### 5.2. Criar o banco e as tabelas

O arquivo `script.sql`, na raiz do projeto, cria o banco `API2`, todas as tabelas e os dados iniciais de desenvolvimento. Execute-o em uma instância MySQL **vazia**:

```bash
mysql -u seu_usuario -p < script.sql
```

Ou, pelo MySQL Workbench / DBeaver: abra o `script.sql` e execute o script inteiro.


## 6. Executar o projeto

### Cada um em um terminal


**Terminal 1 — Back-End:**

```bash
cd backend
npm run dev     # com reinício automático ao salvar arquivos
# ou
npm start       # execução simples, sem reinício automático
```

**Terminal 2 — Front-End:**

```bash
cd frontend
npm run dev
```

### Endereços

| Serviço | URL |
| --- | --- |
| Front-End | http://localhost:5173 |
| Back-End (API) | http://localhost:3001 |

Quando o Back-End inicia corretamente, o terminal mostra:

```text
Backend Express rodando em http://localhost:3001
```

---


## 7. Resumo rápido

```bash
git clone https://github.com/leovmatiusso/API2_DSM_SprintingCheetahs.git
cd API2_DSM_SprintingCheetahs
npm run install:all
cp backend/.env.example backend/.env     # edite com as credenciais do seu banco
mysql -u seu_usuario -p < script.sql     # cria o banco API2 (instância vazia!)
npm run dev                              # sobe Back-End (3001) e Front-End (5173)
```

Acesse http://localhost:5173
