import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "node:crypto";
import { users, Role, User, publicUser } from "./users.js";
import { pool } from "./db.js";
import { OrdemServico } from "./ordemservico.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Sessões em memória: suficientes para o protótipo.
const sessions = new Map<string, string>();

function getAuthenticatedUser(req: Request): User | undefined {
  const header = req.headers.authorization ?? "";

  if (!header.startsWith("Bearer ")) {
    return undefined;
  }

  const token = header.slice(7);
  const userId = sessions.get(token);

  if (!userId) {
    return undefined;
  }

  return users.find(
    user => user.id === userId && user.active
  );
}

function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = getAuthenticatedUser(req);

  if (!user) {
    return res.status(401).json({
      message: "Sessão inválida ou expirada."
    });
  }

  res.locals.user = user;
  next();
}

function requireRole(...roles: Role[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        message: "Sessão inválida ou expirada."
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message:
          "Você não possui permissão para esta operação."
      });
    }

    res.locals.user = user;
    next();
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    message: "Backend funcionando!"
  });
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({
      message: "Email e senha são obrigatórios."
    });
  }

  const user = users.find(
    item =>
      item.email.toLowerCase() ===
      email.trim().toLowerCase()
  );

  if (!user) {
    return res.status(401).json({
      message: "Email ou senha inválidos."
    });
  }

  if (!user.active) {
    return res.status(403).json({
      message:
        "Este usuário está desativado. Entre em contato com o administrador."
    });
  }

  if (user.password !== password) {
    return res.status(401).json({
      message: "Email ou senha inválidos."
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, user.id);

  return res.json({
    token,
    user: publicUser(user)
  });
});

// =====================================================
// LOGOUT
// =====================================================

app.post("/api/logout", requireAuth, (req, res) => {
  const header = req.headers.authorization ?? "";

  sessions.delete(header.slice(7));

  res.json({
    message: "Sessão encerrada."
  });
});

// =====================================================
// MINHA CONTA
// =====================================================

app.get("/api/account", requireAuth, (_req, res) => {
  res.json({
    user: publicUser(
      res.locals.user as User
    )
  });
});

app.put(
  "/api/change-password",
  requireAuth,
  (req, res) => {
    const {
      currentPassword,
      newPassword
    } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Senha atual e nova senha são obrigatórias."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "A nova senha deve possuir pelo menos 6 caracteres."
      });
    }

    const user = res.locals.user as User;

    if (user.password !== currentPassword) {
      return res.status(401).json({
        message: "A senha atual está incorreta."
      });
    }

    user.password = newPassword;

    return res.json({
      message: "Senha atualizada com sucesso."
    });
  }
);

// =====================================================
// ADMINISTRAÇÃO DE CONTAS
//
// SUPERUSUÁRIO:
// - visualizar
// - cadastrar
// - editar
// - ativar/desativar
// - excluir
//
// GESTOR:
// - visualizar
// - cadastrar
//
// O Gestor NÃO pode editar, ativar/desativar ou excluir.
// =====================================================

// Visualizar usuários
app.get(
  "/api/users",
  requireRole("superusuario", "gestor"),
  (_req, res) => {
    res.json({
      users: users.map(publicUser)
    });
  }
);

// Cadastrar usuário
app.post(
  "/api/users",
  requireRole("superusuario", "gestor"),
  (req, res) => {
    const {
      name,
      email,
      password,
      role
    } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
    };

    const validRoles: Role[] = [
      "superusuario",
      "gestor",
      "comercial",
      "suporte",
      "producao",
      "software",
      "implantacao"
    ];

    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message:
          "Nome, email, senha e perfil são obrigatórios."
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Perfil inválido."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "A senha deve possuir pelo menos 6 caracteres."
      });
    }

    if (
      users.some(
        user =>
          user.email.toLowerCase() ===
          email.trim().toLowerCase()
      )
    ) {
      return res.status(409).json({
        message: "Este email já está cadastrado."
      });
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      active: true
    };

    users.push(user);

    res.status(201).json({
      user: publicUser(user)
    });
  }
);

