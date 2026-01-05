"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { sql, eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/utils/dbConfig";
import { Incomes, Expenses, BalanceHistory } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { startOfMonth, format, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";

const IncomeExpenseBalanceChart = ({ count }: { count: number }) => {
    const [data, setData] = useState<{ date: string; income: number; expense: number; balance: number }[]>([]);
    const [maxValue, setMaxValue] = useState<number>(100);
    const [period, setPeriod] = useState<string>("month");

    const { user } = useUser();

    const getFinancialData = async (userEmail: string, period: string) => {
        const today = new Date();
        let startDate = startOfMonth(today);
        if (period === "year") {
            startDate = startOfYear(today);
        }
    
        const formattedToday = format(today, "yyyy-MM-dd");
        const formattedStartDate = format(startDate, "yyyy-MM-dd");
    
        const data = await db
            .select({
                date: BalanceHistory.date,
                income: BalanceHistory.totalIncome,
                expense: BalanceHistory.totalExpense,
                balance: BalanceHistory.balance,
            })
            .from(BalanceHistory)
            .where(
                and(
                    eq(BalanceHistory.createdBy, userEmail),
                    gte(BalanceHistory.date, formattedStartDate),
                    lte(BalanceHistory.date, formattedToday)
                )
            )
            .orderBy(BalanceHistory.date);
    
        console.log("Fetched Data:", data);
    
        const max = Math.max(...data.map(item => Math.max(item.income, item.expense, item.balance)));
        setMaxValue(max > 100 ? max : 100); // Prevent very small Y-axis
    
        return data;
    };
    

    const fetchData = async () => {
        if (user) {
            const financialData = await getFinancialData(user.primaryEmailAddress?.emailAddress!, period);
            setData(financialData);
        }
    };

    useEffect(() => {
        if (user && period) fetchData();
    }, [user, period]);

    useEffect(() => {
        fetchData();
    }, [count]);

    return (
        <div className="w-full h-[340px] justify-start items-start">
            <div className="flex justify-end items-center p-3 gap-2">
                <Button
                    onClick={() => setPeriod("month")}
                    variant="outline"
                    className={`h-8 ${period === "month" && "bg-primary text-white"}`}
                >
                    This Month
                </Button>
                <Button
                    onClick={() => setPeriod("year")}
                    variant="outline"
                    className={`h-8 ${period === "year" && "bg-primary text-white"}`}
                >
                    This Year
                </Button>
            </div>

            <ResponsiveContainer width="100%" height={290}>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) =>
                            new Date(date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })
                        }
                        padding={{ left: 10, right: 10 }}
                    />

                    <YAxis domain={[0, maxValue]} allowDecimals={false} />

                    <Tooltip
                        formatter={(value, name) => [`$${value}`, name]}
                        labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                    />

                    {/* Income Line - Green */}
                    <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#34D399" // Green color
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Total Income"
                    />

                    {/* Expense Line - Red */}
                    <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#EF4444" // Red color
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Total Expenses"
                    />

                    {/* Balance Line - Blue */}
                    <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#4F46E5" // Blue color
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Balance"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default IncomeExpenseBalanceChart;
