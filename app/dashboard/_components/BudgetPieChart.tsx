"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { sql, eq } from "drizzle-orm";
import { db } from "@/utils/dbConfig";
import { Budgets, Expenses, Tags } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";

const COLORS = [
  "#3B82F6", // Blue - vibrant and professional
  "#10B981", // Emerald - fresh and modern
  "#F59E0B", // Amber - warm and inviting
  "#EF4444", // Red - attention-grabbing
  "#8B5CF6", // Purple - elegant
  "#EC4899", // Pink - vibrant
  "#06B6D4", // Cyan - cool and modern
  "#84CC16", // Lime - fresh
  "#F97316", // Orange - energetic
  "#6366F1", // Indigo - sophisticated
  "#14B8A6", // Teal - calming
  "#A855F7", // Violet - rich
];

const BudgetPieChart = () => {
    const {user} = useUser()
    const [data, setData] = useState<{ name: string; totalSpent: number }[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        
        if (typeof window !== 'undefined') {
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    }, []);

  const getBudgetSpending = async (createdBy: string) => {
    // Get budget spending using budgetId directly
    const budgetData = await db
      .select({
        name: Budgets.name,
        totalSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("totalSpent"),
      })
      .from(Budgets)
      .leftJoin(Expenses, eq(Expenses.budgetId, Budgets.id))
      .where(eq(Budgets.createdBy, createdBy))
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

    // Sort by totalSpent descending (show all categories, but limit display in budget comparison)
    const sortedData = cleanedData.sort((a, b) => b.totalSpent - a.totalSpent);
    const displayData = sortedData; // Show all categories in pie chart

    console.log(displayData);
    return displayData;
  };

  useEffect(() => {
    const fetchData = async () => {
      const budgets = await getBudgetSpending(user?.primaryEmailAddress?.emailAddress!);
      setData(budgets);
    };

    user && fetchData();
  }, [user, isMobile]);

  // Reduced by 15%: height 360 -> 306, outerRadius 150 -> 127.5
  // Adjusted to prevent collision with legends
  const chartHeight = 306;
  const outerRadius = isMobile ? 100 : 110; // Smaller radius to leave space for labels and legend

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart margin={{ top: 10, right: 10, bottom: 60, left: 10 }}>
          <Pie 
            data={data} 
            dataKey="totalSpent" 
            nameKey="name" 
            cx="50%" 
            cy={isMobile ? "45%" : "40%"} 
            outerRadius={outerRadius} 
            label={isMobile 
              ? ({ percent }) => `${(percent * 100).toFixed(0)}%`
              : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            iconSize={10}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BudgetPieChart;
