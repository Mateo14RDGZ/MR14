import type { ProjectInstallment } from "./types";

/**
 * Compara lo efectivamente pagado (amount_paid, la suma real de payments)
 * contra el monto acumulado de cada cuota del plan, para saber cuáles ya
 * están cubiertas — sin necesidad de marcar nada a mano.
 */
export function installmentsWithStatus(installments: ProjectInstallment[], amountPaid: number) {
  let cumulative = 0;
  let nextAssigned = false;
  return installments.map((inst) => {
    cumulative += inst.amount;
    const paid = amountPaid >= cumulative - 0.01;
    const isNext = !paid && !nextAssigned;
    if (isNext) nextAssigned = true;
    return { ...inst, paid, isNext };
  });
}
