
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

  try {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10)
      );
      if (!isNaN(d.getTime())) {
        if (
          d.getFullYear() === parseInt(parts[2], 10) &&
          d.getMonth() === parseInt(parts[1], 10) - 1 &&
          d.getDate() === parseInt(parts[0], 10)
        ) {
          return d;
        }
      }
    }
  } catch (e) {
    /* ignore parse error */
  }

  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d;
    }
  } catch (e) {
    /* ignore parse error */
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

export default function ReportsPage() {
  useStore();

  const [selectedYear, setSelectedYear] = React.useState<string>(new Date().getFullYear().toString());

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());

    store.employees.forEach(e => {
      const hireDate = parseFlexibleDate(e.dateEmbauche);
      if (hireDate) years.add(getYear(hireDate));
      if (e.dateDepart) {
        const departureDate = parseFlexibleDate(e.dateDepart);
        if (departureDate) years.add(getYear(departureDate));
      }
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }, [store.employees]);
  
  const yearNumber = parseInt(selectedYear, 10);
  
  const employeesActiveInYear = React.useMemo(() => {
    if (isNaN(yearNumber)) return [];
    const yearStartDate = startOfYear(new Date(yearNumber, 0, 1));
    const yearEndDate = endOfYear(new Date(yearNumber, 0, 1));

    return store.employees.filter(e => {
        const hireDate = parseFlexibleDate(e.dateEmbauche);
        if (!hireDate || hireDate > yearEndDate) {
            return false;
        }
        if (e.status === 'Parti') {
            const departureDate = parseFlexibleDate(e.dateDepart || '');
            if (departureDate && departureDate < yearStartDate) {
                return false;
            }
        }
        return true;
    });
  }, [store.employees, yearNumber]);

  const monthlyData = React.useMemo(() => {
    if (isNaN(yearNumber)) return [];
    const monthNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
    ];
    
    return monthNames.map((name, index) => {
        const monthEndDate = endOfMonth(new Date(yearNumber, index, 1));
        const activeThisMonth = store.employees.filter(e => {
            const hireDate = parseFlexibleDate(e.dateEmbauche);
            if (!hireDate || hireDate > monthEndDate) {
                return false;
            }
            if (e.status === 'Parti') {
                const departureDate = parseFlexibleDate(e.dateDepart || '');
                if (departureDate && departureDate <= monthEndDate) {
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
  }, [store.employees, yearNumber]);

  const dataByEntity = React.useMemo(() => aggregateDataByDimension(employeesActiveInYear, 'entite'), [employeesActiveInYear]);
  const dataByDepartment = React.useMemo(() => aggregateDataByDimension(employeesActiveInYear, 'departement'), [employeesActiveInYear]);
  const dataByWorkLocation = React.useMemo(() => aggregateDataByDimension(employeesActiveInYear, 'lieuTravail'), [employeesActiveInYear]);

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
