import express, {
  Request,
  Response,
  NextFunction
} from "express";
import cors from "cors";
import crypto from "node:crypto";

import {
  users,
  Role,
  User,
  publicUser
} from "./users.js";

import {
  times,
  Time
} from "./times.js";

import { pool } from "./db.js";

import type {
  ResultSetHeader,
  RowDataPacket
} from "mysql2";

import { OrdemServico } from "./ordemservico.js";

const app = express();

const PORT = 3001;

app.use(cors());
app.use(express.json());

// =====================================================
// SESSÕES
// =====================================================

const sessions = new Map<string, string>();

// =====================================================
// AUTENTICAÇÃO
// =====================================================

function getAuthenticatedUser(
  req: Request
): User | undefined {
  const header =
    req.headers.authorization ?? "";

  if (!header.startsWith("Bearer ")) {
    return undefined;
  }

  const token = header.slice(7);

  const userId =
    sessions.get(token);

  if (!userId) {
    return undefined;
  }

  return users.find(
    user =>
      user.id === userId &&
      user.active
  );
}

function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user =
    getAuthenticatedUser(req);

  if (!user) {
    return res.status(401).json({
      message:
        "Sessão inválida ou expirada."
    });
  }

  res.locals.user = user;

  next();
}

function requireRole(
  ...roles: Role[]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user =
      getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        message:
          "Sessão inválida ou expirada."
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

// =====================================================
// HEALTH
// =====================================================

app.get(
  "/api/health",
  (_req, res) => {
    res.json({
      message:
        "Backend funcionando!"
    });
  }
);

// =====================================================
// LOGIN
// =====================================================

app.post(
  "/api/login",
  (req, res) => {
    const {
      email,
      password
    } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email e senha são obrigatórios."
      });
    }

    const user =
      users.find(
        item =>
          item.email.toLowerCase() ===
          email.trim().toLowerCase()
      );

    if (!user) {
      return res.status(401).json({
        message:
          "Email ou senha inválidos."
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message:
          "Este usuário está desativado. Entre em contato com o administrador."
      });
    }

    if (
      user.password !== password
    ) {
      return res.status(401).json({
        message:
          "Email ou senha inválidos."
      });
    }

    const token =
      crypto.randomBytes(32).toString(
        "hex"
      );

    sessions.set(
      token,
      user.id
    );

    return res.json({
      token,
      user: publicUser(user)
    });
  }
);

// =====================================================
// LOGOUT
// =====================================================

app.post(
  "/api/logout",
  requireAuth,
  (req, res) => {
    const header =
      req.headers.authorization ?? "";

    const token =
      header.slice(7);

    sessions.delete(token);

    res.json({
      message:
        "Sessão encerrada."
    });
  }
);

// =====================================================
// MINHA CONTA
// =====================================================

app.get(
  "/api/account",
  requireAuth,
  (_req, res) => {
    res.json({
      user: publicUser(
        res.locals.user as User
      )
    });
  }
);

// =====================================================
// ALTERAR SENHA
// =====================================================

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

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message:
          "Senha atual e nova senha são obrigatórias."
      });
    }

    if (
      newPassword.length < 6
    ) {
      return res.status(400).json({
        message:
          "A nova senha deve possuir pelo menos 6 caracteres."
      });
    }

    const user =
      res.locals.user as User;

    if (
      user.password !==
      currentPassword
    ) {
      return res.status(401).json({
        message:
          "A senha atual está incorreta."
      });
    }

    user.password =
      newPassword;

    return res.json({
      message:
        "Senha atualizada com sucesso."
    });
  }
);

// =====================================================
// USUÁRIOS
//
// SUPERUSUÁRIO:
// visualizar
// cadastrar
// editar
// ativar/desativar
// excluir
//
// GESTOR:
// visualizar
// cadastrar
//
// GESTOR NÃO edita, ativa/desativa
// ou exclui.
// =====================================================

// =====================================================
// VISUALIZAR USUÁRIOS
// =====================================================

app.get(
  "/api/users",
  requireRole(
    "superusuario",
    "gestor"
  ),
  (_req, res) => {
    res.json({
      users:
        users.map(publicUser)
    });
  }
);

// =====================================================
// CADASTRAR USUÁRIO
// =====================================================

