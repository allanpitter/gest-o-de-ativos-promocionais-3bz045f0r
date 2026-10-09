migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientsCol = app.findCollectionByNameOrId('clients')
    const pdvsCol = app.findCollectionByNameOrId('pdvs')
    const campaignsCol = app.findCollectionByNameOrId('campaigns')
    const assetsCol = app.findCollectionByNameOrId('assets')
    const visitsCol = app.findCollectionByNameOrId('visits')
    const incidentsCol = app.findCollectionByNameOrId('incidents')
    const notificationsCol = app.findCollectionByNameOrId('notifications')
    const assetHistoryCol = app.findCollectionByNameOrId('asset_history')
    const routePlansCol = app.findCollectionByNameOrId('route_plans')

    // Helper safe get or create user
    const seedUser = (email, name, role) => {
      try {
        return app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const rec = new Record(usersCol)
        rec.setEmail(email)
        rec.setPassword('Skip@Pass')
        rec.setVerified(true)
        rec.set('name', name)
        rec.set('full_name', name)
        rec.set('role', role)
        app.save(rec)
        return rec
      }
    }

    const demoUser = seedUser('allanpitter@gmail.com', 'Allan Pitter', 'Gestor')
    const promoter1 = seedUser('marcos.silva@profilelog.com.br', 'Marcos Silva', 'Promotor')
    const promoter2 = seedUser('juliana.costa@profilelog.com.br', 'Juliana Costa', 'Promotor')
    const promoter3 = seedUser('rafael.souza@profilelog.com.br', 'Rafael Souza', 'Promotor')

    // Clientes
    const clientNames = [
      {
        name: 'Supermercados São José',
        doc: '12.345.678/0001-90',
        email: 'contato@saojose.com.br',
      },
      { name: 'Rede Bom Preço', doc: '23.456.789/0001-01', email: 'compras@bompreco.com.br' },
      { name: 'Farmácias Vida Mais', doc: '34.567.890/0001-12', email: 'trade@vidamais.com.br' },
      {
        name: 'Atacadão Central',
        doc: '45.678.901/0001-23',
        email: 'operacoes@atacadocentral.com.br',
      },
    ]

    const clientRecords = []
    for (const c of clientNames) {
      let rec
      try {
        rec = app.findFirstRecordByData('clients', 'name', c.name)
      } catch (_) {
        rec = new Record(clientsCol)
        rec.set('name', c.name)
        rec.set('document', c.doc)
        rec.set('contact_email', c.email)
        app.save(rec)
      }
      clientRecords.push(rec)
    }

    // PDVs em São Paulo/SP
    const pdvData = [
      {
        name: 'São José — Av. Paulista',
        address: 'Av. Paulista, 1000 — Bela Vista, São Paulo - SP',
        lat: -23.5653,
        lng: -46.6517,
        client: clientRecords[0],
        seg: 'Food',
      },
      {
        name: 'São José — Augusta',
        address: 'Rua Augusta, 450 — Consolação, São Paulo - SP',
        lat: -23.5512,
        lng: -46.6528,
        client: clientRecords[0],
        seg: 'Food',
      },
      {
        name: 'Bom Preço — Faria Lima',
        address: 'Av. Brigadeiro Faria Lima, 3002 — Itaim Bibi, São Paulo - SP',
        lat: -23.5855,
        lng: -46.6821,
        client: clientRecords[1],
        seg: 'Food',
      },
      {
        name: 'Bom Preço — Pinheiros',
        address: 'Rua dos Pinheiros, 820 — Pinheiros, São Paulo - SP',
        lat: -23.5647,
        lng: -46.6912,
        client: clientRecords[1],
        seg: 'Beverage',
      },
      {
        name: 'Farmácia Vida Mais — Moema',
        address: 'Av. Ibirapuera, 2105 — Moema, São Paulo - SP',
        lat: -23.6015,
        lng: -46.6622,
        client: clientRecords[2],
        seg: 'Personal Care',
      },
      {
        name: 'Farmácia Vida Mais — Jardins',
        address: 'Rua Oscar Freire, 900 — Cerqueira César, São Paulo - SP',
        lat: -23.5639,
        lng: -46.6698,
        client: clientRecords[2],
        seg: 'Personal Care',
      },
      {
        name: 'Atacadão Central — Barra Funda',
        address: 'Av. Marquês de São Vicente, 1619 — Barra Funda, São Paulo - SP',
        lat: -23.5188,
        lng: -46.6734,
        client: clientRecords[3],
        seg: 'Food',
      },
      {
        name: 'Atacadão Central — Ipiranga',
        address: 'Rua Silva Bueno, 1200 — Ipiranga, São Paulo - SP',
        lat: -23.5932,
        lng: -46.6041,
        client: clientRecords[3],
        seg: 'Beverage',
      },
      {
        name: 'Bom Preço — Vila Mariana',
        address: 'Rua Domingos de Morais, 1550 — Vila Mariana, São Paulo - SP',
        lat: -23.5878,
        lng: -46.6385,
        client: clientRecords[1],
        seg: 'Food',
      },
    ]

    const pdvRecords = []
    for (const p of pdvData) {
      let rec
      try {
        rec = app.findFirstRecordByData('pdvs', 'name', p.name)
      } catch (_) {
        rec = new Record(pdvsCol)
        rec.set('name', p.name)
        rec.set('address', p.address)
        rec.set('coordinates', JSON.stringify({ lat: p.lat, lng: p.lng }))
        rec.set('client_id', p.client.id)
        rec.set('segment', p.seg)
        rec.set('status', 'Ativo')
        app.save(rec)
      }
      pdvRecords.push(rec)
    }

    // Campanhas
    const campaignsData = [
      {
        name: 'Campanha Verão MBRF 2025',
        desc: 'Ativação de produtos sazonais e refrescantes em pontos estratégicos com foco em alta conversão.',
        status: 'Ativa',
        start: '2025-01-05 08:00:00.000Z',
        end: '2025-03-31 22:00:00.000Z',
        roi: 285.5,
        client: clientRecords[0],
      },
      {
        name: 'Campanha de Inverno Perfumaria',
        desc: 'Positivação de displays premium em redes farmacêuticas e cosméticos de alto giro.',
        status: 'Planejada',
        start: '2025-05-01 08:00:00.000Z',
        end: '2025-08-31 22:00:00.000Z',
        roi: 210.0,
        client: clientRecords[2],
      },
      {
        name: 'Lancamento Linha Premium',
        desc: 'Lançamento nacional da nova linha com pontas de gôndola e degustação assistida.',
        status: 'Encerrada',
        start: '2024-09-01 08:00:00.000Z',
        end: '2024-12-20 22:00:00.000Z',
        roi: 340.2,
        client: clientRecords[3],
      },
    ]

    const campaignRecords = []
    for (const c of campaignsData) {
      let rec
      try {
        rec = app.findFirstRecordByData('campaigns', 'name', c.name)
      } catch (_) {
        rec = new Record(campaignsCol)
        rec.set('name', c.name)
        rec.set('description', c.desc)
        rec.set('status', c.status)
        rec.set('start_date', c.start)
        rec.set('end_date', c.end)
        rec.set('roi_estimate', c.roi)
        rec.set('client_id', c.client.id)
        app.save(rec)
      }
      campaignRecords.push(rec)
    }

    // 16 Ativos Promocionais
    const assetSpecs = [
      {
        qr: 'MBRF-1001',
        name: 'Display Ilha Central Premium Verão',
        cat: 'DISPLAY',
        status: 'Instalado',
        cond: 'Otimo',
        pdvIdx: 0,
        campIdx: 0,
        desc: 'Display modular de 4 bandejas iluminado em LED',
      },
      {
        qr: 'MBRF-1002',
        name: 'Ponta de Gôndola Geladeira Verão',
        cat: 'PONTA DE GONDOLA',
        status: 'Instalado',
        cond: 'Otimo',
        pdvIdx: 1,
        campIdx: 0,
        desc: 'Estrutura personalizada para topo de ilha refrigerada',
      },
      {
        qr: 'MBRF-1003',
        name: 'Totem Estrutural Interativo MBRF',
        cat: 'ESTRUTURA',
        status: 'Instalado',
        cond: 'Bom',
        pdvIdx: 2,
        campIdx: 0,
        desc: 'Totem de comunicação visual 1.80m com porta folhetos',
      },
      {
        qr: 'MBRF-1004',
        name: 'Faixa de Gôndola e Stopper PVC',
        cat: 'MPDV',
        status: 'Instalado',
        cond: 'Regular',
        pdvIdx: 3,
        campIdx: 0,
        desc: 'Conjunto de precificadores e stoppers de gôndola',
      },
      {
        qr: 'MBRF-1005',
        name: 'Display Balcão Farmácia Vida Mais',
        cat: 'DISPLAY',
        status: 'Instalado',
        cond: 'Otimo',
        pdvIdx: 4,
        campIdx: 1,
        desc: 'Display acrílico para check-out e dermocosméticos',
      },
      {
        qr: 'MBRF-1006',
        name: 'Ponta de Gôndola Linha Cosméticos',
        cat: 'PONTA DE GONDOLA',
        status: 'Instalado',
        cond: 'Bom',
        pdvIdx: 5,
        campIdx: 1,
        desc: 'Revestimento em MDF com testeira retroiluminada',
      },
      {
        qr: 'MBRF-1007',
        name: 'Palete Promocional Atacadão',
        cat: 'ESTRUTURA',
        status: 'Instalado',
        cond: 'Bom',
        pdvIdx: 6,
        campIdx: 2,
        desc: 'Saia de palete reforçada em polipropileno alveolar',
      },
      {
        qr: 'MBRF-1008',
        name: 'Cross Merchandising Bebidas',
        cat: 'MPDV',
        status: 'Instalado',
        cond: 'Otimo',
        pdvIdx: 7,
        campIdx: 0,
        desc: 'Fita cross com 12 ganchos reforçados para corredor central',
      },
      {
        qr: 'MBRF-1009',
        name: 'Display Chão Giratório MBRF',
        cat: 'DISPLAY',
        status: 'Em manutenção',
        cond: 'Manutencao',
        pdvIdx: 8,
        campIdx: 0,
        desc: 'Display giratório de 3 faces com rolamento travado',
      },
      {
        qr: 'MBRF-1010',
        name: 'Stopper Aéreo Dupla Face',
        cat: 'MPDV',
        status: 'Em base',
        cond: 'Bom',
        pdvIdx: null,
        campIdx: 0,
        desc: 'Placa suspensa 60x40cm em base logística aguardando expedição',
      },
      {
        qr: 'MBRF-1011',
        name: 'Display Acrílico de Mesa Premium',
        cat: 'DISPLAY',
        status: 'Em base',
        cond: 'Otimo',
        pdvIdx: null,
        campIdx: 1,
        desc: 'Display de lançamento em estoque central',
      },
      {
        qr: 'MBRF-1012',
        name: 'Estrutura Metálica Portal de Entrada',
        cat: 'ESTRUTURA',
        status: 'Em trânsito',
        cond: 'Bom',
        pdvIdx: 0,
        campIdx: 0,
        desc: 'Portal metálico desmontável em transporte rota Paulista',
      },
      {
        qr: 'MBRF-1013',
        name: 'Adesivo de Piso Antiderrapante',
        cat: 'MPDV',
        status: 'Desinstalado',
        cond: 'Ruim',
        pdvIdx: 1,
        campIdx: 2,
        desc: 'Retirado após término de ação promocional',
      },
      {
        qr: 'MBRF-1014',
        name: 'Wobbler Promocional Pack 50',
        cat: 'MPDV',
        status: 'Instalado',
        cond: 'Otimo',
        pdvIdx: 2,
        campIdx: 0,
        desc: 'Wobblers com haste flexível para gôndolas de cereais',
      },
      {
        qr: 'MBRF-1015',
        name: 'Ponta de Gôndola Dupla Face',
        cat: 'PONTA DE GONDOLA',
        status: 'Instalado',
        cond: 'Regular',
        pdvIdx: 6,
        campIdx: 0,
        desc: 'Estrutura metálica com ganchos laterais',
      },
      {
        qr: 'MBRF-1016',
        name: 'Mini Display Caixa Balcão',
        cat: 'DISPLAY',
        status: 'Em base',
        cond: 'Otimo',
        pdvIdx: null,
        campIdx: 0,
        desc: 'Lote de displays de balcão prontos para positivação',
      },
    ]

    const assetRecords = []
    for (const s of assetSpecs) {
      let rec
      try {
        rec = app.findFirstRecordByData('assets', 'qr_code', s.qr)
      } catch (_) {
        rec = new Record(assetsCol)
        rec.set('name', s.name)
        rec.set('category', s.cat)
        rec.set('qr_code', s.qr)
        rec.set('description', s.desc)
        rec.set('status', s.status)
        rec.set('condition', s.cond)
        if (s.pdvIdx !== null && pdvRecords[s.pdvIdx]) {
          rec.set('current_pdv_id', pdvRecords[s.pdvIdx].id)
        }
        if (s.campIdx !== null && campaignRecords[s.campIdx]) {
          rec.set('campaign_id', campaignRecords[s.campIdx].id)
        }
        app.save(rec)
      }
      assetRecords.push(rec)
    }

    // Histórico de Ativos
    const historySeeds = [
      {
        asset: assetRecords[0],
        action: 'Positivacao',
        pdv: pdvRecords[0],
        promoter: demoUser,
        notes: 'Display central montado e iluminado conforme layout guia.',
      },
      {
        asset: assetRecords[0],
        action: 'Auditoria',
        pdv: pdvRecords[0],
        promoter: promoter1,
        notes: 'Auditoria de rotina. 100% abastecido e sem avarias.',
      },
      {
        asset: assetRecords[1],
        action: 'Positivacao',
        pdv: pdvRecords[1],
        promoter: promoter2,
        notes: 'Ponta de gôndola aplicada na entrada da loja com adesivação completa.',
      },
      {
        asset: assetRecords[8],
        action: 'Manutencao',
        pdv: pdvRecords[8],
        promoter: promoter3,
        notes: 'Base giratória trancada. Solicitada troca de peças.',
      },
      {
        asset: assetRecords[12],
        action: 'Desinstalacao',
        pdv: pdvRecords[1],
        promoter: demoUser,
        notes: 'Remoção de adesivo após encerramento da campanha anterior.',
      },
    ]

    for (const h of historySeeds) {
      try {
        const rec = new Record(assetHistoryCol)
        rec.set('asset_id', h.asset.id)
        rec.set('action', h.action)
        if (h.pdv) rec.set('pdv_id', h.pdv.id)
        if (h.promoter) rec.set('promoter_id', h.promoter.id)
        rec.set('notes', h.notes)
        app.save(rec)
      } catch (_) {}
    }

    // Visitas (20+ nos últimos 30 dias e futuras)
    const defaultChecklist = [
      {
        label: 'Material aplicado conforme padrão de execução?',
        checked: true,
        negative: false,
        photos: [],
      },
      { label: 'Fotografar gôndola e ponto extra', checked: true, negative: false, photos: [] },
      {
        label: 'Verificar presença de ruptura de produto',
        checked: true,
        negative: false,
        photos: [],
      },
      { label: 'Registrar faltas de produto e lote', checked: false, negative: false, photos: [] },
      {
        label: 'Avaliar condição de conservação do material',
        checked: true,
        negative: false,
        photos: [],
      },
    ]

    const checklistNegative = [
      {
        label: 'Material aplicado conforme padrão de execução?',
        checked: false,
        negative: true,
        photos: [],
      },
      { label: 'Fotografar gôndola e ponto extra', checked: true, negative: false, photos: [] },
      {
        label: 'Verificar presença de ruptura de produto',
        checked: true,
        negative: true,
        photos: [],
      },
      { label: 'Registrar faltas de produto e lote', checked: true, negative: false, photos: [] },
      {
        label: 'Avaliar condição de conservação do material',
        checked: false,
        negative: true,
        photos: [],
      },
    ]

    const checklistPartial = [
      {
        label: 'Material aplicado conforme padrão de execução?',
        checked: true,
        negative: false,
        photos: [],
      },
      { label: 'Fotografar gôndola e ponto extra', checked: true, negative: false, photos: [] },
      {
        label: 'Verificar presença de ruptura de produto',
        checked: false,
        negative: false,
        photos: [],
      },
      { label: 'Registrar faltas de produto e lote', checked: false, negative: false, photos: [] },
      {
        label: 'Avaliar condição de conservação do material',
        checked: false,
        negative: false,
        photos: [],
      },
    ]

    const now = new Date()
    const visitsSeedData = [
      // Hoje
      {
        offsetDays: 0,
        pdv: pdvRecords[0],
        promoter: demoUser,
        status: 'Concluida',
        checkin: '08:30',
        checkout: '09:45',
        cl: defaultChecklist,
        notes: 'Gôndola organizada, material com ótima visibilidade.',
      },
      {
        offsetDays: 0,
        pdv: pdvRecords[1],
        promoter: demoUser,
        status: 'Em andamento',
        checkin: '10:15',
        checkout: null,
        cl: checklistPartial,
        notes: 'Em atendimento à gerência do PDV.',
      },
      {
        offsetDays: 0,
        pdv: pdvRecords[2],
        promoter: demoUser,
        status: 'Planejada',
        checkin: null,
        checkout: null,
        cl: defaultChecklist,
        notes: 'Visita agendada para 14:00.',
      },
      {
        offsetDays: 0,
        pdv: pdvRecords[3],
        promoter: promoter1,
        status: 'Concluida',
        checkin: '09:00',
        checkout: '10:10',
        cl: defaultChecklist,
        notes: 'Substituído stopper danificado.',
      },
      {
        offsetDays: 0,
        pdv: pdvRecords[4],
        promoter: promoter2,
        status: 'Em andamento',
        checkin: '10:00',
        checkout: null,
        cl: checklistPartial,
        notes: 'Contagem de giro da perfumaria.',
      },

      // Ontem e dias recentes
      {
        offsetDays: -1,
        pdv: pdvRecords[5],
        promoter: promoter2,
        status: 'Concluida',
        checkin: '11:00',
        checkout: '12:15',
        cl: defaultChecklist,
        notes: 'Positivação realizada com sucesso.',
      },
      {
        offsetDays: -1,
        pdv: pdvRecords[6],
        promoter: promoter3,
        status: 'Concluida',
        checkin: '13:30',
        checkout: '15:00',
        cl: defaultChecklist,
        notes: 'Palete central montado.',
      },
      {
        offsetDays: -2,
        pdv: pdvRecords[7],
        promoter: promoter1,
        status: 'Concluida',
        checkin: '08:15',
        checkout: '09:30',
        cl: checklistNegative,
        notes: 'Ruptura identificada no corredor principal.',
      },
      {
        offsetDays: -3,
        pdv: pdvRecords[8],
        promoter: promoter3,
        status: 'Concluida',
        checkin: '14:00',
        checkout: '15:20',
        cl: checklistNegative,
        notes: 'Display com problema mecânico registrado.',
      },
      {
        offsetDays: -4,
        pdv: pdvRecords[0],
        promoter: demoUser,
        status: 'Concluida',
        checkin: '09:10',
        checkout: '10:20',
        cl: defaultChecklist,
        notes: 'Auditoria semanal preventiva.',
      },
      {
        offsetDays: -5,
        pdv: pdvRecords[2],
        promoter: promoter1,
        status: 'Concluida',
        checkin: '10:00',
        checkout: '11:30',
        cl: defaultChecklist,
        notes: 'Ajuste de precificadores.',
      },
      {
        offsetDays: -7,
        pdv: pdvRecords[3],
        promoter: promoter2,
        status: 'Concluida',
        checkin: '15:00',
        checkout: '16:00',
        cl: defaultChecklist,
        notes: 'Troca de material MPDV.',
      },
      {
        offsetDays: -10,
        pdv: pdvRecords[4],
        promoter: promoter1,
        status: 'Concluida',
        checkin: '09:30',
        checkout: '10:45',
        cl: defaultChecklist,
        notes: 'Treinamento breve do atendente de loja.',
      },
      {
        offsetDays: -12,
        pdv: pdvRecords[1],
        promoter: demoUser,
        status: 'Concluida',
        checkin: '11:00',
        checkout: '12:30',
        cl: defaultChecklist,
        notes: 'Reabastecimento e alinhamento de gôndola.',
      },
      {
        offsetDays: -15,
        pdv: pdvRecords[5],
        promoter: promoter3,
        status: 'Concluida',
        checkin: '14:15',
        checkout: '15:45',
        cl: checklistNegative,
        notes: 'Queda de testeira de ponta de gôndola corrigida.',
      },
      {
        offsetDays: -18,
        pdv: pdvRecords[6],
        promoter: promoter2,
        status: 'Concluida',
        checkin: '08:45',
        checkout: '10:00',
        cl: defaultChecklist,
        notes: 'Visita padrão de giro.',
      },
      {
        offsetDays: -21,
        pdv: pdvRecords[7],
        promoter: promoter1,
        status: 'Concluida',
        checkin: '10:30',
        checkout: '11:45',
        cl: defaultChecklist,
        notes: 'Excelente aceitação da campanha Verão.',
      },
      {
        offsetDays: -25,
        pdv: pdvRecords[8],
        promoter: demoUser,
        status: 'Concluida',
        checkin: '13:00',
        checkout: '14:10',
        cl: defaultChecklist,
        notes: 'Visita de alinhamento com encarregado.',
      },

      // Futuras / Planejadas
      {
        offsetDays: 1,
        pdv: pdvRecords[0],
        promoter: demoUser,
        status: 'Planejada',
        checkin: null,
        checkout: null,
        cl: defaultChecklist,
        notes: 'Rota programada manhã.',
      },
      {
        offsetDays: 1,
        pdv: pdvRecords[4],
        promoter: promoter2,
        status: 'Planejada',
        checkin: null,
        checkout: null,
        cl: defaultChecklist,
        notes: 'Rota Moema agendada.',
      },
      {
        offsetDays: 2,
        pdv: pdvRecords[6],
        promoter: promoter3,
        status: 'Planejada',
        checkin: null,
        checkout: null,
        cl: defaultChecklist,
        notes: 'Auditoria quinzenal Atacadão Central.',
      },
      {
        offsetDays: 3,
        pdv: pdvRecords[2],
        promoter: promoter1,
        status: 'Planejada',
        checkin: null,
        checkout: null,
        cl: defaultChecklist,
        notes: 'Revisão geral Faria Lima.',
      },
    ]

    for (const v of visitsSeedData) {
      const vDate = new Date(now.getTime() + v.offsetDays * 86400000)
      const dateStr = vDate.toISOString().replace('T', ' ').substring(0, 19) + '.000Z'
      const checkinStr = v.checkin ? dateStr.substring(0, 11) + v.checkin + ':00.000Z' : null
      const checkoutStr = v.checkout ? dateStr.substring(0, 11) + v.checkout + ':00.000Z' : null

      try {
        const rec = new Record(visitsCol)
        rec.set('date', dateStr)
        rec.set('pdv_id', v.pdv.id)
        rec.set('promoter_id', v.promoter.id)
        rec.set('status', v.status)
        if (checkinStr) rec.set('checkin_at', checkinStr)
        if (checkoutStr) rec.set('checkout_at', checkoutStr)
        rec.set('checklist', JSON.stringify(v.cl))
        rec.set('notes', v.notes)
        app.save(rec)
      } catch (_) {}
    }

    // Ocorrências (6-8)
    const incidentData = [
      {
        title: 'Ruptura crítica detectada na gôndola de bebidas',
        type: 'Ruptura',
        sev: 'Critica',
        st: 'Aberta',
        pdv: pdvRecords[7],
        asset: assetRecords[7],
        prom: promoter1,
        desc: 'Falta total de estoque do SKU principal no corredor de refrigerados.',
      },
      {
        title: 'Material danificado — Testeira acrílica trincada',
        type: 'Material danificado',
        sev: 'Alta',
        st: 'Em analise',
        pdv: pdvRecords[8],
        asset: assetRecords[8],
        prom: promoter3,
        desc: 'Impacto acidental durante movimentação de empilhadeira causou rachadura.',
      },
      {
        title: 'Queda de estrutura frontal após movimentação',
        type: 'Queda de estrutura',
        sev: 'Alta',
        st: 'Resolvida',
        pdv: pdvRecords[5],
        asset: assetRecords[5],
        prom: promoter2,
        desc: 'Suporte lateral foi reencaixado e fixado com fita 3M extra forte.',
      },
      {
        title: 'PDV não executado — Loja em reforma no setor',
        type: 'PDV nao executado',
        sev: 'Media',
        st: 'Aberta',
        pdv: pdvRecords[3],
        asset: null,
        prom: promoter1,
        desc: 'Setor de mercearia isolado para pintura até a próxima quarta-feira.',
      },
      {
        title: 'Falta de precificador e etiquetas MBRF',
        type: 'Outro',
        sev: 'Baixa',
        st: 'Resolvida',
        pdv: pdvRecords[1],
        asset: assetRecords[1],
        prom: demoUser,
        desc: 'Substituído kit de fitas precificadoras pelo promotor.',
      },
      {
        title: 'Ruptura parcial linha premium',
        type: 'Ruptura',
        sev: 'Alta',
        st: 'Aberta',
        pdv: pdvRecords[0],
        asset: assetRecords[0],
        prom: demoUser,
        desc: 'Apenas 3 unidades restantes na ilha central. Pedido de reposição emergencial.',
      },
      {
        title: 'Stopper empenado por umidade de gôndola',
        type: 'Material danificado',
        sev: 'Media',
        st: 'Em analise',
        pdv: pdvRecords[2],
        asset: assetRecords[2],
        prom: promoter1,
        desc: 'Troca do material de PVC solicitada para a base.',
      },
    ]

    for (const inc of incidentData) {
      try {
        const rec = new Record(incidentsCol)
        rec.set('title', inc.title)
        rec.set('type', inc.type)
        rec.set('severity', inc.sev)
        rec.set('status', inc.st)
        rec.set('pdv_id', inc.pdv.id)
        if (inc.asset) rec.set('asset_id', inc.asset.id)
        if (inc.prom) rec.set('promoter_id', inc.prom.id)
        rec.set('description', inc.desc)
        if (inc.st === 'Resolvida') {
          rec.set(
            'resolution_notes',
            'Ocorrência resolvida com ajuste em campo e reposição técnica.',
          )
          rec.set('resolved_at', now.toISOString().replace('T', ' ').substring(0, 19) + '.000Z')
        }
        app.save(rec)
      } catch (_) {}
    }

    // Notificações
    const notifData = [
      {
        user: demoUser,
        title: 'Alerta de Ruptura Crítica',
        body: 'Ruptura reportada no PDV Atacadão Central — Ipiranga',
        type: 'Incident',
        read: false,
      },
      {
        user: demoUser,
        title: 'Material com avaria reportado',
        body: 'Display Chão Giratório MBRF precisa de manutenção na Vila Mariana',
        type: 'Incident',
        read: false,
      },
      {
        user: demoUser,
        title: 'Nova Visita Concluída',
        body: 'Marcos Silva concluiu visita no Bom Preço — Pinheiros',
        type: 'Visit',
        read: true,
      },
      {
        user: demoUser,
        title: 'Ativo Positivado',
        body: 'Allan Pitter registrou positivação da Ilha Central na Av. Paulista',
        type: 'Asset',
        read: true,
      },
      {
        user: demoUser,
        title: 'Rota do Dia Atualizada',
        body: '3 PDVs sequenciados para a sua rota hoje em São Paulo',
        type: 'System',
        read: false,
      },
    ]

    for (const n of notifData) {
      try {
        const rec = new Record(notificationsCol)
        rec.set('user_id', n.user.id)
        rec.set('title', n.title)
        rec.set('body', n.body)
        rec.set('type', n.type)
        rec.set('read', n.read)
        rec.set('data', JSON.stringify({}))
        app.save(rec)
      } catch (_) {}
    }

    // Rota planejada para HOJE para o Allan Pitter (demo)
    try {
      const todayStr = now.toISOString().substring(0, 10) + ' 00:00:00.000Z'
      const routeRec = new Record(routePlansCol)
      routeRec.set('date', todayStr)
      routeRec.set('promoter_id', demoUser.id)
      routeRec.set(
        'pdv_ids',
        JSON.stringify([pdvRecords[0].id, pdvRecords[1].id, pdvRecords[2].id, pdvRecords[3].id]),
      )
      app.save(routeRec)
    } catch (_) {}
  },
  (app) => {
    // Safe rollback
  },
)
