const chaveReceitas = "panicalc-receitas-v1";
const seletorReceita = document.getElementById("ficha-receita-seletor");
const areaIngredientes = document.getElementById("ficha-ingredientes");
const botaoSalvarFicha = document.getElementById("salvar-ficha");
const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
let receitaAtual = null;
let promessaLogoFicha;

function paraNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  let normalizado = String(valor || "").replace(/[^\d,.-]/g, "");
  const ultimaVirgula = normalizado.lastIndexOf(",");
  const ultimoPonto = normalizado.lastIndexOf(".");
  if (ultimaVirgula !== -1 && ultimoPonto !== -1) {
    normalizado =
      ultimaVirgula > ultimoPonto
        ? normalizado.replace(/\./g, "").replace(",", ".")
        : normalizado.replace(/,/g, "");
  } else if (ultimaVirgula !== -1) {
    normalizado = normalizado.replace(",", ".");
  }
  const numero = Number.parseFloat(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarQuantidade(valor) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatarTempoPreparo(minutos) {
  if (!Number.isFinite(minutos) || minutos <= 0) return "Não informado";
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horas && minutosRestantes) return `${horas} h ${minutosRestantes} min`;
  if (horas) return `${horas} h`;
  return `${minutosRestantes} min`;
}

function carregarReceitas() {
  const receitas = JSON.parse(localStorage.getItem(chaveReceitas) || "[]");
  if (!Array.isArray(receitas)) {
    throw new Error("A lista de receitas salva no navegador é inválida.");
  }
  return receitas.filter(
    (receita) =>
      receita &&
      typeof receita.id === "string" &&
      typeof receita.nome === "string",
  );
}

