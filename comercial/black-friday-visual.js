/* AJR Comercial — campanha Black Friday temática, somente 23–27/11/2026 no horário de Brasília. */
(()=>{'use strict';
  const START=Date.parse('2026-11-23T03:00:00.000Z');
  const END=Date.parse('2026-11-28T03:00:00.000Z');
  const now=Date.now();
  if(now<START || now>=END)return;
  const banner=document.querySelector('.blackfriday');
  if(!banner || document.getElementById('ajr-bf-stage'))return;
  document.documentElement.classList.add('ajr-bf-season');
  const path=location.pathname.toLowerCase();
  const isGestor=path.includes('/gestor/');
  const isDocs=path.includes('/docs/');
  const isFluxo=path.includes('/fluxo-qualidade/');
  const target=isGestor?'#produto':isDocs?'#planos':isFluxo?'#kits':'#produtos';
  const action=isGestor?'Ver oferta do Gestor AJR':isDocs?'Ver pacotes AJR Docs':isFluxo?'Ver kits promocionais':'Ver os três produtos';
  const stage=document.createElement('section');
  stage.id='ajr-bf-stage';
  stage.className='ajr-bf-stage';
  stage.setAttribute('aria-label','Campanha Black Friday AJR, decoração Halloween e desconto de 35%');
  stage.innerHTML=[
    '<div class="ajr-bf-inner">',
      '<div class="ajr-bf-copy">',
        '<div class="ajr-bf-kicker"><span aria-hidden="true">✦</span> Black Friday AJR · Edição especial</div>',
        '<h2>Ofertas <em>de arrepiar.</em></h2>',
        '<p>Abóboras, gatos pretos e velas com chamas douradas anunciam nossa Black Friday. ',
          '<strong>São 35% OFF nos produtos AJR</strong> de 23 a 27 de novembro.</p>',
        '<div class="ajr-bf-offer">',
          '<span class="ajr-bf-discount">35% OFF</span>',
          '<span class="ajr-bf-dates">23 a 27 de novembro de 2026</span>',
        '</div>',
        '<a class="ajr-bf-link" href="',target,'">',action,'</a>',
      '</div>',
      '<div class="ajr-bf-art"><img src="/comercial/black-friday-arte.svg?v=20261126" ',
      'width="740" height="390" loading="eager" decoding="async" ',
      'alt="Abóbora laranja, dois gatos pretos e velas pretas com chamas douradas">',
      '</div>',
    '</div>'
  ].join('');
  banner.insertAdjacentElement('afterend',stage);
})();