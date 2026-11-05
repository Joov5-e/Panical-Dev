const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const modalButtons = document.querySelectorAll(".addIngred, .close-modal");
const outsideModalBody = document.querySelector(".hero");

const getIngredName = document.getElementById("nomeIngred");
const getIngredQuant = document.getElementById("quantIngred");
const getIngredUnidade = document.getElementById("unidadeIngred");
const getIngredPreco = document.getElementById("custoIngrediente");

const renderTable = document.querySelector(".save-ingred");
const getRecipeCatogry = document.getElementById("categoriaReceita");
const getFarinhaBase = document.getElementById("pesoBaseFarinha");
const getRequiredUnit = document.getElementById("uniDesejadas");
const getPesoPorPao = document.getElementById("pesoPorPao");

const editNomeIngred = document.getElementById("editNomeIngred");
const editQuant = document.getElementById("editQuant");
const editUnidade = document.getElementById("editUnidade");
const editIngredPreco = document.getElementById("editPrecoIngred");
const saveEditBtn = document.querySelector(".save-edit-ingred");

const tablePlacement = document.getElementById("tablePlace");
const pesoMassaTotal = document.getElementById("pesoMassaTotal");
const pesoMassaCrua = document.getElementById("pesoMassaCrua");
const valorTotalSpan = document.getElementById("valorTotal");
const quantidadeProduzidaEl = document.getElementById("quantidadeProduzida");

let editingRow = null;
let savingIngredient = false;
let savingEdit = false;
const chaveReceitas = "panicalc-receitas-v1";

const categoriasCatalogo = {
  massaSalgada: "massa-salgado",
  massaIntegral: "massa-integral",
  massaDoce: "massa-meio-doce",
  sobremessa: "massa-doce",
};

function numero(valor) {
  return (
    parseFloat(
      String(valor ?? "")
        .replace("R$", "")
        .replace("g", "")
        .replace("%", "")
        .replace(",", ".")
        .trim(),
    ) || 0
  );
}

function quantidadeEmGramas(valor, unidade) {
  const quantidade = numero(valor);
  return unidade === "kg" ? quantidade * 1000 : quantidade;
}

function atualizarResultados() {
  massaCruaCalc();
  massaTotalCalc();
  rendimentoCalc();
  valorTotalCalc();
}

function setModalState(isOpen) {
  if (!modal || !overlay) return false;

  if (isOpen) {
    if (!getRecipeCatogry?.value.trim()) {
      alert("Selecione uma categoria primeiro!");
      return false;
    }

    if (!getRequiredUnit?.value.trim()) {
      alert("Informe quantas unidades deseja produzir!");
      return false;
    }

    if (!getFarinhaBase?.value.trim()) {
      alert("Informe o peso base da farinha de trigo!");
      return false;
    }

    if (!getPesoPorPao?.value.trim()) {
      alert("Informe o peso de cada pão");
      return false;
    }

  }

  modal.classList.toggle("hidden", !isOpen);
  overlay.classList.toggle("hidden", !isOpen);

  if (outsideModalBody) {
    outsideModalBody.style.filter = isOpen ? "blur(5px)" : "blur(0)";
  }

  if (!isOpen) {
    if (getIngredName) getIngredName.selectedIndex = 0;
    if (getIngredQuant) {
      getIngredQuant.value = "";
      getIngredQuant.disabled = true;
    }
    if (getIngredPreco) getIngredPreco.value = "";
    if (getIngredUnidade) getIngredUnidade.value = "g";
  }

  return true;
}

modalButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (btn.classList.contains("addIngred")) {
      setModalState(true);
    } else {
      setModalState(false);
    }
  });
});

if (getIngredName) {
  getIngredName.addEventListener("change", () => {
    getIngredQuant.value = "";
    getIngredPreco.value = "";
    getIngredUnidade.value = "g";

    if (!getIngredName.value) {
      getIngredQuant.disabled = true;
      return;
    }

    getIngredQuant.disabled = false;
  });
}

