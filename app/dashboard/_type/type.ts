export interface Budget {
    id: number
    name: string
    amount: number
    icon: string | null
    createdBy: string
    tagCount: number
    totalSpent: number
    expenseCount: number
}

export interface Tag {
    id: number
    name: string
    createdBy: string
    totalSpent: number
    expenseCount: number
}

export interface Expense {
    id: number,
    name: string,
    amount: number,
    createdBy: string,
    date: string,
    tagId: number | null,
    tagName: string
}

export interface Income {
    id: number,
    name: string,
    amount: number,
    createdBy: string,
    date: string,
    category: string
}

export interface Loan {
    id: number;
    createdBy: string;
    lender: string;
    principalAmount: number;
    interestRate: string;
    tenureMonths: number;
    repaymentFrequency: string;
    EMI: number;
    remainingPrincipal: number;
    nextDueDate: string;
    isPaidOff: boolean;
  }
  

  export interface LoanRepayment {
    id: number;
    loanId: number | null;
    createdBy: string;
    scheduledDate: string; // Format: YYYY-MM-DD
    amount: number;
    principalAmount: number;
    interestAmount: number;
    status: string;
  }

  export interface ShoppingPlan {
    id: number;
    createdBy: string;
    planDate: string; // Format: YYYY-MM-DD
    status: "draft" | "ready" | "shopping" | "post_shopping" | "completed";
    createdAt: string;
  }

  export interface ShoppingItem {
    id: number;
    planId: number | null;
    name: string;
    quantity: number;
    uom: string | null; // unit of measure
    needWant: "need" | "want";
    estimatePrice: number;
    actualPrice: number | null;
    isPurchased: boolean;
    isMovedToNext: boolean;
    isOutOfPlan: boolean;
    createdAt: string;
  }

  export interface ShoppingPlanWithItems extends ShoppingPlan {
    items: ShoppingItem[];
    totalEstimate: number;
    totalActual: number;
    verdict?: "under_budget" | "on_budget" | "over_budget";
    planNumber?: number;
  }
  