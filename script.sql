-- =====================================================
-- API2 - Banco de dados para MySQL / AWS RDS
-- Execute em uma instância MySQL vazia.
-- =====================================================

CREATE DATABASE IF NOT EXISTS API2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE API2;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS item_equipamento_manutencao;
DROP TABLE IF EXISTS item_equipamento_projeto;
DROP TABLE IF EXISTS item_equipamento_os;
DROP TABLE IF EXISTS anexo;
DROP TABLE IF EXISTS manutencoes;
DROP TABLE IF EXISTS projetos;
DROP TABLE IF EXISTS os;
DROP TABLE IF EXISTS time;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS equipamentos;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- USUÁRIOS
-- =====================================================

CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cargo ENUM(
        'superusuario',
        'gestor',
        'comercial',
        'suporte',
        'producao',
        'software',
        'implantacao'
    ) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    time_id INT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_time (time_id)
) ENGINE=InnoDB;

-- =====================================================
-- TIMES
-- email_time permanece opcional porque a tela atual não
-- solicita e-mail do time.
-- =====================================================

CREATE TABLE time (
    id_time INT PRIMARY KEY AUTO_INCREMENT,
    nome_time VARCHAR(100) NOT NULL UNIQUE,
    email_time VARCHAR(150) NULL UNIQUE,
    departamento VARCHAR(100) NOT NULL,
    responsavel_id INT NULL,
    INDEX idx_time_responsavel (responsavel_id)
) ENGINE=InnoDB;

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuario_time
    FOREIGN KEY (time_id) REFERENCES time(id_time)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE time
    ADD CONSTRAINT fk_time_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- =====================================================
-- EQUIPAMENTOS
-- =====================================================