function massaCruaCalc() {
  const rows = document.querySelectorAll("#tablePlace tbody tr");
  let pesoCru = 0;

  if (rows.length === 0) {
    if (pesoMassaCrua) pesoMassaCrua.style.display = "none";
    return 0;
  }

  rows.forEach((row) => {
    const gramsTd = row.querySelector(".col-grama");
    pesoCru += quantidadeEmGramas(
      gramsTd?.textContent,
      row.dataset.unidade,
    );
  });

  if (pesoMassaCrua) {
    pesoMassaCrua.style.display = "block";
    pesoMassaCrua.innerText = `${pesoCru.toFixed(0)} g`;
  }

  return pesoCru;
}

function massaTotalCalc() {
  const rows = document.querySelectorAll("#tablePlace tbody tr");
  let massaTotal = 0;

  if (rows.length === 0) {
    if (pesoMassaTotal) pesoMassaTotal.style.display = "none";
    return 0;
  }

  rows.forEach((row) => {
    massaTotal += quantidadeEmGramas(
      row.querySelector(".col-grama")?.textContent,
      row.dataset.unidade,
    );
  });

  const pesoEstimado = massaTotal * 0.98;

  if (pesoMassaTotal) {
    pesoMassaTotal.style.display = "block";
    pesoMassaTotal.innerText = `${pesoEstimado.toFixed(0)} g`;
  }

  return massaTotal;
}

function valorTotalCalc() {
  const rows = document.querySelectorAll("#tablePlace tbody tr");
  let totalCusto = 0;

  if (rows.length === 0) {
    if (valorTotalSpan) valorTotalSpan.style.display = "none";
    return;
  }

  rows.forEach((row) => {
    totalCusto += numero(row.querySelector(".col-ppq")?.textContent);
  });

  if (valorTotalSpan) {
    valorTotalSpan.style.display = "block";
    valorTotalSpan.textContent = `R$ ${totalCusto.toFixed(2)}`;
  }
}

function rendimentoCalc() {
  const pesoTotalMassa = massaCruaCalc();
  const pesoPorPao = numero(getPesoPorPao?.value);

  if (!quantidadeProduzidaEl) return;

  if (pesoPorPao <= 0 || pesoTotalMassa <= 0) {
    quantidadeProduzidaEl.style.display = "none";
    quantidadeProduzidaEl.innerText = "";
    return;
  }

  const quantidadeProduzida = Math.floor(pesoTotalMassa / pesoPorPao);

  quantidadeProduzidaEl.style.display = "block";
  quantidadeProduzidaEl.innerText = `${quantidadeProduzida} pães`;
}

getPesoPorPao?.addEventListener("input", rendimentoCalc);

function criarTabela() {
  let table = tablePlacement.querySelector("table");

  if (table) return table;

  table = document.createElement("table");

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  thead.innerHTML = `
    <tr>
      <th>Ingrediente</th>
      <th>Quantidade usada</th>
      <th>Preço total (R$)</th>
      <th>Ação</th>
      <th class="col-filter">
        <button type="button" class="filterUpper" data-tooltip="Ordenar crescentes">
          <i class="fa-solid fa-arrow-up"></i>
        </button>
        <button type="button" class="filterDown" data-tooltip="Ordenar decrescentes">
          <i class="fa-solid fa-arrow-down"></i>
        </button>
      </th>
    </tr>
  `;

  table.appendChild(thead);
  table.appendChild(tbody);
  tablePlacement.appendChild(table);

  return table;
}

function adicionarIngredienteNaTabela({
  ingrediente,
  nome,
  quantidade,
  unidade,
  custo,
}) {
  const table = criarTabela();
  const tbody = table.querySelector("tbody");
  const tr = document.createElement("tr");
  tr.dataset.ingredValue = ingrediente;
  tr.dataset.unidade = unidade;

  const cells = [
    ["col-nome", nome],
    ["col-grama", `${quantidade} ${unidade}`],
    ["col-ppq", `R$ ${custo.toFixed(2)}`],
  ];

  cells.forEach(([className, value]) => {
    const td = document.createElement("td");
    td.className = className;
    td.textContent = value;
    tr.appendChild(td);
  });

  const actions = document.createElement("td");
  actions.innerHTML = `
    <button type="button" class="delete-item" data-tooltip="Excluir ingrediente">
      <i class="fa-solid fa-trash"></i>
    </button>
    <button type="button" class="edit-item" data-tooltip="Editar ingrediente">
      <i class="fa-solid fa-pencil"></i>
    </button>
  `;
  tr.appendChild(actions);

  const filterCell = document.createElement("td");
  filterCell.className = "col-filter";
  tr.appendChild(filterCell);
  tbody.appendChild(tr);
}

