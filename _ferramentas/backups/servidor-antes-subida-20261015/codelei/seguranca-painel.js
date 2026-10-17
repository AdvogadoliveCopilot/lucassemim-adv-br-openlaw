/* =========================================================== */
/* === ARQUIVO: codelei/seguranca-painel.js === */
/* === GUARDIÃO QUANTUM: Autenticação e Criptografia Simulada === */
/* =========================================================== */

// Função Helper para pausas dramáticas (UX)
const delay = ms => new Promise(res => setTimeout(res, ms));

// Função principal chamada pelo botão de login
window.validarAcessoSeguro = async function() {
    
    // 1. COLETA DE ELEMENTOS
    const cpfInput = document.getElementById('cliente-cpf');
    const senhaInput = document.getElementById('cliente-senha');
    const btn = document.querySelector('.btn-login');
    const loginArea = document.getElementById('login-area');
    const dashArea = document.getElementById('dashboard-area');
    const bloqueioArea = document.getElementById('area-bloqueio');
    
    // 2. LIMPEZA E VALIDAÇÃO BÁSICA
    const cpfLimpo = cpfInput.value.replace(/\D/g, "");
    const senhaDigitada = senhaInput.value.trim();

    if (cpfLimpo.length !== 11 || senhaDigitada.length < 3) {
        shakeElement(btn); // Treme o botão
        if(window.notificar) window.notificar("Preencha CPF e Senha corretamente.", "erro");
        return;
    }

    // 3. INÍCIO DA SEQUÊNCIA DE SEGURANÇA
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    cpfInput.disabled = true;
    senhaInput.disabled = true;
    
    try {
        // Efeito "Matrix" de carregamento
        btn.style.background = "#333";
        btn.innerHTML = "📡 ESTABELECENDO CONEXÃO...";
        await delay(600);

        btn.innerHTML = "🔑 VERIFICANDO CREDENCIAIS...";
        await delay(600);

        // 4. BUSCA O ARQUIVO NA PASTA DO CLIENTE (O COFRE)
        // Tenta baixar o JSON com cache-busting para garantir dados frescos
        const resposta = await fetch(`clientes/${cpfLimpo}/dados.json?v=${new Date().getTime()}`);

        if (!resposta.ok) throw new Error("Cliente não localizado.");

        const dados = await resposta.json();

        // 5. COMPARAÇÃO DE SENHA (MATCH)
        if (dados.acesso_seguro && dados.acesso_seguro.senha === senhaDigitada) {
            
            // SUCESSO
            btn.innerHTML = "🔓 ACESSO AUTORIZADO";
            btn.style.background = "#2ecc71"; // Verde Sucesso
            btn.style.borderColor = "#2ecc71";
            
            if(window.notificar) window.notificar("Identidade confirmada. Carregando painel...", "sucesso");

            await delay(800);

            // Ação de Login
            // 1. Carrega os dados no robô
            if(typeof executarRobo === 'function') {
                executarRobo(dados, document.querySelector('.pje-container')); 
            }
            
            // 2. Preenche o Header do Dashboard
            const userIdDisplay = document.getElementById('user-id-display');
            const userNameDisplay = document.getElementById('nome-cliente-display');
            
            if(userIdDisplay) userIdDisplay.innerText = dados.acesso_seguro.token_id || "***";
            if(userNameDisplay) userNameDisplay.innerText = dados.cliente.nome.split(' ')[0]; // Primeiro nome

            // 3. Troca as telas (Fade Out / Fade In)
            loginArea.style.opacity = '0';
            
            setTimeout(() => {
                loginArea.style.display = 'none';
                dashArea.style.display = 'block';
                // Força reflow
                void dashArea.offsetWidth; 
                dashArea.classList.add('ativo');
                
                // Rola para o topo suavemente
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 500);

        } else {
            throw new Error("Senha incorreta.");
        }

    } catch (erro) {
        console.warn("[Segurança Live] Bloqueio:", erro.message);
        
        // ERRO / FALHA
        btn.innerHTML = "🚫 ACESSO NEGADO";
        btn.style.background = "#e74c3c"; // Vermelho
        btn.style.borderColor = "#e74c3c";
        
        // Feedback visual nos inputs
        cpfInput.style.borderColor = "#e74c3c";
        senhaInput.style.borderColor = "#e74c3c";
        shakeElement(loginArea); // Treme o card inteiro

        if(window.notificar) window.notificar("Acesso negado. Verifique seus dados.", "erro");

        // Mostra área de recuperação
        if(bloqueioArea) {
            bloqueioArea.style.display = 'block';
            bloqueioArea.classList.add('reveal', 'active');
        }
        
        // Reseta o botão após 2 segundos
        setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.style.background = ""; // Volta ao gradiente original
            btn.style.borderColor = "";
            btn.disabled = false;
            cpfInput.disabled = false;
            senhaInput.disabled = false;
            senhaInput.value = ""; // Limpa a senha
            senhaInput.focus();
        }, 2000);
    }
};

// Função Visual: Shake (Tremor de Erro)
function shakeElement(element) {
    element.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(0)' }
    ], {
        duration: 400,
        easing: 'ease-in-out'
    });
}