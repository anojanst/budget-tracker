'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CompoundResult {
    finalAmount: number;
    totalInterest: number;
    schedule: { month: number; total: number; interest: number }[];
}

const calculateCompoundInterest = (
    principal: number,
    rate: number,
    years: number,
    frequency: number,
    monthlyContribution: number
): CompoundResult => {
    const r = rate / 100;
    const n = frequency;

    let balance = principal;
    const schedule: { month: number; total: number; interest: number }[] = [];
    let totalInterest = 0;

    for (let i = 1; i <= years * 12; i++) {
        let interestEarned = balance * (r / n);
        balance += interestEarned;
        balance += monthlyContribution;
        totalInterest += interestEarned;

        if (i % 12 === 0) {
            schedule.push({
                month: i,
                total: parseFloat(balance.toFixed(2)),
                interest: parseFloat(totalInterest.toFixed(2))
            });
        }
    }

    return {
        finalAmount: parseFloat(balance.toFixed(2)),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        schedule,
    };
};

export default function CompoundCalculator() {
    const [principal, setPrincipal] = useState<string>('');
    const [interestRate, setInterestRate] = useState<string>('5');
    const [years, setYears] = useState<string>('10');
    const [compounding, setCompounding] = useState<string>('12');
    const [monthlyContribution, setMonthlyContribution] = useState<string>('100');
    const [result, setResult] = useState<CompoundResult | null>(null);
    const [showSchedule, setShowSchedule] = useState<boolean>(false);

    const handleCalculate = () => {
        const principalValue = parseFloat(principal) || 0;
        const interestRateValue = parseFloat(interestRate) || 0;
        const yearsValue = parseFloat(years) || 0;
        const monthlyContributionValue = parseFloat(monthlyContribution) || 0;
        const frequency = parseInt(compounding, 10);
        const details = calculateCompoundInterest(principalValue, interestRateValue, yearsValue, frequency, monthlyContributionValue);
        setResult(details);
        setShowSchedule(false);
    };

    const totalInvestment = (parseFloat(principal) || 0) + ((parseFloat(monthlyContribution) || 0) * (parseFloat(years) || 0) * 12);

    return (
        <div className="w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto">
            <div className='mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold'>Compound Interest Calculator</h2>
                <p className='text-sm text-muted-foreground mt-1'>Calculate your investment growth with compound interest</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                {/* Input Section */}
                <div className="w-full lg:w-1/2 p-4 md:p-5 border rounded-lg bg-card">
                    <h3 className="text-base md:text-lg font-semibold mb-4">Investment Details</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Initial Investment</label>
                            <Input 
                                type="number" 
                                value={principal} 
                                onChange={(e) => setPrincipal(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter initial amount"
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
                            <label className="text-sm font-medium mb-2 block">Number of Years</label>
                            <Input 
                                type="number" 
                                value={years} 
                                onChange={(e) => setYears(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter number of years"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Monthly Contribution</label>
                            <Input 
                                type="number" 
                                value={monthlyContribution} 
                                onChange={(e) => setMonthlyContribution(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter monthly contribution"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Compounding Frequency</label>
                            <Select value={compounding} onValueChange={setCompounding}>
                                <SelectTrigger className="w-full h-9 md:h-10">
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="365">Daily</SelectItem>
                                    <SelectItem value="52">Weekly</SelectItem>
                                    <SelectItem value="12">Monthly</SelectItem>
                                    <SelectItem value="4">Quarterly</SelectItem>
                                    <SelectItem value="1">Annually</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleCalculate} className="w-full mt-3 h-9 md:h-10">Calculate</Button>
                    </div>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="w-full lg:w-1/2 p-4 md:p-5 border rounded-lg bg-card">
                        <h3 className="text-base md:text-lg font-semibold mb-4">Investment Growth Over Time</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Total Investment</div>
                                <div className='text-sm md:text-base font-semibold text-right'>{totalInvestment.toFixed(2)}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Total Interest</div>
                                <div className='text-sm md:text-base font-semibold text-green-600 text-right'>{result.totalInterest.toFixed(2)}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-t-2 border-b-2 border-primary'>
                                <div className="text-sm md:text-base font-semibold">Total (Principal + Interest)</div>
                                <div className='text-sm md:text-base font-bold text-green-600 text-right'>{result.finalAmount.toFixed(2)}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Growth</div>
                                <div className='text-sm md:text-base font-semibold text-blue-600 text-right'>
                                    {totalInvestment > 0 ? ((result.totalInterest / totalInvestment) * 100).toFixed(2) : '0.00'}%
                                </div>
                            </div>
                        </div>

                        <h3 className="text-base md:text-lg font-semibold mb-3">Yearly Breakdown</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs md:text-sm">Year</TableHead>
                                        <TableHead className='text-right text-xs md:text-sm'>Total Amount</TableHead>
                                        <TableHead className='text-right text-xs md:text-sm'>Interest Earned</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.schedule.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-xs md:text-sm">{row.month/12}</TableCell>
                                            <TableCell className='text-right text-xs md:text-sm'>{row.total.toFixed(2)}</TableCell>
                                            <TableCell className='text-right text-xs md:text-sm'>{row.interest.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
