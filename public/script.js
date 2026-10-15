// script.js
// O navegador só envia o número e o token ao servidor e exibe o SVG recebido.

let idToken = null;

// window.aoLogar: o Google precisa enxergar esta função
window.aoLogar = function (resposta) {
  idToken = resposta.credential; // este é o id_token
  console.log("Logado, token recebido");
};

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  const numero = Number(campoNumero.value);

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (idToken || ""),
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: digite um número inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent = "Erro 401: faça login com o Google para gerar o desenho.";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Erro " + resposta.status + " ao gerar o desenho.";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch (erro) {
    mensagem.textContent = "Não foi possível falar com o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