if (renderTable) {
  renderTable.addEventListener("click", (e) => {
    if (e.target.closest(".save-edit-ingred")) return;

    if (!modal || modal.classList.contains("hidden")) return;

    if (savingIngredient) return;

    e.preventDefault();

    const ingredValue = getIngredName.value;
    const name = getIngredName.options[getIngredName.selectedIndex]?.text || "";
    const custo = numero(getIngredPreco?.value);
    const quantidade = numero(getIngredQuant.value);
    const unidade = getIngredUnidade.value;

    if (
      !ingredValue ||
      getIngredQuant.value === "" ||
      !Number.isFinite(quantidade) ||
      quantidade <= 0 ||
      getIngredPreco.value === "" ||
      !Number.isFinite(custo) ||
      custo < 0
    ) {
      alert("Informe a quantidade usada e o preço total do ingrediente.");
      return;
    }

    const tableRows = document.querySelectorAll("#tablePlace tbody tr");

    const alreadyExist = Array.from(tableRows).some((row) => {
      const sameIngred = row.querySelector(".col-nome");
      return sameIngred?.textContent.trim() === name.trim();
    });

    if (alreadyExist) {
      alert("Não é possível adicionar o mesmo ingrediente duas vezes.");
      return;
    }

    savingIngredient = true;

    try {
      adicionarIngredienteNaTabela({
        ingrediente: ingredValue,
        nome: name,
        quantidade,
        unidade,
        custo,
      });
      if (getRequiredUnit) getRequiredUnit.disabled = true;
      if (getFarinhaBase) getFarinhaBase.disabled = true;

      atualizarResultados();
      setModalState(false);
    } finally {
      savingIngredient = false;
    }
  });
}

function FilterByQuant(tb, crescente) {
  const rows = Array.from(tb.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const valorA = quantidadeEmGramas(
      a.querySelector(".col-grama")?.textContent,
      a.dataset.unidade,
    );
    const valorB = quantidadeEmGramas(
      b.querySelector(".col-grama")?.textContent,
      b.dataset.unidade,
    );

    return crescente ? valorA - valorB : valorB - valorA;
  });

  rows.forEach((row) => tb.appendChild(row));
}

function closeEditModal() {
  const overlayEdit = document.querySelector(".overlay-edit");
  const modalEditBody = document.querySelector(".modal-edit-body");

  overlayEdit?.classList.add("hidden");
  modalEditBody?.classList.add("hidden");

  editingRow = null;

  if (outsideModalBody) {
    outsideModalBody.style.filter = "blur(0)";
  }
}

function openEditModal(row) {
  if (!row) return;

  editingRow = row;

  const overlayEdit = document.querySelector(".overlay-edit");
  const modalEditBody = document.querySelector(".modal-edit-body");

  if (!overlayEdit || !modalEditBody) return;

  overlayEdit.style.zIndex = "9998";
  modalEditBody.style.zIndex = "9999";

  overlayEdit.classList.remove("hidden");
  modalEditBody.classList.remove("hidden");

  const ingredKey = row.dataset.ingredValue;
  const currentQuant = numero(row.querySelector(".col-grama")?.textContent);
  const currentCost = numero(row.querySelector(".col-ppq")?.textContent);

  editNomeIngred.value = ingredKey;
  editQuant.value = currentQuant;
  editUnidade.value = row.dataset.unidade || "g";
  if (editIngredPreco) editIngredPreco.value = currentCost;
}
if (saveEditBtn) {
  saveEditBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (savingEdit || !editingRow) return;

    const newIngredKey = editNomeIngred.value;
    const newName =
      editNomeIngred.options[editNomeIngred.selectedIndex]?.text || "";

    const newQuantity = numero(editQuant.value);
    const newUnit = editUnidade.value;
    const newCost = numero(editIngredPreco.value);

    if (!newIngredKey) {
      alert("Selecione um ingrediente.");
      return;
    }

    if (
      editQuant.value === "" ||
      !Number.isFinite(newQuantity) ||
      newQuantity <= 0 ||
      editIngredPreco.value === "" ||
      !Number.isFinite(newCost) ||
      newCost < 0
    ) {
      alert("Informe a quantidade usada e o preço total do ingrediente.");
      return;
    }

    const rows = document.querySelectorAll("#tablePlace tbody tr");

    const duplicate = Array.from(rows).some((row) => {
      if (row === editingRow) return false;
      const rowName = row.querySelector(".col-nome");
      return rowName?.textContent.trim() === newName.trim();
    });

    if (duplicate) {
      alert("Esse ingrediente já existe na tabela.");
      return;
    }

    savingEdit = true;

    try {
      const updateTableData = {
        ".col-nome": newName,
        ".col-grama": `${newQuantity} ${newUnit}`,
        ".col-ppq": `R$ ${newCost.toFixed(2)}`,
      };

      Object.assign(editingRow.dataset, {
        ingredValue: newIngredKey,
        unidade: newUnit,
      });

      for (const [selector, value] of Object.entries(updateTableData)) {
        const element = editingRow.querySelector(selector);
        if (element) {
          element.textContent = value;
        }
      }

      atualizarResultados();
      closeEditModal();
    } finally {
      savingEdit = false;
    }
  });
}

