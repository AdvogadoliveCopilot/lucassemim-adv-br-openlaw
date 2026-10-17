/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-painel-auth.js === */
/* === FUNÇÃO: Autenticação REAL e Gestão de Sessão === */
/* =========================================================== */
//
// ATUALIZADO 11/09/2026: este arquivo ANTES tinha um USERS_DB com CPF e
// senha em texto puro, público, direto no JS do site (isso já causou um
// vazamento real, sanitizado em 10/09/2026 — ver histórico). Agora o
// login é feito de verdade no backend (Apps Script "Advogado Live",
// função loginClientePortal em 24_Painel_Cliente.gs): a senha viaja só
// nesta chamada, é conferida contra um hash com salt guardado numa aba
// oculta da planilha, e NUNCA fica salva em lugar nenhum público.
// O identificador de login mudou de CPF para E-MAIL (decisão de
// 11/09/2026). Requer codeleicivel/civel-api-config.js carregado antes
// deste arquivo (define CIVEL_API_URL).
//
// ATUALIZADO 12/09/2026 (redesign do login): o botão agora tem um
// spinner + texto em <span>s separados (em vez de btn.innerText puro),
// então o efeito de carregamento passou a usar essas duas classes.
// Aproveitado para corrigir um bug real: "originalText" era lido dentro
// de mostrarErro() antes de ser declarado nos casos de erro precoce
// (campo vazio / API não configurada) -- isso lançava
// "Cannot access before initialization" e o aviso de erro nunca
// aparecia pro cliente. Agora a leitura acontece no topo da função.

window.validarAcessoSeguro = function() {
    const emailInput = document.getElementById('cliente-email');
    const passInput = document.getElementById('cliente-senha');
    const btn = document.getElementById('btn-entrar') || document.querySelector('.btn-login');
    const spinner = document.getElementById('spinner-login');
    const textoBtn = document.getElementById('texto-btn-login');
    const errorBox = document.getElementById('area-bloqueio');

    const email = (emailInput.value || '').trim();
    const pass = passInput.value || '';

    // Lido ANTES de qualquer chamada a mostrarErro (corrige o bug do TDZ).
    const textoOriginal = textoBtn ? textoBtn.textContent : (btn ? btn.innerText : 'Entrar no cofre');

    function definirCarregando(carregando) {
        if (btn) btn.disabled = carregando;
        if (spinner) spinner.style.display = carregando ? 'inline-block' : 'none';
        if (textoBtn) {
            textoBtn.textContent = carregando ? 'Verificando credenciais...' : textoOriginal;
        } else if (btn && !carregando) {
            btn.innerText = textoOriginal;
        }
    }

    function mostrarErro(mensagem) {
        definirCarregando(false);

        errorBox.style.display = 'block';
        errorBox.querySelector('[data-erro-msg]').innerText = mensagem;
        errorBox.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 400 });
    }

    if (!email || !pass) {
        mostrarErro('Preencha e-mail e senha.');
        return;
    }

    if (!window.CIVEL_API_URL || CIVEL_API_URL.indexOf('COLE_AQUI') !== -1) {
        mostrarErro('Portal ainda em configuração. Fale com o escritório pelo WhatsApp.');
        return;
    }

    // Efeito Loading
    definirCarregando(true);
    errorBox.style.display = 'none';

    const url = CIVEL_API_URL
        + '?acao=loginCliente'
        + '&email=' + encodeURIComponent(email)
        + '&senha=' + encodeURIComponent(pass);

    fetch(url)
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            if (data && data.sucesso) {
                iniciarSessao(data);
            } else {
                mostrarErro((data && data.mensagem) || 'Credenciais inválidas.');
            }
        })
        .catch(function() {
            mostrarErro('Não foi possível conectar ao portal agora. Tente novamente em instantes.');
        });
};

function iniciarSessao(dadosLogin) {
    // Salva SÓ o e-mail e a "chave" do cliente na sessão do navegador —
    // a senha nunca é guardada em lugar nenhum no cliente.
    // civel-pje-engine.js usa essas duas chaves para buscar o processo
    // real via API, revalidando a cada consulta.
    sessionStorage.setItem('civel_user_email', dadosLogin.email);
    sessionStorage.setItem('civel_user_chave', dadosLogin.clienteChave || '');

    // Esconde Login, Mostra Dash
    document.getElementById('login-area').style.display = 'none';
    const dash = document.getElementById('dashboard-area');
    dash.style.display = 'block';
    dash.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 600 });

    // Preenche Dados
    document.getElementById('nome-cliente-display').innerText = dadosLogin.nome || 'Cliente';
    document.getElementById('user-id-display').innerText = dadosLogin.email;
}

// Toggle Senha (Olho) -- redesenhado 12/09/2026: alterna dois ícones SVG
// (.icone-olho-aberto / .icone-olho-fechado) em vez de trocar por emoji.
window.civelReady(() => {
    const toggleBtn = document.getElementById('toggle-pass');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const input = document.getElementById('cliente-senha');
            const aberto = toggleBtn.querySelector('.icone-olho-aberto');
            const fechado = toggleBtn.querySelector('.icone-olho-fechado');

            if (input.type === "password") {
                input.type = "text";
                if (aberto) aberto.style.display = 'none';
                if (fechado) fechado.style.display = '';
                toggleBtn.setAttribute('aria-label', 'Ocultar senha');
            } else {
                input.type = "password";
                if (aberto) aberto.style.display = '';
                if (fechado) fechado.style.display = 'none';
                toggleBtn.setAttribute('aria-label', 'Mostrar senha');
            }
        });
    }
});
