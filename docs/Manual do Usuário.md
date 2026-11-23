# <div align="center"> Manual do Usuário 📖</div>

<div align= "center"> Após clonar e executar o projeto na sua máquina e instalar todas as dependências, aqui você receberá um guia de como usar o sistema. </div>

### 👤 Tipos de usuário
- **Superusuário**: é o administrador, quem tem acesso a todas as funcionalidades do sistema.
- **Gestor**: responsável por gerenciar e supervisionar todo o fluxo, tendo acesso total aos projetos, manutenções e ordens de serviço, podendo editar e redesignar tarefas. 
- **Comercial**: cria novos projetos, ou seja, pedidos aos quais serão criados do zero, e cria ordens de serviço para o projeto.
- **Suporte**: cria novas manutenções, ou seja, pedidos aos quais são criados a partir de reportes de problemas, e cria ordens de serviço para a manutenção. 
- **Equipe de produção**: conseguem criar OS para projetos e manutenções que fazem parte; Dentro da Altave são as pessoas responsáveis pelo trabalho de montagem e configuração de hardware.
- **Equipe de software**: conseguem criar OS para projetos e manutenções que fazem parte; Dentro da Altave são os desenvolvedores de software.
- **Equipe de monitoramento**: conseguem criar OS para projetos e manutenções que fazem parte e aprovam ou reprovam OS em verificação; Dentro da Altave são as pessoas responsáveis por testarem o produto.
- **Equipe de implantação**: conseguem criar OS para projetos e manutenções que fazem parte; Dentro da Altave são as pessoas que vão até o local para fazer a instalação de equipamentos.
## 1. Cadastro de usuário e times
O sistema te dá automaticamente oito perfis para começar, sendo cada um com propósitos diferentes. Os usuários responsáveis por cadastrar pessoas e times são o gestor e superusuário/administrador.

**Como cadastrar um usuário**
1. Faça o login como gestor ou administrador;
2. Na página inicial, clique no menu da lateral em "Usuários";
3. Clique em "Novo usuário" com o símbolo de "+";
4. Preencha as informações e aperte em "Cadastrar".

**Como cadastrar times
1. Faça o login como gestor ou administrador;
2. Na página inicial, clique no menu da lateral em "Times";
3. Clique em "Novo time" com o símbolo de "+";
4. Preencha as informações e aperte em "Cadastrar".

## 2. Criação de projetos e atribuição de OS
Os usuários permitidos a criar projeto é o comercial e o administrador.
Dentro de um projeto, há várias Ordens de Serviço (OS) e para criar uma OS, ela tem que obrigatoriamente pertencer a um projeto ou manutenção. Esse vínculo de OS e projeto, ocorre automaticamente.

**Como fazer**
1. Faça o login com perfil de comercial ou administrador;
2. Na página inicial, clique no menu da lateral em "Novo projeto";
3. Preencha as informações (anexos são opcionais) e aperte em "Criar projeto".
4. Na nova página direcionada, estará todas as informações sobre o projeto. Para criar uma OS clique em "Nova OS";
5. Preencha as informações (anexos e equipamentos são opcionais) e aperte "Solicitar OS".

## 3. Criação de manutenções e atribuição de OS
Os usuários permitidos a criar manutenção é o suporte e o administrador.
Dentro de uma manutenção, há várias Ordens de Serviço (OS) e para criar uma OS ela tem que obrigatoriamente pertencer a um projeto ou manutenção. Esse vínculo de OS e manutenção, ocorre automaticamente.

**Como fazer**
1. Faça o login com perfil de suporte ou administrador;
2. Na página inicial, clique no menu da lateral em "Nova manutenção";
3. Preencha as informações (anexos e projeto são opcionais) e aperte em "Criar manutenção".
4. Na nova página direcionada, estará todas as informações sobre a manutenção. Para criar uma OS clique em "Nova OS";
5. Preencha as informações (anexos e equipamentos são opcionais) e aperte "Solicitar OS".

## 4. Review e verificação de OS
Todo time tem um responsável/líder, esta pessoa é quem consegue concluir a OS e colocá-la em verificação para alguém da equipe de monitoramento aprovar ou reprovar a OS. Qualquer pessoa do time consegue colocar uma OS em "review", porém apenas o responsável do time consegue tirá-la desse status. 
Ao mudar o status da OS de "review" para "verificação", ninguém do time consegue mudar o estado dela antes de alguém da **equipe de monitoramento** aprovar ou reprovar. 

**OS em verificação**
1. Faça login com o perfil de qualquer pessoa que faça parte do time da OS que queira editar o status;
2. Vá até a OS desejada e edite o status dela para "review";
3. O usuário que é o responsável do time fará a review e para continuar o fluxo ideal, ele muda o status da OS para "verificação";
4. Faça login com o perfil da equipe de monitoramento;
5. No menu lateral, clique em "Ordens disponíveis";
6. Clique na OS que aguarda verificação;
7. Clique em "Aprovar" ou "Reprovar".

**OS aprovada**
1. Clique em "Aprovar";
2. Faça login como responsável do time;
3. Clique na OS aprovada;
4. Preencha o campo "Resumo das atividades" caso for concluir a OS.

**OS reprovada
2. Clique em "Reprovar"
3. Preencha o campo com o motivo da reprovação;
4. Clique em "Confirmar reprovação";
5. Faça login como o responsável do time;
6. Clique na OS reprovada e aparecerá o motivo da reprovação com o status "bloqueado", o único que consegue mudar esse status é o responsável. 
7. Após isso o fluxo pode voltar para teste e depois pode regredir de novo. A equipe de monitoramento pode ter anexado algum relatório de teste, para visualizar isso, expanda a OS desejada e role para baixo.

## 5. Geração de relatório ao finalizar por completo um projeto ou manutenção
Após um projeto/manutenção ser finalizado por completo, isto é, todas as OS em status "concluída" e com resumo feito, o botão de "Gerar relatório" fica disponível para qualquer um que consiga visualizar o projeto/manutenção.

**Fluxo em passos**
1. Faça login com o perfil de qualquer usuário que tenha acesso ao projeto/manutenção;
2. Vá até o projeto/manutenção desejada;
3. Confira se todas as OS atribuídas estão com status "concluída";
4. Confira se o status do projeto/manutenção está como "concluído"
5. Confira se o botão "Gerar relatório" no topo da página está em azul escuro;
6. Clique em "Gerar relatório";
7. O download do PDF do relatório da operação completa será feito automaticamente.

Obs.: Os únicos que conseguem concluir um projeto é comercial, para concluir manutenção é o suporte. Gestor e administrador conseguem concluir ambos.