/* =========================================================== */
/* === FICHEIRO: js/vcard-smart.js (VcardSmart V3) =========== */
/* === FUNÇÃO: Gera arquivo .vcf enriquecido com Web Share === */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.VcardSmart = {
  config: {
    contact: {
      fn:        'Dr. Lucas Semim | Criminalista 24h',
      firstName: 'Lucas',
      lastName:  'Semim',
      prefix:    'Dr.',
      title:     'Advogado Criminalista | OAB/MG 222.539',
      org:       'Lucas Semim Advocacia',
      tel:       '+5531989420094',
      email:     'contato@lucassemim.adv.br',
      site:      'https://lucassemim.adv.br',
      address:   'R. Cel. Abílio Pereira\\, 337;Sabará;MG;34575-020;Brasil',
      instagram: 'https://www.instagram.com/lucasrenansemim/',
      linkedin:  'https://www.linkedin.com/in/lucas-renan-a2a52910b/',
      whatsapp:  'https://wa.me/5531989420094',
      note:      'Plantão Criminal 24h | Sabará e Grande BH | Flagrante\\, Custódia\\, HC | OAB/MG 222.539',
      filename:  'Dr_Lucas_Semim_Plantao_24h.vcf'
    },
    // ATENÇÃO: nenhuma página do site hoje tem estes seletores no HTML,
    // e nenhum outro script (footer-seo.js, header-elite.js) os cria
    // dinamicamente — confirmado por busca em todo o site. Ou seja, o
    // botão "SALVAR NA AGENDA" nunca é injetado em lugar nenhum hoje.
    // Para ativar, adicione um elemento com uma destas classes/id no
    // HTML (ex.: no rodapé) onde o botão deve aparecer.
    targets: [
      '.footer-contact-card',
      '#container-vcard',
      '.vcard-inject'
    ],
    styleId:  'vcard-smart-styles',
    isDebug:  window.location.hostname !== 'lucassemim.adv.br'
  },

  state: { injected: false },

  init() {
    this.injectStyles();

    for (const selector of this.config.targets) {
      const containers = document.querySelectorAll(selector);
      containers.forEach(container => {
        if (!container.querySelector('.btn-vcard-elite')) {
          this.injectButton(container);
          this.state.injected = true;
        }
      });
    }

    if (this.config.isDebug) {
      console.log(`[VcardSmart V3] Botões injetados: ${this.state.injected}`);
    }
  },

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;
    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      /* === VcardSmart V3 === */
      .btn-vcard-elite {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; margin-top: 10px;
        background: transparent;
        border: 1px solid #d4af37; color: #d4af37;
        padding: 8px 16px; border-radius: 4px;
        cursor: pointer;
        font-family: 'Teko', sans-serif; font-size: 1.1rem; letter-spacing: 0.5px;
        transition: background 0.25s, color 0.25s, box-shadow 0.25s;
        -webkit-tap-highlight-color: transparent;
      }
      .btn-vcard-elite:hover,
      .btn-vcard-elite.btn-vcard-hover {
        background: #d4af37; color: #000;
        box-shadow: 0 4px 12px rgba(212,175,55,0.3);
      }
      .btn-vcard-elite:active { transform: scale(0.98); }
      .btn-vcard-elite:focus-visible { outline: 2px solid #d4af37; outline-offset: 3px; }

      @media (prefers-reduced-motion: reduce) {
        .btn-vcard-elite { transition: none; }
      }

      .vcard-toast {
        position: fixed;
        bottom: 24px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #d4af37; color: #000;
        font-family: 'Lato', sans-serif; font-weight: 700; font-size: 0.95rem;
        padding: 12px 28px; border-radius: 8px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        z-index: 99999; white-space: nowrap;
        opacity: 0;
        transition: opacity 0.35s ease, transform 0.35s ease;
        pointer-events: none;
      }
      .vcard-toast.vcard-toast-visible {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }
      @media (prefers-reduced-motion: reduce) {
        .vcard-toast { transition: none; opacity: 1; transform: translateX(-50%); }
      }

      @media (max-width: 768px) {
        .vcard-toast {
          bottom: calc(90px + env(safe-area-inset-bottom, 0px));
        }
      }
    `;
    document.head.appendChild(style);
  },

  buildButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-vcard-elite';
    btn.setAttribute('aria-label', 'Salvar contato do Dr. Lucas Semim na agenda do celular');

    const icon = document.createElement('i');
    icon.className = 'fas fa-address-card';
    icon.setAttribute('aria-hidden', 'true');

    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' SALVAR NA AGENDA'));

    btn.addEventListener('mouseenter', () => btn.classList.add('btn-vcard-hover'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('btn-vcard-hover'));
    btn.addEventListener('click', () => this.download());
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.download();
      }
    });

    return btn;
  },

  injectButton(container) {
    const btn = this.buildButton();
    const hr = container.querySelector('hr');
    if (hr) {
      container.insertBefore(btn, hr);
    } else {
      container.appendChild(btn);
    }
  },

  generateVcf() {
    const c = this.config.contact;
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${c.fn}`,
      `N:${c.lastName};${c.firstName};;${c.prefix};`,
      `TITLE:${c.title}`,
      `ORG:${c.org}`,
      `TEL;TYPE=CELL,PREF:${c.tel}`,
      `TEL;TYPE=WORK:${c.tel}`,
      `EMAIL;TYPE=INTERNET,PREF:${c.email}`,
      `URL;TYPE=WORK:${c.site}`,
      `ADR;TYPE=WORK:;;${c.address}`,
      `NOTE:${c.note}`,
      `CATEGORIES:Advogado,Criminalista,Emergência 24h`,
      `X-SOCIALPROFILE;TYPE=Instagram:${c.instagram}`,
      `X-SOCIALPROFILE;TYPE=LinkedIn:${c.linkedin}`,
      `X-SOCIALPROFILE;TYPE=WhatsApp:${c.whatsapp}`,
      `REV:${new Date().toISOString().split('.')[0]}Z`,
      'END:VCARD'
    ];
    return lines.join('\r\n');
  },

  async download() {
    try {
      const vcfContent = this.generateVcf();
      const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });

      const shared = await this.tryWebShare(blob);

      if (!shared) {
        this.triggerDownload(blob);
        this.showToast('📇 Contato salvo! Abra o arquivo para adicionar à agenda.');
      }

      this.trackEvent('vcard_action', shared ? 'share' : 'download');
    } catch (error) {
      if (this.config.isDebug) console.error('[VcardSmart] Erro no download:', error);
    }
  },

  async tryWebShare(blob) {
    const c = this.config.contact;
    try {
      const file = new File([blob], c.filename, { type: 'text/vcard' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: c.fn,
          text: `Salve o contato de ${c.fn} — Plantão Criminal 24h em Sabará/BH`
        });
        this.showToast('📇 Contato compartilhado com sucesso!');
        return true;
      }
    } catch (err) {
      if (this.config.isDebug && err.name !== 'AbortError') {
        console.warn('[VcardSmart] Web Share falhou:', err.message);
      }
    }
    return false;
  },

  triggerDownload(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.config.contact.filename;
    a.setAttribute('aria-hidden', 'true');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },

  showToast(msg) {
    const existing = document.getElementById('vcard-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'vcard-toast';
    toast.className = 'vcard-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('vcard-toast-visible'));
    });

    setTimeout(() => {
      toast.classList.remove('vcard-toast-visible');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  },

  trackEvent(action, method) {
    try {
      // Usa window.gtag explicitamente (mesmo padrão defensivo já
      // aplicado em ads-intelligence.js), em vez de uma referência
      // solta a "gtag" que dependeria de uma variável global implícita.
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', action, {
        event_category: 'VCard',
        event_label: `${action}_${method}`,
        metodo: method,
        pagina_origem: window.location.pathname,
        campanha: new URLSearchParams(window.location.search).get('utm_campaign') || 'organico'
      });
    } catch { }
  }
};

document.addEventListener('DOMContentLoaded', () => window.VcardSmart.init());