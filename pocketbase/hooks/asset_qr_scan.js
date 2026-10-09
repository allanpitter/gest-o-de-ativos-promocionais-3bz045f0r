// Rota POST /backend/v1/assets/scan
// Recebe { qr_code: string, action?: string, promoter_id?: string, notes?: string, pdv_id?: string }
// Localiza o ativo, atualiza seu status se acionamento de manutenção ou positivação, e retorna ativo + histórico
routerAdd('POST', '/backend/v1/assets/scan', (e) => {
  let body = {}
  try {
    const raw = e.requestInfo().body
    body = typeof raw === 'string' ? JSON.parse(raw) : raw || {}
  } catch (_) {
    return e.json(400, { message: 'JSON inválido na requisição' })
  }

  const qrCode = (body.qr_code || '').trim()
  if (!qrCode) {
    return e.json(400, { message: 'Código QR não informado' })
  }

  let asset
  try {
    asset = $app.findFirstRecordByData('assets', 'qr_code', qrCode)
  } catch (_) {
    return e.json(404, { message: 'Ativo não encontrado para este QR Code' })
  }

  const action = body.action // ex: "Manutencao", "Positivacao", "Desinstalacao"
  const notes = body.notes || ''
  const promoterId = body.promoter_id || (e.auth ? e.auth.id : '')
  const pdvId = body.pdv_id || asset.getString('current_pdv_id')

  // Se for manutenção, atualiza status
  if (action === 'Manutencao') {
    asset.set('status', 'Em manutenção')
    asset.set('condition', 'Manutencao')
    $app.save(asset)
  } else if (action === 'Positivacao' && pdvId) {
    asset.set('status', 'Instalado')
    asset.set('current_pdv_id', pdvId)
    $app.save(asset)
  } else if (action === 'Desinstalacao') {
    asset.set('status', 'Desinstalado')
    $app.save(asset)
  }

  // Registrar no histórico se houver ação informada
  if (action) {
    try {
      const histCol = $app.findCollectionByNameOrId('asset_history')
      const hist = new Record(histCol)
      hist.set('asset_id', asset.id)
      hist.set('action', action)
      if (pdvId) hist.set('pdv_id', pdvId)
      if (promoterId) hist.set('promoter_id', promoterId)
      hist.set('notes', notes || `Ação executada via leitura de QR Code (${action})`)
      $app.save(hist)
    } catch (_) {}
  }

  // Buscar histórico recente
  let history = []
  try {
    history = $app.findRecordsByFilter(
      'asset_history',
      `asset_id = '${asset.id}'`,
      '-created',
      10,
      0,
    )
  } catch (_) {}

  return e.json(200, {
    success: true,
    asset: asset,
    history: history,
  })
})
