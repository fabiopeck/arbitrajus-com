const CASOS = [
  {
    id: 'lav-01',
    numero: '5001847-33.2026.8.13.1820',
    vara: '2a Vara Civel de Lavras',
    autor: 'Maria Helena Costa',
    oab: 'OAB/MG 142.881',
    pedido: 48000,
    alcada: 12500,
    status: 'novo',
    antecipada: true,
    capturadoHa: '2 horas',
    citacaoEm: '15 dias',
    chat: [
      { quem: 'Sistema ARBITRAJUS', quando: 'Hoje, 19h04', texto: 'Processo recem distribuido no TJMG. Citacao ainda nao expedida. Convite de acordo enviado ao patrono.' },
      { quem: 'Robo ODR', quando: 'Hoje, 19h06', texto: 'Proposta inicial calculada: R$ 12.500,00 (26% do pedido), dentro da alcada da Unimed Lavras.' },
    ],
  },
  {
    id: 'lav-02',
    numero: '5001630-12.2026.8.13.1820',
    vara: '1a Vara Civel de Lavras',
    autor: 'Joao Pedro Almeida',
    oab: 'OAB/MG 98.440',
    pedido: 92000,
    alcada: 28000,
    status: 'negociacao',
    antecipada: true,
    capturadoHa: '11 horas',
    citacaoEm: '14 dias',
    chat: [
      { quem: 'Autor (via patrono)', quando: 'Ontem, 16h20', texto: 'Cliente recusou R$ 22 mil. Pede cobertura do medicamento e R$ 35 mil.' },
      { quem: 'Robo ODR', quando: 'Ontem, 16h41', texto: 'Contra-proposta automatica: R$ 28.000,00 + autorizacao administrativa em 48h, sem reconhecimento de culpa.' },
    ],
  },
  {
    id: 'lav-03',
    numero: '5001411-90.2026.8.13.1820',
    vara: 'Juizado Especial Civel de Lavras',
    autor: 'Ana Lucia Ferreira',
    oab: 'OAB/MG 187.203',
    pedido: 18600,
    alcada: 7400,
    status: 'minuta',
    antecipada: false,
    chat: [
      { quem: 'Robo ODR', quando: '15/08, 10h12', texto: 'Partes aderiram. Minuta de acordo gerada e aguardando aval do juridico da Unimed Lavras.' },
    ],
  },
  {
    id: 'lav-04',
    numero: '5001288-05.2026.8.13.1820',
    vara: '1a Vara Civel de Lavras',
    autor: 'Carlos Eduardo Ramos',
    oab: 'OAB/MG 76.119',
    pedido: 150000,
    alcada: 41000,
    status: 'negociacao',
    antecipada: false,
    chat: [
      { quem: 'Sistema ARBITRAJUS', quando: '12/08, 09h00', texto: 'Caso em negociacao no chat. Provisao contabil sugerida: R$ 41.000,00.' },
    ],
  },
  {
    id: 'lav-05',
    numero: '5001102-78.2026.8.13.1820',
    vara: 'Juizado Especial Civel de Lavras',
    autor: 'Patricia Souza Lima',
    oab: 'OAB/MG 155.662',
    pedido: 9700,
    alcada: 3900,
    status: 'acordo',
    antecipada: false,
    chat: [
      { quem: 'Sistema ARBITRAJUS', quando: '08/08, 14h33', texto: 'Acordo homologado. Economia: R$ 5.800,00. Provisao extinta neste caso.' },
    ],
  },
  {
    id: 'lav-06',
    numero: '5000988-21.2026.8.13.1820',
    vara: '2a Vara Civel de Lavras',
    autor: 'Hospital Santa Casa (reembolso de associado)',
    oab: 'OAB/MG 121.004',
    pedido: 64000,
    alcada: 21000,
    status: 'novo',
    antecipada: true,
    capturadoHa: '3 horas',
    citacaoEm: '15 dias',
    chat: [
      { quem: 'Robo ODR', quando: 'Hoje, 18h10', texto: 'Captura antecipada. Ainda ha janela para acordo antes de custas e contestacao.' },
    ],
  },
];

const STATUS = {
  novo: 'Novo capturado',
  negociacao: 'Em negociacao no chat',
  minuta: 'Minuta para aprovar',
  acordo: 'Acordo concluido',
};

