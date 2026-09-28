import { ROLES } from "./constants";

export type Role = keyof typeof ROLES;

const permissions: Record<string, string[]> = {
  // Customer permissions
  "customer:create": [ROLES.SALES_DEALER, ROLES.MARKETING, ROLES.ADMIN_BACKOFFICE],
  "customer:read": [ROLES.SALES_DEALER, ROLES.MARKETING, ROLES.ATASAN_MARKETING, ROLES.ADMIN_BACKOFFICE],
  "customer:update": [ROLES.SALES_DEALER, ROLES.MARKETING, ROLES.ADMIN_BACKOFFICE],

  // Application permissions
  "application:create": [ROLES.SALES_DEALER, ROLES.MARKETING],
  "application:read-own": [ROLES.SALES_DEALER, ROLES.MARKETING],
  "application:read-all": [ROLES.ATASAN_MARKETING, ROLES.ADMIN_BACKOFFICE],
  "application:update": [ROLES.MARKETING, ROLES.ADMIN_BACKOFFICE],
  "application:submit": [ROLES.MARKETING],
  "application:approve": [ROLES.ATASAN_MARKETING],

  // Document permissions
  "document:upload": [ROLES.SALES_DEALER, ROLES.MARKETING],
  "document:upload-signed": [ROLES.MARKETING],
  "document:read": [ROLES.SALES_DEALER, ROLES.MARKETING, ROLES.ATASAN_MARKETING, ROLES.ADMIN_BACKOFFICE],
  "document:delete": [ROLES.MARKETING, ROLES.ADMIN_BACKOFFICE],

  // Contract permissions
  "contract:generate": [ROLES.MARKETING],
  "contract:read": [ROLES.MARKETING, ROLES.ATASAN_MARKETING, ROLES.ADMIN_BACKOFFICE],
  "contract:approve": [ROLES.ATASAN_MARKETING, ROLES.ADMIN_BACKOFFICE],

  // Monitoring
  "monitoring:read": [ROLES.ADMIN_BACKOFFICE, ROLES.ATASAN_MARKETING],
};

export function hasPermission(role: string, action: string): boolean {
  const allowed = permissions[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function canReadApplication(role: string, userId: string, createdById: string, assignedMarketingId: string | null): boolean {
  if (role === ROLES.ATASAN_MARKETING || role === ROLES.ADMIN_BACKOFFICE) return true;
  if (role === ROLES.SALES_DEALER && createdById === userId) return true;
  if (role === ROLES.MARKETING && (createdById === userId || assignedMarketingId === userId)) return true;
  return false;
}
