create database API2;

use API2;

create table time (
    id_time int primary key auto_increment,
    nome_time varchar(100) not null,
    email_time varchar(100) unique not null,
    departamento varchar(100) not null,
    responsavel_id int
);


create table usuarios (
    id_usuario int primary key auto_increment,
    nome varchar(100) not null,
    email varchar(100) unique not null,
    cargo varchar(100) not null,
    senha_hash varchar(255) not null,
    time_id int,
    data_criacao datetime default current_timestamp,
    constraint fk_usuario_time foreign key (time_id) references time(id_time) on delete set null
);

alter table time 
add constraint fk_time_responsavel foreign key (responsavel_id) references usuarios(id_usuario) on delete set null;

create table os(
    os_id int primary key auto_increment,
    os_titulo varchar(100) not null,
    os_descricao text,
    os_status enum('aberta', 'em andamento', 'concluida', 'teste', 'bloqueado', 'review') default 'aberta',
    prioridade enum('baixa', 'media', 'alta', 'critica') default 'media',
    os_cliente varchar(100) not null,
    data_limite date,
    id_criador int not null,
    id_time_responsavel int, 
    data_criacao datetime default current_timestamp,
    constraint fk_criador_os foreign key (id_criador) references usuarios(id_usuario), 
    constraint fk_os_time foreign key (id_time_responsavel) references time(id_time) on delete set null
);


create table anexo(
    anexo_id int primary key auto_increment,
    os_id int not null,
    nome_anexo varchar(100) not null,
    anexo_tipo varchar(100) not null,
    anexo_tamanho bigint,
    data_anexo datetime default current_timestamp,
    constraint fk_anexos_os foreign key (os_id) references os(os_id) on delete cascade);

create table projetos (
    projeto_id int primary key auto_increment,
    nome varchar(150) not null,
    data_assinatura_contrato date,
    data_implantacao date,
    data_vencimento_contrato date,
    responsavel_id int,
    vendedor_id int,
    tipo_sistema varchar(100) not null,
    equipamentos_hardware text,
    data_criacao datetime default current_timestamp,
    constraint fk_projeto_responsavel foreign key (responsavel_id) references usuarios(id_usuario) on delete set null,
    constraint fk_projeto_vendedor foreign key (vendedor_id) references usuarios(id_usuario) on delete set null
);

create table manutencoes (
    manutencao_id int primary key auto_increment,
    projeto_id int not null,
    data_inicio_problema date not null,
    tipo_manutencao enum('corretiva', 'preventiva', 'evolutiva', 'adaptativa') not null,
    descricao_situacao text not null,
    status enum('aberta', 'em andamento', 'concluida', 'cancelada') default 'aberta',
    data_criacao datetime default current_timestamp,
    constraint fk_manutencao_projeto foreign key (projeto_id) references projetos(projeto_id) on delete cascade
);