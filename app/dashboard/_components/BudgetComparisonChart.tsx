'use client'
import { db } from "@/utils/dbConfig";
import { Budgets, Expenses, Tags } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { sql, eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const BudgetComparisonChart = () => {
    const { user } = useUser()

    const [budgetData, setBudgetData] = useState<any[]>([]);
    const getBudgetComparisonData = async (userEmail: string) => {
        const data = await db
            .select({
                name: Budgets.name,
                amount: Budgets.amount,
                totalAmountSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("total_amount_spent"),
            })
            .from(Budgets)
            .leftJoin(Expenses, eq(Expenses.budgetId, Budgets.id))
            .where(eq(Budgets.createdBy, userEmail))
            .groupBy(Budgets.name, Budgets.amount);

        return data;
    };
    useEffect(() => {
        const fetchData = async () => {
            const data = await getBudgetComparisonData(user?.primaryEmailAddress?.emailAddress!);
            // Truncate budget names to 3 letters
            const truncatedData = data.map(item => ({
                ...item,
                name: item.name.substring(0, 4)
            }));
            setBudgetData(truncatedData);
        };

        user && fetchData();
    }, [user]);

    return (
            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={budgetData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    {/* <Legend /> */}
                    <Bar dataKey="amount" fill="#8884d8" barSize={10} name="Budget Amount" />
                    <Bar dataKey="totalAmountSpent" fill="#82ca9d" barSize={10} name="Spent Amount" />
                </BarChart>
            </ResponsiveContainer>
    );
};

export default BudgetComparisonChart;
