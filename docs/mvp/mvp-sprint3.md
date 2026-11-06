# <div align="center">📌 MVP - Sprint 3 <a id="topo"></a> </div>
> Status da Sprint: Em andamento 🟨
---
### 🎯 Objetivo do MVP
Na terceira e última Sprint, o foco será nas funcionalidades de filtragem de Ordens de Serviço por prioridade, atraso, departamento e status (US19 e US18), além de um histórico (log de auditoria) que guarda as atividades do sistema para o gestor, permitindo-o que veja quem fez o quê e quando (US23).

> <a href="">Clique aqui para ver o vídeo da Sprint!</a>

### 👥 Personas

- **Gestor:** Responsável pela criação de novos usuários e times, além de acompanhar e gerenciar projetos, manutenções e OS
- **Comercial:** Responsável pela criação, acompanhamento e edição de novos projetos e OS vinculadas à um projeto
- **Suporte:** Responsável pela criação, acompanhamento e edição de novas manutenções e OS vinculadas à uma manutenção
- **Equipes (produção, software, monitoramento e implantação):** Responsáveis pelo fluxo de trabalho, ou seja, realização, conclusão e edição de OS

<br>

<details><summary>ℹ️ Legenda</summary>
&nbsp;&nbsp;🔴 Não iniciado <br> &nbsp;&nbsp;🟡 Em andamento <br> &nbsp;&nbsp;🟢 Concluído <br> &nbsp;&nbsp;★ Meta
</details>

### 🔑 Backlog do MVP

|     RANK      | USER STORY   | PRIORIDADE | ESTIMATIVA | ÉPICO | SPRINT | STATUS |
| :-----------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: | :--------: | :---: | :----: | ------ |
| 18<sup>★</sup> | Como usuário quero um filtro no qual apareça as OS ordenadas por status, prioridade e departamento, para que eu consiga agir antes que surja um problema                                                                |    Must    |     2      |  E3   |   2    | 🟡     |
| 19<sup>★</sup> | Como usuário, quero ver quais OS estão atrasadas, para que eu possa agir antes que o atraso se torne um problema maior                                                                                                  |    Must    |     3      |  E3   |   2    | 🟡     |
| 23<sup>★</sup> | Como gestor, quero que o sistema guarde um registro de tudo que acontece nele, para que eu consiga checar depois quem fez o quê                                                                                         |    Must    |     3      |  E4   |   2    | 🔴     |

### 📋 Backlog da Sprint

| RANK | USER STORY                                                                                                                                                                                                                | PRIORIDADE | ESTIMATIVA | ÉPICO | SPRINT | STATUS |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ----- | ------ | ------ |
| 18<sup>★</sup> | Como usuário quero um filtro no qual apareça as OS ordenadas por status, prioridade e departamento, para que eu consiga agir antes que surja um problema                                                                  | Must       | 5          | E4    | 3      | 🟡    |
| 19<sup>★</sup> | Como usuário, quero ver quais OS estão atrasadas, para que eu possa agir antes que o atraso se torne um problema maior                                                                                                    | Must       | 3          | E4    | 3      | 🟡    |
| 20              | Como equipe de produção, software, monitoramento ou implantação, quero receber notificação quando houver uma mudança relevante na minha OS, para que eu me mantenha atualizado sem precisar checar o sistema o tempo todo | Could      | 3          | E5    | 3      | 🟡    |
| 21              | Como equipe de produção, software, monitoramento ou implantação, quero ser notificado quando uma OS crítica for aberta, para que eu reaja rapidamente a casos urgentes                                                    | Could      | 2          | E5    | 3      | 🟡    |
| 22              | Como usuário, quero ver o histórico completo de uma OS (status, responsáveis, prazos), para que eu tenha rastreabilidade e clareza sobre o que já ocorreu                                                                 | Should     | 5          | E6    | 3      | 🔴    |
| 23<sup>★</sup> | Como gestor, quero que o sistema guarde um registro de tudo que acontece nele, para que eu consiga checar depois quem fez o quê                                                                                           | Should     | 13         | E6    | 3      | 🔴    |
| 24              | Como equipe de monitoramento, quero aprovar ou reprovar a verificação de uma, para que a OS seja encerrada (se aprovada) ou volte para a equipe de software (se reprovada)                                                | Should     | 3          | E7    | 3      | 🔴    |
| 25              | Como equipe de monitoramento, quero poder anexar relatórios em PDF do resultado dos testes, para que a próxima equipe responsável saiba o que fazer                                                                       | Should     | 3          | E7    | 3      | 🔴    |

<br>

### 📊 Critérios de Aceitação
No final da Sprint 3 o MVP deve permitir que: <br>
- Todos os usuários consigam filtrar Ordens de Serviço por status, departamento e/ou prioridade; <br>
- Todos os usuários consigam visualizar separadamente as Ordens de Serviço atrasadas; <br>
- O gestor consiga ver um registro de atividade dos usuários dentro do sistema. <br>


### 👤 Equipe <a id="equipe"></a>

| Foto | Função | Nome | GitHub | Linkedin |
| :--: | :----: | :--: | :----: | :----: |
| <img src="https://github.com/Dai4ne.png" width="50"> | Product Owner | Daiane Karine da Silva | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Dai4ne) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/daianekarine/) |
| <img src="https://github.com/leovmatiusso.png" width="50"> | Scrum Master | Leonardo Vilela Matiusso | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/leovmatiusso) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/leonardo-vilela-matiusso-94b405374/) |
| <img src="https://github.com/arthur-oliver.png" width="50"> | Dev Team | Arthur Óliver Rossi Alves | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/arthur-oliver) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/arthur-óliver-728123350?utm_source=share_via&utm_content=profile&utm_medium=member_android) |
| <img src="https://github.com/MartinsLavinia.png" width="50"> | Dev Team | Lavínia Martins Moreno Sanches | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MartinsLavinia) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lavinia-martins221?utm_source=share_via&utm_content=profile&utm_medium=member_android) |
| <img src="https://github.com/guilherme16092007.png" width="50"> | Dev Team | Guilherme Henrique Campos Ribeiro | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/guilherme16092007) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/guilherme-ribeiro-b441bb334) |
| <img src="https://github.com/gustaft07.png" width="50"> | Dev Team | Gustavo de Oliveira Azevedo | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/gustaft07) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gustavo-oliveira-1056303a8) |
| <img src="https://github.com/kersilva.png" width="50"> | Dev Team | Kelwin Felipe Rocha Silva | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kersilva) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kersilva) |
| <img src="https://github.com/vinicius538.png" width="50"> | Dev Team | Vinicius de Souza | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/vinicius538) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/vinícius-de-souza-2a55042b8) |

<p align="right"><a href="#topo">↑ Voltar ao topo</a></p>
