export type UserRole = 'Gestor' | 'Promotor' | 'admin'

export interface User {
  id: string
  email: string
  name?: string
  full_name?: string
  role?: UserRole
  avatar?: string
  created: string
  updated: string
}

export interface Client {
  id: string
  name: string
  document?: string
  contact_email?: string
  created: string
  updated: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface PDV {
  id: string
  name: string
  address?: string
  coordinates?: string | Coordinates
  client_id?: string
  segment?: 'Food' | 'Beverage' | 'Personal Care' | 'Other'
  status?: 'Ativo' | 'Inativo'
  created: string
  updated: string
  expand?: {
    client_id?: Client
  }
}

export type AssetCategory = 'MPDV' | 'DISPLAY' | 'ESTRUTURA' | 'PONTA DE GONDOLA'
export type AssetStatus = 'Instalado' | 'Em trânsito' | 'Em base' | 'Desinstalado' | 'Em manutenção'
export type AssetCondition = 'Otimo' | 'Bom' | 'Regular' | 'Ruim' | 'Manutencao'

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  qr_code: string
  description?: string
  image?: string
  status: AssetStatus
  condition?: AssetCondition
  current_pdv_id?: string
  campaign_id?: string
  created: string
  updated: string
  expand?: {
    current_pdv_id?: PDV
    campaign_id?: Campaign
  }
}

export interface Campaign {
  id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  status?: 'Planejada' | 'Ativa' | 'Encerrada'
  client_id?: string
  roi_estimate?: number
  created: string
  updated: string
  expand?: {
    client_id?: Client
  }
}

export interface ChecklistItem {
  label: string
  checked: boolean
  negative?: boolean
  photos?: string[]
}

export interface Visit {
  id: string
  date: string
  pdv_id: string
  promoter_id: string
  checkin_at?: string
  checkout_at?: string
  status?: 'Planejada' | 'Em andamento' | 'Concluida' | 'Cancelada' | 'Atrasada'
  checklist?: string | ChecklistItem[]
  photos?: string[]
  notes?: string
  created: string
  updated: string
  expand?: {
    pdv_id?: PDV
    promoter_id?: User
  }
}

export interface Incident {
  id: string
  title: string
  type?: 'Ruptura' | 'Material danificado' | 'Queda de estrutura' | 'PDV nao executado' | 'Outro'
  severity?: 'Baixa' | 'Media' | 'Alta' | 'Critica'
  status?: 'Aberta' | 'Em analise' | 'Resolvida'
  pdv_id: string
  asset_id?: string
  promoter_id?: string
  description?: string
  photos?: string[]
  resolution_notes?: string
  resolved_at?: string
  created: string
  updated: string
  expand?: {
    pdv_id?: PDV
    asset_id?: Asset
    promoter_id?: User
  }
}

export interface Notification {
  id: string
  user_id: string
  title?: string
  body?: string
  type?: 'Incident' | 'Visit' | 'Asset' | 'System'
  read?: boolean
  data?: any
  created: string
  updated: string
}

export interface AssetHistory {
  id: string
  asset_id: string
  action: 'Positivacao' | 'Desinstalacao' | 'Manutencao' | 'Auditoria'
  pdv_id?: string
  promoter_id?: string
  photo?: string
  notes?: string
  created: string
  updated: string
  expand?: {
    asset_id?: Asset
    pdv_id?: PDV
    promoter_id?: User
  }
}

export interface RoutePlan {
  id: string
  date: string
  promoter_id: string
  pdv_ids?: string | string[]
  created: string
  updated: string
  expand?: {
    promoter_id?: User
  }
}