if (tablePlacement) {
  tablePlacement.addEventListener("click", (e) => {
    const deleteItem = e.target.closest(".delete-item");
    const editItem = e.target.closest(".edit-item");
    const filterUpBtn = e.target.closest(".filterUpper");
    const filterDownBtn = e.target.closest(".filterDown");

    if (!deleteItem && !editItem && !filterUpBtn && !filterDownBtn) {
      return;
    }

    e.preventDefault();

    if (deleteItem) {
      const row = deleteItem.closest("tr");
      const table = deleteItem.closest("table");

      row.remove();

      const remainingRows = table.querySelectorAll("tbody tr");

      if (remainingRows.length === 0) {
        table.remove();

        if (getRequiredUnit) getRequiredUnit.disabled = false;
        if (getFarinhaBase) getFarinhaBase.disabled = false;

        document.querySelectorAll(".tooltip").forEach((el) => {
          el.style.display = "none";
        });
      }
    } else if (editItem) {
      openEditModal(editItem.closest("tr"));
    } else {
      const table = tablePlacement.querySelector("table");
      const tbody = table?.querySelector("tbody");

      if (tbody && filterUpBtn) FilterByQuant(tbody, true);
      if (tbody && filterDownBtn) FilterByQuant(tbody, false);
    }

    atualizarResultados();
  });
}

const imageInput = document.getElementById("imgReceita");
const imagePreview = document.getElementById("imagePreview");
const uploadPlaceholder = document.querySelector(".upload-placeholder");

