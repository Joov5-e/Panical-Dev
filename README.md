# PaniCalc

Aplicação web para organizar receitas de padaria, consultar fichas técnicas,
acompanhar rendimento e estimar custos e preços. O projeto é composto por
HTML, CSS e JavaScript, sem servidor ou API.

## Estrutura

```text
.
├── index.html
├── Front-End/
│   └── src/
│       ├── assets/
│       │   ├── icons/
│       │   │   └── navigation/
│       │   └── images/
│       ├── pages/
│       │   ├── cadastro-receitas/
│       │   ├── catalogo/
│       │   ├── ficha-tecnica/
│       │   ├── precificacao/
│       │   ├── rendimento/
│       │   └── sobre/
│       ├── scripts/
│       │   └── layout/
│       └── styles/
│           └── layout/
├── docs/
│   └── references/
└── archive/
    ├── backend-layout/
    └── legacy-scripts/
```

- `index.html` é a página inicial e ponto de entrada do sistema.
- Cada recurso da aplicação tem sua própria página, estilos e scripts em
  `Front-End/src/pages/`.
- Imagens e ícones compartilhados ficam em `Front-End/src/assets/`.
- Navegação reutilizada e estilos gerais ficam em
  `Front-End/src/scripts/layout/` e `Front-End/src/styles/layout/`.
- `docs/references/` contém anotações e referências antigas preservadas.
- `archive/` guarda scripts e auxiliares antigos, fora do carregamento da aplicação.

## Executar localmente

Abra a pasta do projeto no VS Code e inicie `index.html` com a extensão Live
Server. Também é possível abrir o arquivo diretamente no navegador, mas servir
o projeto por um endereço local estável facilita a navegação entre páginas e o
armazenamento de dados.

As receitas e os dados de precificação ficam no `localStorage` do navegador.
Eles não são enviados a um backend e não são compartilhados entre navegadores
ou endereços de origem diferentes. A exportação de PDF usa jsPDF via CDN e
precisa de conexão com a internet.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Bootstrap, Font Awesome e Google Fonts via CDN
