
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Briefcase,
  Building,
  UserMinus,
  UserPlus,
  Users,
  Percent,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useStore, type Employee } from '@/lib/store';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { addMonths, differenceInDays, format, differenceInMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Parses a date string from various common formats. More robustly.
 * @param dateString The date string to parse.
 * @returns A Date object or null if parsing fails.
 */
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

const chartConfig = {
  Entrées: {
    label: 'Entrées',
    color: 'hsl(var(--primary))',
  },
  Sorties: {
    label: 'Sorties',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[108px] rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[108px] rounded-lg" />
        <Skeleton className="h-[108px] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-[380px] rounded-lg" />
      </div>
    </div>
  );
}

// All hooks must be called at the top level, unconditionally.
export default function DashboardPage() {
  const { isLoaded, store } = useStore();
  const [clientData, setClientData] = React.useState<any>(null);

  React.useEffect(() => {
    if (isLoaded) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const newHiresThisYearList = store.employees.filter((employee) => {
          const hireDate = parseFlexibleDate(employee.dateEmbauche);
          return hireDate ? hireDate.getFullYear() === currentYear : false;
        });
        const departuresThisYearList = store.employees.filter((employee) => {
          if (employee.status !== 'Parti') return false;
          const departureDate = parseFlexibleDate(employee.dateDepart || '');
          return departureDate ? departureDate.getFullYear() === currentYear : false;
        });
        
        const newHiresThisMonth = newHiresThisYearList.filter((employee) => {
          const hireDate = parseFlexibleDate(employee.dateEmbauche);
          return hireDate ? hireDate.getMonth() === currentMonth : false;
        }).length;

        const departuresThisMonth = departuresThisYearList.filter((employee) => {
          if (employee.status !== 'Parti') return false;
          const departureDate = parseFlexibleDate(employee.dateDepart || '');
          return departureDate ? departureDate.getMonth() === currentMonth : false;
        }).length;

        const activeEmployees = store.employees.filter((e) => e.status === 'Actif');
        const totalEmployees = activeEmployees.length;
        const newHiresThisYear = newHiresThisYearList.length;
        const departuresThisYear = departuresThisYearList.length;

        const employeesAtStartOfYear = totalEmployees - newHiresThisYear + departuresThisYear;
        const averageEmployeesYear = (employeesAtStartOfYear + totalEmployees) / 2;
        const employeesAtStartOfMonth = totalEmployees - newHiresThisMonth + departuresThisMonth;
        const averageEmployeesMonth = (employeesAtStartOfMonth + totalEmployees) / 2;

        const metrics = {
          newHiresThisYear,
          departuresThisYear,
          openPositions: store.openPositions.filter((p) => p.status === 'Ouvert').length,
          totalDepartments: new Set(activeEmployees.map((e) => e.departement).filter((d) => d && d.trim() && d.trim() !== 'N/A')).size,
          totalEmployees,
          turnoverRateYearly: averageEmployeesYear > 0 ? (departuresThisYear / averageEmployeesYear) * 100 : 0,
          turnoverRateMonthly: averageEmployeesMonth > 0 ? (departuresThisMonth / averageEmployeesMonth) * 100 : 0,
        };

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthlyMovementsData = monthNames.map((month) => ({ name: month, Entrées: 0, Sorties: 0 }));
        store.employees.forEach((employee) => {
          const hireDate = parseFlexibleDate(employee.dateEmbauche);
          if (hireDate && hireDate.getFullYear() === currentYear) {
            monthlyMovementsData[hireDate.getMonth()]['Entrées'] += 1;
          }
          if (employee.status === 'Parti') {
            const departureDate = parseFlexibleDate(employee.dateDepart || '');
            if (departureDate && departureDate.getFullYear() === currentYear) {
              monthlyMovementsData[departureDate.getMonth()]['Sorties'] += 1;
            }
          }
        });
        const monthlyMovements = monthlyMovementsData.slice(0, currentMonth + 1);

        const employeesEndingTrial = store.employees
          .filter((employee) => employee.status === 'Actif' && employee.periodeEssai > 0)
          .map((employee) => {
            const hireDate = parseFlexibleDate(employee.dateEmbauche);
            if (!hireDate) return null;
            const trialEndDate = addMonths(hireDate, employee.periodeEssai);
            const daysRemaining = differenceInDays(trialEndDate, today);
            if (daysRemaining >= 0 && daysRemaining <= 15) {
              return { ...employee, trialEndDate, daysRemaining };
            }
            return null;
          })
          .filter((e): e is NonNullable<typeof e> => e !== null)
          .sort((a, b) => a.daysRemaining - b.daysRemaining);

        const alerts: { employee: Employee; location: string; duration: number }[] = [];
        const activeEmps = store.employees.filter((e) => e.status === 'Actif');
        const lastChangeDateMap = new Map<string, Date>();
        store.workLocationHistory.forEach(change => {
          const changeDate = parseFlexibleDate(change.date);
          if (!changeDate) return;
          const existingDate = lastChangeDateMap.get(change.matricule);
          if (!existingDate || changeDate > existingDate) {
            lastChangeDateMap.set(change.matricule, changeDate);
          }
        });
        for (const employee of activeEmps) {
          const assignmentStartDate = lastChangeDateMap.get(employee.matricule);
          if (assignmentStartDate) {
            const durationInMonths = differenceInMonths(today, assignmentStartDate);
            if (durationInMonths >= 48) {
              alerts.push({ employee, location: employee.lieuTravail, duration: durationInMonths });
            }
          }
        }
        const employeesWithLongAssignments = alerts.sort((a, b) => b.duration - a.duration);

        setClientData({
          metrics,
          monthlyMovements,
          employeesEndingTrial,
          employeesWithLongAssignments,
        });
    }
  }, [isLoaded, store.employees, store.openPositions, store.workLocationHistory]);

  if (!isLoaded || !clientData) {
    return <DashboardSkeleton />;
  }
  
  const { metrics, monthlyMovements, employeesEndingTrial, employeesWithLongAssignments } = clientData;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employés Actifs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Statistique globale</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nouvelles Recrues
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{metrics.newHiresThisYear}</div>
            <p className="text-xs text-muted-foreground">Cette année</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départs</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-{metrics.departuresThisYear}</div>
            <p className="text-xs text-muted-foreground">Cette année</p>
          </CardContent>
        </Card>
        <Link href="/recruitment">
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Postes Ouverts
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.openPositions}</div>
              <p className="text-xs text-muted-foreground">
                Cliquez pour voir les recrutements
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Nombre total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-primary">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle>
              Alertes de Fin de Période d'Essai
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeesEndingTrial.length > 0 ? (
              <div className="space-y-4">
                {employeesEndingTrial.map((employee) => (
                  <div key={employee.matricule} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-semibold">{employee.noms}</p>
                      <p className="text-sm text-muted-foreground">
                        Se termine le {format(employee.trialEndDate, 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                        <span className="font-bold text-lg text-primary">{employee.daysRemaining}</span>
                        <span className="text-sm text-muted-foreground ml-1">{employee.daysRemaining > 1 ? 'jours' : 'jour'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune période d'essai ne se termine dans les 15 prochains jours.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle>
              Alertes de Durée d'Affectation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeesWithLongAssignments.length > 0 ? (
              <div className="space-y-4">
                {employeesWithLongAssignments.map(({ employee, location, duration }) => (
                  <div key={employee.matricule} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-semibold">{employee.noms}</p>
                      <p className="text-sm text-muted-foreground">
                        Lieu: {location}
                      </p>
                    </div>
                    <div className="text-right">
                        <span className="font-bold text-lg text-amber-600">{duration}</span>
                        <span className="text-sm text-muted-foreground ml-1">mois</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun employé n'a dépassé 48 mois d'affectation sur un même site.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de Rotation (Annuel)
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.turnoverRateYearly.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Basé sur les départs de cette année
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de Rotation (Mensuel)
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.turnoverRateMonthly.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Pour le mois en cours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mouvements de Personnel (Cette Année)</CardTitle>
            <CardDescription>
              Graphique des entrées et sorties mensuelles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[300px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={monthlyMovements} accessibilityLayer>
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
                    dataKey="Entrées"
                    fill="var(--color-Entrées)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Sorties"
                    fill="var(--color-Sorties)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

