migrate(
  (app) => {
    // 1. Atualizar users auth collection
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['Gestor', 'Promotor', 'admin'],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('full_name')) {
      users.fields.add(
        new TextField({
          name: 'full_name',
        }),
      )
    }
    users.listRule = ''
    users.viewRule = ''
    users.createRule = ''
    users.updateRule = '@request.auth.id = id'
    users.deleteRule = '@request.auth.id = id'
    users.addIndex('idx_users_role', false, 'role', '')
    app.save(users)

    // 2. clients
    const clients = new Collection({
      name: 'clients',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'document', type: 'text' },
        { name: 'contact_email', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_clients_name ON clients (name)'],
    })
    app.save(clients)

    // 3. pdvs
    const clientsId = app.findCollectionByNameOrId('clients').id
    const pdvs = new Collection({
      name: 'pdvs',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'address', type: 'text' },
        { name: 'coordinates', type: 'json' },
        { name: 'client_id', type: 'relation', collectionId: clientsId, maxSelect: 1 },
        {
          name: 'segment',
          type: 'select',
          values: ['Food', 'Beverage', 'Personal Care', 'Other'],
          maxSelect: 1,
        },
        { name: 'status', type: 'select', values: ['Ativo', 'Inativo'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pdvs_client_id ON pdvs (client_id)',
        'CREATE INDEX idx_pdvs_segment ON pdvs (segment)',
      ],
    })
    app.save(pdvs)

    // 4. campaigns
    const campaigns = new Collection({
      name: 'campaigns',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['Planejada', 'Ativa', 'Encerrada'],
          maxSelect: 1,
        },
        { name: 'client_id', type: 'relation', collectionId: clientsId, maxSelect: 1 },
        { name: 'roi_estimate', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_campaigns_status ON campaigns (status)',
        'CREATE INDEX idx_campaigns_client_id ON campaigns (client_id)',
      ],
    })
    app.save(campaigns)

    // 5. assets
    const pdvsId = app.findCollectionByNameOrId('pdvs').id
    const campaignsId = app.findCollectionByNameOrId('campaigns').id
    const assets = new Collection({
      name: 'assets',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          values: ['MPDV', 'DISPLAY', 'ESTRUTURA', 'PONTA DE GONDOLA'],
          required: true,
          maxSelect: 1,
        },
        { name: 'qr_code', type: 'text', required: true },
        { name: 'description', type: 'text' },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'status',
          type: 'select',
          values: ['Instalado', 'Em trânsito', 'Em base', 'Desinstalado', 'Em manutenção'],
          required: true,
          maxSelect: 1,
        },
        {
          name: 'condition',
          type: 'select',
          values: ['Otimo', 'Bom', 'Regular', 'Ruim', 'Manutencao'],
          maxSelect: 1,
        },
        { name: 'current_pdv_id', type: 'relation', collectionId: pdvsId, maxSelect: 1 },
        { name: 'campaign_id', type: 'relation', collectionId: campaignsId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_assets_qr_code ON assets (qr_code)',
        'CREATE INDEX idx_assets_status ON assets (status)',
        'CREATE INDEX idx_assets_category ON assets (category)',
        'CREATE INDEX idx_assets_current_pdv_id ON assets (current_pdv_id)',
        'CREATE INDEX idx_assets_campaign_id ON assets (campaign_id)',
      ],
    })
    app.save(assets)

    // 6. visits
    const visits = new Collection({
      name: 'visits',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'pdv_id', type: 'relation', collectionId: pdvsId, required: true, maxSelect: 1 },
        {
          name: 'promoter_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        { name: 'checkin_at', type: 'date' },
        { name: 'checkout_at', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['Planejada', 'Em andamento', 'Concluida', 'Cancelada', 'Atrasada'],
          maxSelect: 1,
        },
        { name: 'checklist', type: 'json' },
        {
          name: 'photos',
          type: 'file',
          maxSelect: 10,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_visits_pdv_id ON visits (pdv_id)',
        'CREATE INDEX idx_visits_promoter_id ON visits (promoter_id)',
        'CREATE INDEX idx_visits_date ON visits (date)',
        'CREATE INDEX idx_visits_status ON visits (status)',
      ],
    })
    app.save(visits)

    // 7. incidents
    const assetsId = app.findCollectionByNameOrId('assets').id
    const incidents = new Collection({
      name: 'incidents',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: [
            'Ruptura',
            'Material danificado',
            'Queda de estrutura',
            'PDV nao executado',
            'Outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'severity',
          type: 'select',
          values: ['Baixa', 'Media', 'Alta', 'Critica'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['Aberta', 'Em analise', 'Resolvida'],
          maxSelect: 1,
        },
        { name: 'pdv_id', type: 'relation', collectionId: pdvsId, required: true, maxSelect: 1 },
        { name: 'asset_id', type: 'relation', collectionId: assetsId, maxSelect: 1 },
        { name: 'promoter_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'description', type: 'text' },
        {
          name: 'photos',
          type: 'file',
          maxSelect: 3,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'resolution_notes', type: 'text' },
        { name: 'resolved_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_incidents_status ON incidents (status)',
        'CREATE INDEX idx_incidents_severity ON incidents (severity)',
        'CREATE INDEX idx_incidents_pdv_id ON incidents (pdv_id)',
        'CREATE INDEX idx_incidents_promoter_id ON incidents (promoter_id)',
      ],
    })
    app.save(incidents)

    // 8. notifications
    const notifications = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'text' },
        {
          name: 'type',
          type: 'select',
          values: ['Incident', 'Visit', 'Asset', 'System'],
          maxSelect: 1,
        },
        { name: 'read', type: 'bool' },
        { name: 'data', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notifications_user_id ON notifications (user_id)',
        'CREATE INDEX idx_notifications_read ON notifications (read)',
      ],
    })
    app.save(notifications)

    // 9. asset_history
    const assetHistory = new Collection({
      name: 'asset_history',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'asset_id',
          type: 'relation',
          collectionId: assetsId,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'action',
          type: 'select',
          values: ['Positivacao', 'Desinstalacao', 'Manutencao', 'Auditoria'],
          maxSelect: 1,
        },
        { name: 'pdv_id', type: 'relation', collectionId: pdvsId, maxSelect: 1 },
        { name: 'promoter_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'photo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_asset_history_asset_id ON asset_history (asset_id)',
        'CREATE INDEX idx_asset_history_action ON asset_history (action)',
      ],
    })
    app.save(assetHistory)

    // 10. route_plans
    const routePlans = new Collection({
      name: 'route_plans',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'date', type: 'date', required: true },
        {
          name: 'promoter_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        { name: 'pdv_ids', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_route_plans_date ON route_plans (date)',
        'CREATE INDEX idx_route_plans_promoter_id ON route_plans (promoter_id)',
      ],
    })
    app.save(routePlans)
  },
  (app) => {
    const toDelete = [
      'route_plans',
      'asset_history',
      'notifications',
      'incidents',
      'visits',
      'assets',
      'campaigns',
      'pdvs',
      'clients',
    ]
    for (const name of toDelete) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