app.post(
  "/api/users",
  requireRole(
    "superusuario",
    "gestor"
  ),
  (req, res) => {
    const {
      name,
      email,
      password,
      role,
      time_id
    } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      time_id?: string | null;
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

    if (
      !validRoles.includes(role)
    ) {
      return res.status(400).json({
        message:
          "Perfil inválido."
      });
    }

    if (
      password.length < 6
    ) {
      return res.status(400).json({
        message:
          "A senha deve possuir pelo menos 6 caracteres."
      });
    }

    // Verifica se o time existe
    if (
      time_id &&
      !times.some(
        time =>
          time.id === time_id
      )
    ) {
      return res.status(400).json({
        message:
          "Time inválido."
      });
    }

    // Verifica email duplicado
    if (
      users.some(
        user =>
          user.email.toLowerCase() ===
          email.trim().toLowerCase()
      )
    ) {
      return res.status(409).json({
        message:
          "Este email já está cadastrado."
      });
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email:
        email.trim().toLowerCase(),
      password,
      role,
      active: true,
      time_id:
        time_id ?? null
    };

    users.push(user);

    // Adiciona usuário ao time
    if (user.time_id) {
      const time =
        times.find(
          item =>
            item.id ===
            user.time_id
        );

      if (
        time &&
        !time.usuarios_ids.includes(
          user.id
        )
      ) {
        time.usuarios_ids.push(
          user.id
        );
      }
    }

    return res.status(201).json({
      user: publicUser(user)
    });
  }
);

// =====================================================
// EDITAR USUÁRIO
// SOMENTE SUPERUSUÁRIO
// =====================================================

