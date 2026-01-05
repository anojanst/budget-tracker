'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const taxBrackets = {
    sriLanka: [
        { limit: 150000, rate: 0 },
        { limit: 233333, rate: 6 },
        { limit: 275000, rate: 12 },
        { limit: 316667, rate: 18 },
        { limit: 358333, rate: 24 },
        { limit: 400000, rate: 30 },
        { limit: Infinity, rate: 36 },
    ],
    newZealand: [
        { limit: 1175, rate: 10.5 },
        { limit: 4000, rate: 17.5 },
        { limit: 6000, rate: 30 },
        { limit: 15000, rate: 33 },
        { limit: Infinity, rate: 39 },
    ],
};

// Salary Frequency Multipliers
const frequencyMultipliers: Record<string, number> = {
    weekly: 4.33, // Approximate weeks per month
    biMonthly: 2, // Two payments per month
    monthly: 1,
    annually: 1 / 12, // Convert annual salary to monthly
};

// Function to Calculate Tax Based on Brackets
const calculateTax = (salary: number, country: 'sriLanka' | 'newZealand', isForeignIncome: boolean) => {
    if (salary <= 0) return { totalTax: 0, breakdown: [] };

    if (country === 'sriLanka' && isForeignIncome) {
        // Apply Flat 15% Tax for Foreign Income in Sri Lanka
        const taxAmount = (salary * 15) / 100;
        return {
            totalTax: taxAmount,
            breakdown: [{ range: "Flat 15% (Foreign Income)", taxableAmount: salary, taxAmount: taxAmount }]
        };
    }

    // Apply Progressive Tax Rates for Local Income (Sri Lanka) or New Zealand
    const brackets = taxBrackets[country];
    let tax = 0;
    let previousLimit = 0;
    let breakdown: { range: string; taxableAmount: number; taxAmount: number }[] = [];

    for (const { limit, rate } of brackets) {
        if (salary > previousLimit) {
            const taxableAmount = Math.min(salary, limit) - previousLimit;
            const taxAmount = (taxableAmount * rate) / 100;
            tax += taxAmount;
            breakdown.push({
                range: `${previousLimit.toLocaleString()} - ${limit === Infinity ? 'Above' : limit.toLocaleString()}`,
                taxableAmount: taxableAmount,
                taxAmount: taxAmount,
            });
        }
        previousLimit = limit;

        if (salary <= limit) break;
    }

    return { totalTax: tax, breakdown };
};

export default function TaxCalculator() {
    const [country, setCountry] = useState<'sriLanka' | 'newZealand'>('sriLanka');
    const [salary, setSalary] = useState<string>('');
    const [frequency, setFrequency] = useState<'weekly' | 'biMonthly' | 'monthly' | 'annually'>('monthly');
    const [isForeignIncome, setIsForeignIncome] = useState<boolean>(false);
    const [taxDetails, setTaxDetails] = useState<{ totalTax: number; breakdown: any[] } | null>(null);
    const [convertedSalary, setConvertedSalary] = useState<number>(0);

    const handleCalculate = () => {
        const salaryValue = parseFloat(salary) || 0;
        const monthlySalary = salaryValue * frequencyMultipliers[frequency];
        setConvertedSalary(monthlySalary);

        const taxData = calculateTax(monthlySalary, country, isForeignIncome);
        setTaxDetails(taxData);
    };

    return (
        <div className="w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto">
            <div className='mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold'>Tax Calculator</h2>
                <p className='text-sm text-muted-foreground mt-1'>Calculate your tax liability based on income and country</p>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                {/* Input Section */}
                <div className='w-full lg:w-1/2 p-4 md:p-5 border rounded-lg bg-card'>
                    <h3 className="text-base md:text-lg font-semibold mb-4">Input Details</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Select Country</label>
                            <Select value={country} onValueChange={(value) => setCountry(value as 'sriLanka' | 'newZealand')}>
                                <SelectTrigger className="w-full h-9 md:h-10">
                                    <SelectValue placeholder="Select a country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sriLanka">🇱🇰 Sri Lanka</SelectItem>
                                    <SelectItem value="newZealand">🇳🇿 New Zealand</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Enter Salary</label>
                            <Input
                                type="number"
                                placeholder="Enter salary"
                                value={salary}
                                onChange={(e) => setSalary(e.target.value)}
                                className="w-full h-9 md:h-10"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Payment Frequency</label>
                            <Select value={frequency} onValueChange={(value) => setFrequency(value as 'weekly' | 'biMonthly' | 'monthly' | 'annually')}>
                                <SelectTrigger className="w-full h-9 md:h-10">
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="biMonthly">Bi-Monthly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="annually">Annually</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {country === "sriLanka" && (
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    checked={isForeignIncome}
                                    onChange={() => setIsForeignIncome(!isForeignIncome)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm">Is this Foreign Income? (Flat 15% tax applies)</label>
                            </div>
                        )}

                        <Button onClick={handleCalculate} className="w-full mt-4 h-9 md:h-10">
                            Calculate Tax
                        </Button>
                    </div>
                </div>

                {/* Results Section */}
                {taxDetails && (
                    <div className='w-full lg:w-1/2 p-4 md:p-5 border rounded-lg bg-card'>
                        <h3 className="text-base md:text-lg font-semibold mb-4">Tax Calculation Details</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Gross Monthly Salary</div>
                                <div className='text-sm md:text-base font-semibold text-right'>{convertedSalary.toLocaleString()}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-b'>
                                <div className="text-sm md:text-base">Total Tax Payable</div>
                                <div className='text-sm md:text-base font-semibold text-red-600 text-right'>- {taxDetails.totalTax.toLocaleString()}</div>
                            </div>
                            <div className='flex gap-2 items-center justify-between py-2 border-t-2 border-b-2 border-primary'>
                                <div className="text-sm md:text-base font-semibold">Net Income After Tax</div>
                                <div className='text-sm md:text-base font-bold text-green-600 text-right'>{(convertedSalary - taxDetails.totalTax).toLocaleString()}</div>
                            </div>
                        </div>

                        <h3 className="text-base md:text-lg font-semibold mb-3">Tax Breakdown by Bracket</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs md:text-sm">Income Range</TableHead>
                                        <TableHead className='text-right text-xs md:text-sm'>Taxable Amount</TableHead>
                                        <TableHead className='text-right text-xs md:text-sm'>Tax Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {taxDetails.breakdown.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-xs md:text-sm">{row.range}</TableCell>
                                            <TableCell className='text-right text-xs md:text-sm'>{row.taxableAmount.toLocaleString()}</TableCell>
                                            <TableCell className='text-right text-xs md:text-sm'>{row.taxAmount.toLocaleString()}</TableCell>
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
