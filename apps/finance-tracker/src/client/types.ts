export interface User {
  id: string;
  username: string;
  displayName: string;
}

export type ItemType = 'INCOME' | 'CREDIT_CARD' | 'LOAN_PAYMENT' | 'RENT' | 'OTHER';

export type Permission = 'OWNER' | 'MEMBER' | 'VIEWER';

export interface Item {
  id: string;
  type: ItemType;
  label: string;
  amount: number;
  dayOfMonth: number;
  isPaid: boolean;
}

export interface BalanceCards {
  currentBalance: number;
  expectedBalance: number;
  deficitExcess: number;
}

export interface WorkspaceData {
  workspace: {
    id: string;
    balance: number;
    cycleStartDay: number;
    cycleEndDay: number;
  };
  items: Item[];
  balanceCards: BalanceCards;
  cycleLabel: string;
  permission: Permission;
}

export interface Member {
  userId: string;
  username: string;
  displayName: string;
  permission: Permission;
}

export interface SharedWorkspace {
  workspaceId: string;
  ownerDisplayName: string;
  permission: Permission;
}

export interface CreateItemData {
  workspaceId: string;
  type: ItemType;
  label: string;
  amount: number;
  dayOfMonth: number;
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  INCOME: 'Income',
  CREDIT_CARD: 'Credit Card',
  LOAN_PAYMENT: 'Loan Payment',
  RENT: 'Rent',
  OTHER: 'Other',
};

export const ITEM_TYPE_IS_INCOME: Record<ItemType, boolean> = {
  INCOME: true,
  CREDIT_CARD: false,
  LOAN_PAYMENT: false,
  RENT: false,
  OTHER: false,
};
