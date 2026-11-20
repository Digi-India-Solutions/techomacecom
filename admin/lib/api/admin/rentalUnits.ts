import type {
  RentalUnit,
  RentalUnitCondition,
  RentalUnitSanitisationLog,
  RentalUnitServiceLog,
  RentalUnitStatus,
} from '@/types/admin';
import { mockDelay } from './client';
import { INITIAL_RENTAL_UNITS } from './mockData';
import { getProductsStore } from './legacyProductStore';

let rentalUnitsStore: RentalUnit[] = structuredClone(INITIAL_RENTAL_UNITS);

export function getRentalUnitsStore(): RentalUnit[] {
  return rentalUnitsStore;
}

export async function listRentalUnits(filters?: {
  search?: string;
  productId?: string;
  status?: 'all' | RentalUnitStatus;
  condition?: 'all' | RentalUnitCondition;
  serviceDueOnly?: boolean;
}): Promise<RentalUnit[]> {
  await mockDelay(130);
  let list = [...rentalUnitsStore];

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (u) =>
        u.unitCode.toLowerCase().includes(q) ||
        u.serialNumber.toLowerCase().includes(q) ||
        u.productName.toLowerCase().includes(q) ||
        (u.currentCustomerName && u.currentCustomerName.toLowerCase().includes(q)) ||
        (u.currentRentalId && u.currentRentalId.toLowerCase().includes(q))
    );
  }

  if (filters?.productId && filters.productId !== 'all') {
    list = list.filter((u) => u.productId === filters.productId);
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((u) => u.status === filters.status);
  }
  if (filters?.condition && filters.condition !== 'all') {
    list = list.filter((u) => u.condition === filters.condition);
  }
  if (filters?.serviceDueOnly) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 14);
    list = list.filter(
      (u) => u.condition === 'needs_service' || new Date(u.nextServiceDue) <= thresholdDate
    );
  }

  return structuredClone(list);
}

export async function getRentalUnitById(id: string): Promise<RentalUnit | null> {
  await mockDelay(110);
  const found = rentalUnitsStore.find((u) => u.id === id);
  return found ? structuredClone(found) : null;
}

export async function createRentalUnit(payload: {
  productId: string;
  serialNumber: string;
  purchaseDate: string;
  condition: RentalUnitCondition;
  notes?: string;
}): Promise<RentalUnit> {
  await mockDelay(180);
  const product = getProductsStore().find((p) => p.id === payload.productId);
  if (!product) throw new Error('Selected product not found');
  if (rentalUnitsStore.some((u) => u.serialNumber.toLowerCase() === payload.serialNumber.trim().toLowerCase())) {
    throw new Error(`Serial number "${payload.serialNumber}" already exists.`);
  }

  const nextService = new Date(payload.purchaseDate || Date.now());
  nextService.setMonth(nextService.getMonth() + 3);
  const unitIdx = rentalUnitsStore.length + 1;

  const created: RentalUnit = {
    id: `ru-${Date.now()}`,
    unitCode: `RU-${product.sku.split('-')[1] || 'EQP'}-${String(unitIdx).padStart(3, '0')}`,
    productId: product.id,
    productName: product.name,
    productImage: product.images[0]?.url || '',
    serialNumber: payload.serialNumber.trim(),
    purchaseDate: payload.purchaseDate,
    condition: payload.condition,
    status: payload.condition === 'needs_service' ? 'under_service' : 'available',
    lastServiceDate: payload.purchaseDate,
    nextServiceDue: nextService.toISOString().slice(0, 10),
    notes: payload.notes || 'Added to fleet inventory.',
    rentalHistory: [],
    serviceLogs: [],
    sanitisationLogs: [],
  };

  rentalUnitsStore = [created, ...rentalUnitsStore];
  return structuredClone(created);
}

export async function bulkAddRentalUnits(payload: {
  productId: string;
  serialNumbers: string[];
  purchaseDate: string;
  condition: RentalUnitCondition;
}): Promise<{ added: RentalUnit[]; skipped: string[] }> {
  await mockDelay(220);
  const product = getProductsStore().find((p) => p.id === payload.productId);
  if (!product) throw new Error('Selected product not found');

  const added: RentalUnit[] = [];
  const skipped: string[] = [];

  for (const rawSn of payload.serialNumbers) {
    const sn = rawSn.trim();
    if (!sn) continue;
    const exists =
      rentalUnitsStore.some((u) => u.serialNumber.toLowerCase() === sn.toLowerCase()) ||
      added.some((u) => u.serialNumber.toLowerCase() === sn.toLowerCase());
    if (exists) {
      skipped.push(sn);
      continue;
    }

    const nextService = new Date(payload.purchaseDate || Date.now());
    nextService.setMonth(nextService.getMonth() + 3);
    const unitNum = rentalUnitsStore.length + added.length + 1;

    added.push({
      id: `ru-${Date.now()}-${unitNum}`,
      unitCode: `RU-${product.sku.split('-')[1] || 'EQP'}-${String(unitNum).padStart(3, '0')}`,
      productId: product.id,
      productName: product.name,
      productImage: product.images[0]?.url || '',
      serialNumber: sn,
      purchaseDate: payload.purchaseDate,
      condition: payload.condition,
      status: payload.condition === 'needs_service' ? 'under_service' : 'available',
      lastServiceDate: payload.purchaseDate,
      nextServiceDue: nextService.toISOString().slice(0, 10),
      notes: 'Bulk registered serial unit.',
      rentalHistory: [],
      serviceLogs: [],
      sanitisationLogs: [],
    });
  }

  rentalUnitsStore = [...added, ...rentalUnitsStore];
  return { added: structuredClone(added), skipped };
}

export async function updateRentalUnit(
  id: string,
  patch: Partial<Pick<RentalUnit, 'condition' | 'status' | 'notes' | 'nextServiceDue'>>
): Promise<RentalUnit> {
  await mockDelay(140);
  const existing = rentalUnitsStore.find((u) => u.id === id);
  if (!existing) throw new Error('Rental unit not found');
  const updated: RentalUnit = { ...existing, ...patch };
  rentalUnitsStore = rentalUnitsStore.map((u) => (u.id === id ? updated : u));
  return structuredClone(updated);
}

export async function addServiceLog(
  unitId: string,
  entry: Omit<RentalUnitServiceLog, 'id'>
): Promise<RentalUnit> {
  await mockDelay(160);
  const existing = rentalUnitsStore.find((u) => u.id === unitId);
  if (!existing) throw new Error('Rental unit not found');

  const log: RentalUnitServiceLog = { ...entry, id: `sl-${Date.now()}` };
  const updated: RentalUnit = {
    ...existing,
    lastServiceDate: entry.date,
    nextServiceDue: entry.nextDueDate || existing.nextServiceDue,
    serviceLogs: [log, ...existing.serviceLogs],
  };

  rentalUnitsStore = rentalUnitsStore.map((u) => (u.id === unitId ? updated : u));
  return structuredClone(updated);
}

export async function addSanitisationLog(
  unitId: string,
  entry: Omit<RentalUnitSanitisationLog, 'id'>
): Promise<RentalUnit> {
  await mockDelay(160);
  const existing = rentalUnitsStore.find((u) => u.id === unitId);
  if (!existing) throw new Error('Rental unit not found');

  const log: RentalUnitSanitisationLog = { ...entry, id: `san-${Date.now()}` };
  const updated: RentalUnit = {
    ...existing,
    sanitisationLogs: [log, ...existing.sanitisationLogs],
  };

  rentalUnitsStore = rentalUnitsStore.map((u) => (u.id === unitId ? updated : u));
  return structuredClone(updated);
}
