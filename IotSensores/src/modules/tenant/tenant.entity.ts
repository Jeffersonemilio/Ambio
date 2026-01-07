export interface Tenant {
  id: string;
  name: string;
  document: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTenantDTO {
  name: string;
  document: string;
  email: string;
}

export interface UpdateTenantDTO {
  name?: string;
  document?: string;
  email?: string;
  is_active?: boolean;
}
