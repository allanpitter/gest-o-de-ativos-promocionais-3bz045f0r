// onRecordAfterCreate em visits — item de checklist negativo cria incident automaticamente + notificação aos gestores
onRecordAfterCreate((e) => {
  const visit = e.record
  const checklistRaw = visit.getString('checklist')
  if (!checklistRaw) return

  let checklistItems = []
  try {
    checklistItems = JSON.parse(checklistRaw) ?? []
  } catch (_) {
    return
  }

  if (!Array.isArray(checklistItems)) return

  const pdvId = visit.getString('pdv_id')
  const promoterId = visit.getString('promoter_id')

  let pdvName = 'PDV'
  try {
    const pdvRec = $app.findRecordById('pdvs', pdvId)
    pdvName = pdvRec.getString('name')
  } catch (_) {}

  // Buscar todos os gestores para notificar
  let managers = []
  try {
    managers = $app.findRecordsByFilter('_pb_users_auth_', "role = 'Gestor'", '', 50, 0)
  } catch (_) {}

  const incidentsCol = $app.findCollectionByNameOrId('incidents')
  const notifCol = $app.findCollectionByNameOrId('notifications')

  for (const item of checklistItems) {
    if (item && item.negative) {
      const label = item.label || 'Não conformidade identificada'
      let type = 'Outro'
      let severity = 'Media'

      const lower = label.toLowerCase()
      if (lower.includes('ruptura')) {
        type = 'Ruptura'
        severity = 'Alta'
      } else if (lower.includes('queda') || lower.includes('estrutura')) {
        type = 'Queda de estrutura'
        severity = 'Alta'
      } else if (
        lower.includes('danificado') ||
        lower.includes('avaria') ||
        lower.includes('condição')
      ) {
        type = 'Material danificado'
        severity = 'Media'
      } else if (lower.includes('não aplicado') || lower.includes('padrão')) {
        type = 'PDV nao executado'
        severity = 'Media'
      }

      // Criar incidente
      const inc = new Record(incidentsCol)
      inc.set('title', `Item negativo no PDV ${pdvName}: ${label}`)
      inc.set('type', type)
      inc.set('severity', severity)
      inc.set('status', 'Aberta')
      inc.set('pdv_id', pdvId)
      if (promoterId) inc.set('promoter_id', promoterId)
      inc.set('description', `Gerado automaticamente via checklist de visita. Item: "${label}".`)
      $app.save(inc)

      // Notificar gestores
      for (const mgr of managers) {
        try {
          const notif = new Record(notifCol)
          notif.set('user_id', mgr.id)
          notif.set('title', `Alerta: Não conformidade no PDV ${pdvName}`)
          notif.set(
            'body',
            `Incidente de ${type} (${severity}) gerado automaticamente na visita de checklist.`,
          )
          notif.set('type', 'Incident')
          notif.set('read', false)
          notif.set('data', JSON.stringify({ visit_id: visit.id, incident_id: inc.id }))
          $app.save(notif)
        } catch (_) {}
      }
    }
  }
}, 'visits')
