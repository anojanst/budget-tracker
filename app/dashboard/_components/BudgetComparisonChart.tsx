'use client'
import { db } from "@/utils/dbConfig";
import { Budgets, Expenses, Tags } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { sql, eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const BudgetComparisonChart = () => {
    const { user } = useUser()
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            
            // Sort by amount descending and take top 4 on mobile
            const sortedData = data.sort((a, b) => b.amount - a.amount);
            const displayData = isMobile ? sortedData.slice(0, 4) : sortedData;
            
            // Truncate budget names to 4 letters
            const truncatedData = displayData.map(item => ({
                ...item,
                name: item.name.substring(0, 4)
            }));
            setBudgetData(truncatedData);
        };

        user && fetchData();
    }, [user, isMobile]);

    return (
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={budgetData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                    />
                    <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        iconSize={12}
                    />
                    <Bar 
                        dataKey="amount" 
                        fill="#6366F1" 
                        barSize={40} 
                        name="Budget Amount"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                        dataKey="totalAmountSpent" 
                        fill="#10B981" 
                        barSize={40} 
                        name="Spent Amount"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
    );
};

export default BudgetComparisonChart;
