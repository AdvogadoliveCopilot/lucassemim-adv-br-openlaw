/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-form-intelligence.js === */
/* === FUNÇÃO: Camada Neural de Validação e Assistência === */
/* =========================================================== */

window.civelReady(function() {
    console.log("🧠 [Form Intelligence] Escaneando campos...");
    initQuantumForms();
});

function initQuantumForms() {
    // Delegação de Eventos: Detecta inputs em qualquer lugar do site
    document.body.addEventListener('input', handleInput);
    document.body.addEventListener('blur', handleBlur, true);
}

// --- 1. ROTEADOR DE EVENTOS ---
function handleInput(e) {
    const target = e.target;

    // CORRIGIDO 11/09/2026: 'input'/'blur' sao capturados por delegação em TODO
    // o <body> (de propósito, pra cobrir campos de qualquer página). Mas nem todo
    // elemento que dispara 'input' é um <input>/<select> — um <div contenteditable>
    // também dispara, e nele target.name é undefined. undefined.includes(...)
    // quebrava com TypeError e parava o handler no meio. target.id já é seguro
    // (sempre string), só target.name precisava da guarda.
    const id = target.id || '';
    const name = target.name || '';

    // Máscara de Telefone (Universal)
    if (target.type === 'tel' || id.includes('tel') || name.includes('tel')) {
        maskPhone(target);
    }

    // Máscara de CPF/CNPJ
    if (id.includes('doc') || name.includes('cpf') || name.includes('cnpj')) {
        maskDoc(target);
    }

    // Máscara de Processo CNJ (Novo!)
    if (id.includes('proc') || name.includes('processo')) {
        maskCNJ(target);
    }

    // Máscara Monetária (R$)
    if (id.includes('valor')) {
        maskMoney(target);
    }
}

function handleBlur(e) {
    const target = e.target;

    // Validação Visual de CPF/CNPJ
    if ((target.id || '').includes('doc')) {
        validateDocVisual(target);
    }

    // Sugestão de E-mail (Anti-Typo)
    if (target.type === 'email') {
        checkEmailTypo(target);
    }
}

// --- 2. MÁSCARAS INTELIGENTES ---

function maskPhone(el) {
    let v = el.value.replace(/\D/g, "");
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
    el.value = v;
}

function maskDoc(el) {
    let v = el.value.replace(/\D/g, "");
    if (v.length <= 11) { // CPF
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else { // CNPJ
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
    }
    el.value = v;
}

function maskCNJ(el) {
    // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
    let v = el.value.replace(/\D/g, "");
    // Limita tamanho
    if (v.length > 20) v = v.substring(0, 20);
    
    // Aplica a máscara progressivamente
    v = v.replace(/^(\d{7})(\d)/, '$1-$2');
    v = v.replace(/-(\d{2})(\d)/, '-$1.$2');
    v = v.replace(/\.(\d{4})(\d)/, '.$1.$2');
    v = v.replace(/\.(\d)(\d)/, '.$1.$2'); // J
    v = v.replace(/\.(\d{2})(\d)/, '.$1.$2'); // TR
    
    el.value = v;
}

function maskMoney(el) {
    let v = el.value.replace(/\D/g, "");
    v = (v / 100).toFixed(2) + "";
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    el.value = "R$ " + v;
}

// --- 3. VALIDAÇÃO VISUAL (FEEDBACK) ---

function validateDocVisual(el) {
    // Remove ícones antigos
    const parent = el.parentNode;
    const oldIcon = parent.querySelector('.validation-icon');
    if(oldIcon) oldIcon.remove();

    const val = el.value.replace(/\D/g, '');
    if(val.length === 0) return;

    // Lógica Matemática (Módulo 11 Simplificado para feedback visual)
    let isValid = false;
    if (val.length === 11 || val.length === 14) isValid = true; 
    // (Poderíamos usar o algoritmo completo aqui, mas vamos focar na UX rápida)

    // Cria o ícone
    const icon = document.createElement('span');
    icon.classList.add('validation-icon');
    icon.style.position = 'absolute';
    icon.style.right = '10px';
    icon.style.top = '40px'; // Ajuste conforme layout
    icon.style.fontWeight = 'bold';

    if (isValid) {
        icon.innerHTML = "✓";
        icon.style.color = "#2ecc71"; // Verde
        el.style.borderColor = "#2ecc71";
    } else {
        icon.innerHTML = "✕";
        icon.style.color = "#e74c3c"; // Vermelho
        el.style.borderColor = "#e74c3c";
        // Efeito Shake
        el.animate([
            { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, 
            { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
        ], { duration: 300 });
    }
    
    // Insere (requer que o input esteja num div relative)
    if(getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    parent.appendChild(icon);
}

// --- 4. CORRETOR DE E-MAIL (ANTI-TYPO) ---
function checkEmailTypo(el) {
    const val = el.value.toLowerCase();
    const domains = {
        'gamil.com': 'gmail.com',
        'gnail.com': 'gmail.com',
        'hotmial.com': 'hotmail.com',
        'outlok.com': 'outlook.com',
        'yaho.com': 'yahoo.com'
    };

    const parts = val.split('@');
    if (parts.length === 2) {
        const domain = parts[1];
        if (domains[domain]) {
            const suggestion = parts[0] + '@' + domains[domain];
            
            // Cria sugestão visual
            const parent = el.parentNode;
            const existingMsg = parent.querySelector('.email-suggestion');
            if(existingMsg) existingMsg.remove();

            const msg = document.createElement('div');
            msg.className = 'email-suggestion';
            msg.style.color = '#f1c40f'; // Amarelo Dourado
            msg.style.fontSize = '0.8rem';
            msg.style.marginTop = '5px';
            msg.style.cursor = 'pointer';
            msg.innerHTML = `💡 Você quis dizer <strong>${suggestion}</strong>? (Clique para corrigir)`;
            
            msg.onclick = function() {
                el.value = suggestion;
                msg.remove();
                el.style.borderColor = "#2ecc71";
            };

            parent.appendChild(msg);
        }
    }
}