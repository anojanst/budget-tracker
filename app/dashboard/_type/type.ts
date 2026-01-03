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
    budgetId: number | null,
    tagId: number | null,
    tagName: string | null,
    budgetName: string | null
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

  export interface SavingGoal {
    id: number;
    createdBy: string;
    title: string;
    targetAmount: number;
    targetDate: string; // Format: YYYY-MM-DD
    createdAt: string;
  }

  export interface SavingContribution {
    id: number;
    goalId: number | null;
    createdBy: string;
    amount: number;
    date: string; // Format: YYYY-MM-DD
    expenseId: number | null;
    createdAt: string;
  }

  export interface SavingGoalWithContributions extends SavingGoal {
    contributions: SavingContribution[];
    totalSaved: number;
    progress: number; // percentage
    remainingAmount: number;
  }
  