'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EMIResult {
    EMI: number;
    totalInterest: number;
    totalRepayment: number;
    schedule: { month: number; principalPaid: number; interestPaid: number; remainingBalance: number }[];
}

// Function to Calculate EMI and Amortization Schedule
const calculateEMI = (principal: number, annualRate: number, tenure: number): EMIResult => {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) {
        const equalEMI = principal / tenure;
        return {
            EMI: equalEMI,
            totalInterest: 0,
            totalRepayment: principal,
            schedule: Array.from({ length: tenure }, (_, i) => ({
                month: i + 1,
                principalPaid: equalEMI,
                interestPaid: 0,
                remainingBalance: principal - equalEMI * (i + 1),
            })),
        };
    }

    const EMI = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    const totalRepayment = EMI * tenure;
    const totalInterest = totalRepayment - principal;

    let remainingBalance = principal;
    const schedule = [];

    for (let i = 1; i <= tenure; i++) {
        const interestPaid = remainingBalance * monthlyRate;
        const principalPaid = EMI - interestPaid;
        remainingBalance -= principalPaid;

        schedule.push({
            month: i,
            principalPaid: parseFloat(principalPaid.toFixed(2)),
            interestPaid: parseFloat(interestPaid.toFixed(2)),
            remainingBalance: parseFloat(remainingBalance.toFixed(2)),
        });
    }

    return {
        EMI: parseFloat(EMI.toFixed(2)),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        totalRepayment: parseFloat(totalRepayment.toFixed(2)),
        schedule,
    };
};

export default function EMICalculator() {
    const [principal, setPrincipal] = useState<string>('50000');
    const [interestRate, setInterestRate] = useState<string>('10');
    const [tenure, setTenure] = useState<string>('24');
    const [emiDetails, setEmiDetails] = useState<EMIResult | null>(null);
    const [showReport, setShowReport] = useState<boolean>(false);

    const handleCalculate = () => {
        const principalValue = parseFloat(principal) || 0;
        const interestRateValue = parseFloat(interestRate) || 0;
        const tenureValue = parseInt(tenure) || 0;
        const details: EMIResult = calculateEMI(principalValue, interestRateValue, tenureValue);
        setEmiDetails(details);
        setShowReport(false); // Reset report view on new calculation
    };

    return (
        <div className="w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto">
            <div className='mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold'>EMI Calculator</h2>
                <p className='text-sm text-muted-foreground mt-1'>Calculate your Equated Monthly Installment and repayment schedule</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                {/* Input Section */}
                <div className="w-full lg:w-1/2 p-4 md:p-5 border rounded-lg bg-card">
                    <h3 className="text-base md:text-lg font-semibold mb-4">Loan Details</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Loan Amount</label>
                            <Input 
                                type="number" 
                                value={principal} 
                                onChange={(e) => setPrincipal(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter loan amount"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Annual Interest Rate (%)</label>
                            <Input 
                                type="number" 
                                value={interestRate} 
                                onChange={(e) => setInterestRate(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter interest rate"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Loan Tenure (Months)</label>
                            <Input 
                                type="number" 
                                value={tenure} 
                                onChange={(e) => setTenure(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter tenure in months"
                            />
                        </div>
                        <Button onClick={handleCalculate} className="w-full mt-3 h-9 md:h-10">
                            Calculate EMI
                        </Button>
                    </div>
                </div>

                {/* EMI Results Section */}
                {emiDetails && (
                    <div className='w-full lg:w-1/2 p-4 md:p-5 border rounded-lg bg-card'>
                        <h3 className="text-base md:text-lg font-semibold mb-4">EMI Calculation Results</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Monthly EMI</div>
                                <div className='text-sm md:text-base font-semibold text-right'>{emiDetails.EMI.toLocaleString()}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Total Interest Payable</div>
                                <div className='text-sm md:text-base font-semibold text-red-600 text-right'>{emiDetails.totalInterest.toLocaleString()}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-t-2 border-b-2 border-primary'>
                                <div className="text-sm md:text-base font-semibold">Total Repayment Amount</div>
                                <div className='text-sm md:text-base font-bold text-green-600 text-right'>{emiDetails.totalRepayment.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Show EMI Breakdown Button */}
                        <Button onClick={() => setShowReport(!showReport)} className="w-full mb-4 h-9 md:h-10">
                            {showReport ? "Hide EMI Report" : "View Detailed EMI Report"}
                        </Button>

                        {showReport && emiDetails && (
                            <>
                                <h3 className="text-base md:text-lg font-semibold mb-3">EMI Breakdown</h3>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs md:text-sm">Month</TableHead>
                                                <TableHead className='text-right text-xs md:text-sm'>Principal Paid</TableHead>
                                                <TableHead className='text-right text-xs md:text-sm'>Interest Paid</TableHead>
                                                <TableHead className='text-right text-xs md:text-sm'>Remaining Balance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {emiDetails.schedule.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="text-xs md:text-sm">{row.month}</TableCell>
                                                    <TableCell className='text-right text-xs md:text-sm'>{row.principalPaid.toLocaleString()}</TableCell>
                                                    <TableCell className='text-right text-xs md:text-sm'>{row.interestPaid.toLocaleString()}</TableCell>
                                                    <TableCell className='text-right text-xs md:text-sm'>{row.remainingBalance.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
