
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PlusCircle,
  Search,
  MoreHorizontal,
  Trash2,
  Calendar as CalendarIcon,
  Upload,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import React from 'react';
import { store, notify, useStore, type Employee } from '@/lib/store';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Papa from 'papaparse';

export default function PersonnelPage() {
  const { currentUser } = useStore();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(
    null
  );

  // --- Add Form State ---
  const matriculeInputRef = React.useRef<HTMLInputElement>(null);
  const nomsInputRef = React.useRef<HTMLInputElement>(null);
  const emailInputRef = React.useRef<HTMLInputElement>(null);
  const posteInputRef = React.useRef<HTMLInputElement>(null);
  const periodeEssaiInputRef = React.useRef<HTMLInputElement>(null);
  const [addSexe, setAddSexe] = React.useState<Employee['sexe']>();
  const [hireDate, setHireDate] = React.useState<Date | undefined>();
  const [department, setDepartment] = React.useState<string>();
  const [entity, setEntity] = React.useState<string>();
  const [workLocation, setWorkLocation] = React.useState<string>();

  // --- Edit Form State ---
  const [editingHireDate, setEditingHireDate] = React.useState<
    Date | undefined
  >();
  const [editingDepartureDate, setEditingDepartureDate] = React.useState<
    Date | undefined
  >();
  const [editingStatus, setEditingStatus] = React.useState<
    Employee['status'] | undefined
  >();
  const [editingSexe, setEditingSexe] = React.useState<Employee['sexe']>();
  const [editingDepartment, setEditingDepartment] = React.useState<string | undefined>();
  const [editingEntity, setEditingEntity] = React.useState<string | undefined>();
  const [editingWorkLocation, setEditingWorkLocation] = React.useState<string | undefined>();


  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const canManage = currentUser?.role !== 'membre';

  const handleImportClick = () => {
    csvInputRef.current?.click();
  };
  
  const getSexe = (sexe: string | undefined): Employee['sexe'] => {
      if (!sexe) return 'N/A';
      const s = sexe.trim().toLowerCase();
      if (s === 'femme' || s === 'f' || s === 'féminin') return 'Femme';
      if (s === 'homme' || s === 'h' || s === 'm' || s === 'masculin' || s === 'mascilin') return 'Homme';
      return 'N/A';
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const importedData = results.data;
          if (!importedData || !Array.isArray(importedData)) {
            console.error('Invalid CSV data received');
            alert('Données CSV invalides reçues.');
            return;
          }

          const newEmployees: Employee[] = importedData
            .map((row: any): Employee | null => {
              if (!row.Matricule || !row.Noms || !row.Poste) {
                return null;
              }
              return {
                matricule: row.Matricule,
                noms: row.Noms,
                email:
                  row.Email ||
                  `${row.Noms.toLowerCase().replace(/\s/g, '.')}@example.com`,
                sexe: getSexe(row.Sexe),
                entite: row.Entité || 'N/A',
                departement: row.Département || 'N/A',
                lieuTravail: row['Lieu de travail'] || 'N/A',
                poste: row.Poste,
                salaire: parseFloat(row['Salaire de Base']) || 0,
                typeContrat: row['Type de Contrat'] || 'N/A',
                dateEmbauche:
                  row['Date de Début'] ||
                  row["Date d'embauche"] ||
                  format(new Date(), 'dd/MM/yyyy'),
                periodeEssai:
                  parseInt(
                    row["Période d'essai (mois)"] ||
                      row["Période d'essai (jours)"] ||
                      row["Période d'essai"] ||
                      '0',
                    10
                  ) || 0,
                status: row.Statut === 'Parti' ? 'Parti' : 'Actif',
                dateDepart: row['Date de départ'],
              };
            })
            .filter((e): e is Employee => e !== null);

          const existingMatricules = new Set(
            store.employees.map((e) => e.matricule)
          );
          const uniqueNewEmployees = newEmployees.filter(
            (ne) => !existingMatricules.has(ne.matricule)
          );

          if (uniqueNewEmployees.length > 0) {
            store.employees.push(...uniqueNewEmployees);

            const allDepartments = new Set(store.departments);
            const allEntities = new Set(store.entities);
            const allWorkLocations = new Set(store.workLocations);

            store.employees.forEach(employee => {
                if (employee.departement && employee.departement.trim() && employee.departement.trim() !== 'N/A') {
                    allDepartments.add(employee.departement.trim());
                }
                if (employee.entite && employee.entite.trim() && employee.entite.trim() !== 'N/A') {
                    allEntities.add(employee.entite.trim());
                }
                if (employee.lieuTravail && employee.lieuTravail.trim() && employee.lieuTravail.trim() !== 'N/A') {
                    allWorkLocations.add(employee.lieuTravail.trim());
                }
            });

            store.departments = Array.from(allDepartments).sort();
            store.entities = Array.from(allEntities).sort();
            store.workLocations = Array.from(allWorkLocations).sort();
            
            notify();
            alert(
              `${uniqueNewEmployees.length} employé(s) importé(s) avec succès !`
            );
          } else {
            alert(
              'Aucun nouvel employé à importer ou les données sont invalides/dupliquées.'
            );
          }
          
          if (csvInputRef.current) {
            csvInputRef.current.value = '';
          }
        },
        error: (error) => {
          console.error("Erreur d'analyse CSV:", error);
          alert("Une erreur est survenue lors de l'analyse du fichier CSV.");
        }
      });
    }
  };

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    try {
      const parts = dateString.split('/');
      const date = new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10)
      );
      return isNaN(date.getTime()) ? undefined : date;
    } catch (e) {
      return undefined;
    }
  };

  React.useEffect(() => {
    if (editingEmployee) {
      setEditingHireDate(parseDate(editingEmployee.dateEmbauche));
      setEditingDepartureDate(parseDate(editingEmployee.dateDepart));
      setEditingStatus(editingEmployee.status);
      setEditingSexe(editingEmployee.sexe);
      setEditingDepartment(editingEmployee.departement);
      setEditingEntity(editingEmployee.entite);
      setEditingWorkLocation(editingEmployee.lieuTravail);
    } else {
      setEditingHireDate(undefined);
      setEditingDepartureDate(undefined);
      setEditingStatus(undefined);
      setEditingSexe(undefined);
      setEditingDepartment(undefined);
      setEditingEntity(undefined);
      setEditingWorkLocation(undefined);
    }
  }, [editingEmployee]);

  const handleAddEmployee = (event: React.FormEvent) => {
    event.preventDefault();
    const newEmployee: Employee = {
      matricule:
        matriculeInputRef.current?.value ||
        `E${Math.floor(Math.random() * 1000)}`,
      noms: nomsInputRef.current?.value || '',
      email: emailInputRef.current?.value || '',
      sexe: addSexe || 'N/A',
      entite: entity || 'N/A',
      departement: department || 'N/A',
      lieuTravail: workLocation || 'N/A',
      poste: posteInputRef.current?.value || '',
      salaire: 0,
      typeContrat: 'N/A',
      dateEmbauche: hireDate ? format(hireDate, 'dd/MM/yyyy') : '',
      periodeEssai: parseInt(periodeEssaiInputRef.current?.value || '0', 10),
      status: 'Actif',
    };
    if (newEmployee.noms && newEmployee.email && newEmployee.matricule) {
      store.employees.push(newEmployee);
      notify();
      setIsAddDialogOpen(false);
      // Reset fields
      if (matriculeInputRef.current) matriculeInputRef.current.value = '';
      if (nomsInputRef.current) nomsInputRef.current.value = '';
      if (emailInputRef.current) emailInputRef.current.value = '';
      setAddSexe(undefined);
      setEntity(undefined);
      setDepartment(undefined);
      setWorkLocation(undefined);
      if (posteInputRef.current) posteInputRef.current.value = '';
      if (periodeEssaiInputRef.current)
        periodeEssaiInputRef.current.value = '';
      setHireDate(undefined);
    }
  };

  const handleUpdateEmployee = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEmployee || !editingStatus) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    let finalDepartureDate = editingDepartureDate;
    if (editingStatus === 'Parti' && !finalDepartureDate) {
      finalDepartureDate = new Date();
    }

    const updatedEmployee: Employee = {
      ...editingEmployee,
      noms: formData.get('noms-edit') as string,
      email: formData.get('email-edit') as string,
      sexe: editingSexe || editingEmployee.sexe,
      entite: editingEntity || editingEmployee.entite,
      departement: editingDepartment || editingEmployee.departement,
      lieuTravail: editingWorkLocation || editingEmployee.lieuTravail,
      poste: formData.get('poste-edit') as string,
      dateEmbauche: editingHireDate
        ? format(editingHireDate, 'dd/MM/yyyy')
        : editingEmployee.dateEmbauche,
      periodeEssai: parseInt(
        (formData.get('periodeEssai-edit') as string) || '0',
        10
      ),
      status: editingStatus,
      dateDepart:
        editingStatus === 'Parti' && finalDepartureDate
          ? format(finalDepartureDate, 'dd/MM/yyyy')
          : undefined,
    };

    store.employees = store.employees.map((e) =>
      e.matricule === editingEmployee.matricule ? updatedEmployee : e
    );
    notify();
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (matricule: string) => {
    store.employees = store.employees.filter((e) => e.matricule !== matricule);
    notify();
  };

  const handleDeleteAllEmployees = () => {
    store.employees = [];
    store.salaryHistory = [];
    store.functionHistory = [];
    store.contractHistory = [];
    store.departmentHistory = [];
    store.entityHistory = [];
    store.workLocationHistory = [];
    notify();
  };

  const getStatusBadgeVariant = (status: Employee['status']) => {
    switch (status) {
      case 'Actif':
        return 'secondary';
      case 'Parti':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredEmployees = store.employees.filter(
    (employee) =>
      employee.noms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.sexe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.entite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.departement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lieuTravail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.poste.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Gestion du Personnel</CardTitle>
              <CardDescription>
                Gérez les informations des employés.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <>
                  <Button onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer CSV
                  </Button>
                  <input
                    type="file"
                    ref={csvInputRef}
                    accept=".csv"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                </>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un employé
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleAddEmployee}>
                    <DialogHeader>
                      <DialogTitle>Ajouter un nouvel employé</DialogTitle>
                      <DialogDescription>
                        Remplissez les informations ci-dessous pour ajouter un
                        nouvel employé.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="matricule" className="text-right">
                          Matricule
                        </Label>
                        <Input
                          id="matricule"
                          ref={matriculeInputRef}
                          placeholder="p. ex. E123"
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nom
                        </Label>
                        <Input
                          id="name"
                          ref={nomsInputRef}
                          placeholder="p. ex. Alice Bernard"
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          ref={emailInputRef}
                          placeholder="p. ex. alice.b@example.com"
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="add-sexe" className="text-right">
                          Sexe
                        </Label>
                        <Select value={addSexe} onValueChange={(v) => setAddSexe(v as Employee['sexe'])}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner le sexe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Homme">Homme</SelectItem>
                            <SelectItem value="Femme">Femme</SelectItem>
                            <SelectItem value="N/A">Non spécifié</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="entity" className="text-right">
                          Entité
                        </Label>
                        <Select value={entity} onValueChange={setEntity}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner une entité" />
                          </SelectTrigger>
                          <SelectContent>
                            {store.entities.map(ent => (
                              <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">
                          Département
                        </Label>
                         <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner un département" />
                          </SelectTrigger>
                          <SelectContent>
                            {store.departments.map(dep => (
                              <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="work-location" className="text-right">
                          Lieu de travail
                        </Label>
                        <Select value={workLocation} onValueChange={setWorkLocation}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner un lieu" />
                          </SelectTrigger>
                          <SelectContent>
                            {store.workLocations.map(loc => (
                              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Poste
                        </Label>
                        <Input
                          id="role"
                          ref={posteInputRef}
                          placeholder="p. ex. Manager"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hire-date" className="text-right">
                          Date d'embauche
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'col-span-3 justify-start text-left font-normal',
                                !hireDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {hireDate ? (
                                format(hireDate, 'dd/MM/yyyy')
                              ) : (
                                <span>Choisir une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={hireDate}
                              onSelect={setHireDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="trial-period" className="text-right">
                          Période d'essai (mois)
                        </Label>
                        <Input
                          id="trial-period"
                          type="number"
                          ref={periodeEssaiInputRef}
                          placeholder="p. ex. 3"
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Annuler
                        </Button>
                      </DialogClose>
                      <Button type="submit">Sauvegarder</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              {canManage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Tout supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Êtes-vous absolutely sûr ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Cela supprimera
                          définitivement tous les employés et leur historique
                          associé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllEmployees}>
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              )}
            </div>
          </div>
          <div className="relative mt-4 w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des employés..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Département
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Lieu de travail
                  </TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.matricule}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={`https://placehold.co/40x40.png`}
                            alt="Avatar"
                            data-ai-hint="person"
                          />
                          <AvatarFallback>
                            {employee.noms.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <p className="font-medium">{employee.noms}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.sexe}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {employee.departement}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{employee.lieuTravail}</TableCell>
                    <TableCell>{employee.poste}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(employee.status) as any}
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setEditingEmployee(employee)}
                          >
                            Modifier
                          </DropdownMenuItem>
                          {canManage && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Êtes-vous sûr ?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible. L'employé sera
                                      définitivement supprimé.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteEmployee(employee.matricule)
                                      }
                                    >
                                      Confirmer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={!!editingEmployee}
        onOpenChange={(isOpen) => !isOpen && setEditingEmployee(null)}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateEmployee}>
            <DialogHeader>
              <DialogTitle>Modifier l'employé</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations ci-dessous. Le matricule ne peut
                pas être modifié.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="matricule-edit" className="text-right">
                  Matricule
                </Label>
                <Input
                  id="matricule-edit"
                  name="matricule-edit"
                  defaultValue={editingEmployee?.matricule}
                  className="col-span-3"
                  readOnly
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="noms-edit" className="text-right">
                  Nom
                </Label>
                <Input
                  id="noms-edit"
                  name="noms-edit"
                  defaultValue={editingEmployee?.noms}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email-edit" className="text-right">
                  Email
                </Label>
                <Input
                  id="email-edit"
                  name="email-edit"
                  type="email"
                  defaultValue={editingEmployee?.email}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sexe" className="text-right">
                  Sexe
                </Label>
                <Select value={editingSexe} onValueChange={(v) => setEditingSexe(v as Employee['sexe'])}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner le sexe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Homme">Homme</SelectItem>
                    <SelectItem value="Femme">Femme</SelectItem>
                    <SelectItem value="N/A">Non spécifié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entite-edit" className="text-right">
                  Entité
                </Label>
                <Select value={editingEntity} onValueChange={setEditingEntity}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.entities.map(ent => (
                      <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departement-edit" className="text-right">
                  Département
                </Label>
                <Select value={editingDepartment} onValueChange={setEditingDepartment}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un département" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.departments.map(dep => (
                      <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="work-location-edit" className="text-right">
                  Lieu de travail
                </Label>
                <Select value={editingWorkLocation} onValueChange={setEditingWorkLocation}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.workLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="poste-edit" className="text-right">
                  Poste
                </Label>
                <Input
                  id="poste-edit"
                  name="poste-edit"
                  defaultValue={editingEmployee?.poste}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status-edit" className="text-right">
                  Statut
                </Label>
                <Select
                  name="status-edit"
                  value={editingStatus}
                  onValueChange={(value: Employee['status']) =>
                    setEditingStatus(value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Parti">Parti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hire-date-edit" className="text-right">
                  Date d'embauche
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'col-span-3 justify-start text-left font-normal',
                        !editingHireDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingHireDate ? (
                        format(editingHireDate, 'dd/MM/yyyy')
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingHireDate}
                      onSelect={setEditingHireDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {editingStatus === 'Parti' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="departure-date-edit" className="text-right">
                    Date de départ
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'col-span-3 justify-start text-left font-normal',
                          !editingDepartureDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingDepartureDate ? (
                          format(editingDepartureDate, 'dd/MM/yyyy')
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingDepartureDate}
                        onSelect={setEditingDepartureDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="periodeEssai-edit" className="text-right">
                  Période d'essai (mois)
                </Label>
                <Input
                  id="periodeEssai-edit"
                  name="periodeEssai-edit"
                  type="number"
                  defaultValue={editingEmployee?.periodeEssai}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingEmployee(null)}
              >
                Annuler
              </Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
