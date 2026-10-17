/**
 * TERMINAL GUARDIÃO - CORE ENGINE V1.0
 * Inteligência de Login, Cadastro e Dopamina Visual
 * Desenvolvido para Semim & Associados
 */

const ANJO_CONFIG = {
    url: "https://script.google.com/macros/s/AKfycbyq2ieHuEK6nnpWYa3bibtOEZsP53rw2q41Jx27QfTYr8gTrFh_bZ36mh6NN1CXIH6O/exec",
    versao: "1.0.0"
};

// 1. INICIALIZAÇÃO COM EFEITO DIGITAÇÃO (DOPAMINA)
document.addEventListener('DOMContentLoaded', () => {
    console.log("🛡️ Terminal Guardião Ativado...");
    aplicarEfeitosVisuais();
});

function aplicarEfeitosVisuais() {
    const loginBox = document.querySelector('.login-box');
    if(loginBox) {
        loginBox.style.opacity = '0';
        loginBox.style.transform = 'translateY(30px)';
        setTimeout(() => {
            loginBox.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            loginBox.style.opacity = '1';
            loginBox.style.transform = 'translateY(0)';
        }, 300);
    }
}

// 2. ALTERNADOR DE TELAS COM ANIMAÇÃO "GLITCH"
function alternarAuth(tela) {
    const boxLogin = document.getElementById('box-login');
    const boxCadastro = document.getElementById('box-cadastro');
    const msgAlerta = document.getElementById('msg-alerta');

    msgAlerta.style.display = 'none';
    
    if(tela === 'cadastro') {
        boxLogin.style.display = 'none';
        boxCadastro.style.display = 'block';
        boxCadastro.classList.add('animate__animated', 'animate__fadeInRight');
    } else {
        boxCadastro.style.display = 'none';
        boxLogin.style.display = 'block';
        boxLogin.classList.add('animate__animated', 'animate__fadeInLeft');
    }
}

// 3. FUNÇÃO DE FEEDBACK INTELIGENTE
function feedback(msg, tipo) {
    const el = document.getElementById('msg-alerta');
    el.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i> ${msg.toUpperCase()}`;
    el.className = `mt-3 small font-teko fs-5 text-${tipo} animate__animated animate__shakeX`;
    el.style.display = "block";
}

// 4. LÓGICA DE CADASTRO (PROCESSAMENTO SILENCIOSO)
async function processarCadastro(event, form) {
    event.preventDefault();
    const btn = form.querySelector('button');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = "<i class='fas fa-sync fa-spin'></i> CRIPTOGRAFANDO...";

    const params = new URLSearchParams(new FormData(form));

    try {
        const response = await fetch(ANJO_CONFIG.url, { method: 'POST', body: params });
        const data = await response.json();

        if(data.result === "success") {
            feedback(data.mensagem || "ACESSO CONCEDIDO. BEM-VINDO AO TIME.", "success");
            confettiEfeito(); // Gatilho de Dopamina
            setTimeout(() => alternarAuth('login'), 3000);
        } else {
            feedback(data.mensagem || "FALHA NA VALIDAÇÃO.", "danger");
        }
    } catch (error) {
        feedback("ERRO DE CONEXÃO COM O TERMINAL.", "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// 5. LÓGICA DE LOGIN (RECONHECIMENTO DE ELITE)
async function processarLogin(event, form) {
    event.preventDefault();
    const email = form.querySelector('#email').value;
    const senha = form.querySelector('#senha').value;
    const btn = form.querySelector('button');
    
    btn.disabled = true;
    btn.innerHTML = "<i class='fas fa-shield-halved fa-spin'></i> AUTORIZANDO...";

    try {
        const response = await fetch(`${ANJO_CONFIG.url}?acao=login&email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`);
        const res = await response.json();

        if (res.sucesso) {
            feedback("IDENTIDADE CONFIRMADA. ACESSANDO PORTFÓLIO...", "success");
            // Salva o nome para usar no painel
            localStorage.setItem('anjo_nome', res.nome);
            localStorage.setItem('anjo_email', email);
            
            setTimeout(() => {
                document.getElementById('nome-anjo-tela').innerText = res.nome;
                document.getElementById('tela-auth').style.display = 'none';
                document.getElementById('painel-investidor').style.display = 'block';
                carregarCasos(email);
            }, 1500);
        } else { 
            feedback("ACESSO NEGADO: CREDENCIAIS INVÁLIDAS.", "danger"); 
            btn.disabled = false;
            btn.innerHTML = "AUTORIZAR";
        }
    } catch (error) {
        feedback("ERRO CRÍTICO NO SERVIDOR.", "danger");
        btn.disabled = false;
        btn.innerHTML = "AUTORIZAR";
    }
}

// 6. EFEITO CELEBRAÇÃO (DOPAMINA)
function confettiEfeito() {
    // Aqui você pode adicionar uma biblioteca de confete ou apenas um brilho na tela
    document.body.style.boxShadow = "inset 0 0 100px rgba(212, 175, 55, 0.2)";
    setTimeout(() => document.body.style.boxShadow = "none", 2000);
}