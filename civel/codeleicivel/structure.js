/* =========================================================== */
/* === ARQUIVO: codeleicivel/structure.js (Visual Neural + Read AI) === */
/* === FUNÇÃO: Menu Mapa Mental, Logo Viva e Footer === */
/* =========================================================== */

(function() {
    console.log("💎 [Structure] Iniciando Arquitetura Neural...");

    // 1. MAPA DO IMPÉRIO (LINKS)
    const links = {
        home: "index.html",
        blindagem: "blindagem-patrimonial.html",
        bancario: "bancario-juros.html",
        familia: "familia-sucessoes.html",
        execucao: "execucao-cobranca.html",
        seguros: "seguros-indenizacao.html",
        erro_medico: "erro-medico.html",
        contratos: "contratos-negocios.html",
        acidentes: "acidentes-transito.html",
        golpe_pix: "golpe-pix-civel.html",
        rmc_consignado: "rmc-consignado-civel.html",
        bets: "bets-civel.html",
        reajuste_plano: "reajuste-plano-saude-civel.html",
        usucapiao: "usucapiao-civel.html",
        superendividamento: "superendividamento-civel.html",

        // REGIÕES
        sabara: "sabara-civel.html",
        belo_horizonte: "belohorizonte-civel.html",
        
        // ÁREA VIP
        painel: "painel-cliente.html",
        sala: "sala-reuniao.html",
        cadastro: "cadastro-cliente.html",

        // CRIMINAL
        criminal_site: "https://lucassemim.adv.br"
    };

    // 2. HTML DO HEADER (ESTRUTURA)
    // Alteração Principal: Adição da classe 'btn-agenda-ia' no botão de Agenda
    const headerHTML = `
        <div class="container-platinum">
            <a href="${links.home}" class="logo-civel-quantum">
                <span class="logo-top">LUCAS SEMIM</span>
                <span class="logo-bottom">ADVOCACIA PATRIMONIAL</span>
            </a>

            <nav class="nav-platinum d-none d-lg-flex">
                
                <div class="dropdown-plat">
                    <a href="#" class="link-platinum">PATRIMÔNIO ▾</a>
                    <div class="dropdown-menu-plat">
                        <div class="menu-connector"></div> <a href="${links.blindagem}"><span class="branch">├─</span> 🏛️ Holding & Blindagem</a>
                        <a href="${links.execucao}"><span class="branch">├─</span> 💰 Recuperação de Ativos</a>
                        <a href="${links.contratos}"><span class="branch">└─</span> ✒️ Contratos & Negócios</a>
                    </div>
                </div>

                <div class="dropdown-plat">
                    <a href="#" class="link-platinum">DIREITOS ▾</a>
                    <div class="dropdown-menu-plat">
                        <div class="menu-connector"></div>
                        <a href="${links.bancario}"><span class="branch">├─</span> 🏦 Direito Bancário</a>
                        <a href="${links.seguros}"><span class="branch">├─</span> 🛡️ Seguros & Indenizações</a>
                        <a href="${links.erro_medico}"><span class="branch">├─</span> 🏥 Erro Médico</a>
                        <a href="${links.acidentes}"><span class="branch">├─</span> 🚗 Acidente de Trânsito</a>
                        <a href="${links.golpe_pix}"><span class="branch">├─</span> 📲 Golpe do Pix</a>
                        <a href="${links.rmc_consignado}"><span class="branch">├─</span> 🧓 Cartão RMC / Consignado</a>
                        <a href="${links.bets}"><span class="branch">├─</span> 🎰 Bets / Casas de Apostas</a>
                        <a href="${links.reajuste_plano}"><span class="branch">├─</span> 🏥 Reajuste de Plano de Saúde</a>
                        <a href="${links.usucapiao}"><span class="branch">├─</span> 🏡 Usucapião</a>
                        <a href="${links.superendividamento}"><span class="branch">└─</span> 📉 Superendividamento</a>
                    </div>
                </div>

                <a href="${links.familia}" class="link-platinum">FAMÍLIA</a>

                <div class="dropdown-plat">
                    <a href="#" class="link-platinum">REGIÕES ▾</a>
                    <div class="dropdown-menu-plat">
                        <div class="menu-connector"></div>
                        <a href="${links.sabara}"><span class="branch">├─</span> 📍 Sabará</a>
                        <a href="${links.belo_horizonte}"><span class="branch">└─</span> 📍 Belo Horizonte</a>
                    </div>
                </div>

                <div class="dropdown-plat">
                    <a href="#" class="link-platinum link-vip">ÁREA VIP ▾</a>
                    <div class="dropdown-menu-plat vip-menu-bg">
                        <div class="menu-connector gold-line"></div>
                        <a href="${links.painel}"><span class="branch gold">├─</span> 🔐 Painel do Cliente</a>
                        <a href="${links.sala}"><span class="branch gold">├─</span> 📹 Sala de Reunião</a>
                        <a href="${links.cadastro}"><span class="branch gold">└─</span> 📝 Novo Cadastro</a>
                    </div>
                </div>
                
                <a href="${links.criminal_site}" class="link-platinum link-criminal">CRIMINAL ↗</a>
            </nav>

            <div class="mobile-toggle d-lg-none" onclick="window.toggleMobileMenu()">
                <span></span><span></span><span></span>
            </div>

            <a href="https://wa.me/5531989420094" class="btn-platinum d-none d-md-inline-block btn-agenda-ia">
                AGENDA IA
            </a>
        </div>

        <div id="mobile-menu-overlay">
            <span class="close-mobile" onclick="window.toggleMobileMenu()">✕</span>
            <nav class="mobile-nav-content">
                <a href="${links.home}" class="mob-link">Início</a>
                
                <div class="mob-divider">ÁREAS DE ATUAÇÃO</div>
                <a href="${links.blindagem}" class="mob-sub">└ Holding Familiar</a>
                <a href="${links.familia}" class="mob-sub">└ Família & Sucessões</a>
                <a href="${links.bancario}" class="mob-sub">└ Direito Bancário</a>
                <a href="${links.acidentes}" class="mob-sub">└ Acidente de Trânsito</a>
                <a href="${links.golpe_pix}" class="mob-sub">└ Golpe do Pix</a>
                <a href="${links.rmc_consignado}" class="mob-sub">└ Cartão RMC / Consignado</a>
                <a href="${links.bets}" class="mob-sub">└ Bets / Casas de Apostas</a>
                <a href="${links.reajuste_plano}" class="mob-sub">└ Reajuste de Plano de Saúde</a>
                <a href="${links.usucapiao}" class="mob-sub">└ Usucapião</a>
                <a href="${links.superendividamento}" class="mob-sub">└ Superendividamento</a>
                <a href="${links.sabara}" class="mob-sub">└ Atuação em Sabará</a>
                <a href="${links.belo_horizonte}" class="mob-sub">└ Atuação em Belo Horizonte</a>
                
                <div class="mobile-vip-area">
                    <p>ACESSO RESTRITO</p>
                    <a href="${links.painel}">🔐 Painel do Cliente</a>
                    <a href="${links.sala}">📹 Sala de Reunião</a>
                </div>

                <a href="${links.criminal_site}" class="btn-criminal-mob">Ir para Site Criminal</a>
            </nav>
        </div>
    `;

    // 3. HTML DO FOOTER
    const footerHTML = `
        <div class="container">
            <div class="row gy-5">
                <div class="col-lg-4 text-center text-lg-start">
                    <div class="logo-footer">LUCAS SEMIM</div>
                    <p class="footer-desc">
                        Arquitetura jurídica de alto padrão. Proteção patrimonial, sucessão e negócios com sigilo absoluto.
                    </p>
                    <p class="oab-footer">OAB/MG 222.539</p>
                </div>
                <div class="col-lg-2 col-6">
                    <h4 class="footer-head">Soluções</h4>
                    <ul class="footer-list">
                        <li><a href="${links.blindagem}">Holding</a></li>
                        <li><a href="${links.familia}">Família</a></li>
                        <li><a href="${links.bancario}">Bancário</a></li>
                        <li><a href="${links.acidentes}">Acidente de Trânsito</a></li>
                        <li><a href="${links.golpe_pix}">Golpe do Pix</a></li>
                        <li><a href="${links.rmc_consignado}">Cartão RMC / Consignado</a></li>
                        <li><a href="${links.bets}">Bets / Apostas</a></li>
                        <li><a href="${links.reajuste_plano}">Reajuste Plano de Saúde</a></li>
                        <li><a href="${links.usucapiao}">Usucapião</a></li>
                        <li><a href="${links.superendividamento}">Superendividamento</a></li>
                    </ul>
                </div>
                <div class="col-lg-2 col-6">
                    <h4 class="footer-head">Cliente</h4>
                    <ul class="footer-list">
                        <li><a href="${links.painel}" style="color:#d4af37;">Login Painel</a></li>
                        <li><a href="${links.sala}">Sala Virtual</a></li>
                        <li><a href="${links.cadastro}">Cadastre-se</a></li>
                    </ul>
                </div>
                <div class="col-lg-4 text-center text-lg-end">
                    <h4 class="footer-head">Atendimento</h4>
                    <p class="footer-contact">📍 Atendimento Nacional</p>
                    <p class="footer-contact">📞 (31) 98942-0094</p>
                    <a href="https://wa.me/5531989420094" class="btn-platinum mt-3" style="display:inline-block;">INICIAR CONVERSA</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Lucas Semim Advocacia. Todos os direitos reservados.</p>
                <a href="${links.criminal_site}" class="back-criminal">Acessar Núcleo Criminal</a>
            </div>
        </div>
    `;

    // 4. INJEÇÃO DE CSS (DESIGN SYSTEM NEURAL)
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- HEADER FIXO --- */
        .header-civel-platinum {
            background: rgba(5, 5, 8, 0.95); backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding: 15px 0;
            position: fixed; top: 0; width: 100%; z-index: 9999;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8); transition: all 0.3s;
        }
        .container-platinum { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }

        /* --- LOGO OURO LÍQUIDO (Efeito Movimento) --- */
        .logo-civel-quantum { text-decoration: none; display: flex; flex-direction: column; justify-content: center; }
        .logo-top {
            font-family: 'Playfair Display', serif; font-weight: 800; font-size: 1.7rem; letter-spacing: 2px;
            /* O Gradiente Mágico */
            background: linear-gradient(110deg, #bf953f 20%, #fcf6ba 40%, #b38728 50%, #fcf6ba 60%, #bf953f 80%);
            background-size: 200% auto;
            -webkit-background-clip: text; background-clip: text; color: transparent;
            text-transform: uppercase; line-height: 1;
            animation: metal-shine 5s linear infinite; /* A luz passando */
            text-shadow: 0 0 2px rgba(0,0,0,0.5);
        }
        .logo-bottom {
            font-family: 'Teko', sans-serif; font-size: 0.85rem; color: #888; letter-spacing: 5px; 
            text-transform: uppercase; margin-top: 2px; display: inline-block; transition: 0.3s;
        }
        .logo-civel-quantum:hover .logo-bottom { color: #fff; letter-spacing: 6px; }
        
        @keyframes metal-shine { to { background-position: -200% center; } }

        /* --- NAV MAPA MENTAL --- */
        .nav-platinum { gap: 30px; align-items: center; display: flex; }
        .link-platinum { 
            color: #ccc; text-decoration: none; font-family: 'Lato'; font-size: 0.85rem; 
            text-transform: uppercase; letter-spacing: 1px; position: relative; transition: 0.3s; padding: 15px 0;
        }
        .link-platinum:hover { color: #d4af37; }
        .link-vip { color: #d4af37 !important; font-weight: bold; text-shadow: 0 0 10px rgba(212, 175, 55, 0.3); }

        /* DROPDOWN (ÁRVORE) */
        .dropdown-plat { position: relative; cursor: pointer; }
        .dropdown-menu-plat {
            display: none; position: absolute; top: 100%; left: -20px;
            background: #0b0b0b; border: 1px solid #333; border-left: 2px solid #d4af37; /* A base da árvore */
            min-width: 260px; padding: 10px 0 10px 10px; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.95); border-radius: 0 8px 8px 8px;
        }
        .dropdown-plat:hover .dropdown-menu-plat { display: block; animation: fadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        
        .dropdown-menu-plat a { 
            display: block; padding: 10px 15px; color: #aaa; text-decoration: none; 
            font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.2s;
            display: flex; align-items: center;
        }
        .dropdown-menu-plat a:hover { background: rgba(255,255,255,0.05); color: #fff; padding-left: 20px; }
        
        /* Galhos da Árvore */
        .branch { 
            color: #444; margin-right: 8px; font-family: 'Fira Code'; font-size: 1rem; 
        }
        .branch.gold { color: #d4af37; }
        .vip-menu-bg { background: linear-gradient(to bottom, #0b0b0b, #111); border-color: #d4af37; }

        /* --- BOTÃO AGENDA --- */
        .btn-platinum {
            border: 1px solid #d4af37; color: #d4af37; padding: 8px 30px;
            font-family: 'Teko'; font-size: 1.3rem; letter-spacing: 1px;
            text-decoration: none; transition: 0.3s; border-radius: 4px;
            background: linear-gradient(45deg, transparent 50%, rgba(212, 175, 55, 0.1) 100%);
            background-size: 200%;
        }
        .btn-platinum:hover { 
            background-position: 100%; color: #fff; 
            box-shadow: 0 0 25px rgba(212, 175, 55, 0.3); transform: scale(1.05); 
        }

        /* --- FOOTER --- */
        .footer-civel { background: #050505; border-top: 1px solid #222; padding: 80px 0 30px; color: #888; font-size: 0.9rem; margin-top: 80px; }
        .logo-footer { font-family: 'Playfair Display'; color: #fff; font-size: 2rem; margin-bottom: 15px; letter-spacing: 1px; }
        .footer-head { font-family: 'Teko'; color: #d4af37; font-size: 1.5rem; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; display: inline-block; padding-bottom: 5px; }
        .footer-list { list-style: none; padding: 0; }
        .footer-list li { margin-bottom: 12px; }
        .footer-list a { color: #999; text-decoration: none; transition: 0.2s; display:inline-block; }
        .footer-list a:hover { color: #d4af37; transform: translateX(5px); }
        .footer-bottom { margin-top: 60px; padding-top: 20px; border-top: 1px solid #222; text-align: center; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
        
        .back-criminal { 
            color: #555; text-decoration: none; font-size: 0.85rem; border: 1px solid #333; 
            padding: 5px 15px; border-radius: 50px; transition: 0.3s;
        }
        .back-criminal:hover { border-color: #e74c3c; color: #e74c3c; }

        /* --- MOBILE --- */
        .mobile-toggle { display: none; cursor: pointer; flex-direction: column; gap: 6px; }
        .mobile-toggle span { width: 35px; height: 2px; background: #d4af37; transition: 0.3s; }
        
        #mobile-menu-overlay {
            position: fixed; top: 0; right: 0; width: 100%; height: 100vh; 
            background: rgba(5,5,5,0.98); backdrop-filter: blur(15px);
            z-index: 10002; /* Maior que tudo */
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        #mobile-menu-overlay.active { transform: translateX(0); }
        
        .mobile-nav-content { display: flex; flex-direction: column; gap: 15px; text-align: left; width: 80%; padding-bottom: 100px; /* Espaço para barra inferior */ }
        .mob-link { font-family: 'Playfair Display'; color: #fff; font-size: 1.8rem; text-decoration: none; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .mob-divider { color: #d4af37; font-family: 'Teko'; font-size: 1.2rem; margin-top: 10px; }
        .mob-sub { color: #aaa; font-size: 1.1rem; text-decoration: none; margin-left: 15px; display: block; }
        
        .mobile-vip-area { border: 1px solid #d4af37; padding: 25px; border-radius: 12px; margin-top: 30px; text-align: center; }
        .mobile-vip-area p { color: #d4af37; font-family:'Teko'; font-size: 1.2rem; margin-bottom:15px; }
        .mobile-vip-area a { display: block; color: #fff; text-decoration: none; padding: 10px; border-bottom: 1px dashed #333; }
        
        .close-mobile { position: absolute; top: 30px; right: 30px; font-size: 3rem; color: #666; cursor: pointer; }

        @media(max-width: 991px) { .nav-platinum { display: none; } .mobile-toggle { display: flex; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // 5. FUNÇÃO DE INJEÇÃO
    function injectLayout() {
        const headerEl = document.getElementById('header-placeholder') || document.querySelector('header');
        const footerEl = document.getElementById('footer-placeholder') || document.querySelector('footer');

        if (headerEl) {
            headerEl.innerHTML = headerHTML;
            headerEl.className = ""; // Limpa classes antigas
            headerEl.classList.add('header-civel-platinum');
        }
        if (footerEl) {
            footerEl.innerHTML = footerHTML;
            footerEl.className = "";
            footerEl.classList.add('footer-civel');
        }

        // HIGHLIGHT PÁGINA ATUAL
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.link-platinum, .dropdown-menu-plat a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
                const parent = link.closest('.dropdown-plat');
                if (parent) parent.querySelector('.link-platinum').classList.add('active');
            }
        });
    }

    // 6. EXECUÇÃO IMEDIATA
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLayout);
    } else {
        injectLayout();
    }

    // FUNÇÃO GLOBAL MOBILE
    window.toggleMobileMenu = function() {
        const menu = document.getElementById('mobile-menu-overlay');
        if(menu) menu.classList.toggle('active');
    }

})();