/* =================================== */
/* === ARQUIVO: codelei/clientes-vip.js === */
/* === SEGURANÇA: Lista de Clientes Autorizados === */
/* =================================== */

// LISTA DE CLIENTES (BANCO DE DADOS SEGURO)
// Formato: "CPF_SEM_PONTOS": { nome: "Nome", senha: "SENHA_DEFINIDA" }
const BASE_CLIENTES = {
    "12345678900": { nome: "Cliente Teste", senha: "123" },
    "00000000000": { nome: "Exemplo VIP", senha: "vip" },
    // ADICIONE SEUS CLIENTES REAIS AQUI:
    // "CPF": { nome: "Nome", senha: "Senha" },
};

window.validarAcessoSeguro = function() {
    const cpfInput = document.getElementById('cliente-cpf');
    const senhaInput = document.getElementById('cliente-senha');
    const loginArea = document.getElementById('login-area');
    const dashArea = document.getElementById('dashboard-area');
    const bloqueioArea = document.getElementById('area-bloqueio');
    
    const cpfLimpo = cpfInput.value.replace(/\D/g, "");
    const senha = senhaInput.value;

    // Feedback Visual
    const btn = document.querySelector('.btn-login');
    const textoOriginal = btn.innerText;
    btn.innerText = "🔒 VERIFICANDO CREDENCIAIS...";
    btn.style.background = "#333";

    setTimeout(() => {
        // Lógica de Validação
        const cliente = BASE_CLIENTES[cpfLimpo];

        if (cliente && cliente.senha === senha) {
            // SUCESSO: Libera o Painel
            loginArea.style.display = 'none';
            dashArea.classList.add('ativo');
            
            document.getElementById('user-id-display').innerText = cpfLimpo;
            document.getElementById('nome-cliente-display').innerText = cliente.nome;
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // FALHA: Mostra Bloqueio e Oferta de Cadastro
            bloqueioArea.style.display = 'block';
            btn.innerText = textoOriginal;
            btn.style.background = "";
            cpfInput.style.borderColor = "#e74c3c";
            senhaInput.style.borderColor = "#e74c3c";
        }
    }, 1000);
};