app.put(
  "/api/users/:id",
  requireRole("superusuario"),
  (req, res) => {
    const user =
      users.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!user) {
      return res.status(404).json({
        message:
          "Usuário não encontrado."
      });
    }

    const {
      name,
      email,
      password,
      role,
      active,
      time_id
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
        message:
          "Perfil inválido."
      });
    }

    // Verifica o novo time
    if (
      time_id !== undefined &&
      time_id !== null &&
      !times.some(
        time =>
          time.id === time_id
      )
    ) {
      return res.status(400).json({
        message:
          "Time inválido."
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

    // Verifica email duplicado
    if (
      email !== undefined &&
      users.some(
        item =>
          item.id !== user.id &&
          item.email.toLowerCase() ===
            email
              .trim()
              .toLowerCase()
      )
    ) {
      return res.status(409).json({
        message:
          "Este email já está cadastrado."
      });
    }

    if (
      name !== undefined
    ) {
      user.name =
        name.trim();
    }

    if (
      email !== undefined
    ) {
      user.email =
        email
          .trim()
          .toLowerCase();
    }

    if (
      password !== undefined
    ) {
      user.password =
        password;
    }

    if (
      role !== undefined
    ) {
      user.role =
        role;
    }

    // =================================================
    // ALTERAÇÃO DO TIME DO USUÁRIO
    // =================================================

    if (
      time_id !== undefined
    ) {
      const oldTimeId =
        user.time_id;

      // Remove do time antigo
      if (oldTimeId) {
        const oldTime =
          times.find(
            time =>
              time.id ===
              oldTimeId
          );

        if (oldTime) {
          oldTime.usuarios_ids =
            oldTime.usuarios_ids.filter(
              id =>
                id !== user.id
            );

          if (
            oldTime.responsavel_id ===
            user.id
          ) {
            oldTime.responsavel_id =
              null;
          }
        }
      }

      // Define novo time
      user.time_id =
        time_id;

      // Adiciona ao novo time
      if (time_id) {
        const newTime =
          times.find(
            time =>
              time.id ===
              time_id
          );

        if (
          newTime &&
          !newTime.usuarios_ids.includes(
            user.id
          )
        ) {
          newTime.usuarios_ids.push(
            user.id
          );
        }
      }
    }

    if (
      active !== undefined
    ) {
      user.active =
        active;
    }

    // Se desativar usuário,
    // invalida suas sessões.
    if (!user.active) {
      for (
        const [
          token,
          userId
        ] of sessions
      ) {
        if (
          userId === user.id
        ) {
          sessions.delete(
            token
          );
        }
      }
    }

    return res.json({
      user: publicUser(user)
    });
  }
);

// =====================================================
// EXCLUIR USUÁRIO
// SOMENTE SUPERUSUÁRIO
// =====================================================

app.delete(
  "/api/users/:id",
  requireRole("superusuario"),
  (req, res) => {
    const currentUser =
      res.locals.user as User;

    // Não permite excluir
    // o próprio usuário.
    if (
      currentUser.id ===
      req.params.id
    ) {
      return res.status(400).json({
        message:
          "O próprio usuário logado não pode ser excluído."
      });
    }

    const index =
      users.findIndex(
        item =>
          item.id ===
          req.params.id
      );

    if (index === -1) {
      return res.status(404).json({
        message:
          "Usuário não encontrado."
      });
    }

    users.splice(
      index,
      1
    );

    // Remove o usuário
    // dos times.
    for (
      const time of times
    ) {
      time.usuarios_ids =
        time.usuarios_ids.filter(
          id =>
            id !== req.params.id
        );

      if (
        time.responsavel_id ===
        req.params.id
      ) {
        time.responsavel_id =
          null;
      }
    }

    return res.json({
      message:
        "Usuário excluído com sucesso."
    });
  }
);

// =====================================================
// TIMES
// TEMPORÁRIO EM MEMÓRIA
// =====================================================

function publicTime(
  time: Time
) {
  const responsavel =
    time.responsavel_id
      ? users.find(
          user =>
            user.id ===
            time.responsavel_id
        )
      : undefined;

  const pessoasVinculadas =
    time.usuarios_ids
      .map(
        id =>
          users.find(
            user =>
              user.id === id
          )
      )
      .filter(
        (
          user
        ): user is User =>
          Boolean(user)
      )
      .map(publicUser);

  return {
    id: time.id,

    nome_time:
      time.nome_time,

    departamento:
      time.departamento,

    responsavel_id:
      time.responsavel_id,

    responsavel:
      responsavel
        ? publicUser(
            responsavel
          )
        : null,

    pessoasVinculadas
  };
}

// =====================================================
// VISUALIZAR TIMES
// GESTOR E SUPERUSUÁRIO
// =====================================================

app.get(
  "/api/times",
  requireRole(
    "superusuario",
    "gestor"
  ),
  (_req, res) => {
    return res.json({
      times:
        times.map(
          publicTime
        )
    });
  }
);

// =====================================================
// CADASTRAR TIME
// GESTOR E SUPERUSUÁRIO
// =====================================================

app.post(
  "/api/times",
  requireRole(
    "superusuario",
    "gestor"
  ),
  (req, res) => {
    const {
      nome_time,
      departamento,
      responsavel_id,
      usuarios_ids
    } = req.body as {
      nome_time?: string;
      departamento?: string;
      responsavel_id?: string | null;
      usuarios_ids?: string[];
    };

    if (
      !nome_time?.trim() ||
      !departamento?.trim()
    ) {
      return res.status(400).json({
        message:
          "Nome do time e equipe relacionada são obrigatórios."
      });
    }

    const ids =
      Array.isArray(
        usuarios_ids
      )
        ? [
            ...new Set(
              usuarios_ids
            )
          ]
        : [];

    // O responsável também
    // pertence ao time.
    if (
      responsavel_id &&
      !ids.includes(
        responsavel_id
      )
    ) {
      ids.push(
        responsavel_id
      );
    }

    // Verifica responsável
    if (
      responsavel_id &&
      !users.some(
        user =>
          user.id ===
          responsavel_id
      )
    ) {
      return res.status(400).json({
        message:
          "Pessoa responsável inválida."
      });
    }

    // Verifica usuários
    if (
      ids.some(
        id =>
          !users.some(
            user =>
              user.id === id
          )
      )
    ) {
      return res.status(400).json({
        message:
          "Uma ou mais pessoas vinculadas são inválidas."
      });
    }

    // Não permite nome duplicado
    if (
      times.some(
        time =>
          time.nome_time
            .toLowerCase() ===
          nome_time
            .trim()
            .toLowerCase()
      )
    ) {
      return res.status(409).json({
        message:
          "Este time já está cadastrado."
      });
    }

    const time: Time = {
      id:
        crypto.randomUUID(),

      nome_time:
        nome_time.trim(),

      departamento:
        departamento.trim(),

      responsavel_id:
        responsavel_id ??
        null,

      usuarios_ids:
        ids
    };

    times.push(time);

    // Atualiza o time dos usuários.
    for (
      const user of users
    ) {
      if (
        ids.includes(
          user.id
        )
      ) {
        user.time_id =
          time.id;
      }
    }

    return res.status(201).json({
      time:
        publicTime(time)
    });
  }
);

// =====================================================
// EDITAR TIME
// GESTOR E SUPERUSUÁRIO
// =====================================================

app.put(
  "/api/times/:id",
  requireRole(
    "superusuario",
    "gestor"
  ),
  (req, res) => {
    const time =
      times.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!time) {
      return res.status(404).json({
        message:
          "Time não encontrado."
      });
    }

    const {
      nome_time,
      departamento,
      responsavel_id,
      usuarios_ids
    } = req.body as {
      nome_time?: string;
      departamento?: string;
      responsavel_id?: string | null;
      usuarios_ids?: string[];
    };

    if (
      !nome_time?.trim() ||
      !departamento?.trim()
    ) {
      return res.status(400).json({
        message:
          "Nome do time e equipe relacionada são obrigatórios."
      });
    }

    const ids =
      Array.isArray(
        usuarios_ids
      )
        ? [
            ...new Set(
              usuarios_ids
            )
          ]
        : [];

    // Responsável também deve
    // estar entre as pessoas vinculadas.
    if (
      responsavel_id &&
      !ids.includes(
        responsavel_id
      )
    ) {
      ids.push(
        responsavel_id
      );
    }

    if (
      responsavel_id &&
      !users.some(
        user =>
          user.id ===
          responsavel_id
      )
    ) {
      return res.status(400).json({
        message:
          "Pessoa responsável inválida."
      });
    }

    if (
      ids.some(
        id =>
          !users.some(
            user =>
              user.id === id
          )
      )
    ) {
      return res.status(400).json({
        message:
          "Uma ou mais pessoas vinculadas são inválidas."
      });
    }

    // Não permite nome duplicado
    if (
      times.some(
        item =>
          item.id !==
            time.id &&
          item.nome_time
            .toLowerCase() ===
          nome_time
            .trim()
            .toLowerCase()
      )
    ) {
      return res.status(409).json({
        message:
          "Este time já está cadastrado."
      });
    }

    const oldIds =
      [
        ...time.usuarios_ids
      ];

    time.nome_time =
      nome_time.trim();

    time.departamento =
      departamento.trim();

    time.responsavel_id =
      responsavel_id ??
      null;

    time.usuarios_ids =
      ids;

    // Remove vínculo antigo
    for (
      const userId of oldIds
    ) {
      if (
        !ids.includes(
          userId
        )
      ) {
        const user =
          users.find(
            item =>
              item.id ===
              userId
          );

        if (
          user &&
          user.time_id ===
            time.id
        ) {
          user.time_id =
            null;
        }
      }
    }

    // Adiciona novos vínculos
    for (
      const userId of ids
    ) {
      const user =
        users.find(
          item =>
            item.id ===
            userId
        );

      if (user) {
        user.time_id =
          time.id;
      }
    }

    return res.json({
      time:
        publicTime(time)
    });
  }
);

