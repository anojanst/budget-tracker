"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { sql, eq } from "drizzle-orm";
import { db } from "@/utils/dbConfig";
import { Budgets, Expenses, Tags } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF"];

const BudgetPieChart = () => {
    const {user} = useUser()
  const [data, setData] = useState<{ name: string; totalSpent: number }[]>([]);

  const getBudgetSpending = async (createdBy: string) => {
    // Get budget spending
    const budgetData = await db
      .select({
        name: Budgets.name,
        totalSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("totalSpent"),
      })
      .from(Budgets)
      .leftJoin(Tags, sql`${Tags.budgetId} = ${Budgets.id}`)
      .leftJoin(Expenses, sql`${Expenses.tagId} = ${Tags.id}`)
      .where(eq(Expenses.createdBy, createdBy))
      .groupBy(Budgets.name);
  
    // Get savings total (contributions are recorded as expenses with "Savings:" prefix)
    const savingsData = await db
      .select({
        totalSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("totalSpent"),
      })
      .from(Expenses)
      .where(
        sql`${Expenses.createdBy} = ${createdBy} AND ${Expenses.name} LIKE 'Savings:%'`
      );

    const cleanedData = budgetData
      .map((item) => ({
        name: item.name || "Uncategorized",
        totalSpent: Number(item.totalSpent),
      }))
      .filter((item) => item.totalSpent > 0);

    // Add savings if there are any
    const savingsTotal = Number(savingsData[0]?.totalSpent || 0);
    if (savingsTotal > 0) {
      cleanedData.push({
        name: "Savings",
        totalSpent: savingsTotal,
      });
    }

    console.log(cleanedData);
    return cleanedData;
  };

  useEffect(() => {
    const fetchData = async () => {
      const budgets = await getBudgetSpending(user?.primaryEmailAddress?.emailAddress!);
      setData(budgets);
    };

    user && fetchData();
  }, [user]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="totalSpent" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default BudgetPieChart;
