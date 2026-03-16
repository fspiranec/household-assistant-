export type Expense = {
  id: string;
  household_id: string;
  created_by: string;
  amount: number;
  date: string;
  merchant: string;
  category: string;
  tags: string[] | null;
  notes: string | null;
  parsed_payload: Record<string, unknown> | null;
};