// Editar usuário
// SOMENTE SUPERUSUÁRIO
app.put(
  "/api/users/:id",
  requireRole("superusuario"),
  (req, res) => {
    const user = users.find(
      item => item.id === req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado."
      });
    }

    const {
      name,
      email,
      password,
      role,
      active
    } = req.body as Partial<User>;

    const validRoles: Role[] = [
      "superusuario",
      "gestor",
      "comercial",
      "suporte",
      "producao",
      "software",
      "implantacao"
    ];

    if (
      role !== undefined &&
      !validRoles.includes(role)
    ) {
      return res.status(400).json({
        message: "Perfil inválido."
      });
    }

    if (
      password !== undefined &&
      password.length < 6
    ) {
      return res.status(400).json({
        message:
          "A senha deve possuir pelo menos 6 caracteres."
      });
    }

    if (
      email !== undefined &&
      users.some(
        item =>
          item.id !== user.id &&
          item.email.toLowerCase() ===
            email.trim().toLowerCase()
      )
    ) {
      return res.status(409).json({
        message: "Este email já está cadastrado."
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      user.email =
        email.trim().toLowerCase();
    }

    if (password !== undefined) {
      user.password = password;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (active !== undefined) {
      user.active = active;
    }

    // Invalida sessões existentes
    // quando a conta é desativada.
    if (!user.active) {
      for (const [
        token,
        userId
      ] of sessions) {
        if (userId === user.id) {
          sessions.delete(token);
        }
      }
    }

    res.json({
      user: publicUser(user)
    });
  }
);

// Excluir usuário
// SOMENTE SUPERUSUÁRIO
app.delete(
  "/api/users/:id",
  requireRole("superusuario"),
  (req, res) => {
    const currentUser =
      res.locals.user as User;

    if (
      currentUser.id === req.params.id
    ) {
      return res.status(400).json({
        message:
          "O próprio usuário logado não pode ser excluído."
      });
    }

    const index = users.findIndex(
      item => item.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({
        message: "Usuário não encontrado."
      });
    }

    users.splice(index, 1);

    res.json({
      message:
        "Usuário excluído com sucesso."
    });
  }
);

app.listen(PORT, () =>
  console.log(
    `Backend Express rodando em http://localhost:${PORT}`
  )
);

// =====================================================
// CRIAÇÃO DA O.S.
// =====================================================

/*
app.post("/api/os", requireAuth, async (req, res) => {{
  const{
    os_titulo,
    os_descricao,
    prioridade,
    os_cliente,
    data_limite,
    id_time_responsavel,
  } = req.body as Partial<OrdemServico>;

  if (
    !os_titulo ||
    !os_cliente ||
    !os_descricao ||
    !prioridade ||
    !data_limite ||
    !id_time_responsavel
  ){
    return res.status(400).json({
      message:
        "Titulo e cliente sao obrigatórios, por favor preencha!!!"
    });
  }

  try {
    const[result] = await pool.execute(
      `INSERT INTO os
      (
        os_titulo,
        os_descricao,
        os_status,
        prioridade,
        os_cliente,
        data_limite,
        id_criador,
        id_time_responsavel
      )
      VALUES (?, ?, 'aberta', ?, ?, ?, ?, ?)`,
      [
        os_titulo,
        os_descricao,
        prioridade,
        os_cliente,
        data_limite,
        (res.locals.user as any).id,
        id_time_responsavel,
      ]
    );

    const insertId = (result as any).insertId;

    return res.status(201).json({
      message:
        "Ordem de serviço aberta com sucesso!",
      os: {
        os_id: insertId,
        os_status: "aberta"
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erro ao abrir a ordem de serviço."
    });
  }
  }
);
*/