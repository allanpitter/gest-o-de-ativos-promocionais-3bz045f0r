// onRecordAfterCreate em incidents — notifica todos os gestores
onRecordAfterCreate((e) => {
  const incident = e.record
  const title = incident.getString('title') || 'Nova ocorrência registrada'
  const severity = incident.getString('severity') || 'Média'
  const type = incident.getString('type') || 'Ocorrência'
  const pdvId = incident.getString('pdv_id')

  let pdvName = ''
  if (pdvId) {
    try {
      const pdv = $app.findRecordById('pdvs', pdvId)
      pdvName = ` em ${pdv.getString('name')}`
    } catch (_) {}
  }

  let managers = []
  try {
    managers = $app.findRecordsByFilter('_pb_users_auth_', "role = 'Gestor'", '', 50, 0)
  } catch (_) {}

  const notifCol = $app.findCollectionByNameOrId('notifications')
  for (const mgr of managers) {
    try {
      const notif = new Record(notifCol)
      notif.set('user_id', mgr.id)
      notif.set('title', `Ocorrência: ${type} (${severity})`)
      notif.set('body', `${title}${pdvName}`)
      notif.set('type', 'Incident')
      notif.set('read', false)
      notif.set('data', JSON.stringify({ incident_id: incident.id }))
      $app.save(notif)
    } catch (_) {}
  }
}, 'incidents')
