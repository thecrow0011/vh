import { FuelLog, MaintenanceRecord, VehicleDocument, AppNotification, Vehicle } from '../types';

export function formatKm(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km)) return '0 km';
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(km))} km`;
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0,00 DA';
  return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} DA`;
}

export function formatDateFr(dateStr: string | undefined | null): string {
  if (!dateStr) return 'Date inconnue';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDaysDifference(targetDateStr: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = targetDateStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

export function getDocumentStatus(doc: VehicleDocument): {
  status: 'expired' | 'urgent' | 'warning' | 'valid';
  daysLeft: number;
  label: string;
} {
  const daysLeft = getDaysDifference(doc.expiryDate);

  if (daysLeft < 0) {
    return {
      status: 'expired',
      daysLeft,
      label: `Expiré depuis ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? 's' : ''}`,
    };
  }
  if (daysLeft <= 15) {
    return {
      status: 'urgent',
      daysLeft,
      label: daysLeft === 0 ? "Expire aujourd'hui" : `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
    };
  }
  if (daysLeft <= (doc.notifyDaysBefore || 45)) {
    return {
      status: 'warning',
      daysLeft,
      label: `Expire dans ${daysLeft} jours`,
    };
  }
  return {
    status: 'valid',
    daysLeft,
    label: `Valide (${daysLeft} jours)`,
  };
}

export function calculateFuelMetrics(logs: FuelLog[]): {
  processedLogs: FuelLog[];
  avgConsumption: number;
  totalSpent: number;
  totalLiters: number;
  avgPricePerLiter: number;
  totalDistanceTracked: number;
} {
  // Sort logs chronologically (and by mileage if same date)
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.mileage - b.mileage
  );

  let totalSpent = 0;
  let totalLiters = 0;
  let totalDistanceTracked = 0;
  let totalLitersConsumed = 0;
  let consumptionSum = 0;
  let consumptionCount = 0;

  const processedLogs: FuelLog[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = { ...sorted[i] };
    totalSpent += current.totalCost;
    totalLiters += current.liters;

    if (i > 0) {
      const prev = sorted[i - 1]; // Enregistrement N-1 (Enregistrement 1)
      const dist = current.mileage - prev.mileage; // Kilomètres rajoutés / parcourus de l'Enregistrement N (Enregistrement 2)
      if (dist > 0) {
        current.distanceSinceLast = dist;
        totalDistanceTracked += dist;
        totalLitersConsumed += prev.liters; // Volume consommé sur cette distance = Volume Enr N-1

        // Nouvelle formule demandée :
        // Consommation = Enregistrement_1[Volume_Carburant] / Enregistrement_2[Kilomètres_Rajoutés]
        // Consommation (L/100km) = (Volume_Enr1 / Distance_Enr2) * 100
        const l100km = (prev.liters / dist) * 100;
        if (l100km > 0.5 && l100km < 50) { // Contrôle de cohérence
          current.consumption = Number(l100km.toFixed(2));
          consumptionSum += l100km;
          consumptionCount++;
        }
      }
    } else {
      // Ignorer le calcul pour le tout premier enregistrement (pas d'enregistrement N-1 précédent)
      current.consumption = undefined;
      current.distanceSinceLast = undefined;
    }
    processedLogs.push(current);
  }

  // Reverse so newest first for display (et par kilométrage décroissant si même date)
  processedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.mileage - a.mileage);

  // Global weighted average consumption: (total litres consommés / distance totale suivie) * 100
  let avgConsumption = 0;
  if (totalDistanceTracked > 0 && totalLitersConsumed > 0) {
    avgConsumption = Number(((totalLitersConsumed / totalDistanceTracked) * 100).toFixed(2));
  } else if (consumptionCount > 0) {
    avgConsumption = Number((consumptionSum / consumptionCount).toFixed(2));
  }

  const avgPricePerLiter = totalLiters > 0 ? Number((totalSpent / totalLiters).toFixed(3)) : 0;

  return {
    processedLogs,
    avgConsumption,
    totalSpent,
    totalLiters: Number(totalLiters.toFixed(1)),
    avgPricePerLiter,
    totalDistanceTracked,
  };
}

export function computeMaintenanceStatus(
  record: MaintenanceRecord,
  currentMileage: number,
  fallbackIntervalKm: number = 15000
): {
  isDue: boolean;
  isOverdue: boolean;
  isSoon: boolean;
  kmRemaining?: number;
  daysRemaining?: number;
  reason: string;
  percentUsed: number;
  statusLabel: string;
  targetLabel: string;
  subLabel: string;
} {
  let isDue = false;
  let isOverdue = false;
  let isSoon = false;
  let kmRemaining: number | undefined;
  let daysRemaining: number | undefined;
  const reasons: string[] = [];
  let percentUsed = 0;
  let statusLabel = '';
  let targetLabel = '';
  let subLabel = '';

  if (record.nextDueMileage) {
    const totalInterval = Math.max(500, record.nextDueMileage - record.mileage);
    const kmElapsed = Math.max(0, currentMileage - record.mileage);
    kmRemaining = record.nextDueMileage - currentMileage;

    if (kmRemaining <= 0) {
      isOverdue = true;
      percentUsed = 100;
      reasons.push(`Dépassement de ${formatKm(Math.abs(kmRemaining))}`);
      statusLabel = `Retard de ${formatKm(Math.abs(kmRemaining))}`;
    } else {
      percentUsed = Math.min(100, Math.max(0, Math.round((kmElapsed / totalInterval) * 100)));
      if (kmRemaining <= 1500) {
        isDue = true;
        isSoon = true;
        reasons.push(`À prévoir dans ${formatKm(kmRemaining)}`);
      }
      statusLabel = `Dans ${formatKm(kmRemaining)}`;
    }

    targetLabel = `Échéance à ${formatKm(record.nextDueMileage)}`;
    if (record.nextDueDate) {
      targetLabel += ` (${formatDateFr(record.nextDueDate)})`;
    }
    subLabel = `+${formatKm(kmElapsed)} parcourus sur ${formatKm(totalInterval)}`;
  } else if (record.nextDueDate) {
    daysRemaining = getDaysDifference(record.nextDueDate);
    const baselineTime = new Date(record.date).getTime();
    const targetTime = new Date(record.nextDueDate).getTime();
    const totalDays = Math.max(1, Math.round((targetTime - baselineTime) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.round((Date.now() - baselineTime) / (1000 * 60 * 60 * 24)));

    if (daysRemaining < 0) {
      isOverdue = true;
      percentUsed = 100;
      reasons.push(`Échéance dépassée de ${Math.abs(daysRemaining)} j`);
      statusLabel = `Retard de ${Math.abs(daysRemaining)} j`;
    } else {
      percentUsed = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
      if (daysRemaining <= 30) {
        isDue = true;
        isSoon = true;
        reasons.push(`Échéance dans ${daysRemaining} j`);
      }
      statusLabel = `Dans ${daysRemaining} j`;
    }

    targetLabel = `Échéance : ${formatDateFr(record.nextDueDate)}`;
    subLabel = `${daysElapsed} j écoulés sur ${totalDays} j`;
  } else {
    // Neither set: use fallbackIntervalKm
    const totalInterval = fallbackIntervalKm;
    const kmElapsed = Math.max(0, currentMileage - record.mileage);
    kmRemaining = totalInterval - kmElapsed;

    if (kmRemaining <= 0) {
      isOverdue = true;
      percentUsed = 100;
      reasons.push(`Dépassement de ${formatKm(Math.abs(kmRemaining))}`);
      statusLabel = `Retard de ${formatKm(Math.abs(kmRemaining))}`;
    } else {
      percentUsed = Math.min(100, Math.max(0, Math.round((kmElapsed / totalInterval) * 100)));
      if (kmRemaining <= 1500) {
        isDue = true;
        isSoon = true;
        reasons.push(`À prévoir dans ${formatKm(kmRemaining)}`);
      }
      statusLabel = `Dans ${formatKm(kmRemaining)}`;
    }

    targetLabel = `Intervalle conseillé : ${formatKm(record.mileage + totalInterval)}`;
    subLabel = `+${formatKm(kmElapsed)} parcourus sur ${formatKm(totalInterval)}`;
  }

  // Cross-check date overdue if both were set
  if (record.nextDueDate && record.nextDueMileage) {
    const dRem = getDaysDifference(record.nextDueDate);
    daysRemaining = dRem;
    if (dRem < 0 && !isOverdue) {
      isOverdue = true;
      statusLabel = `Retard date (${Math.abs(dRem)} j)`;
    } else if (dRem <= 30) {
      isSoon = true;
      isDue = true;
    }
  }

  return {
    isDue: isDue || isOverdue,
    isOverdue,
    isSoon: isSoon || isDue || isOverdue,
    kmRemaining,
    daysRemaining,
    reason: reasons.join(' • ') || (isOverdue ? statusLabel : 'À jour'),
    percentUsed,
    statusLabel,
    targetLabel,
    subLabel,
  };
}

export function generateAppNotifications(
  vehicle: Vehicle,
  documents: VehicleDocument[],
  maintenance: MaintenanceRecord[]
): AppNotification[] {
  const notifs: AppNotification[] = [];

  // 1. Documents notifications
  documents.forEach((doc) => {
    const { status, daysLeft } = getDocumentStatus(doc);
    if (status === 'expired') {
      notifs.push({
        id: `notif-doc-${doc.id}`,
        type: 'document_expiry',
        title: `${doc.title} EXPIRÉ`,
        message: `Ce document a expiré depuis ${Math.abs(daysLeft)} jour(s). Risque d'amende ou défaut de couverture !`,
        severity: 'urgent',
        dueDate: doc.expiryDate,
        targetTab: 'documents',
        targetId: doc.id,
      });
    } else if (status === 'urgent') {
      notifs.push({
        id: `notif-doc-${doc.id}`,
        type: 'document_expiry',
        title: `Échéance proche : ${doc.title}`,
        message: `Expire dans ${daysLeft} jour(s). Pensez à renouveler votre document sans attendre.`,
        severity: 'urgent',
        dueDate: doc.expiryDate,
        targetTab: 'documents',
        targetId: doc.id,
      });
    } else if (status === 'warning') {
      notifs.push({
        id: `notif-doc-${doc.id}`,
        type: 'document_expiry',
        title: `Rappel : ${doc.title}`,
        message: `Renouvellement à anticiper dans ${daysLeft} jours.`,
        severity: 'warning',
        dueDate: doc.expiryDate,
        targetTab: 'documents',
        targetId: doc.id,
      });
    }
  });

  // 2. Maintenance notifications
  maintenance.forEach((m) => {
    const status = computeMaintenanceStatus(m, vehicle.currentMileage);
    if (status.isOverdue) {
      notifs.push({
        id: `notif-maint-${m.id}`,
        type: 'maintenance_overdue',
        title: `Entretien en retard : ${m.title}`,
        message: status.reason,
        severity: 'urgent',
        targetTab: 'entretien',
        targetId: m.id,
      });
    } else if (status.isDue) {
      notifs.push({
        id: `notif-maint-${m.id}`,
        type: 'maintenance_due',
        title: `Entretien imminent : ${m.title}`,
        message: status.reason,
        severity: 'warning',
        targetTab: 'entretien',
        targetId: m.id,
      });
    }
  });

  return notifs;
}
