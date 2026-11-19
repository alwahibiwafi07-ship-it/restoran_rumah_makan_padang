//bentuk data yang dikirim backend

export type Role = "ADMIN" | "CASHIER";
export type Channel = "DINE_IN" | "TAKEAWAY";
export type PaymentMethod = "CASH" | "QRIS";
export type TransactionStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export type User = {
    id: string;
    name: string;
    email: string;
    role: Role;
};

export type UserAccount = User & {
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type Category = {
    id: string;
    code: string;
    name: string;
    sortOrder: number;
    _count?: {menus: number};
};

export type Menu = {
    id: string;
    code: string;
    name: string;
    price: number;
    trackStock: boolean;
    stockQty: number | null;
    categoryId: string;
    archivedAt: string | null;
    category: {id: string; code: string; name: string};
};

export type StockLog = {
    id: string;
    type: "SALE" | "ADD" | "REDUCE";
    change: number;
    stockAfter: number;
    reason: string | null;
    note: string | null;
    createdAt: string;
    user: {id: string; name: string};
    transaction: {id: string; ticketNo: number} | null;
};

export type TransactionItem = {
    id: string;
    menuId: string;
    nameSnapshot: string;
    priceSnapshot: number;
    qty: number;
    lineTotal: number;
};

export type Transaction = {
    id: string;
    clientRef: string;
    businessDate: string;
    ticketNo: number;
    ticket: string;
    channel: Channel;
    paymentMethod: PaymentMethod;
    status: TransactionStatus;
    subtotal: number;
    takeoutFee: number;
    tax: number;
    rounding: number;
    total: number;
    cashReceived: number | null;
    changeAmount: number | null;
    midtransOrderId: string | null;
    qrUrl: string | null;
    expiresAt: string | null;
    paidAt: string | null;
    createdAt: string;
    cashier: {id: string; name: string};
    items: TransactionItem[];
};

export type DashboardToday = {
    date: string;
    transactionCount: number;
    revenue: number;
    byMethod: {method: PaymentMethod; count: number; total: number}[];
    topMenus: {menuId: string; name: string; qty: number; total: number}[];
    lowStock: {id: string; code: string; name: string; stockQty: number; status: "HABIS" | "MENIPIS"}[];
    recentTransactions: (Omit<Transaction, "items">)[];
};
