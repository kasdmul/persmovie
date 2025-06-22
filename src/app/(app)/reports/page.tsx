
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useStore, store, type Employee } from '@/lib/store';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { endOfMonth, endOfYear, getYear, startOfYear } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  Homme: {
    label: 'Hommes',
    color: 'hsl(var(--primary))',
  },
  Femme: {
    label: 'Femmes',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;


function parseFlexibleDate(dateString: string): Date | null {
  if (!dateString) return null;
  const trimmedDateString = dateString.trim();

  // Try dd/MM/yyyy format first
  const parts = trimmedDateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Basic validation for dd/MM/yyyy
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const d = new Date(year, month - 1, day);
        // Check if the created date is valid and matches the input parts
        if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
            return d;
        }
    }
  }

  // Fallback for other formats that new Date() can handle
  try {
    const d = new Date(trimmedDateString);
    if (!isNaN(d.getTime())) {
      return d;
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return null;
}


const aggregateDataByDimension = (employees: Employee[], dimension: 'entite' | 'departement' | 'lieuTravail') => {
  const aggregation = employees.reduce((acc, employee) => {
    const key = employee[dimension];
    if (key && key !== 'N/A') {
      if (!acc[key]) {
        acc[key] = { name: key, Homme: 0, Femme: 0 };
      }
      if (employee.sexe === 'Homme') {
        acc[key].Homme += 1;
      } else if (employee.sexe === 'Femme') {
        acc[key].Femme += 1;
      }
    }
    return acc;
  }, {} as Record<string, { name: string; Homme: number; Femme: number }>);

  return Object.values(aggregation).sort((a,b) => a.name.localeCompare(b.name));
};

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader></Card>
      <Skeleton className="h-[400px] w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  useStore();
  const [isClient, setIsClient] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState<string>(new Date().getFullYear().toString());
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    store.employees.forEach(e => {
      const hireDate = parseFlexibleDate(e.dateEmbauche);
      if (hireDate) years.add(getYear(hireDate));
      if (e.dateDepart) {
        const departureDate = parseFlexibleDate(e.dateDepart);
        if (departureDate) years.add(getYear(departureDate));
      }
    });
    const allYears = Array.from(years).sort((a, b) => b - a);
    if (!allYears.includes(new Date().getFullYear())) {
        allYears.unshift(new Date().getFullYear());
    }
    return allYears;
  }, [store.employees]);
  
  if (!isClient) {
    return <ReportsSkeleton />;
  }
  
  const yearNumber = parseInt(selectedYear, 10);
  
  const employeesActiveInYear = store.employees.filter(e => {
      const hireDate = parseFlexibleDate(e.dateEmbauche);
      if (!hireDate || getYear(hireDate) > yearNumber) return false;
      if (e.status === 'Parti') {
          const departureDate = parseFlexibleDate(e.dateDepart || '');
          if (departureDate && getYear(departureDate) < yearNumber) return false;
      }
      return true;
  });

  const monthlyData = (() => {
    if (isNaN(yearNumber)) return [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    return monthNames.map((name, index) => {
        const monthEndDate = endOfMonth(new Date(yearNumber, index, 1));
        const activeThisMonth = store.employees.filter(e => {
            const hireDate = parseFlexibleDate(e.dateEmbauche);
            if (!hireDate || hireDate > monthEndDate) return false;
            if (e.status === 'Parti') {
                const departureDate = parseFlexibleDate(e.dateDepart || '');
                if (departureDate && departureDate < monthEndDate) {
                    return false;
                }
            }
            return true;
        });

        return {
            name,
            Homme: activeThisMonth.filter(e => e.sexe === 'Homme').length,
            Femme: activeThisMonth.filter(e => e.sexe === 'Femme').length,
        }
    });
  })();

  const dataByEntity = aggregateDataByDimension(employeesActiveInYear, 'entite');
  const dataByDepartment = aggregateDataByDimension(employeesActiveInYear, 'departement');
  const dataByWorkLocation = aggregateDataByDimension(employeesActiveInYear, 'lieuTravail');

  const renderChart = (data: typeof dataByEntity, title: string, description: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {data.length > 0 ? (
          <div className="h-[350px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={data} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  allowDecimals={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend content={<ChartLegendContent />} />
                <Bar
                  dataKey="Homme"
                  fill="var(--color-Homme)"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="Femme"
                  fill="var(--color-Femme)"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée disponible pour ce rapport.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <div>
                        <CardTitle>Filtres des Rapports</CardTitle>
                        <CardDescription>Sélectionnez une année pour filtrer tous les rapports ci-dessous.</CardDescription>
                    </div>
                    <div className='w-48'>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une année" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Effectif Mensuel par Sexe</CardTitle>
            <CardDescription>Évolution du nombre d'hommes et de femmes actifs chaque mois pour l'année {selectedYear}.</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
             {monthlyData.some(m => m.Homme > 0 || m.Femme > 0) ? (
              <div className="h-[350px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={monthlyData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      allowDecimals={false}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Legend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="Homme"
                      fill="var(--color-Homme)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Femme"
                      fill="var(--color-Femme)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <p className="text-muted-foreground">Aucune donnée disponible pour l'année {selectedYear}.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {renderChart(dataByEntity, `Répartition par Entité (${selectedYear})`, `Nombre d'employés par entité, ventilé par sexe pour l'année ${selectedYear}.`)}
            {renderChart(dataByDepartment, `Répartition par Département (${selectedYear})`, `Nombre d'employés par département, ventilé par sexe pour l'année ${selectedYear}.`)}
            <div className="xl:col-span-2">
                {renderChart(dataByWorkLocation, `Répartition par Lieu de Travail (${selectedYear})`, `Nombre d'employés par lieu de travail, ventilé par sexe pour l'année ${selectedYear}.`)}
            </div>
        </div>
    </div>
  );
}
