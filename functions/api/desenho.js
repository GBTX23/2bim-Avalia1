// functions/api/desenho.js
// Pages Function: responde em /api/desenho
import { gerarDesenho } from "../../lib/desenho.js";

function resposta(texto, status) {
  return new Response(texto, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  // 1) Método: só POST (405)
  if (request.method !== "POST") {
    return new Response("Método não permitido", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  // 2) Corpo: JSON válido com numero inteiro de 1 a 100 (400)
  let corpo;
  try {
    const texto = await request.text();
    if (texto.trim() === "") {
      return resposta("Corpo ausente", 400);
    }
    corpo = JSON.parse(texto);
  } catch (erro) {
    return resposta("JSON inválido", 400);
  }

  if (corpo === null || typeof corpo !== "object" || Array.isArray(corpo)) {
    return resposta("Corpo inválido", 400);
  }

  const numero = corpo.numero;
  if (typeof numero !== "number" || !Number.isInteger(numero) || numero < 1 || numero > 100) {
    return resposta("numero deve ser um inteiro entre 1 e 100", 400);
  }

  // 3) Token: Authorization: Bearer <id_token> (401)
  const cabecalho = request.headers.get("Authorization") || "";
  if (!cabecalho.startsWith("Bearer ")) {
    return resposta("Token ausente", 401);
  }
  const token = cabecalho.slice(7).trim();
  if (token === "") {
    return resposta("Token ausente", 401);
  }

  let dados;
  try {
    const verificacao = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token)
    );
    if (verificacao.status !== 200) {
      return resposta("Token inválido ou expirado", 401);
    }
    dados = await verificacao.json();
  } catch (erro) {
    return resposta("Não foi possível validar o token", 401);
  }

  if (!env.GOOGLE_CLIENT_ID) {
    return resposta("DIAGNOSTICO: variavel GOOGLE_CLIENT_ID nao chegou na funcao", 401);
  }
  if (dados.aud !== env.GOOGLE_CLIENT_ID) {
    return resposta(
      "DIAGNOSTICO: aud=[" + dados.aud + "] variavel=[" + env.GOOGLE_CLIENT_ID + "] tamanho=" + env.GOOGLE_CLIENT_ID.length,
      401
    );
  }
  if (String(dados.email_verified) !== "true") {
    return resposta("E-mail não verificado", 401);
  }

  // 4) Tudo certo: assina com o e-mail que veio do Google
  const svg = gerarDesenho(numero, dados.email);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" },
  });
}