function brl(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'portal-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function openModal(html) {
  document.getElementById('portal-modal-body').innerHTML = html;
  document.getElementById('portal-modal').classList.add('open');
}

function casoById(id) {
  return CASOS.find((c) => c.id === id);
}

function renderTabela() {
  document.getElementById('portal-tbody').innerHTML = CASOS.map((c) => `
    <tr>
      <td class="portal-proc">
        <strong>${c.numero}</strong>
        <small>${c.vara}</small>
        ${c.antecipada ? `
          <span class="selo-antecipada"><i class="fas fa-bolt"></i> Captura antecipada</span>
          <span class="portal-citacao">Capturado ha ${c.capturadoHa}. Citacao oficial estimada para daqui a ${c.citacaoEm}.</span>
        ` : ''}
      </td>
      <td>
        <strong>${c.autor}</strong><br>
        <small>${c.oab}</small>
      </td>
      <td class="portal-valores">
        <span class="pedido">Pedido: ${brl(c.pedido)}</span>
        <span class="alcada">Alcada de acordo: ${brl(c.alcada)}</span>
      </td>
      <td>${STATUS[c.status]}</td>
      <td>
        <div class="portal-actions">
          <button class="portal-btn portal-btn-chat" data-act="chat" data-id="${c.id}">Ver chat / negociacao</button>
          <button class="portal-btn portal-btn-aprovar" data-act="aprovar" data-id="${c.id}">Aprovar minuta</button>
          <button class="portal-btn portal-btn-link" data-act="link" data-id="${c.id}">Copiar link de acordo</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function bindAcoes() {
  document.getElementById('portal-tbody').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    const caso = casoById(btn.dataset.id);
    if (!caso) return;

    if (btn.dataset.act === 'chat') {
      openModal(`
        <h2>Chat de negociacao</h2>
        <p>${caso.numero} | ${caso.autor}</p>
        <div class="portal-chat">
          ${caso.chat.map((m) => `<div class="portal-msg"><span>${m.quem} | ${m.quando}</span><p>${m.texto}</p></div>`).join('')}
        </div>
      `);
    }

    if (btn.dataset.act === 'aprovar') {
      openModal(`
        <h2>Aprovar minuta de acordo</h2>
        <p>Termo gerado para ${caso.autor} no processo ${caso.numero}.</p>
        <p>Valor do pedido: <strong>${brl(caso.pedido)}</strong></p>
        <p>Valor sugerido (alcada Unimed Lavras): <strong>${brl(caso.alcada)}</strong></p>
        <p>Economia neste caso: <strong>${brl(caso.pedido - caso.alcada)}</strong></p>
        <p>Ao aprovar, o termo segue para assinatura da parte contraria sem contestacao judicial.</p>
      `);
    }

    if (btn.dataset.act === 'link') {
      const url = `${location.origin}/frontend/pages/portal-cliente.html#acordo-${caso.id}`;
      try {
        await navigator.clipboard.writeText(url);
        toast('Link de acordo copiado.');
      } catch {
        toast(url);
      }
    }
  });
}

function charts() {
  const ChartLib = window.Chart;
  if (!ChartLib) return;

  new ChartLib(document.getElementById('chart-causas'), {
    type: 'bar',
    data: {
      labels: ['Negativa de cobertura', 'Reajuste de mensalidade', 'Demora em autorizacao', 'Rede credenciada', 'Medicamento de alto custo'],
      datasets: [{
        label: '% dos processos',
        data: [38, 24, 18, 12, 8],
        backgroundColor: ['#001f3f', '#0066cc', '#c9a227', '#276749', '#2b6cb0'],
        borderRadius: 8,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 50, ticks: { callback: (v) => `${v}%` } },
      },
    },
  });

  new ChartLib(document.getElementById('chart-funil'), {
    type: 'doughnut',
    data: {
      labels: ['Novos capturados', 'Em negociacao no chat', 'Acordos concluidos'],
      datasets: [{
        data: [20, 50, 30],
        backgroundColor: ['#0066cc', '#c9a227', '#276749'],
      }],
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      cutout: '58%',
    },
  });
}

document.getElementById('portal-modal-close')?.addEventListener('click', () => {
  document.getElementById('portal-modal').classList.remove('open');
});

renderTabela();
bindAcoes();
charts();
