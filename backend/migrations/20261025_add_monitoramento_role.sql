-- Adiciona o perfil "monitoramento" em bancos já existentes.
-- (Em banco novo, o script.sql já cria tudo isso.)
-- Usuário de teste: monitoramento@empresa.com | senha 123456

ALTER TABLE usuarios
    MODIFY COLUMN cargo ENUM(
        'superusuario',
        'gestor',
        'comercial',
        'suporte',
        'producao',
        'software',
        'implantacao',
        'monitoramento'
    ) NOT NULL;

INSERT INTO time (nome_time, email_time, departamento)
SELECT 'Monitoramento', NULL, 'monitoramento'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM time WHERE departamento = 'monitoramento' OR nome_time = 'Monitoramento'
);

INSERT INTO usuarios (nome, email, cargo, senha_hash, ativo, time_id)
SELECT 'Monitoramento', 'monitoramento@empresa.com', 'monitoramento',
       'scrypt:10e30fc14d0eab11e4582007171557a0:15d1449e09830e09fb99910527f8250ce63ef1f3d9a1ad2f4202c010249610a9de8ef7ecb377846da9a0826e3e866a954b0d855962505044d3e699b9827550a8', TRUE,
       (SELECT id_time FROM time WHERE departamento = 'monitoramento' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'monitoramento@empresa.com'
);
