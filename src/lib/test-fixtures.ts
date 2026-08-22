import type { Transaction } from "./types";

let nextId = 0;

export function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: nextId++,
    date: new Date(2024, 0, 1),
    payee: "PAYEE",
    debit: 0,
    credit: 0,
    balance: null,
    currency: "EUR",
    ...overrides,
  };
}
