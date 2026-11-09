export interface AdminMembership { user_id: string; role: 'owner' | 'operator' | 'analyst'; active: boolean }
export interface AdminRecord { id: string; housing_request_id: string | null; listing_id: string | null; actor: string | null; created_at: string; action: 'view' | 'contact' | 'review'; result: string; note: string }
export interface MatchDelivery { id: string; housing_request_id: string; listing_id: string; created_at: string; channel: 'web' | 'sms'; status: 'accepted' | 'delivered' | 'failed' | 'unknown'; delivered_at: string | null; read_at: string | null }
