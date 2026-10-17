/* =========================================================== */
/* === ARQUIVO: codelei/vip-logic.js (Quantum Gatekeeper) === */
/* === FUNÇÃO: Validação de Acesso com Feedback Tático === */
/* =========================================================== */

// 1. BANCO DE DADOS (Lista Compactada para Performance)
// Adicionei os números de teste que você enviou
const LISTA_VIP = [
    "31999999999", "27997255051", "31991069061", "31997456138", "11999999999", "85988999999" "61999544859"
    // ... Cole aqui os outros 5.000 números quando quiser
];

// Variáveis de Estado
let etapa = 1;
let tentativas = 0;

// 2. MÁSCARA INTELIGENTE (Formata enquanto digita)
function mascaraTelefone(input) {
    let v = input.value.replace(/\D/g, "");
    v = v.replace(/^0/, "");
    if (v.length > 10) {
        v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 5) {
        v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
        v = v.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
    } else {
        v = v.replace(/^(\d*)/, "($1");
    }
    input.value = v;
}

// 3. LÓGICA DE VERIFICAÇÃO (CORE)
window.verificarVIP = function() {
    const phoneInput = document.getElementById('vip-phone');
    const emailInput = document.getElementById('vip-email');
    const btn = document.getElementById('btn-acao');
    const erro = document.getElementById('area-erro');
    
    // Proteção contra Força Bruta
    if (tentativas >= 3) {
        if(window.notificar) window.notificar("Muitas tentativas. Aguarde 10s.", "erro");
        btn.disabled = true;
        btn.style.background = "#555";
        setTimeout(() => { btn.disabled = false; btn.style.background = ""; tentativas = 0; }, 10000);
        return;
    }

    const phoneLimpo = phoneInput.value.replace(/\D/g, "");

    // Simulação de "Descriptografia" (Feedback Visual)
    const textoOriginal = btn.innerText;
    btn.innerText = "🔒 VERIFICANDO HASH...";
    btn.style.background = "#333";
    btn.disabled = true;

    setTimeout(() => {
        // Lógica Etapa 1: Telefone
        if (etapa === 1) {
            // Verifica se o número contém na lista (para lidar com formatos variados)
            // Se a lista estiver vazia ou tiver o código mestre "LIBERADO", passa
            const isVip = LISTA_VIP.some(n => n.includes(phoneLimpo)) || LISTA_VIP.includes("LIBERADO");

            if (isVip && phoneLimpo.length >= 10) {
                // SUCESSO
                etapa = 2;
                phoneInput.disabled = true;
                phoneInput.style.opacity = "0.5";
                phoneInput.style.borderColor = "#2ecc71"; // Verde
                
                emailInput.style.display = "block";
                emailInput.focus();
                
                btn.innerText = "CONFIRMAR E-MAIL 📧";
                btn.style.background = "linear-gradient(45deg, #2ecc71, #27ae60)";
                btn.disabled = false;
                if(erro) erro.style.display = "none";
                
                if(window.notificar) window.notificar("Número Localizado! Confirme o e-mail.", "sucesso");

            } else {
                // FALHA
                tentativas++;
                btn.innerText = "TENTAR NOVAMENTE";
                btn.style.background = "#e74c3c"; // Vermelho
                btn.disabled = false;
                phoneInput.style.borderColor = "#e74c3c";
                
                if(erro) {
                    erro.style.display = "block";
                    erro.classList.add("reveal"); // Animação se disponível
                }
                
                // Animação de Tremor (Shake)
                const box = document.querySelector('.cofre-container');
                if(box) {
                    box.animate([
                        { transform: 'translateX(0)' },
                        { transform: 'translateX(-10px)' },
                        { transform: 'translateX(10px)' },
                        { transform: 'translateX(0)' }
                    ], { duration: 400 });
                }
            }
        } 
        // Lógica Etapa 2: Email
        else if (etapa === 2) {
            if (emailInput.value.includes("@") && emailInput.value.includes(".")) {
                liberarAcesso(phoneLimpo);
            } else {
                if(window.notificar) window.notificar("Digite um e-mail válido.", "erro");
                else alert("E-mail inválido.");
                btn.disabled = false;
                btn.innerText = "CONFIRMAR E-MAIL 📧";
                btn.style.background = "linear-gradient(45deg, #2ecc71, #27ae60)";
            }
        }
    }, 800); // Delay de 800ms para "suspense"
};

function liberarAcesso(id) {
    document.getElementById('fase-validacao').style.display = 'none';
    document.getElementById('area-sucesso').style.display = 'block';
    
    // Gera Ticket Visual
    const ticket = id.slice(-4);
    document.getElementById('ticket-id').innerText = ticket;
    
    // Confete (Se houver biblioteca, mas vamos usar CSS pulse no botão)
    const btnZap = document.querySelector('#area-sucesso .btn-destravar');
    if(btnZap) btnZap.style.animation = "pulse 1s infinite";
}

window.agendarMeet = function() {
    const telefone = document.getElementById('vip-phone').value;
    const email = document.getElementById('vip-email').value;

    const texto = `🎟️ *RESGATE DE TICKET VIP (PRO BONO)*%0A%0A` +
                  `Olá Dr. Lucas, fui selecionado na lista de prioridade.` +
                  `%0AQuero agendar minha análise estratégica gratuita via Meet.` +
                  `%0A%0A*DADOS VALIDADOS:*` +
                  `%0ATel: ${telefone}` +
                  `%0AEmail: ${email}` +
                  `%0A%0A*STATUS:* CÓDIGO AUTORIZADO PELO SISTEMA.`;
    
    window.open(`https://wa.me/5531989420094?text=${texto}`, '_blank');
};