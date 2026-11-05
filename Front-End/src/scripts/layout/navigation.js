(() => {
// ==========================
// MENU LATERAL (toggle)
// ==========================
const sidebar = document.getElementById('sidebar');
const btn = document.getElementById('btn-menu');
const colunaLateral = document.querySelector('.coluna_lateral');
const overlay = document.getElementById('overlay');

if (btn && sidebar && colunaLateral && overlay) {
    const definirMenuAberto = (abrindo) => {
        sidebar.classList.toggle('aberto', abrindo);
        btn.classList.toggle('menu-aberto', abrindo);
        colunaLateral.classList.toggle('oculta', abrindo);
        overlay.classList.toggle('ativo', abrindo);
        sidebar.setAttribute('aria-hidden', String(!abrindo));
        sidebar.toggleAttribute('inert', !abrindo);
        btn.setAttribute('aria-expanded', String(abrindo));
        btn.setAttribute(
            'aria-label',
            abrindo ? 'Fechar navegação' : 'Abrir navegação'
        );
    };

    btn.addEventListener('click', () => {
        definirMenuAberto(!sidebar.classList.contains('aberto'));
    });

    overlay.addEventListener('click', () => definirMenuAberto(false));
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && sidebar.classList.contains('aberto')) {
            definirMenuAberto(false);
            btn.focus();
        }
    });
}
})();

// ==========================
// LINK ATIVO NO MENU
// ==========================
const paginaAtual = window.location.pathname.split('/').pop();
document.querySelectorAll('.auth-link').forEach((link) => {
    if (link.dataset.page === paginaAtual) {
        link.classList.add('ativo');
    }
});

// ==========================
// CATÁLOGO DE RECEITAS
// ==========================
