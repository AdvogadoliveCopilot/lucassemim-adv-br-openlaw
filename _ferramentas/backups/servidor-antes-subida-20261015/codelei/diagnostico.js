/* =========================================================== */
/* === FICHEIRO: js/diagnostico.js (DiagnosticoElite V3) ===== */
/* === FUNÇÃO: Funil de Triagem e Envio de Dossiê via WPP ==== */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

/* 
  Para compatibilidade com o HTML existente, atualize os atributos onclick dos botões:
  DE: onclick="iniciarDiagnostico('prisao', this)"
  PARA: onclick="window.DiagnosticoElite.iniciarDiagnostico('prisao', this)"
  
  OU: utilize atributos data-action="iniciar" data-valor="prisao" e faça o binding via addEventListener.
*/

window.DiagnosticoElite = {
    config: {
        whatsapp: '5531989420094',
        waBase: 'https://wa.me/',
        scrollOffset: 120,
        campos: ['diag-nome', 'diag-telefone', 'diag-email', 'diag-crime', 'diag-narrativa', 'diag-objetivo'],
        camposOpcionais: ['diag-email', 'diag-crime', 'diag-processo', 'diag-comarca', 'diag-situacao'],
        storagePrefix: 'diagn_',
        sendCooldownMs: 30000,
        isDebug: window.location.hostname !== 'lucassemim.adv.br'
    },

    state: {
        enviando: false,
        ultimoEnvio: 0,
        reducedMotion: false
    },

    init() {
        try {
            this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            const btnFinal = document.querySelector('.btn-diagnostico-final');
            if (btnFinal || document.getElementById('diag-nome')) {
                this.injectStyles();
                this.initMascaras();
                this.initAutoSave();
                this.initFormulario();
                this.trackEvent('diagn_start', 0, 'inicio_diagnostico');
                
                if (this.config.isDebug) {
                    console.log('[DiagnosticoElite V3] Inicializado com sucesso.');
                }
            }
        } catch (e) {
            if (this.config.isDebug) console.error('[DiagnosticoElite] Erro na inicialização:', e);
        }
    },

    injectStyles() {
        if (document.getElementById('diagnostico-elite-styles')) return;
        const style = document.createElement('style');
        style.id = 'diagnostico-elite-styles';
        style.textContent = `
            /* === DiagnosticoElite V3 === */
            .passo-diagn {
                display: none; opacity: 0;
                transition: opacity 0.35s ease;
            }
            .passo-diagn.passo-active {
                opacity: 1;
            }
            .resultado-diagn {
                display: none; opacity: 0; transform: translateY(8px);
                transition: opacity 0.4s ease, transform 0.35s ease;
            }
            .resultado-diagn.resultado-active {
                opacity: 1; transform: translateY(0);
            }
            @media (prefers-reduced-motion: reduce) {
                .passo-diagn, .resultado-diagn { transition: none; }
                .resultado-diagn { transform: none; }
            }
            @keyframes diagFadeIn {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            
            .btn-diagn-pressed { transform: scale(0.97) !important; }
            
            .diagn-loading-indicator {
                text-align: center; color: #d4af37;
                font-family: 'Teko', sans-serif; font-size: 1.2rem;
                letter-spacing: 1px; padding: 20px 0;
                display: flex; align-items: center; justify-content: center; gap: 10px;
            }
            
            .field-valid {
                border-color: #2ecc71 !important;
                box-shadow: 0 0 6px rgba(46,204,113,0.25) !important;
            }
            .field-error {
                border-color: #e74c3c !important;
                box-shadow: 0 0 6px rgba(231,76,60,0.2) !important;
            }
            
            .btn-diagn-loading {
                background: #333 !important; color: #999 !important;
                cursor: not-allowed !important; pointer-events: none;
            }
            
            .diagn-notif {
                padding: 12px 18px; border-radius: 6px;
                font-family: 'Lato', sans-serif; font-size: 0.95rem;
                margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
            }
            .diagn-notif-erro { background: rgba(231,76,60,0.1); border-left: 3px solid #e74c3c; color: #ff8a80; }
            .diagn-notif-sucesso { background: rgba(46,204,113,0.1); border-left: 3px solid #2ecc71; color: #69f0ae; }
            .diagn-notif-aviso { background: rgba(212,175,55,0.1); border-left: 3px solid #d4af37; color: #d4af37; }
        `;
        document.head.appendChild(style);
    },

    iniciarDiagnostico(valor, btnEl) {
        try {
            if (btnEl) {
                btnEl.classList.add('btn-diagn-pressed');
                setTimeout(() => btnEl.classList.remove('btn-diagn-pressed'), 200);
            }

            this.resetar();
            this.trackEvent('diagn_step1', 1, valor);

            setTimeout(() => {
                if (valor === 'prisao') {
                    this.mostrarPasso('diag-step-2');
                } else if (valor === 'processo') {
                    this.mostrarResultado('res-complexo');
                } else if (valor === 'social') {
                    this.mostrarResultado('res-social');
                }
            }, 300);
        } catch (e) {
            if (this.config.isDebug) console.error('[DiagnosticoElite] Erro no passo 1:', e);
        }
    },

    avaliarEmergencia(valor, btnEl) {
        try {
            if (btnEl) {
                btnEl.classList.add('btn-diagn-pressed');
                setTimeout(() => btnEl.classList.remove('btn-diagn-pressed'), 200);
            }

            ['res-emergencia', 'res-complexo'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            this.trackEvent('diagn_step2', 2, valor);
            this.showLoading('diag-step-2');

            setTimeout(() => {
                this.hideLoading('diag-step-2');

                if (valor === 'agora') {
                    this.mostrarResultado('res-emergencia');
                } else if (valor === 'passado') {
                    this.mostrarResultado('res-complexo');
                }
            }, 800);
        } catch (e) {
            if (this.config.isDebug) console.error('[DiagnosticoElite] Erro no passo 2:', e);
        }
    },

    mostrarPasso(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'block';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.classList.add('passo-active');
                this.scrollParaEl(id);
            });
        });
    },

    mostrarResultado(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'block';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.classList.add('resultado-active');
                this.scrollParaEl(id);
                this.trackEvent('diagn_resultado', 3, id);
            });
        });
    },

    resetar() {
        ['res-emergencia', 'res-complexo', 'res-social', 'diag-step-2'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.remove('passo-active', 'resultado-active');
            
            el.addEventListener('transitionend', () => {
                if (!el.classList.contains('passo-active') && !el.classList.contains('resultado-active')) {
                    el.style.display = 'none';
                }
            }, { once: true });
        });
    },

    scrollParaEl(id) {
        const target = document.getElementById(id);
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const destY = rect.top + window.scrollY - this.config.scrollOffset;
        const smooth = !this.state.reducedMotion;
        window.scrollTo({ top: destY, behavior: smooth ? 'smooth' : 'auto' });
    },

    buildLoadingIndicator() {
        const div = document.createElement('div');
        div.id = 'diagn-loading';
        div.className = 'diagn-loading-indicator';
        const icon = document.createElement('i');
        icon.className = 'fas fa-circle-notch fa-spin';
        icon.setAttribute('aria-hidden', 'true');
        div.appendChild(icon);
        div.appendChild(document.createTextNode(' ANALISANDO RISCO DE CUSTÓDIA...'));
        return div;
    },

    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const loader = this.buildLoadingIndicator();
        container.appendChild(loader);
    },

    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const loader = container.querySelector('#diagn-loading');
        if (loader) loader.remove();
    },

    initFormulario() {
        const btnFinal = document.querySelector('.btn-diagnostico-final');
        if (btnFinal) {
            btnFinal.addEventListener('click', (e) => {
                e.preventDefault();
                this.enviarDiagnostico();
            });
        }
    },

    initMascaras() {
        const telInput = document.getElementById('diag-telefone');
        const cpfInput = document.getElementById('diag-cpf');

        if (telInput) {
            telInput.addEventListener('input', (e) => {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
                this.validarCampo(telInput, e.target.value.length >= 14);
            });
        }
        
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, "");
                v = v.replace(/(\d{3})(\d)/, "$1.$2");
                v = v.replace(/(\d{3})(\d)/, "$1.$2");
                v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                e.target.value = v;
                this.validarCampo(cpfInput, this.validarCPF(v));
            });
        }
    },

    initAutoSave() {
        this.config.campos.forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;

            const salvo = sessionStorage.getItem(`${this.config.storagePrefix}${id}`);
            if (salvo) {
                input.value = salvo;
                this.validarCampo(input);
            }

            input.addEventListener('input', () => {
                sessionStorage.setItem(`${this.config.storagePrefix}${id}`, input.value);
                this.validarCampo(input);
            });
        });
    },

    clearAutoSave() {
        this.config.campos.forEach(id => {
            sessionStorage.removeItem(`${this.config.storagePrefix}${id}`);
        });
        sessionStorage.removeItem(`${this.config.storagePrefix}diag-cpf`);
    },

    validarCampo(input, valido = null) {
        const isEmpty = input.value.trim().length <= 3;

        if (isEmpty) {
            input.classList.remove('field-valid', 'field-error');
            return;
        }

        const isValid = valido !== null ? valido : true;
        input.classList.toggle('field-valid', isValid);
        input.classList.toggle('field-error', !isValid);
    },

    validarCPF(cpfStr) {
        const cpf = cpfStr.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
        let rem = (sum * 10) % 11;
        if (rem === 10 || rem === 11) rem = 0;
        if (rem !== parseInt(cpf[9])) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
        rem = (sum * 10) % 11;
        if (rem === 10 || rem === 11) rem = 0;
        if (rem !== parseInt(cpf[10])) return false;

        return true;
    },

    validarFormulario() {
        const nome = document.getElementById('diag-nome')?.value.trim();
        const telefone = document.getElementById('diag-telefone')?.value.trim();
        const narrativa = document.getElementById('diag-narrativa')?.value.trim();

        if (!nome || !telefone || !narrativa || narrativa.length < 10) {
            this.mostrarNotificacao('Por favor, preencha os campos obrigatórios corretamente.', 'erro');
            return false;
        }
        return true;
    },

    enviarDiagnostico() {
        const agora = Date.now();
        if (this.state.enviando || (agora - this.state.ultimoEnvio) < this.config.sendCooldownMs) {
            this.mostrarNotificacao('Aguarde um momento antes de enviar novamente.', 'aviso');
            return;
        }

        if (!this.validarFormulario()) return;

        this.setEnviando(true);
        this.trackEvent('diagn_send', 4, 'dossie_whatsapp');

        setTimeout(() => {
            try {
                const msg = this.buildMensagem();
                const url = `${this.config.waBase}${this.config.whatsapp}?text=${msg}`;
                this.openWhatsApp(url);
                this.clearAutoSave();
                this.state.ultimoEnvio = Date.now();
                this.mostrarNotificacao('Dossiê preparado e enviado! Aguarde nosso retorno.', 'sucesso');
            } catch (e) {
                this.mostrarNotificacao('Erro ao enviar. Tente novamente.', 'erro');
                if (this.config.isDebug) console.error('[DiagnosticoElite] Erro no envio:', e);
            } finally {
                this.setEnviando(false);
            }
        }, 1500);
    },

    buildMensagem() {
        const get = id => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const nome = get('diag-nome');
        const cpf = get('diag-cpf') || 'Não informado';
        const telefone = get('diag-telefone');
        const situacao = get('diag-situacao') || 'Não informado';
        const crime = get('diag-crime') || 'Não informado';
        const processo = get('diag-processo') || 'Não informado';
        const comarca = get('diag-comarca') || 'Não informado';
        const email = get('diag-email') || 'Não informado';
        const narrativa = get('diag-narrativa');
        const objetivo = get('diag-objetivo') || 'Análise geral';

        const teses = [];
        document.querySelectorAll('.tese-input:checked').forEach(el => teses.push(el.value));

        const linhas = [
            '🧠 *DOSSIÊ DE TRIAGEM CRIMINAL — SEMIM ADVOCACIA* 🧠',
            '',
            `*Nome:* ${nome}`,
            `*CPF:* ${cpf}`,
            `*Contato:* ${telefone}`,
            `*E-mail:* ${email}`,
            `*Situação:* ${situacao}`,
            `*Crime / Imputação:* ${crime}`,
            `*Nº Processo:* ${processo}`,
            `*Comarca:* ${comarca}`,
            '',
            `*Narrativa:*`,
            narrativa,
            '',
            `*Objetivo:* ${objetivo}`,
            teses.length ? `*Teses de Interesse:* ${teses.join(', ')}` : undefined,
            '',
            `_Diagnóstico enviado via site | ${new Date().toLocaleString('pt-BR')}_`
        ].filter(l => l !== undefined);

        return encodeURIComponent(linhas.join('\n'));
    },

    openWhatsApp(url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    setEnviando(sim) {
        this.state.enviando = sim;
        const btn = document.querySelector('.btn-diagnostico-final');
        if (!btn) return;

        if (sim) {
            btn.classList.add('btn-diagn-loading');
            btn.disabled = true;
            btn.textContent = '⏳ Enviando...';
        } else {
            btn.classList.remove('btn-diagn-loading');
            btn.disabled = false;
            btn.textContent = 'ENVIAR DOSSIÊ CRIMINAL';
        }
    },

    mostrarNotificacao(msg, tipo) {
        const existente = document.getElementById('diagn-notif');
        if (existente) existente.remove();

        const notif = document.createElement('div');
        notif.id = 'diagn-notif';
        notif.className = `diagn-notif diagn-notif-${tipo}`;
        notif.setAttribute('role', 'alert');
        notif.setAttribute('aria-live', 'assertive');

        const icon = document.createElement('i');
        if (tipo === 'erro') icon.className = 'fas fa-circle-xmark';
        else if (tipo === 'sucesso') icon.className = 'fas fa-circle-check';
        else icon.className = 'fas fa-circle-info';
        icon.setAttribute('aria-hidden', 'true');
        
        notif.appendChild(icon);
        notif.appendChild(document.createTextNode(` ${msg}`));

        const btn = document.querySelector('.btn-diagnostico-final');
        if (btn && btn.parentNode) {
            btn.parentNode.insertBefore(notif, btn);
        } else {
            document.body.appendChild(notif);
        }

        setTimeout(() => {
            if (document.body.contains(notif)) notif.remove();
        }, 5000);
    },

    trackEvent(action, step, label) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', action, {
                event_category: 'Diagnostico_Funil',
                event_label: label,
                funil_passo: step,
                pagina_origem: window.location.pathname
            });
        } catch { }
    }
};

document.addEventListener('DOMContentLoaded', () => window.DiagnosticoElite.init());