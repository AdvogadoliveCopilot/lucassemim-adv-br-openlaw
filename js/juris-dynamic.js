/* =========================================================== /
/ === ARQUIVO: js/juris-dynamic.js (JurisDynamic V3) ======== /
/ === FUNÇÃO: Injetar Jurisprudência do STJ/STF na Sidebar == /
/ === DATA: 11/06/2026                                    === /
/ =========================================================== */

window.JurisDynamic = {
config: {
whatsapp: 'https://wa.me/5531989420094',
sidebarSelectors: [
'aside',
'.sidebar',
'#sidebar',
'.col-sidebar',
'[data-sidebar]',
'.widget-area',
'.sidebar-container'
],
db: [
{
tags: ['flagrante', 'preso em flagrante', 'auto de prisão', 'delegacia', 'lavratura'],
tribunal: 'STJ — Jurisprudência',
titulo: 'Nulidade do Flagrante sem Testemunhas Idôneas',
texto: 'O auto de prisão em flagrante lavrado sem testemunhas idôneas — ou com policiais como únicas testemunhas em crime cometido fora de área pública — é nulo, devendo ser relaxado pelo juiz na audiência de custódia.',
fonte: 'STJ — Habeas Corpus consolidado',
ctaMsg: 'Familiar preso em flagrante. Preciso analisar a legalidade da prisão agora.'
},
{
tags: ['audiência de custódia', 'custódia', 'apresentação', '24 horas', 'cnj 213'],
tribunal: 'CNJ — Res. 213/2015 + CPP art. 310',
titulo: 'Audiência de Custódia é Direito Irrenunciável',
texto: 'A apresentação do preso ao juiz em até 24 horas é obrigatória (Res. CNJ 213/2015). A ausência da audiência de custódia configura nulidade absoluta, podendo resultar em relaxamento da prisão. Maus-tratos devem ser registrados em ata.',
fonte: 'Resolução CNJ 213/2015 + STJ',
ctaMsg: 'Familiar com audiência de custódia hoje. Preciso de defesa urgente.'
},
{
tags: ['habeas corpus', 'hc', 'liminar', 'trancamento', 'justa causa', 'ilegalidade'],
tribunal: 'STJ / STF — Jurisprudência',
titulo: 'HC Trancativo por Falta de Justa Causa',
texto: 'O habeas corpus é cabível para trancar ação penal quando manifesta a atipicidade da conduta, ausência de indícios mínimos de autoria ou materialidade, ou quando a denúncia é inepta por falta de individualização da conduta do acusado.',
fonte: 'STJ — Sexta Turma / STF',
ctaMsg: 'Preciso impetrar habeas corpus urgente. Meu caso tem ilegalidade clara.'
},
{
tags: ['prisão preventiva', 'preventiva', 'decreto de prisão', 'art. 312', 'segregação cautelar', 'preso preventivo'],
tribunal: 'CPP art. 312 + STJ',
titulo: 'Preventiva Exige Fundamentação Concreta',
texto: 'A prisão preventiva não pode ser decretada com base em fórmulas genéricas ou gravidade abstrata do delito. O art. 312 do CPP exige fundamentação concreta em fatos do caso. A Lei 13.964/2019 impõe revisão periódica obrigatória a cada 90 dias.',
fonte: 'CPP art. 312 + Pacote Anticrime (Lei 13.964/2019)',
ctaMsg: 'Familiar preso preventivamente. Quero contestar a prisão com habeas corpus.'
},
{
tags: ['tráfico', 'tráfico de drogas', 'entorpecentes', 'lei de drogas', '11.343', 'art. 33', 'privilegiado'],
tribunal: 'STJ / STF — Tese Pacificada',
titulo: 'Tráfico Privilegiado: Pena Pode Ser Reduzida em até 2/3',
texto: 'O §4º do art. 33 da Lei 11.343/2006 permite redução de 1/6 a 2/3 para réu primário, de bons antecedentes, que não se dedique a atividades criminosas nem integre organização criminosa. O STF fixou que tráfico privilegiado NÃO é crime hediondo (RE 672.029/RG).',
fonte: 'STF — RE 672.029 / STJ — EResp 1.619.087',
ctaMsg: 'Preso por tráfico. Quero saber se tenho direito ao tráfico privilegiado.'
},
{
tags: ['porte de drogas', 'uso pessoal', 'usuário', 'art. 28', 'descriminalização', 'quantidade'],
tribunal: 'STF — RE 635.659 (Repercussão Geral)',
titulo: 'STF: Porte para Uso Pessoal Não é Crime',
texto: 'O STF declarou inconstitucional a criminalização do porte de drogas para uso pessoal (RE 635.659). A distinção entre uso e tráfico deve considerar quantidade, local, circunstâncias e histórico — não há critério objetivo de gramas. A qualificação depende de prova, não de presunção.',
fonte: 'STF — RE 635.659 — Repercussão Geral',
ctaMsg: 'Fui preso com drogas. Quero discutir se é uso pessoal ou tráfico.'
},
{
tags: ['execução penal', 'progressão de regime', 'seeu', 'reincidência', 'cálculo de pena', 'stj', 'tema 1172'],
tribunal: 'STJ — Tema 1172 & Tema 1084',
titulo: 'Progressão em Hediondo: 40%, Não 60%',
texto: 'A reincidência genérica em crime hediondo exige apenas 40% de cumprimento de pena para progressão, e não 60%. O aumento superior a 1/6 pela reincidência específica exige fundamentação concreta sobre os antecedentes — não é automático.',
fonte: 'STJ — Tema 1172 e Tema 1084',
ctaMsg: 'Familiar preso. Quero verificar se tem direito à progressão de regime.'
},
{
tags: ['saidinha', 'saída temporária', 'lei 14.843', 'páscoa', 'natal', 'dia das mães', 'execução penal'],
tribunal: 'STF — Repercussão Geral',
titulo: 'Lei 14.843/2024 Não Retroage para Crimes Anteriores',
texto: 'A lei penal mais gravosa não pode retroagir para atingir crimes cometidos antes de sua vigência (art. 5º, XL, CF/88). O benefício da saída temporária consolidado antes da Lei 14.843/2024 é direito adquirido do condenado.',
fonte: 'Supremo Tribunal Federal + CF/88 art. 5º, XL',
ctaMsg: 'Familiar perdeu a saidinha com a nova lei. Quero entrar com recurso.'
},
{
tags: ['tornozeleira', 'monitoramento eletrônico', 'descarga', 'bateria', 'violação', 'revogação'],
tribunal: 'STJ — HC 978.495/MG e HC 893.030/SP',
titulo: 'Descarga de Bateria Não Gera Revogação Automática',
texto: 'A violação do monitoramento eletrônico por descarga da bateria, sem comprovação de dolo ou culpa do monitorado, não autoriza automaticamente a revogação da liberdade. O STJ exige análise das circunstâncias concretas e apresentação de defesa prévia.',
fonte: 'STJ — HC 978.495/MG / HC 893.030/SP',
ctaMsg: 'Tornozeleira descarregou. Preciso de defesa urgente para não ser preso.'
},
{
tags: ['júri', 'tribunal do júri', 'homicídio', 'feminicídio', 'latrocínio', 'quesitos', 'plenário'],
tribunal: 'CF/88 art. 5º, XXXVIII + CPP',
titulo: 'Soberania do Júri e Nulidades no Plenário',
texto: 'O Tribunal do Júri tem soberania constitucional nos veredictos, mas nulidades absolutas do plenário — como cerceamento de defesa, questão de ordem não apreciada, ou produção de prova ilícita — autorizam a anulação pelo Tribunal de Justiça e realização de novo júri.',
fonte: 'CF/88 art. 5º, XXXVIII / CPP art. 564',
ctaMsg: 'Tenho julgamento no Júri. Preciso de defesa especializada urgente.'
},
{
tags: ['gaeco', 'organização criminosa', 'ocrim', 'lei 12.850', 'operação policial', 'associação criminosa', 'extorsão', 'propina'],
tribunal: 'STJ — Jurisprudência / Lei 12.850/2013',
titulo: 'Denúncia Genérica em OCRIM é Inepta',
texto: 'A Lei 12.850/2013 exige ao menos 4 pessoas e estrutura ordenada para configurar organização criminosa. A denúncia deve individualizar a conduta de cada acusado. A "pesca de arrasto" do MP, sem individualização, gera nulidade absoluta por inépcia.',
fonte: 'STJ — Sexta Turma / Lei 12.850/2013 art. 1º',
ctaMsg: 'Investigado ou indiciado em operação do GAECO. Preciso de defesa imediata.'
},
{
tags: ['delação premiada', 'colaboração premiada', 'acordo', 'colar', 'testemunha', 'corréu'],
tribunal: 'STJ / STF — Jurisprudência',
titulo: 'Delação de Corréu Não é Prova Suficiente',
texto: 'A colaboração premiada é meio de obtenção de prova, não prova em si. O STJ e o STF consolidaram que a delação de corréu isolada, sem corroboração em outros elementos probatórios, não serve como fundamento exclusivo para condenação (nemo tenetur se detegere).',
fonte: 'STJ — Sexta Turma / STF — jurisprudência consolidada',
ctaMsg: 'Fui delatado por corréu. Preciso de defesa contra delação premiada.'
},
{
tags: ['maria da penha', 'violência doméstica', 'falsa acusação', 'medida protetiva', 'divórcio', 'lesão corporal doméstica'],
tribunal: 'STJ — Terceira Turma',
titulo: 'Medida Protetiva Não Pode Ser Instrumento de Coação',
texto: 'As medidas protetivas de urgência da Lei 11.340/2006 não podem ser utilizadas como instrumento de coação patrimonial em disputas de Varas de Família. A denúncia falsa gera responsabilidade criminal (art. 339 do CP) e civil, e o acusado tem direito à prova da falsidade.',
fonte: 'STJ — Terceira Turma / Lei 11.340/2006',
ctaMsg: 'Fui acusado falsamente por violência doméstica. Preciso de defesa urgente.'
},
{
tags: ['furto', 'furto simples', 'princípio da insignificância', 'bagatela', 'atipicidade material', 'furto famélico'],
tribunal: 'STF — HC 84.412 / STJ',
titulo: 'Princípio da Insignificância Exclui o Crime',
texto: 'O princípio da insignificância (bagatela) exclui a tipicidade material da conduta quando presentes: mínima ofensividade, ausência de periculosidade social, reduzido grau de reprovabilidade e inexpressividade da lesão jurídica. A reincidência, por si só, não impede a aplicação do princípio.',
fonte: 'STF — HC 84.412 / STJ — jurisprudência',
ctaMsg: 'Preso por furto de pequeno valor. Quero aplicar o princípio da insignificância.'
},
{
tags: ['roubo', 'roubo circunstanciado', 'latrocínio', 'grave ameaça', 'concurso de agentes', 'arma de fogo'],
tribunal: 'STJ — Jurisprudência Consolidada',
titulo: 'Roubo: Causas de Aumento Exigem Comprovação',
texto: 'A majorante de "emprego de arma de fogo" no roubo (art. 157, §2º-A, I, CP) exige que o instrumento seja apreendido e periciado OU que sua eficiência lesiva seja provada por outros meios. O simples testemunho policial não é suficiente para essa qualificadora.',
fonte: 'STJ — Quinta e Sexta Turmas / Súmula 443',
ctaMsg: 'Acusado de roubo. Quero analisar as qualificadoras com advogado especializado.'
},
{
tags: ['crime informático', 'invasão de dispositivo', 'hacker', 'estelionato digital', 'pix', 'fraude eletrônica', 'lei carolina dieckmann'],
tribunal: 'Lei 12.737/2012 + Marco Civil',
titulo: 'Crimes Digitais Exigem Laudo Pericial Especializado',
texto: 'Crimes informáticos (Lei 12.737/2012) dependem de prova pericial específica nos dispositivos. O Marco Civil da Internet (Lei 12.965/2014) exige ordem judicial para quebra de sigilo de dados e logs — provas obtidas sem autorização judicial são ilícitas.',
fonte: 'Lei 12.737/2012 / Marco Civil art. 22 / STJ',
ctaMsg: 'Investigado por crime digital. Preciso verificar a legalidade das provas.'
},
{
tags: ['estelionato', 'fraude', 'golpe', 'cheque', 'representação', 'ação penal condicionada'],
tribunal: 'CP art. 171 + Lei 13.964/2019',
titulo: 'Estelionato Exige Representação da Vítima (Regra Geral)',
texto: 'Com o Pacote Anticrime (Lei 13.964/2019), o estelionato (art. 171 do CP) passou a ser, em regra, de ação penal pública condicionada à representação da vítima. Sem representação tempestiva, a ação penal é extinta — exceto quando praticado contra a Administração Pública ou pessoa vulnerável.',
fonte: 'CP art. 171, §5º + Lei 13.964/2019',
ctaMsg: 'Processado por estelionato. Quero verificar se a ação penal é legal.'
},
{
tags: ['legítima defesa', 'excludente de ilicitude', 'estado de necessidade', 'legitima defesa putativa', 'excesso'],
tribunal: 'CP art. 23 + Doutrina / STF',
titulo: 'Legítima Defesa: Moderação é Questão de Prova',
texto: 'A legítima defesa (art. 23, II, CP) exige agressão injusta, atual ou iminente, direito próprio ou alheio e uso moderado dos meios disponíveis. A legítima defesa putativa (erro sobre excludente) afasta a culpabilidade. O excesso, se involuntário (art. 23, §único), pode excluir o dolo.',
fonte: 'CP art. 23, II e §único / STF',
ctaMsg: 'Fui preso por legítima defesa. Quero discutir o caso com advogado especializado.'
},
{
tags: ['lei seca', 'bafômetro', 'blitz', 'etilômetro', 'recusa', 'embriaguez ao volante', 'cnh', 'art. 306'],
tribunal: 'STJ / CTB art. 277',
titulo: 'Recusa ao Bafômetro: Sinais Clínicos São Obrigatórios',
texto: 'A mera recusa ao etilômetro não configura automaticamente embriaguez ao volante (art. 306 do CTB). A abordagem policial deve documentar sinais visíveis de alteração (hálito, comportamento, dificuldade motora) no Auto de Infração. Sem essa fundamentação, o auto é nulo.',
fonte: 'CTB art. 277 / STJ — jurisprudência',
ctaMsg: 'Abordado na lei seca. Quero verificar se o auto de infração tem vícios.'
},
{
tags: ['abordagem policial', 'fundada suspeita', 'busca pessoal', 'art. 244', 'ilegalidade', 'cerceamento'],
tribunal: 'STJ — Jurisprudência / CPP art. 244',
titulo: 'Busca Pessoal Sem Fundada Suspeita é Ilegal',
texto: 'A busca pessoal (CPP art. 244) exige fundada suspeita individualizada — não basta "área de risco" ou "atitude suspeita" genérica. Provas obtidas em busca ilegal são ilícitas (art. 157 do CPP) e devem ser desentranhadas dos autos, podendo levar ao trancamento da ação.',
fonte: 'CPP art. 244 + STJ — jurisprudência',
ctaMsg: 'Preso após abordagem policial. Quero verificar se a busca foi legal.'
},
{
tags: ['nulidade processual', 'nulidade', 'cerceamento de defesa', 'contraditório', 'ampla defesa', 'intimação'],
tribunal: 'CPP art. 563 + STJ',
titulo: 'Nulidade Sem Prejuízo Não é Reconhecida',
texto: 'O sistema de nulidades do CPP adota o princípio pas de nullité sans grief: não se pronuncia nulidade sem demonstração de prejuízo concreto à defesa. Porém, nulidades absolutas (como ausência de defensor, falta de citação e incompetência absoluta) independem de demonstração de prejuízo.',
fonte: 'CPP art. 563 / STJ — Súmula 523 STF',
ctaMsg: 'Tenho nulidade processual no meu caso. Quero análise urgente do advogado.'
},
{
tags: ['progressão', 'regime semiaberto', 'regime aberto', 'bom comportamento', 'atestado', 'mérito'],
tribunal: 'LEP art. 112 + STJ',
titulo: 'Progressão de Regime: Requisito Objetivo e Subjetivo',
texto: 'A progressão de regime exige cumprimento de fração da pena (1/6 para não reincidentes em crimes comuns) e bom comportamento carcerário (requisito subjetivo). A negativa baseada apenas em "gravidade do crime" sem fundamentação concreta é ilegal e cabe HC.',
fonte: 'LEP art. 112 / STJ — jurisprudência',
ctaMsg: 'Familiar tem direito à progressão de regime. Preciso de petição urgente.'
},
{
tags: ['detração', 'tempo preso', 'prisão provisória', 'cálculo', 'remição', 'trabalho'],
tribunal: 'CP art. 42 + LEP',
titulo: 'Detração: Todo Tempo Preso Deve Ser Computado',
texto: 'O art. 42 do CP garante ao condenado o desconto de todo o tempo em que ficou preso provisoriamente (preventiva, flagrante, habeas corpus negado). A não realização da detração é ilegalidade sanável a qualquer tempo, inclusive por HC.',
fonte: 'CP art. 42 / LEP / STJ',
ctaMsg: 'Familiar ficou preso preventivamente. Preciso calcular a detração penal.'
},
{
tags: ['tentativa', 'iter criminis', 'desistência voluntária', 'arrependimento eficaz', 'crime consumado'],
tribunal: 'CP art. 14, II + STJ',
titulo: 'Tentativa Pune Menos — Desistência Exclui o Crime',
texto: 'A tentativa (CP art. 14, II) reduz a pena de 1 a 2/3 em relação ao crime consumado. A desistência voluntária e o arrependimento eficaz (art. 15) excluem a responsabilidade pelo crime tentado, respondendo o agente apenas pelos atos praticados (crime-meio).',
fonte: 'CP art. 14 e 15 / STJ',
ctaMsg: 'Acusado por crime que não se consumou. Quero discutir tentativa ou desistência.'
},
{
tags: ['default'],
tribunal: 'STF — CF/88 art. 5º, LV',
titulo: 'Contraditório e Ampla Defesa São Invioláveis',
texto: 'Ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória (art. 5º, LVII, CF/88). O contraditório e a ampla defesa, com os meios e recursos a ela inerentes, são garantias constitucionais que nenhuma lei pode suprimir.',
fonte: 'Constituição Federal, art. 5º, LV e LVII',
ctaMsg: 'Preciso de defesa criminal urgente. Quero falar com o Dr. Lucas Semim agora.'
}
]
},

state: {
match: null,
cardEl: null,
reducedMotion: false
},

init() {
this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ctx = this.buildPageContext();
this.state.match = this.findBestMatch(ctx);

this.injectStyles();

const card = this.buildCard(this.state.match);
this.state.cardEl = card;

const sidebar = this.findSidebar();
if (sidebar) {
  sidebar.insertBefore(card, sidebar.firstChild);
  this.initReveal(card);
  this.trackEvent('juris_card_shown', this.state.match.tribunal);
}

if (location.hostname !== 'lucassemim.adv.br') {
  console.log(`[JurisDynamic V3] Match: "${this.state.match.titulo}" (ctx: ${ctx.slice(0, 80)}...)`);
}
},

buildPageContext() {
try {
const h2s = [...document.querySelectorAll('article h2, .post-content h2, main h2')]
.slice(0, 5).map(h => h.textContent).join(' ');
const tags = document.querySelector('[data-tags], .post-tags, .article-tags')?.textContent || '';

  return [
    window.location.pathname,
    document.title,
    document.querySelector('meta[name="keywords"]')?.content || '',
    document.querySelector('meta[name="description"]')?.content || '',
    document.querySelector('h1')?.textContent || '',
    h2s,
    tags
  ].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
} catch {
  return document.title.toLowerCase();
}
},

scoreMatch(item, ctx) {
if (item.tags.includes('default')) return -1;
return item.tags.reduce((score, tag) => {
const tagNorm = tag.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
if (!ctx.includes(tagNorm)) return score;
return score + Math.max(1, Math.floor(tagNorm.length / 4));
}, 0);
},

findBestMatch(ctx) {
let best = null;
let bestScore = 0;
for (const item of this.config.db) {
const score = this.scoreMatch(item, ctx);
if (score > bestScore) {
best = item;
bestScore = score;
}
}
return best || this.config.db.find(i => i.tags.includes('default'));
},

injectStyles() {
if (document.getElementById('juris-dynamic-styles')) return;
const style = document.createElement('style');
style.id = 'juris-dynamic-styles';
style.textContent = /* === JurisDynamic V3 === */ .juris-card-elite { background: rgba(15,15,15,0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(212,175,55,0.2); border-left: 4px solid #d4af37; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transition: border-color 0.3s, transform 0.3s; opacity: 0; transform: translateY(12px); } .juris-card-elite.juris-visible { opacity: 1; transform: translateY(0); transition: opacity 0.5s ease, transform 0.4s ease, border-color 0.3s, box-shadow 0.3s; } @media (prefers-reduced-motion: reduce) { .juris-card-elite { opacity: 1; transform: none; transition: none; } } .juris-card-elite:hover { border-color: rgba(212,175,55,0.5); transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.6); } .juris-header-elite { font-family: 'Teko', sans-serif; color: #fff; font-size: 1.4rem; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; } .juris-tribunal-badge { display: inline-block; background: rgba(255,255,255,0.1); color: #ccc; font-family: 'Lato', sans-serif; font-size: 0.75rem; font-weight: bold; padding: 4px 10px; border-radius: 4px; margin-bottom: 15px; letter-spacing: 1px; text-transform: uppercase; } .juris-title-elite { color: #d4af37; font-family: 'Lato', sans-serif; font-style: italic; font-size: 1.1rem; margin-bottom: 15px; line-height: 1.4; } .juris-text-box { position: relative; padding-left: 15px; border-left: 2px solid rgba(255,255,255,0.1); margin-bottom: 15px; } .juris-quote-icon { position: absolute; top: -5px; left: -10px; color: rgba(212,175,55,0.2); font-size: 1.5rem; } .juris-text-elite { color: #aaa; font-size: 0.9rem; line-height: 1.65; margin: 0; font-family: 'Lato', sans-serif; } .juris-footer-elite { text-align: right; color: #555; font-family: 'Lato', sans-serif; font-size: 0.78rem; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; margin-bottom: 14px; } .juris-cta-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #128c7e, #075e54); color: #fff; text-decoration: none; font-family: 'Teko', sans-serif; font-size: 1.1rem; letter-spacing: 0.5px; text-transform: uppercase; padding: 10px 16px; border-radius: 6px; transition: opacity 0.2s, transform 0.15s; box-shadow: 0 3px 12px rgba(18,140,126,0.3); } .juris-cta-btn:hover { opacity: 0.9; transform: translateY(-1px); color: #fff; } .juris-cta-btn:focus-visible { outline: 2px solid #25d366; outline-offset: 3px; };
document.head.appendChild(style);
},

buildCard(item) {
const card = document.createElement('div');
card.className = 'juris-card-elite';

const header = document.createElement('div');
header.className = 'juris-header-elite';
const headerIcon = document.createElement('i');
headerIcon.className = 'fas fa-balance-scale';
headerIcon.setAttribute('aria-hidden', 'true');
header.appendChild(headerIcon);
header.appendChild(document.createTextNode(' PRECEDENTE DE DEFESA'));

const badge = document.createElement('div');
badge.className = 'juris-tribunal-badge';
badge.textContent = item.tribunal;

const title = document.createElement('h5');
title.className = 'juris-title-elite';
title.textContent = `"${item.titulo}"`;

const textBox = document.createElement('div');
textBox.className = 'juris-text-box';
const quoteIcon = document.createElement('i');
quoteIcon.className = 'fas fa-quote-left juris-quote-icon';
quoteIcon.setAttribute('aria-hidden', 'true');
const textP = document.createElement('p');
textP.className = 'juris-text-elite';
textP.textContent = item.texto;
textBox.appendChild(quoteIcon);
textBox.appendChild(textP);

const footer = document.createElement('div');
footer.className = 'juris-footer-elite';
const sourceSpan = document.createElement('span');
sourceSpan.textContent = `FONTE: ${item.fonte}`;
footer.appendChild(sourceSpan);

const cta = this.buildCTA(item);

card.appendChild(header);
card.appendChild(badge);
card.appendChild(title);
card.appendChild(textBox);
card.appendChild(footer);
card.appendChild(cta);

return card;
},

buildCTA(item) {
const msg = item.ctaMsg || 'Preciso de defesa criminal urgente. Quero falar com o Dr. Lucas Semim.';
const url = ${this.config.whatsapp}?text=${encodeURIComponent(msg)};

const a = document.createElement('a');
a.href = url;
a.target = '_blank';
a.rel = 'noopener noreferrer';
a.className = 'juris-cta-btn';
a.setAttribute('aria-label', 'Falar com Dr. Lucas Semim sobre este tema');

const icon = document.createElement('i');
icon.className = 'fab fa-whatsapp';
icon.setAttribute('aria-hidden', 'true');
a.appendChild(icon);
a.appendChild(document.createTextNode(' Falar com Dr. Lucas Semim'));

a.addEventListener('click', () => this.trackEvent('juris_cta_click', item.tribunal));
return a;
},

findSidebar() {
for (const selector of this.config.sidebarSelectors) {
const el = document.querySelector(selector);
if (el) return el;
}
return null;
},

initReveal(card) {
if (this.state.reducedMotion || !('IntersectionObserver' in window)) {
card.classList.add('juris-visible');
return;
}

const obs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('juris-visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

obs.observe(card);
},

trackEvent(action, label) {
try {
if (typeof gtag === 'function') {
gtag('event', action, {
event_category: 'JurisDynamic',
event_label: label,
pagina_origem: window.location.pathname
});
}
} catch {
}
}
};

document.addEventListener('DOMContentLoaded', () => window.JurisDynamic.init());