if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    const formatosPermitidos = ["image/jpeg", "image/png"];

    if (!formatosPermitidos.includes(file.type)) {
      alert("Selecione uma imagem JPG ou PNG.");
      imageInput.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5 MB.");
      imageInput.value = "";
      return;
    }

    if (imagePreview) {
      if (imagePreview.dataset.objectUrl) {
        URL.revokeObjectURL(imagePreview.dataset.objectUrl);
      }

      const imageUrl = URL.createObjectURL(file);
      imagePreview.src = imageUrl;
      imagePreview.dataset.objectUrl = imageUrl;
      imagePreview.hidden = false;
    }

    if (uploadPlaceholder) {
      uploadPlaceholder.hidden = true;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let tooltip = document.querySelector(".tooltip");

  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);
  }

  document.addEventListener(
    "mouseover",
    (e) => {
      const target = e.target.closest("[data-tooltip]");
      if (!target) return;

      tooltip.textContent = target.dataset.tooltip;
      const rect = target.getBoundingClientRect();

      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY}px`;
      tooltip.style.display = "block";
    },
    true,
  );

  document.addEventListener(
    "mouseout",
    (e) => {
      const target = e.target.closest("[data-tooltip]");
      if (!target) return;

      if (e.relatedTarget && target.contains(e.relatedTarget)) {
        return;
      }

      tooltip.style.display = "none";
    },
    true,
  );

  window.addEventListener("scroll", () => {
    tooltip.style.display = "none";
  });
});

const saveRecipeButton = document.getElementById("saveRecipe");
const idReceitaEdicao = new URLSearchParams(window.location.search).get("editar");

function preencherReceitaParaEdicao(id) {
  let receitasSalvas;
  try {
    receitasSalvas = JSON.parse(localStorage.getItem(chaveReceitas) || "[]");
  } catch (erro) {
    console.error("Não foi possível carregar a receita para edição:", erro);
    document.getElementById("recipe-save-status").textContent =
      "Não foi possível carregar a receita para edição.";
    return;
  }

  if (!Array.isArray(receitasSalvas)) {
    document.getElementById("recipe-save-status").textContent =
      "A lista de receitas salvas está inválida.";
    return;
  }

  const receita = receitasSalvas.find((item) => String(item.id) === id);
  if (!receita) {
    document.getElementById("recipe-save-status").textContent =
      "A receita não foi encontrada no navegador.";
    return;
  }

  document.getElementById("receitaNome").value = receita.nome || "";
  getRecipeCatogry.value =
    Object.entries(categoriasCatalogo).find(
      ([, categoria]) => categoria === receita.categoria,
    )?.[0] || "";
  getRequiredUnit.value = String(
    receita.unidadesBase || receita.unidades || "",
  );
  getPesoPorPao.value = String(receita.pesoPorUnidade || "");
  document.getElementById("tempoPreparo").value = String(
    receita.tempoPreparoMinutos || "",
  );
  getFarinhaBase.value = String(numero(receita.farinha));
  document.getElementById("modoPreparo").value = receita.descricao || "";

  const ingredientes = Array.isArray(receita.ingredientes)
    ? receita.ingredientes
    : [];
  if (ingredientes.length) {
    const tbody = criarTabela().querySelector("tbody");

    ingredientes.forEach((ingrediente) => {
      const option = Array.from(getIngredName.options).find(
        (item) => item.textContent.trim() === ingrediente.nome,
      );
      if (!option) {
        console.warn(
          `O ingrediente "${ingrediente.nome}" não pode ser carregado para edição.`,
        );
        return;
      }

      const gramas = numero(ingrediente.quantidade);
      const custo = numero(ingrediente.custo);
      const unidade =
        ingrediente.unidade ||
        (/\bkg\b/i.test(String(ingrediente.quantidade))
          ? "kg"
          : /ml/i.test(String(ingrediente.quantidade))
            ? "ml"
            : "g");
      const linha = document.createElement("tr");
      linha.dataset.ingredValue = option.value;
      linha.dataset.unidade = unidade;

      [
        ["col-nome", ingrediente.nome],
        ["col-grama", `${gramas} ${unidade}`],
        ["col-ppq", `R$ ${custo.toFixed(2)}`],
      ].forEach(([className, value]) => {
        const celula = document.createElement("td");
        celula.className = className;
        celula.textContent = value;
        linha.appendChild(celula);
      });

      const acoes = document.createElement("td");
      acoes.innerHTML = `
        <button type="button" class="delete-item" data-tooltip="Excluir ingrediente">
          <i class="fa-solid fa-trash"></i>
        </button>
        <button type="button" class="edit-item" data-tooltip="Editar ingrediente">
          <i class="fa-solid fa-pencil"></i>
        </button>
      `;
      linha.appendChild(acoes);

      const filtro = document.createElement("td");
      filtro.className = "col-filter";
      linha.appendChild(filtro);
      tbody.appendChild(linha);
    });

    if (tbody.children.length) {
      getRequiredUnit.disabled = true;
      getFarinhaBase.disabled = true;
    }
  }
  document.querySelector(".header-text-content h1").textContent =
    "Editar receita";
  saveRecipeButton.querySelector("button").textContent = "Salvar alterações";
  atualizarResultados();
}

if (idReceitaEdicao) {
  preencherReceitaParaEdicao(idReceitaEdicao);
}

if (saveRecipeButton) {
  saveRecipeButton.addEventListener("click", () => {
    const hasRecipeName = document.getElementById("receitaNome").value.trim();
    const hasCategory = getRecipeCatogry.value.trim();
    const hasFarinha = getFarinhaBase.value.trim();
    const hasMethod = document.getElementById("modoPreparo").value.trim();
    const tempoPreparoTexto = document.getElementById("tempoPreparo").value;
    const tempoPreparoMinutos = tempoPreparoTexto
      ? Number(tempoPreparoTexto)
      : null;
    const hasTable = tablePlacement?.querySelector("table");
    const hasData = hasTable?.querySelector("tbody");
    const tableExists = hasData && hasData.querySelectorAll("tr").length > 0;
    const status = document.getElementById("recipe-save-status");

    if (!hasRecipeName) {
      alert("Informe o nome da receita");
      return;
    } else if (!hasCategory) {
      alert("Informe a categoria da receita");
      return;
    } else if (!hasFarinha || numero(hasFarinha) <= 0) {
      alert("Informe o peso base da farinha");
      return;
    } else if (!numero(getRequiredUnit.value) || !numero(getPesoPorPao.value)) {
      alert("Informe a quantidade desejada e o peso de cada pão");
      return;
    } else if (
      tempoPreparoTexto &&
      (!Number.isInteger(tempoPreparoMinutos) || tempoPreparoMinutos <= 0)
    ) {
      alert("Informe um tempo de preparo válido em minutos.");
      return;
    } else if (!hasMethod) {
      alert("Descreva o modo de preparo");
      return;
    } else if (!tableExists) {
      alert("Adicione pelo menos um item na sua receita para salvar");
      return;
    }

    try {
      const ingredientes = Array.from(
        hasData.querySelectorAll("tr"),
        (row) => ({
          nome: row.querySelector(".col-nome")?.textContent.trim() || "",
          quantidade: row.querySelector(".col-grama")?.textContent.trim() || "",
          unidade: row.dataset.unidade || "g",
          custo: row.querySelector(".col-ppq")?.textContent.trim() || "",
        }),
      );
      const custoTexto = (valorTotalSpan?.textContent || "").replace(
        /[^\d,.-]/g,
        "",
      );
      const custoTotal = Number.parseFloat(
        custoTexto.includes(",")
          ? custoTexto.replace(/\./g, "").replace(",", ".")
          : custoTexto,
      );
      const rendimentoTexto = quantidadeProduzidaEl?.textContent || "";
      const receita = {
        id:
          idReceitaEdicao ||
          globalThis.crypto?.randomUUID?.() ||
          String(Date.now()),
        nome: hasRecipeName,
        categoria: categoriasCatalogo[hasCategory] || "massa-salgado",
        categoriaNome:
          getRecipeCatogry.options[getRecipeCatogry.selectedIndex].text,
        descricao: document.getElementById("modoPreparo").value.trim(),
        farinha: `${numero(hasFarinha)} g`,
        unidades:
          Number.parseInt(rendimentoTexto, 10) ||
          Math.floor(numero(getRequiredUnit.value)),
        unidadesBase: numero(getRequiredUnit.value),
        pesoPorUnidade: numero(getPesoPorPao.value),
        tempoPreparoMinutos,
        custoTotal: Number.isFinite(custoTotal) ? custoTotal : 0,
        ingredientes,
        favorito: false,
        criadoEm: new Date().toISOString(),
      };
      const receitasSalvas = JSON.parse(
        localStorage.getItem(chaveReceitas) || "[]",
      );
      if (!Array.isArray(receitasSalvas)) {
        throw new Error("A lista de receitas salva está inválida.");
      }
      const indiceExistente = receitasSalvas.findIndex(
        (item) => String(item.id) === receita.id,
      );
      if (idReceitaEdicao && indiceExistente < 0) {
        throw new Error("A receita que você está editando não foi encontrada.");
      }
      if (indiceExistente >= 0) {
        receita.favorito = Boolean(receitasSalvas[indiceExistente].favorito);
        receita.criadoEm =
          receitasSalvas[indiceExistente].criadoEm || receita.criadoEm;
        receitasSalvas[indiceExistente] = receita;
      } else {
        receitasSalvas.push(receita);
      }
      localStorage.setItem(chaveReceitas, JSON.stringify(receitasSalvas));
      status.textContent = idReceitaEdicao
        ? "Alterações salvas no catálogo."
        : "Receita salva e adicionada ao catálogo.";
    } catch (erro) {
      console.error("Não foi possível salvar a receita:", erro);
      status.textContent =
        "Não foi possível salvar a receita neste navegador. Verifique o espaço disponível.";
    }
  });
}

window.addEventListener("beforeunload", () => {
  if (imagePreview?.dataset.objectUrl) {
    URL.revokeObjectURL(imagePreview.dataset.objectUrl);
  }
});
