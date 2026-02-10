import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Mock transaction type
type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
};

// Generate mock data for a given month
function getMockTransactions(year: number, month: number): Transaction[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const incomeCategories = [
    "Registration",
    "Sponsors",
    "Merchandise",
    "Donations",
    "Concessions",
  ];
  const expenseCategories = [
    "Venue",
    "Equipment",
    "Prizes",
    "Marketing",
    "Admin",
    "Referees",
  ];
  const txs: Transaction[] = [];
  let id = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (d % 3 === 0) {
      txs.push({
        id: `i-${id++}`,
        type: "income",
        amount: 200 + Math.floor(Math.random() * 800),
        category: incomeCategories[Math.floor(Math.random() * incomeCategories.length)],
        date,
      });
    }
    if (d % 2 === 0) {
      txs.push({
        id: `e-${id++}`,
        type: "expense",
        amount: 50 + Math.floor(Math.random() * 400),
        category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
        date,
      });
    }
  }
  return txs;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const INCOME_COLORS = ["#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];
const EXPENSE_COLORS = ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2", "#fef2f2"];

const cashflowChartConfig = {
  income: { label: "Income", color: "hsl(142, 76%, 36%)" },
  expense: { label: "Expense", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig;

export default function MonthlyOverview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const transactions = useMemo(
    () => getMockTransactions(year, month),
    [year, month]
  );

  const { income, expense, gross, incomeByCategory, expenseByCategory, cashflowByWeek } =
    useMemo(() => {
      const incomeTotal = transactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expenseTotal = transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

      const incByCat: Record<string, number> = {};
      const expByCat: Record<string, number> = {};
      transactions.forEach((t) => {
        if (t.type === "income") {
          incByCat[t.category] = (incByCat[t.category] ?? 0) + t.amount;
        } else {
          expByCat[t.category] = (expByCat[t.category] ?? 0) + t.amount;
        }
      });

      const weekBuckets: Record<number, { income: number; expense: number }> = {};
      transactions.forEach((t) => {
        const d = new Date(t.date);
        const day = d.getDate();
        const week = Math.min(4, Math.ceil(day / 7));
        if (!weekBuckets[week]) weekBuckets[week] = { income: 0, expense: 0 };
        if (t.type === "income") weekBuckets[week].income += t.amount;
        else weekBuckets[week].expense += t.amount;
      });
      const cashflowByWeek = [1, 2, 3, 4].map((w) => ({
        week: `Week ${w}`,
        income: weekBuckets[w]?.income ?? 0,
        expense: weekBuckets[w]?.expense ?? 0,
      }));

      const incomeByCategory = Object.entries(incByCat)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      const expenseByCategory = Object.entries(expByCat)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        income: incomeTotal,
        expense: expenseTotal,
        gross: incomeTotal - expenseTotal,
        incomeByCategory,
        expenseByCategory,
        cashflowByWeek,
      };
    },
    [transactions]
  );

  const incomeChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    incomeByCategory.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color: INCOME_COLORS[i % INCOME_COLORS.length],
      };
    });
    return config;
  }, [incomeByCategory]);

  const expenseChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    expenseByCategory.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
      };
    });
    return config;
  }, [expenseByCategory]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = MONTHS.map((label, i) => ({ value: String(i + 1), label }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Monthly overview, <span className="italic text-purple-500">{MONTHS[month - 1]}</span>
              </h1>
              <p className="text-sm text-muted-foreground">Income, expenses & cashflow</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {/* Month / Year selectors */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Month</span>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Year</span>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 3 cards: Income, Expense, Gross */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">
                ${income.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expense
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                ${expense.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gross
              </CardTitle>
              <Minus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${gross >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                ${gross.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cashflow graph */}
        <Card>
          <CardHeader>
            <CardTitle>Cashflow — Income vs Expense</CardTitle>
            <p className="text-sm text-muted-foreground">
              {MONTHS[month - 1]} {year} by week
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cashflowChartConfig} className="h-[280px] w-full">
              <BarChart data={cashflowByWeek} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Two columns: Income (pie + list) | Expense (pie + list) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income column */}
          <Card>
            <CardHeader>
              <CardTitle>Income by category</CardTitle>
              <p className="text-sm text-muted-foreground">Pie chart and list (highest to lowest)</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="min-h-[240px] w-full lg:min-w-[240px]">
                {incomeByCategory.length > 0 ? (
                  <ChartContainer config={incomeChartConfig} className="h-[240px] w-full aspect-square">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={incomeByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        strokeWidth={1}
                      >
                        {incomeByCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={INCOME_COLORS[i % INCOME_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    No income data
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">By category (highest → lowest)</p>
                <ul className="space-y-1.5">
                  {incomeByCategory.map((item, i) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full mr-2"
                        style={{ backgroundColor: INCOME_COLORS[i % INCOME_COLORS.length] }}
                      />
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="tabular-nums text-emerald-600">
                        ${item.value.toLocaleString()}
                      </span>
                    </li>
                  ))}
                  {incomeByCategory.length === 0 && (
                    <li className="py-4 text-center text-sm text-muted-foreground">
                      No income this month
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Expense column */}
          <Card>
            <CardHeader>
              <CardTitle>Expense by category</CardTitle>
              <p className="text-sm text-muted-foreground">Pie chart and list (highest to lowest)</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="min-h-[240px] w-full lg:min-w-[240px]">
                {expenseByCategory.length > 0 ? (
                  <ChartContainer config={expenseChartConfig} className="h-[240px] w-full aspect-square">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={expenseByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        strokeWidth={1}
                      >
                        {expenseByCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    No expense data
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">By category (highest → lowest)</p>
                <ul className="space-y-1.5">
                  {expenseByCategory.map((item, i) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full mr-2"
                        style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }}
                      />
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="tabular-nums text-red-600">
                        ${item.value.toLocaleString()}
                      </span>
                    </li>
                  ))}
                  {expenseByCategory.length === 0 && (
                    <li className="py-4 text-center text-sm text-muted-foreground">
                      No expenses this month
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
