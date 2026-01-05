'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FDResult {
    maturityAmount: number;
    totalInterest: number;
    schedule: { year: number; principal: number; interest: number; total: number }[];
}

// Function to Calculate Fixed Deposit
const calculateFD = (
    principal: number,
    annualRate: number,
    tenure: number,
    compoundingFrequency: number
): FDResult => {
    const r = annualRate / 100;
    const n = compoundingFrequency;
    const t = tenure;

    // Maturity Amount = P * (1 + r/n)^(n*t)
    const maturityAmount = principal * Math.pow(1 + (r / n), n * t);
    const totalInterest = maturityAmount - principal;

    // Yearly breakdown
    const schedule: { year: number; principal: number; interest: number; total: number }[] = [];
    for (let year = 1; year <= tenure; year++) {
        const yearTotal = principal * Math.pow(1 + (r / n), n * year);
        const yearInterest = yearTotal - principal;
        schedule.push({
            year,
            principal: principal,
            interest: parseFloat(yearInterest.toFixed(2)),
            total: parseFloat(yearTotal.toFixed(2)),
        });
    }

    return {
        maturityAmount: parseFloat(maturityAmount.toFixed(2)),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        schedule,
    };
};

export default function FDCalculator() {
    const [principal, setPrincipal] = useState<string>('');
    const [interestRate, setInterestRate] = useState<string>('6');
    const [tenure, setTenure] = useState<string>('1');
    const [compounding, setCompounding] = useState<string>('4');
    const [result, setResult] = useState<FDResult | null>(null);

    const handleCalculate = () => {
        const principalValue = parseFloat(principal) || 0;
        const interestRateValue = parseFloat(interestRate) || 0;
        const tenureValue = parseFloat(tenure) || 0;
        const compoundingValue = parseInt(compounding, 10);

        if (principalValue <= 0 || interestRateValue <= 0 || tenureValue <= 0) {
            return;
        }

        const details = calculateFD(principalValue, interestRateValue, tenureValue, compoundingValue);
        setResult(details);
    };

    return (
        <div className="w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto">
            <div className='mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold'>Fixed Deposit Calculator</h2>
                <p className='text-sm text-muted-foreground mt-1'>Calculate your FD maturity amount and interest earnings</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                {/* Input Section */}
                <div className="w-full lg:w-1/2 p-4 md:p-5 border rounded-lg bg-card">
                    <h3 className="text-base md:text-lg font-semibold mb-4">FD Details</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Principal Amount</label>
                            <Input 
                                type="number" 
                                value={principal} 
                                onChange={(e) => setPrincipal(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter principal amount"
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
                            <label className="text-sm font-medium mb-2 block">Tenure (Years)</label>
                            <Input 
                                type="number" 
                                value={tenure} 
                                onChange={(e) => setTenure(e.target.value)} 
                                className="h-9 md:h-10"
                                placeholder="Enter tenure in years"
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
                                    <SelectItem value="12">Monthly</SelectItem>
                                    <SelectItem value="4">Quarterly</SelectItem>
                                    <SelectItem value="2">Semi-Annually</SelectItem>
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
                        <h3 className="text-base md:text-lg font-semibold mb-4">FD Calculation Results</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Principal Amount</div>
                                <div className='text-sm md:text-base font-semibold text-right'>{parseFloat(principal).toLocaleString()}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Total Interest</div>
                                <div className='text-sm md:text-base font-semibold text-green-600 text-right'>{result.totalInterest.toLocaleString()}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-t-2 border-b-2 border-primary'>
                                <div className="text-sm md:text-base font-semibold">Maturity Amount</div>
                                <div className='text-sm md:text-base font-bold text-green-600 text-right'>{result.maturityAmount.toLocaleString()}</div>
                            </div>
                        </div>

                        <h3 className="text-base md:text-lg font-semibold mb-3">Yearly Breakdown</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs md:text-sm">Year</TableHead>
                                        <TableHead className='text-right text-xs md:text-sm'>Principal</TableHead>
                                        <TableHead className='text-right text-xs md:text-sm'>Interest</TableHead>
                                        <TableHead className='text-right text-xs md:text-sm'>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.schedule.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-xs md:text-sm">{row.year}</TableCell>
                                            <TableCell className='text-right text-xs md:text-sm'>{row.principal.toLocaleString()}</TableCell>
                                            <TableCell className='text-right text-xs md:text-sm'>{row.interest.toLocaleString()}</TableCell>
                                            <TableCell className='text-right text-xs md:text-sm'>{row.total.toLocaleString()}</TableCell>
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

