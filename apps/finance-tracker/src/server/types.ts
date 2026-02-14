export interface JwtPayload {
  id: number;
  username: string;
}

export interface BalanceCards {
  currentBalance: number;
  expectedBalance: number;
  deficitExcess: number;
}

export interface WorkspaceResponse {
  workspace: {
    id: number;
    balance: number;
    cycleStartDay: number | null;
    cycleEndDay: number | null;
  };
  items: Array<{
    id: number;
    type: string;
    label: string;
    amount: number;
    dayOfMonth: number;
    isPaid: boolean;
  }>;
  balanceCards: BalanceCards;
  cycleLabel: string | null;
  permission: string;
}
