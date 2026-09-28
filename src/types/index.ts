export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  nik: string;
  name: string;
  placeOfBirth: string;
  dateOfBirth: string;
  maritalStatus: string;
  spouseName?: string;
  address: string;
  phone: string;
  email?: string;
  createdAt: string;
  _count?: { applications: number };
}

export interface CreditApplication {
  id: string;
  applicationNumber: string;
  customerId: string;
  customer: Customer;
  createdById: string;
  createdBy: User;
  assignedMarketingId?: string;
  assignedMarketing?: User;
  status: string;
  dealerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleType: string;
  vehicleYear: number;
  vehicleColor: string;
  vehiclePrice: number;
  downPayment: number;
  loanAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  insurance: number;
  totalLoanCost: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  documents?: ApplicationDocument[];
  approvalHistories?: ApprovalHistory[];
  statusHistories?: StatusHistory[];
  contract?: Contract;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  storageName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  status: string;
  uploadedById: string;
  uploadedBy: User;
  uploadedAt: string;
  notes?: string;
}

export interface Contract {
  id: string;
  applicationId: string;
  documentNumber: string;
  documentType: string;
  filePath?: string;
  fileName?: string;
  status: string;
  generatedAt: string;
  approvedAt?: string;
}

export interface ApprovalHistory {
  id: string;
  applicationId: string;
  approverId: string;
  approver: User;
  action: string;
  note?: string;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  applicationId: string;
  oldStatus?: string;
  newStatus: string;
  changedById: string;
  changedBy: User;
  note?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
