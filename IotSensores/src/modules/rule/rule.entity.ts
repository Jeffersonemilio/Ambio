export type RuleType = 'TEMPERATURE' | 'HUMIDITY' | 'BATTERY';
export type RuleCondition = 'ABOVE' | 'BELOW' | 'BETWEEN' | 'OUTSIDE';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Rule {
  id: string;
  tenant_id: string;
  sensor_id: string | null;
  name: string;
  type: RuleType;
  condition: RuleCondition;
  threshold_min: number | null;
  threshold_max: number | null;
  severity: AlertSeverity;
  is_active: boolean;
  cooldown_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRuleDTO {
  tenant_id: string;
  sensor_id?: string | null;
  name: string;
  type: RuleType;
  condition: RuleCondition;
  threshold_min?: number | null;
  threshold_max?: number | null;
  severity?: AlertSeverity;
  cooldown_minutes?: number;
}

export interface UpdateRuleDTO {
  name?: string;
  type?: RuleType;
  condition?: RuleCondition;
  threshold_min?: number | null;
  threshold_max?: number | null;
  severity?: AlertSeverity;
  is_active?: boolean;
  cooldown_minutes?: number;
}

export interface RuleFilters {
  tenant_id?: string;
  sensor_id?: string;
  type?: RuleType;
  is_active?: boolean;
}