// =====================================================
// EXCLUIR TIME
// GESTOR E SUPERUSUÁRIO
// =====================================================

app.delete(
  "/api/times/:id",
  requireRole(
    "superusuario",
    "gestor"
  ),
  (req, res) => {
    const index =
      times.findIndex(
        time =>
          time.id ===
          req.params.id
      );

    if (index === -1) {
      return res.status(404).json({
        message:
          "Time não encontrado."
      });
    }

    const [
      removed
    ] = times.splice(
      index,
      1
    );

    // Remove o vínculo
    // dos usuários.
    for (
      const user of users
    ) {
      if (
        user.time_id ===
        removed.id
      ) {
        user.time_id =
          null;
      }
    }

    return res.json({
      message:
        "Time excluído com sucesso."
    });
  }
);

// =====================================================
// CRIAÇÃO DA O.S.
// =====================================================

app.post(
  "/api/os",
  requireAuth,
  async (req, res) => {
    const {
      os_titulo,
      os_descricao,
      prioridade,
      os_cliente,
      data_limite,
      id_time_responsavel
    } =
      req.body as Partial<OrdemServico>;

    if (
      !os_titulo ||
      !os_cliente ||
      !os_descricao ||
      !prioridade ||
      !data_limite ||
      !id_time_responsavel
    ) {
      return res.status(400).json({
        message:
          "Titulo e cliente sao obrigatórios, por favor preencha!!!"
      });
    }

    try {
      const [
        result
      ] =
        await pool.execute(
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
       VALUES (
          ?,
          ?,
          'aberta',
          ?,
          ?,
          ?,
          ?,
          ?
       )`,
          [
            os_titulo,
            os_descricao,
            prioridade,
            os_cliente,
            data_limite,
            (
              res.locals
                .user as User
            ).id,
            id_time_responsavel
          ]
        );

      const insertId =
        (
          result as ResultSetHeader
        ).insertId;

      return res.status(201).json({
        message:
          "Ordem de serviço aberta com sucesso!",

        os: {
          os_id:
            insertId,

          os_status:
            "aberta"
        }
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

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(
  PORT,
  () =>
    console.log(
      `Backend Express rodando em http://localhost:${PORT}`
    )
);