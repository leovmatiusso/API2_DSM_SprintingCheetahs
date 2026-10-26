import { transporter } from "./mailer.js";

interface SenhaAlteradaData {
  nome: string;
  email: string;
  dataHora: Date;
}

export async function enviarSenhaAlterada(dados: SenhaAlteradaData) {
  const dataFormatada = dados.dataHora.toLocaleString("pt-BR");

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: dados.email,
    subject: "Sua senha foi alterada",
    text: `Olá, ${dados.nome}.\n\nSua senha foi alterada em ${dataFormatada}.\n\nSe não foi você, entre em contato com o suporte imediatamente.`,
    html: `
      <p>Olá, <strong>${dados.nome}</strong>.</p>
      <p>${dados.nome} Vinicius muito maneiro.</p>
      <p>Data: <strong>${dataFormatada}</strong>.</p>
      <p>Se não foi você, entre em contato com o suporte imediatamente.</p>
    `,
  });
}

//                               ,'"`.,./.
//                             ,'        Y',"..
//                           ,'           \  | \
//                          /              . |  `
//                         /               | |   \
//            __          .                | |    .
//       _   \  `. ---.   |                | j    |
//      / `-._\   `Y   \  |                |.     |
//     _`.    ``    \   \ |..              '      |,-'""7,....
//     l     '-.     . , `|  | , |`. , ,  /,     ,'    '/   ,'_,.-.
//     `-..     `-.  : :     |/ `   ' "\,' | _  /          '-'    /___
//      \""' __.,.-`.: :        /   /._    l'.,'
//       `--,   _.-' `".           /__ `'-.' '         .
//       ,---..._,.--"""""""--.__..----,-.'   .  /    .'   ,.--
//       |                          ,':| /    | /     ;.,-'--      ,.-
//       |     .---.              .'  :|'     |/ ,.-='"-.`"`' _   -.'
//       /    \    /               `. :|--.  _L,"---.._        "----'
//     ,' `.   \ ,'           _,     `''   ``.-'       `-  -..___,'
//    . ,.  .   `   __     .-'  _.-           `.     .__    \
//    |. |`        "  ;   !   ,.  |             `.    `.`'---'
//    ,| |C\       ` /    | ,' |(]|            -. |-..--`
//   /  "'--'       '      /___|__]        `.  `- |`.
//  .       ,'                   ,   /       .    `. \
//    \                      .,-'  ,'         .     `-.
//     x---..`.  -'  __..--'"/"""""  ,-.      |   |   |
//    / \--._'-.,.--'     _`-    _. ' /       |     -.|
//   ,   .   `-..__ ...--'  _,.-' | `   ,.-.  ;   /  '|
//  .  _,'         '"-----""      |    `   | /  ,'    ;
//  |-'  .-.    `._               |     `._// ,'     /
// _|    `-'   _,' "`--.._________|        `,'    _ /.
////\   ,-._.'"/\__,.   _,"     /_\__/`. /'.-.'.-/_,`-' mh
//`-"`"' v'    `"  `-`-"              `-'`-`  `'