function carregarLogoFicha() {
  if (!promessaLogoFicha) {
    promessaLogoFicha = new Promise((resolve, reject) => {
      const imagem = new Image();
      imagem.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = imagem.naturalWidth;
        canvas.height = imagem.naturalHeight;
        const contexto = canvas.getContext("2d");
        if (!contexto) {
          reject(new Error("Não foi possível preparar o logo para o PDF."));
          return;
        }
        contexto.drawImage(imagem, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      imagem.onerror = () =>
        reject(new Error("Não foi possível carregar o logo da PaniCalc."));
      imagem.src = new URL("../../assets/images/logo-pan.png", window.location.href).href;
    });
  }
  return promessaLogoFicha;
}

async function gerarPdfFicha(receita) {
  const JsPdf = window.jspdf?.jsPDF;
  if (typeof JsPdf !== "function") {
    throw new Error("A biblioteca jsPDF não está disponível.");
  }

  const logo = await carregarLogoFicha();
  const doc = new JsPdf();
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 15;
  const larguraConteudo = largura - margem * 2;
  const marrom = [74, 46, 30];
  const caramelo = [169, 127, 74];
  const ingredientes = Array.isArray(receita.ingredientes)
    ? receita.ingredientes
    : [];
  let y = 44;

  const cabecalho = () => {
    doc.setFillColor(...marrom);
    doc.rect(0, 0, largura, 32, "F");
    doc.addImage(logo, "PNG", margem, 4, 24, 24);
    doc.setTextColor(255, 250, 243);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PaniCalc", margem + 29, 14);
    doc.setFontSize(10);
    doc.text("FICHA TÉCNICA", margem + 29, 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Emitida em ${new Intl.DateTimeFormat("pt-BR").format(new Date())}`,
      largura - margem,
      20,
      { align: "right" },
    );
    doc.setTextColor(...marrom);
  };

  const garantirEspaco = (alturaNecessaria) => {
    if (y + alturaNecessaria <= altura - margem) return;
    doc.addPage();
    cabecalho();
    y = 42;
  };

  const adicionarRotuloValor = (rotulo, valor, x, posicaoY, larguraTexto) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(rotulo, x, posicaoY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const linhas = doc.splitTextToSize(String(valor || "—"), larguraTexto);
    doc.text(linhas, x, posicaoY + 6);
    return linhas.length * 5 + 13;
  };

  cabecalho();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const nomeLinhas = doc.splitTextToSize(receita.nome, larguraConteudo);
  doc.text(nomeLinhas, margem, y);
  y += nomeLinhas.length * 8 + 5;

  const primeiraColuna = margem;
  const segundaColuna = margem + larguraConteudo / 2;
  const alturaCategoria = adicionarRotuloValor(
    "CATEGORIA",
    receita.categoriaNome || receita.categoria,
    primeiraColuna,
    y,
    larguraConteudo / 2 - 8,
  );
  const alturaCodigo = adicionarRotuloValor(
    "CÓDIGO",
    receita.id.slice(0, 8),
    segundaColuna,
    y,
    larguraConteudo / 2 - 8,
  );
  y += Math.max(alturaCategoria, alturaCodigo);

  doc.setFillColor(232, 201, 160);
  doc.roundedRect(margem, y, larguraConteudo, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INGREDIENTES", margem + 3, y + 5.5);
  y += 14;

  const colunas = {
    ingrediente: margem,
    quantidade: margem + larguraConteudo * 0.58,
    unidade: margem + larguraConteudo * 0.75,
    custo: largura - margem,
  };
  const desenharCabecalhoTabela = () => {
    doc.setFillColor(243, 234, 219);
    doc.rect(margem, y - 4, larguraConteudo, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("INGREDIENTE", colunas.ingrediente + 2, y + 2);
    doc.text("QUANTIDADE", colunas.quantidade, y + 2);
    doc.text("UNIDADE", colunas.unidade, y + 2);
    doc.text("CUSTO TOTAL", colunas.custo - 2, y + 2, { align: "right" });
    y += 10;
  };
  desenharCabecalhoTabela();

  ingredientes.forEach((ingrediente) => {
    const nome = doc.splitTextToSize(
      ingrediente.nome || "Ingrediente",
      larguraConteudo * 0.52,
    );
    const alturaLinha = Math.max(8, nome.length * 4.5 + 3);
    garantirEspaco(alturaLinha + 2);
    if (y === 42) desenharCabecalhoTabela();
    doc.setDrawColor(...caramelo);
    doc.line(margem, y + alturaLinha, largura - margem, y + alturaLinha);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(nome, colunas.ingrediente + 2, y + 3);
    doc.text(
      formatarQuantidade(paraNumero(ingrediente.quantidade)),
      colunas.quantidade,
      y + 3,
    );
    doc.text(ingrediente.unidade || "g", colunas.unidade, y + 3);
    doc.text(
      moeda.format(paraNumero(ingrediente.custo)),
      colunas.custo - 2,
      y + 3,
      { align: "right" },
    );
    y += alturaLinha + 2;
  });
  if (!ingredientes.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Nenhum ingrediente cadastrado.", margem + 2, y + 3);
    y += 12;
  }

  garantirEspaco(43);
  y += 5;
  doc.setFillColor(243, 234, 219);
  doc.roundedRect(margem, y, larguraConteudo, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INFORMAÇÕES DA PRODUÇÃO", margem + 3, y + 5.5);
  y += 15;

  const dadosProducao = [
    ["RENDIMENTO", `${formatarQuantidade(paraNumero(receita.unidades))} unidades`],
    ["PESO POR UNIDADE", `${formatarQuantidade(paraNumero(receita.pesoPorUnidade))} g`],
    ["TEMPO DE PREPARO", formatarTempoPreparo(paraNumero(receita.tempoPreparoMinutos))],
    ["CUSTO TOTAL", moeda.format(paraNumero(receita.custoTotal))],
    [
      "CUSTO POR UNIDADE",
      paraNumero(receita.unidades) > 0
        ? moeda.format(paraNumero(receita.custoTotal) / paraNumero(receita.unidades))
        : "—",
    ],
  ];
  dadosProducao.forEach(([rotulo, valor], indice) => {
    const coluna = indice % 2;
    if (coluna === 0 && indice > 0) y += 15;
    const x = margem + coluna * (larguraConteudo / 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(rotulo, x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(valor, x, y + 6);
  });
  y += 42;

  const modoPreparo = receita.descricao || "Não informado.";
  const linhasPreparo = doc.splitTextToSize(modoPreparo, larguraConteudo - 6);
  garantirEspaco(20);
  doc.setFillColor(232, 201, 160);
  doc.roundedRect(margem, y, larguraConteudo, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MODO DE PREPARO", margem + 3, y + 5.5);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  linhasPreparo.forEach((linha) => {
    garantirEspaco(6);
    doc.text(linha, margem + 2, y);
    y += 5;
  });

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...marrom);
    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      largura - margem,
      altura - 7,
      { align: "right" },
    );
  }

  const nomeArquivo =
    receita.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "receita";
  doc.save(`ficha-tecnica-${nomeArquivo}.pdf`);
}

function atualizarFicha(receita) {
  document.getElementById("receipt-name").textContent =
    receita?.nome || "Selecione uma receita";
  document.getElementById("receipt-code").textContent =
    receita?.id?.slice(0, 8) || "—";
  document.getElementById("receipt-category").textContent =
    receita?.categoriaNome || receita?.categoria || "—";
  document.getElementById("receipt-description").textContent =
    receita?.descricao || "Não informado.";
  document.getElementById("ficha-rendimento").textContent = receita
    ? `${formatarQuantidade(paraNumero(receita.unidades))} unidades`
    : "—";
  document.getElementById("ficha-peso-unidade").textContent = receita
    ? `${formatarQuantidade(paraNumero(receita.pesoPorUnidade))} g`
    : "—";
  document.getElementById("ficha-tempo-preparo").textContent =
    formatarTempoPreparo(paraNumero(receita?.tempoPreparoMinutos));
  const custoTotal = paraNumero(receita?.custoTotal);
  document.getElementById("ficha-custo-total").textContent = receita
    ? moeda.format(custoTotal)
    : "—";
  const unidades = paraNumero(receita?.unidades);
  document.getElementById("ficha-custo-unidade").textContent =
    unidades > 0 ? moeda.format(custoTotal / unidades) : "—";
  document.getElementById("ficha-observacoes").textContent =
    receita?.descricao || "Não há modo de preparo cadastrado.";

  areaIngredientes
    .querySelectorAll(".ingredient-row, .ficha-sem-ingredientes")
    .forEach((item) => item.remove());
  const ingredientes = Array.isArray(receita?.ingredientes)
    ? receita.ingredientes
    : [];
  if (!ingredientes.length) {
    const vazio = document.createElement("div");
    vazio.className = "ingredient-row ficha-sem-ingredientes";
    vazio.textContent = "Nenhum ingrediente cadastrado.";
    areaIngredientes.appendChild(vazio);
    return;
  }

  ingredientes.forEach((ingrediente) => {
    const quantidade = paraNumero(ingrediente.quantidade);
    const custoIngrediente = paraNumero(ingrediente.custo);
    const linha = document.createElement("div");
    linha.className = "ingredient-row";
    [
      ingrediente.nome || "Ingrediente",
      formatarQuantidade(quantidade),
      ingrediente.unidade || "g",
      moeda.format(custoIngrediente),
    ].forEach((valor) => {
      const celula = document.createElement("div");
      celula.textContent = valor;
      linha.appendChild(celula);
    });
    areaIngredientes.appendChild(linha);
  });
}

try {
  const receitas = carregarReceitas();
  const receitaNaUrl = new URLSearchParams(window.location.search).get(
    "receita",
  );

  seletorReceita.replaceChildren();
  receitas.forEach((receita) => {
    const opcao = document.createElement("option");
    opcao.value = receita.id;
    opcao.textContent = receita.nome;
    seletorReceita.appendChild(opcao);
  });

  if (!receitas.length) {
    const opcao = document.createElement("option");
    opcao.value = "";
    opcao.textContent = "Nenhuma receita cadastrada";
    seletorReceita.appendChild(opcao);
    seletorReceita.disabled = true;
    atualizarFicha(null);
  } else {
    seletorReceita.value = receitas.some(
      (receita) => receita.id === receitaNaUrl,
    )
      ? receitaNaUrl
      : receitas[0].id;
    receitaAtual = receitas.find(
      (receita) => receita.id === seletorReceita.value,
    );
    atualizarFicha(receitaAtual);
  }

  seletorReceita.addEventListener("change", () => {
    receitaAtual = receitas.find(
      (item) => item.id === seletorReceita.value,
    );
    atualizarFicha(receitaAtual);
    const url = new URL(window.location.href);
    if (receitaAtual) url.searchParams.set("receita", receitaAtual.id);
    else url.searchParams.delete("receita");
    window.history.replaceState(null, "", url);
  });

  window.addEventListener("storage", (evento) => {
    if (evento.key !== chaveReceitas) return;
    window.location.reload();
  });
} catch (erro) {
  console.error("Não foi possível carregar as receitas da ficha técnica:", erro);
  seletorReceita.disabled = true;
  botaoSalvarFicha.disabled = true;
  seletorReceita.replaceChildren(new Option("Erro ao carregar receitas", ""));
  atualizarFicha(null);
}

botaoSalvarFicha.addEventListener("click", async () => {
  if (!receitaAtual) {
    alert("Selecione uma receita antes de gerar o PDF.");
    return;
  }

  try {
    botaoSalvarFicha.disabled = true;
    await gerarPdfFicha(receitaAtual);
  } catch (erro) {
    console.error("Não foi possível gerar o PDF da ficha técnica:", erro);
    alert("Não foi possível gerar o PDF da ficha técnica.");
  } finally {
    botaoSalvarFicha.disabled = false;
  }
});
