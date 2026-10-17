/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-meeting-logic.js === */
/* === FUNÇÃO: Inteligência da Sala de Guerra (Cockpit Mode) === */
/* =========================================================== */

window.civelReady(function() {
    console.log("💎 [Meeting Logic] Banco de Dados de Clientes Carregado.");
    
    // Listener para o botão de entrada (delegação para funcionar dinamicamente)
    document.body.addEventListener('click', function(e) {
        if(e.target && e.target.id === 'btn-entrar') {
            e.preventDefault(); // Impede o link padrão
            if(!e.target.classList.contains('active')) return;
            iniciarProtocoloReuniao(e.target.href);
        }
    });
});

// 1. BANCO DE DADOS DE CLIENTES
// SANITIZADO 10/09/2026: dados reais de clientes (nome, telefone, número de processo,
// status estratégico do caso e link de reunião) estavam hardcoded em texto puro neste
// arquivo JS público, sem autenticação real — risco de sigilo profissional (OAB art. 25)
// e LGPD. Substituído por dado fictício até existir um backend com autenticação de verdade.
// NÃO reintroduzir dado real de cliente aqui.
const CLIENTES_DB = {
    // Conta de demonstração
    "11999999999": {
        nome: "Cliente Demonstração",
        processo: "0000000-00.0000.0.00.0000",
        partes: "Cliente Demonstração vs. Parte Exemplo",
        mov: "Aguardando andamento",
        status: "EXEMPLO",
        hora: "A combinar",
        link: "https://meet.google.com/exemplo-demo-link"
    },
    // Acesso administrativo — não usar número de contato público como chave
    "00000000000": {
        nome: "Dr. Lucas (Admin)",
        processo: "MESA DE COMANDO",
        partes: "Lucas Semim Advocacia",
        mov: "Gestão de Painel",
        status: "SISTEMA ONLINE",
        hora: "ACESSO LIVRE",
        link: "https://meet.google.com/exemplo-admin-link"
    }
};

// 2. MÁSCARA DE TELEFONE
window.mascaraTelefone = function(input) {
    let v = input.value.replace(/\D/g, "");
    v = v.replace(/^0/, "");
    if (v.length > 10) v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 5) v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
    else v = v.replace(/^(\d*)/, "($1");
    input.value = v;
};

// 3. VALIDAÇÃO
window.validarCliente = function() {
    const input = document.getElementById('client-phone');
    const btn = document.querySelector('.btn-gate');
    const erro = document.getElementById('msg-erro');
    const phoneLimpo = input.value.replace(/\D/g, "");

    if(phoneLimpo.length < 10) {
        input.style.borderColor = "#e74c3c";
        return;
    }

    // Loading
    const textoOriginal = btn.innerText;
    btn.innerText = "AUTENTICANDO...";
    btn.style.background = "#333";
    btn.style.color = "#fff";
    erro.style.display = 'none';

    setTimeout(() => {
        const cliente = CLIENTES_DB[phoneLimpo];

        if (cliente) {
            // Preenche Dashboard
            document.getElementById('cli-nome').innerText = cliente.nome;
            document.getElementById('cli-proc').innerText = cliente.processo;
            document.getElementById('cli-partes').innerText = cliente.partes;
            document.getElementById('cli-mov').innerText = cliente.mov;
            document.getElementById('cli-status').innerText = cliente.status;
            document.getElementById('cli-hora').innerText = cliente.hora;
            
            // Prepara o Link no Botão
            const btnEntrar = document.getElementById('btn-entrar');
            btnEntrar.href = cliente.link; // Salva o link no href para uso posterior

            // Troca Tela
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('process-dashboard').style.display = 'block';
            document.getElementById('main-card').style.borderTopColor = "#2ecc71";
        } else {
            // Erro
            btn.innerText = textoOriginal;
            btn.style.background = "";
            input.style.borderColor = "#e74c3c";
            erro.style.display = 'block';
            const card = document.getElementById('main-card');
            card.animate([{transform:'translateX(0)'},{transform:'translateX(-10px)'},{transform:'translateX(10px)'},{transform:'translateX(0)'}],{duration:400});
        }
    }, 1500);
};

// 4. CHECKBOX LIBERAÇÃO
window.liberarBotao = function() {
    const check = document.getElementById('check-termos');
    const btn = document.getElementById('btn-entrar');
    if (check.checked) {
        btn.classList.add('active');
        btn.innerText = "ENTRAR NA SALA AGORA";
        btn.style.pointerEvents = "all";
        btn.style.opacity = "1";
    } else {
        btn.classList.remove('active');
        btn.innerText = "AGUARDANDO ACEITE...";
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.5";
    }
};

// 5. PROTOCOLO "COCKPIT" (A NOVA INTELIGÊNCIA)
// Abre o Meet em janela separada e transforma o site em bloco de notas
window.iniciarProtocoloReuniao = function(meetLink) {
    
    // A. Abre o Meet em modo "App" (Janela Flutuante)
    const width = 1200;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    window.open(meetLink, 'SalaGuerraVIP', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);

    // B. Transforma a página atual em "Modo Anotação"
    const dashboard = document.getElementById('process-dashboard');
    
    dashboard.innerHTML = `
        <div style="text-align:center; animation: fadeIn 1s;">
            <div style="font-size:3rem; margin-bottom:10px;">🔴</div>
            <h2 style="font-family:'Teko'; color:#e74c3c; font-size:2.5rem;">REUNIÃO EM ANDAMENTO</h2>
            <p style="color:#aaa;">A janela de vídeo foi aberta. Mantenha esta tela para anotações.</p>
            
            <div style="background:#111; padding:20px; border-radius:10px; margin-top:20px; text-align:left; border:1px solid #333;">
                <label style="color:#d4af37; font-family:'Fira Code'; font-size:0.9rem; display:block; margin-bottom:10px;">
                    📝 SUAS ANOTAÇÕES DO CASO:
                </label>
                <textarea id="notas-reuniao" style="width:100%; height:200px; background:#050505; color:#fff; border:1px solid #444; padding:15px; border-radius:5px; font-family:'Lato';" placeholder="Digite aqui orientações importantes do Dr. Lucas..."></textarea>
            </div>

            <button onclick="window.print()" style="margin-top:20px; background:transparent; border:1px solid #aaa; color:#aaa; padding:10px 20px; cursor:pointer; font-family:'Fira Code';">
                🖨️ Imprimir / Salvar PDF
            </button>
            
            <div style="margin-top:30px;">
                <a href="javascript:location.reload()" style="color:#666; text-decoration:none; font-size:0.8rem;">
                    Encerrar Sessão
                </a>
            </div>
        </div>
    `;
};