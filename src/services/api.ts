import pb from '@/lib/pocketbase/client'
import type {
  Asset,
  PDV,
  Campaign,
  Visit,
  Incident,
  Notification,
  AssetHistory,
  RoutePlan,
  User,
} from '@/types'

export const assetService = {
  async getAll(params?: { filter?: string; sort?: string; page?: number; perPage?: number }) {
    return pb.collection('assets').getList<Asset>(params?.page || 1, params?.perPage || 100, {
      filter: params?.filter || '',
      sort: params?.sort || '-created',
      expand: 'current_pdv_id,campaign_id',
    })
  },

  async getById(id: string) {
    return pb.collection('assets').getOne<Asset>(id, {
      expand: 'current_pdv_id,campaign_id',
    })
  },

  async create(data: FormData | Partial<Asset>) {
    return pb.collection('assets').create<Asset>(data)
  },

  async update(id: string, data: FormData | Partial<Asset>) {
    return pb.collection('assets').update<Asset>(id, data)
  },

  async delete(id: string) {
    return pb.collection('assets').delete(id)
  },

  async scanQR(qr_code: string, action?: string, notes?: string, pdv_id?: string) {
    const url = `${pb.baseUrl}/backend/v1/assets/scan`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify({
        qr_code,
        action,
        notes,
        pdv_id,
        promoter_id: pb.authStore.record?.id,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erro ao escanear ativo' }))
      throw new Error(err.message || 'Falha ao processar QR code')
    }
    return res.json()
  },
}

export const pdvService = {
  async getAll() {
    return pb.collection('pdvs').getFullList<PDV>({
      sort: 'name',
      expand: 'client_id',
    })
  },
  async getById(id: string) {
    return pb.collection('pdvs').getOne<PDV>(id, { expand: 'client_id' })
  },
}

export const campaignService = {
  async getAll() {
    return pb.collection('campaigns').getFullList<Campaign>({
      sort: '-created',
      expand: 'client_id',
    })
  },
  async getById(id: string) {
    return pb.collection('campaigns').getOne<Campaign>(id, { expand: 'client_id' })
  },
  async create(data: Partial<Campaign>) {
    return pb.collection('campaigns').create<Campaign>(data)
  },
}

export const visitService = {
  async getAll(params?: { filter?: string; sort?: string; page?: number; perPage?: number }) {
    return pb.collection('visits').getList<Visit>(params?.page || 1, params?.perPage || 100, {
      filter: params?.filter || '',
      sort: params?.sort || '-date',
      expand: 'pdv_id,promoter_id',
    })
  },
  async create(data: FormData | Partial<Visit>) {
    return pb.collection('visits').create<Visit>(data)
  },
  async update(id: string, data: FormData | Partial<Visit>) {
    return pb.collection('visits').update<Visit>(id, data)
  },
}

export const incidentService = {
  async getAll(params?: { filter?: string; sort?: string; page?: number; perPage?: number }) {
    return pb.collection('incidents').getList<Incident>(params?.page || 1, params?.perPage || 100, {
      filter: params?.filter || '',
      sort: params?.sort || '-created',
      expand: 'pdv_id,asset_id,promoter_id',
    })
  },
  async create(data: FormData | Partial<Incident>) {
    return pb.collection('incidents').create<Incident>(data)
  },
  async update(id: string, data: Partial<Incident>) {
    return pb.collection('incidents').update<Incident>(id, data)
  },
}

export const notificationService = {
  async getAll(userId: string) {
    return pb.collection('notifications').getList<Notification>(1, 50, {
      filter: `user_id = '${userId}'`,
      sort: '-created',
    })
  },
  async markAsRead(id: string) {
    return pb.collection('notifications').update<Notification>(id, { read: true })
  },
  async markAllAsRead(userId: string) {
    const list = await pb.collection('notifications').getFullList<Notification>({
      filter: `user_id = '${userId}' && read = false`,
    })
    return Promise.all(list.map((n) => pb.collection('notifications').update(n.id, { read: true })))
  },
}

export const assetHistoryService = {
  async getByAssetId(assetId: string) {
    return pb.collection('asset_history').getFullList<AssetHistory>({
      filter: `asset_id = '${assetId}'`,
      sort: '-created',
      expand: 'pdv_id,promoter_id',
    })
  },
  async create(data: FormData | Partial<AssetHistory>) {
    return pb.collection('asset_history').create<AssetHistory>(data)
  },
}

export const routeService = {
  async getForDateAndPromoter(dateStr: string, promoterId: string) {
    const list = await pb.collection('route_plans').getList<RoutePlan>(1, 1, {
      filter: `promoter_id = '${promoterId}' && date ~ '${dateStr}'`,
      sort: '-created',
    })
    return list.items[0] || null
  },
  async saveRoute(data: { date: string; promoter_id: string; pdv_ids: string[] }) {
    const existing = await routeService.getForDateAndPromoter(
      data.date.substring(0, 10),
      data.promoter_id,
    )
    if (existing) {
      return pb.collection('route_plans').update<RoutePlan>(existing.id, {
        pdv_ids: JSON.stringify(data.pdv_ids),
      })
    }
    return pb.collection('route_plans').create<RoutePlan>({
      date: data.date,
      promoter_id: data.promoter_id,
      pdv_ids: JSON.stringify(data.pdv_ids),
    })
  },
}

export const userService = {
  async getAll() {
    return pb.collection('users').getFullList<User>({
      sort: 'name',
    })
  },
}

export const getFileUrl = (
  record: { id: string; collectionId: string; collectionName: string },
  filename?: string,
) => {
  if (!filename) return ''
  return pb.files.getURL(record, filename)
}