CREATE TABLE equipamentos (
    equipamento_id INT PRIMARY KEY AUTO_INCREMENT,
    nome_equipamento VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- =====================================================
-- ORDENS DE SERVIÇO
-- =====================================================

CREATE TABLE os (
    os_id INT PRIMARY KEY AUTO_INCREMENT,
    os_titulo VARCHAR(150) NOT NULL,
    os_descricao TEXT NOT NULL,
    os_status ENUM(
        'aberta',
        'em andamento',
        'concluida',
        'teste',
        'bloqueado',
        'review'
    ) NOT NULL DEFAULT 'aberta',
    prioridade ENUM('baixa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    data_limite DATE NOT NULL,
    id_criador INT NOT NULL,
    id_time_responsavel INT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_os_criador (id_criador),
    INDEX idx_os_time (id_time_responsavel),
    INDEX idx_os_status (os_status),
    CONSTRAINT fk_criador_os
        FOREIGN KEY (id_criador) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_os_time
        FOREIGN KEY (id_time_responsavel) REFERENCES time(id_time)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- PROJETOS
-- =====================================================

CREATE TABLE projetos (
    projeto_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    data_assinatura_contrato DATE NULL,
    data_implantacao DATE NULL,
    data_vencimento_contrato DATE NULL,
    responsavel_id INT NULL,
    vendedor_id INT NULL,
    tipo_sistema VARCHAR(100) NOT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_projeto_responsavel (responsavel_id),
    INDEX idx_projeto_vendedor (vendedor_id),
    CONSTRAINT fk_projeto_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL,
    CONSTRAINT fk_projeto_vendedor
        FOREIGN KEY (vendedor_id) REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- MANUTENÇÕES
-- =====================================================

CREATE TABLE manutencoes (
    manutencao_id INT PRIMARY KEY AUTO_INCREMENT,
    data_inicio_problema DATE NOT NULL,
    tipo_manutencao ENUM('corretiva', 'preventiva', 'evolutiva', 'adaptativa') NOT NULL,
    descricao_situacao TEXT NOT NULL,
    status ENUM('aberta', 'em andamento', 'concluida', 'cancelada') NOT NULL DEFAULT 'aberta',
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    projeto_id INT NULL,
    resumo VARCHAR(255) NULL,
    responsavel_id INT NULL,
    prioridade ENUM('baixa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    INDEX idx_manutencao_projeto (projeto_id),
    INDEX idx_manutencao_responsavel (responsavel_id),
    CONSTRAINT fk_manutencao_projeto
        FOREIGN KEY (projeto_id) REFERENCES projetos(projeto_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_manutencao_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- ANEXOS
-- Um anexo deve pertencer a exatamente uma origem.
-- =====================================================

CREATE TABLE anexo (
    anexo_id INT PRIMARY KEY AUTO_INCREMENT,
    os_id INT NULL,
    nome_anexo VARCHAR(255) NOT NULL,
    anexo_tipo VARCHAR(150) NOT NULL,
    anexo_tamanho BIGINT UNSIGNED NULL,
    data_anexo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    manutencao_id INT NULL,
    projeto_id INT NULL,
    conteudo_arquivo LONGBLOB NOT NULL,
    INDEX idx_anexo_os (os_id),
    INDEX idx_anexo_manutencao (manutencao_id),
    INDEX idx_anexo_projeto (projeto_id),
    CONSTRAINT fk_anexos_os
        FOREIGN KEY (os_id) REFERENCES os(os_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_anexo_manutencao
        FOREIGN KEY (manutencao_id) REFERENCES manutencoes(manutencao_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_anexo_projeto
        FOREIGN KEY (projeto_id) REFERENCES projetos(projeto_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_anexo_um_vinculo CHECK (
        (os_id IS NOT NULL) +
        (manutencao_id IS NOT NULL) +
        (projeto_id IS NOT NULL) = 1
    )
) ENGINE=InnoDB;

-- =====================================================
-- RELACIONAMENTOS DE EQUIPAMENTOS
-- =====================================================

CREATE TABLE item_equipamento_os (
    os_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (os_id, equipamento_id),
    CONSTRAINT chk_item_os_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_item_os
        FOREIGN KEY (os_id) REFERENCES os(os_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_os_equipamento
        FOREIGN KEY (equipamento_id) REFERENCES equipamentos(equipamento_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE item_equipamento_projeto (
    projeto_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (projeto_id, equipamento_id),
    CONSTRAINT chk_item_projeto_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_item_projeto
        FOREIGN KEY (projeto_id) REFERENCES projetos(projeto_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_projeto_equipamento
        FOREIGN KEY (equipamento_id) REFERENCES equipamentos(equipamento_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE item_equipamento_manutencao (
    manutencao_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (manutencao_id, equipamento_id),
    CONSTRAINT chk_item_manutencao_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_item_manutencao
        FOREIGN KEY (manutencao_id) REFERENCES manutencoes(manutencao_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_manutencao_equipamento
        FOREIGN KEY (equipamento_id) REFERENCES equipamentos(equipamento_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- DADOS INICIAIS PARA DESENVOLVIMENTO/TESTE
-- Senha de todas as contas abaixo: 123456
-- O backend valida o formato scrypt:<salt>:<hash>.
-- =====================================================

INSERT INTO usuarios (nome, email, cargo, senha_hash, ativo, time_id) VALUES
('Administrador do Sistema', 'admin@empresa.com', 'superusuario', 'scrypt:f423adce56b0c68ef13f54a9a6dab911:d753c6bbe0ca0c1e217477833b09319af62e801615f6d0ae19df3f13deedf61c1b28a892d61d04cfad09b23357fa150bd3718c88b17ebc2ee240495119661c73', TRUE, NULL),
('Gestor', 'gestor@empresa.com', 'gestor', 'scrypt:e6bc28adde569978437137eb4249a2b2:338ff8c098c765e2f5bd5ea44ca91d1c94e99efba278b4196b1cbe8aa346bb8f8c9c41ee8cff0513aeeb59c2ad11557e9ec1b3b7553d599438edb6d3c908cea8', TRUE, NULL),
('Comercial', 'comercial@empresa.com', 'comercial', 'scrypt:8a78c314b6510531d0cba3fac701d8ac:8aeeb8710808b31ef709b5a8b1e43e5f1cc18b49b2ae5db34485d638ddd590f6e91239d9adc2a02b663669c500ff2005d8102612c3503583d02e5e0fca580521', TRUE, NULL),
('Suporte', 'suporte@empresa.com', 'suporte', 'scrypt:24c3fea94bc378d0c3ce81162201e610:161b1c9ea0ffb3d9b6fc4ac7fe22c1ef9cb0d2399840a61347a30cbe51b04fb1c44c1c46677fa43b52fe4e56ae1756fa6e0a2331dfdc5182abc2b6f7c8139622', TRUE, NULL),
('Produção', 'producao@empresa.com', 'producao', 'scrypt:3e15643b6efea99e9c5e8337224ce6da:43e47af515c456c9d3b79e35b4fdc214145daafddf9db3433785dad3ac8574ee1711a04a1f71e882413e0d2a4e95d52bfbf0a0f22cd1ecfc4f717f8737821134', TRUE, NULL),
('Software', 'software@empresa.com', 'software', 'scrypt:e0fbf81ea30fb0310350d12fc6e0858b:7dc391979d9f6500ee85685b7ba3229a1928bdbb6bd4cb03ff158a2949b695755918dd4c58a8e132809010cb44a660bd50c31e6b0f2ab8d40c2c7d5ad7296805', TRUE, NULL),
('Implantação', 'implantacao@empresa.com', 'implantacao', 'scrypt:f79381f899e0a9b58754f1b02fd5b8aa:83f75865934992466e1b8292036a9b77d26823541a59a686ea54d6d32d8a89bc891af6059d32989c4f315befc8981ac0ea57ba7778da739690b1520aaa959366', TRUE, NULL);

INSERT INTO time (nome_time, email_time, departamento) VALUES
('Software', NULL, 'Software'),
('Comercial', NULL, 'Comercial');

UPDATE usuarios SET time_id = 1 WHERE id_usuario = 6;
UPDATE usuarios SET time_id = 2 WHERE id_usuario = 3;

INSERT INTO equipamentos (nome_equipamento) VALUES
('aeróstato'),
('torre'),
('câmera óptica'),
('câmera térmica'),
('switch'),
('roteador'),
('cabo de rede'),
('conector rj45'),
('patch cord'),
('sensor de movimento');
