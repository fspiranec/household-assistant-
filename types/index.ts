export type Expense = {
  id: string;
  household_id: string;
  created_by: string;
  created_by_name?: string;
  can_edit?: boolean;
  amount: number;
  date: string;
  merchant: string;
  category: string;
  tags: string[] | null;
  notes: string | null;
  parsed_payload: Record<string, unknown> | null;
  is_private: boolean;
};

export type ExpenseItem = {
  id: string;
  expense_id: string;
  name: string;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
};

export type ExpenseFile = {
  id: string;
  expense_id: string;
  path: string;
  bucket: string;
  uploaded_by: string;
  created_at: string;
};

export type ExpenseDetail = Expense & {
  expense_items?: ExpenseItem[];
  expense_files?: ExpenseFile[];
};

export type HouseholdMember = {
  id: string;
  role: string;
  display_name: string;
  email: string;
};

export type Household = {
  id: string;
  name: string;
  current_user_role?: string | null;
  members?: HouseholdMember[];
};

export type ExpensesResponse = {
  data: Expense[];
};

export type ExpenseFilters = {
  start: string;
  end: string;
  category: string;
  tag: string;
  merchant: string;
  exclude_private: boolean;
};

export type HouseholdMemberOption = {
  id: string;
  display_name: string;
};

export type ExpenseMetaResponse = {
  categories: string[];
  tags: string[];
  merchants: string[];
  members: HouseholdMemberOption[];
};
