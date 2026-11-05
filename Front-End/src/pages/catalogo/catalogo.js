const listaReceitas = document.querySelector(".lista-receitas");

if (listaReceitas) {
  const selectCategoria = document.getElementById("filtro-categoria");
  const tituloCategoria = document.getElementById("categoria-titulo");
  const modalReceita = document.getElementById("modal-receita");
  const tituloModalReceita = document.getElementById("modal-receita-titulo");
  const descricaoModalReceita = document.getElementById(
    "modal-receita-descricao",
  );
  const farinhaModalReceita = document.getElementById("modal-receita-farinha");
  const categoriaModalReceita = document.getElementById(
    "modal-receita-categoria",
  );
  const botaoFecharModalReceita = modalReceita.querySelector(
    ".modal-receita-fechar",
  );
  let cardAtivo = null;

  const nomesCategorias = {
    "mais-recente": "Mais recentes:",
    "massa-salgado": "Massa salgada:",
    "massa-integral": "Massa integral:",
    "massa-meio-doce": "Massa semi doce:",
    "massa-doce": "Massa doce:",
    favoritas: "Favoritas:",
  };

  const categoriasReceita = {
    "massa-salgado": "Massa salgada",
    "massa-integral": "Massa integral",
    "massa-meio-doce": "Massa semi doce",
    "massa-doce": "Massa doce",
  };

  function criarSeletorCategoriaPersonalizado(select) {
    if (!select) return;

    const seletor = document.createElement("div");
    seletor.className = "catalogo-select-personalizado";

    const botao = document.createElement("button");
    botao.className = "catalogo-select-botao";
    botao.type = "button";
    botao.setAttribute("aria-haspopup", "listbox");
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-label", "Filtrar receitas por categoria");

    const valor = document.createElement("span");
    const seta = document.createElement("span");
    seta.setAttribute("aria-hidden", "true");
    seta.textContent = "▾";
    botao.append(valor, seta);

    const opcoes = document.createElement("div");
    opcoes.className = "catalogo-select-opcoes";
    opcoes.id = "filtro-categoria-opcoes";
    opcoes.setAttribute("role", "listbox");
    opcoes.hidden = true;
    botao.setAttribute("aria-controls", opcoes.id);
    seletor.append(botao, opcoes);
    select.after(seletor);

    function fecharOpcoes(devolverFoco = false) {
      opcoes.hidden = true;
      botao.setAttribute("aria-expanded", "false");
      if (devolverFoco) botao.focus();
    }

    function abrirOpcoes(indice = 0) {
      atualizarOpcoes();
      const itens = opcoes.querySelectorAll('[role="option"]');
      if (!itens.length) return;

      opcoes.hidden = false;
      botao.setAttribute("aria-expanded", "true");
      itens[Math.max(0, Math.min(indice, itens.length - 1))].focus();
    }

    function atualizarOpcoes() {
      valor.textContent = select.selectedOptions[0].textContent;
      botao.setAttribute(
        "aria-label",
        `Filtrar receitas por categoria: ${valor.textContent}`,
      );
      opcoes.replaceChildren();

      Array.from(select.options)
        .filter((opcao) => !opcao.hidden)
        .forEach((opcao) => {
          const item = document.createElement("div");
          item.className = "catalogo-select-opcao";
          item.setAttribute("role", "option");
          item.setAttribute("tabindex", "-1");
          item.setAttribute("aria-selected", "false");
          item.dataset.value = opcao.value;
          item.textContent = opcao.textContent;
          opcoes.appendChild(item);
        });
    }

    botao.addEventListener("click", () => {
      if (opcoes.hidden) abrirOpcoes();
      else fecharOpcoes();
    });

    botao.addEventListener("keydown", (evento) => {
      if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
        evento.preventDefault();
        abrirOpcoes(evento.key === "ArrowUp" ? opcoes.children.length - 1 : 0);
      }
    });

    opcoes.addEventListener("click", (evento) => {
      const item = evento.target.closest('[role="option"]');
      if (!item) return;

      select.value = item.dataset.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      fecharOpcoes(true);
    });

    opcoes.addEventListener("keydown", (evento) => {
      const itemAtual = evento.target.closest('[role="option"]');
      if (!itemAtual) return;

      const itens = Array.from(opcoes.querySelectorAll('[role="option"]'));
      const indice = itens.indexOf(itemAtual);

      if (evento.key === "Escape") {
        evento.preventDefault();
        fecharOpcoes(true);
      } else if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
        evento.preventDefault();
        const direcao = evento.key === "ArrowDown" ? 1 : -1;
        itens[(indice + direcao + itens.length) % itens.length].focus();
      } else if (evento.key === "Home" || evento.key === "End") {
        evento.preventDefault();
        itens[evento.key === "Home" ? 0 : itens.length - 1].focus();
      } else if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        itemAtual.click();
      }
    });

    document.addEventListener("click", (evento) => {
      if (!seletor.contains(evento.target)) fecharOpcoes();
    });

    select.classList.add("catalogo-select-nativo");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    atualizarOpcoes();

    return atualizarOpcoes;
  }

  const iconeVazio = "../../assets/images/Coracao.png";
  const iconeCheio = "../../assets/images/CoracaoCheio.png";

  const chaveReceitas = "panicalc-receitas-v1";
  const botaoApagarReceitas = document.getElementById("apagar-receitas");
  const listaModalIngredientes = document.getElementById(
    "modal-receita-ingredientes",
  );
  const modoPreparoModal = document.getElementById("modal-receita-preparo");
  const rendimentoModal = document.getElementById("modal-receita-rendimento");
  const custoModal = document.getElementById("modal-receita-custo");
  const pesoModal = document.getElementById("modal-receita-peso");
  const tempoModal = document.getElementById("modal-receita-tempo");
  let receitas = [];

  function carregarReceitas() {
    const salvas = JSON.parse(localStorage.getItem(chaveReceitas) || "[]");
    if (!Array.isArray(salvas)) {
      throw new Error("A lista de receitas salva no navegador é inválida.");
    }
    return salvas.filter(
      (receita) =>
        receita &&
        typeof receita.id === "string" &&
        typeof receita.nome === "string",
    );
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor) || 0);
  }

  function formatarTempoPreparo(minutos) {
    const tempo = Number(minutos);
    if (!Number.isFinite(tempo) || tempo <= 0) return "Não informado";
    const horas = Math.floor(tempo / 60);
    const minutosRestantes = tempo % 60;
    if (horas && minutosRestantes) return `${horas} h ${minutosRestantes} min`;
    if (horas) return `${horas} h`;
    return `${minutosRestantes} min`;
  }

  function visualizarReceita(id) {
    const receita = receitas.find((item) => String(item.id) === id);

    if (!receita) return;

    tituloModalReceita.textContent = receita.nome;
    descricaoModalReceita.textContent = `${receita.categoriaNome || categoriasReceita[receita.categoria] || "Receita"} · ${receita.unidades || 0} unidades · ${formatarMoeda(receita.custoTotal)}`;
    farinhaModalReceita.textContent = receita.farinha;
    categoriaModalReceita.textContent =
      receita.categoriaNome || categoriasReceita[receita.categoria] || "";
    listaModalIngredientes.replaceChildren();
    (Array.isArray(receita.ingredientes) ? receita.ingredientes : []).forEach(
      (ingrediente) => {
        const item = document.createElement("li");
        item.textContent = `${ingrediente.nome}: ${ingrediente.quantidade}`;
        listaModalIngredientes.appendChild(item);
      },
    );
    modoPreparoModal.textContent = receita.descricao || "Não informado.";
    rendimentoModal.textContent = `${receita.unidades || 0} unidades`;
    custoModal.textContent = formatarMoeda(receita.custoTotal);
    pesoModal.textContent = `${receita.pesoPorUnidade || 0} g`;
    tempoModal.textContent = formatarTempoPreparo(receita.tempoPreparoMinutos);
    modalReceita.showModal();
  }

  function filtrarCards(categoriaSelecionada) {
    let visiveis = 0;
    listaReceitas.querySelectorAll(".receita-card").forEach((card) => {
      const receita = receitas.find(
        (item) => String(item.id) === card.dataset.id,
      );
      const exibir =
        categoriaSelecionada === "favoritas"
          ? Boolean(receita?.favorito)
          : categoriaSelecionada === "mais-recente" ||
            card.dataset.categoria === categoriaSelecionada;
      card.hidden = !exibir;
      if (exibir) visiveis += 1;
    });

    const mensagem = listaReceitas.querySelector(".catalogo-vazio");
    if (mensagem) {
      mensagem.hidden = visiveis > 0;
      mensagem.textContent = receitas.length
        ? "Nenhuma receita encontrada nesta categoria."
        : "Você ainda não cadastrou receitas. Use a página Receita para adicionar a primeira.";
    }
  }

  listaReceitas.addEventListener("click", (evento) => {
    const alvo = evento.target;

    if (!(alvo instanceof Element)) return;
    const botaoPrecificar = alvo.closest(".btn-precificar");
    if (botaoPrecificar) {
      const card = botaoPrecificar.closest(".receita-card");
      if (!card) return;

      window.location.href = `../precificacao/precificacao.html?receita=${encodeURIComponent(card.dataset.id)}`;
      return;
    }

    const botaoFicha = alvo.closest(".btn-ficha");
    if (botaoFicha) {
      const card = botaoFicha.closest(".receita-card");
      if (!card) return;

      window.location.href = `../ficha-tecnica/ficha-tecnica.html?receita=${encodeURIComponent(card.dataset.id)}`;
      return;
    }

    const botaoEditar = alvo.closest(".btn-editar");
    if (botaoEditar) {
      const card = botaoEditar.closest(".receita-card");
      if (!card) return;

      window.location.href = `../cadastro-receitas/cadastro-receitas.html?editar=${encodeURIComponent(card.dataset.id)}`;
      return;
    }

    const botaoFavorito = alvo.closest(".btn-favorito");
    if (botaoFavorito) {
      const card = botaoFavorito.closest(".receita-card");
      const receita = receitas.find(
        (item) => String(item.id) === card?.dataset.id,
      );
      if (!receita) return;

      receita.favorito = !receita.favorito;
      try {
        localStorage.setItem(chaveReceitas, JSON.stringify(receitas));
        const img = botaoFavorito.querySelector("img");
        img.src = receita.favorito ? iconeCheio : iconeVazio;
        botaoFavorito.setAttribute("aria-pressed", String(receita.favorito));
        botaoFavorito.setAttribute(
          "aria-label",
          receita.favorito ? "Remover das favoritas" : "Adicionar às favoritas",
        );
        filtrarCards(selectCategoria.value);
      } catch (erro) {
        console.error("Não foi possível atualizar a receita favorita:", erro);
      }
      return;
    }
    if (alvo.closest("button")) return;

    const card = alvo.closest(".receita-card");
    if (!card || !listaReceitas.contains(card)) return;

    cardAtivo = card;
    visualizarReceita(card.dataset.id);
  });

  listaReceitas.addEventListener("keydown", (evento) => {
    const card = evento.target;

    if (!(card instanceof HTMLElement) || !card.matches(".receita-card"))
      return;
    if (evento.key !== "Enter" && evento.key !== " ") return;

    evento.preventDefault();
    cardAtivo = card;
    visualizarReceita(card.dataset.id);
  });

  botaoFecharModalReceita.addEventListener("click", () => {
    modalReceita.close();
  });

  modalReceita.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") modalReceita.close();
  });

  modalReceita.addEventListener("click", (evento) => {
    if (evento.target === modalReceita) modalReceita.close();
  });

  modalReceita.addEventListener("close", () => {
    cardAtivo?.focus();
  });

  function renderizarReceitas(receitas) {
    listaReceitas.replaceChildren();
    botaoApagarReceitas.disabled = receitas.length === 0;

    if (!receitas.length) {
      const vazio = document.createElement("p");
      vazio.className = "catalogo-vazio";
      vazio.setAttribute("role", "status");
      listaReceitas.appendChild(vazio);
    }

    receitas.forEach((receita) => {
      const card = document.createElement("article");
      card.classList.add("receita-card");
      card.dataset.categoria = receita.categoria;
      card.dataset.id = receita.id;
      card.tabIndex = 0;
      card.setAttribute("aria-label", `Ver detalhes de ${receita.nome}`);

      const imagem = document.createElement("div");
      imagem.className = "card-img";
      const favorito = document.createElement("button");
      favorito.type = "button";
      favorito.className = "btn-favorito";
      favorito.setAttribute("aria-pressed", String(Boolean(receita.favorito)));
      favorito.setAttribute(
        "aria-label",
        receita.favorito ? "Remover das favoritas" : "Adicionar às favoritas",
      );
      const icone = document.createElement("img");
      icone.src = receita.favorito ? iconeCheio : iconeVazio;
      icone.alt = "";
      favorito.appendChild(icone);
      imagem.appendChild(favorito);

      const conteudo = document.createElement("div");
      conteudo.className = "receita-card-conteudo";
      const titulo = document.createElement("h2");
      titulo.textContent = receita.nome;
      const categoria = document.createElement("p");
      categoria.textContent =
        receita.categoriaNome ||
        categoriasReceita[receita.categoria] ||
        "Receita";
      const farinha = document.createElement("p");
      farinha.textContent = `Farinha de trigo: ${receita.farinha || "Não informado"}`;
      const resumo = document.createElement("p");
      resumo.textContent = `${receita.unidades || 0} unidades · ${formatarMoeda(receita.custoTotal)}`;
      const tempo = document.createElement("p");
      tempo.textContent = `Preparo: ${formatarTempoPreparo(receita.tempoPreparoMinutos)}`;
      const editar = document.createElement("button");
      editar.type = "button";
      editar.className = "btn-editar";
      editar.textContent = "Editar receita";
      editar.setAttribute("aria-label", `Editar receita ${receita.nome}`);
      const precificar = document.createElement("button");
      precificar.type = "button";
      precificar.className = "btn-precificar";
      precificar.textContent = "Precificar";
      precificar.setAttribute("aria-label", `Abrir precificação de ${receita.nome}`);
      const ficha = document.createElement("button");
      ficha.type = "button";
      ficha.className = "btn-ficha";
      ficha.textContent = "Ficha técnica";
      ficha.setAttribute("aria-label", `Abrir ficha técnica de ${receita.nome}`);
      const acoes = document.createElement("div");
      acoes.className = "acoes-receita";
      acoes.append(editar, precificar, ficha);
      conteudo.append(titulo, categoria, farinha, resumo, tempo, acoes);
      card.append(imagem, conteudo);

      listaReceitas.appendChild(card);
    });
    filtrarCards(selectCategoria.value);
  }

  botaoApagarReceitas.addEventListener("click", () => {
    if (!receitas.length) return;
    if (
      !window.confirm(
        `Apagar todas as ${receitas.length} receitas cadastradas? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    try {
      localStorage.removeItem(chaveReceitas);
      receitas = [];
      renderizarReceitas(receitas);
    } catch (erro) {
      console.error("Não foi possível apagar as receitas cadastradas:", erro);
      window.alert(
        "Não foi possível apagar as receitas. Tente novamente.",
      );
    }
  });

  // ==========================
  // FILTRO DE CATEGORIA + OCULTAÇÃO DA OPÇÃO SELECIONADA NA LISTA
  // ==========================
  if (selectCategoria && tituloCategoria) {
    const atualizarSeletorPersonalizado =
      criarSeletorCategoriaPersonalizado(selectCategoria);

    function ocultarOpcaoSelecionada() {
      const valorAtual = selectCategoria.value;

      // 'hidden' tira a opção só da LISTA suspensa (o menu que abre ao clicar).
      // Diferente de remove(), o elemento continua no DOM, então o texto
      // dela ainda aparece normalmente na caixa fechada do select.
      Array.from(selectCategoria.options).forEach((opt) => {
        opt.hidden = opt.value === valorAtual;
      });
      atualizarSeletorPersonalizado();
    }

    selectCategoria.addEventListener("change", () => {
      const categoriaSelecionada = selectCategoria.value;
      tituloCategoria.textContent = nomesCategorias[categoriaSelecionada];

      filtrarCards(categoriaSelecionada);
      ocultarOpcaoSelecionada();
    });

    tituloCategoria.textContent = nomesCategorias[selectCategoria.value];
    filtrarCards(selectCategoria.value);
    ocultarOpcaoSelecionada();
  }

  try {
    receitas = carregarReceitas();
    renderizarReceitas(receitas);
  } catch (erro) {
    console.error("Não foi possível carregar as receitas:", erro);
    listaReceitas.replaceChildren();
    const aviso = document.createElement("p");
    aviso.className = "catalogo-vazio";
    aviso.setAttribute("role", "alert");
    aviso.textContent =
      "Não foi possível carregar suas receitas. Atualize a página e tente novamente.";
    listaReceitas.appendChild(aviso);
  }

  window.addEventListener("storage", (evento) => {
    if (evento.key !== chaveReceitas) return;
    try {
      receitas = carregarReceitas();
      renderizarReceitas(receitas);
    } catch (erro) {
      console.error("Não foi possível atualizar o catálogo:", erro);
    }
  });
}
