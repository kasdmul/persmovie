
'use client';

import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, DollarSign, Briefcase, FileText, History, Landmark, Building, Network, FileDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { store, notify, useStore, SalaryChange, FunctionChange, ContractChange, DepartmentChange, EntityChange, Employee, WorkLocationChange } from '@/lib/store';
import Papa from 'papaparse';
import { Checkbox } from '@/components/ui/checkbox';


function SalaryChangeContent() {
  useStore(); // Subscribe to store updates

  const [selectedMatricule, setSelectedMatricule] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [newSalary, setNewSalary] = React.useState('');
  const [reason, setReason] = React.useState('');

  const selectedEmployee = store.employees.find(e => e.matricule === selectedMatricule);

  const resetFields = () => {
    setSelectedMatricule(undefined);
    setDate(new Date());
    setNewSalary('');
    setReason('');
  }

  const handleApplyChange = () => {
    if (!selectedEmployee || !newSalary || !reason || !date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newSalaryValue = parseFloat(newSalary);
    if (isNaN(newSalaryValue)) {
      alert('Le nouveau salaire doit être un nombre.');
      return;
    }

    const newChange: SalaryChange = {
      date: format(date, 'dd/MM/yyyy'),
      matricule: selectedEmployee.matricule,
      noms: selectedEmployee.noms,
      ancienneValeur: selectedEmployee.salaire,
      nouvelleValeur: newSalaryValue,
      motif: reason,
    };
    store.salaryHistory.unshift(newChange);

    const employeeToUpdate = store.employees.find(e => e.matricule === selectedEmployee.matricule);
    if (employeeToUpdate) {
        employeeToUpdate.salaire = newSalaryValue;
    }
    
    notify();
    resetFields();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' $US';
  }

  return (
    <div className="space-y-8 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            <span>Changement de Salaire</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">Appliquer un Changement</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee-select-salary">Sélectionner Employé</Label>
              <Select value={selectedMatricule} onValueChange={setSelectedMatricule}>
                <SelectTrigger id="employee-select-salary">
                  <SelectValue placeholder="Choisir un employé" />
                </SelectTrigger>
                <SelectContent>
                  {store.employees.map(employee => (
                    <SelectItem key={employee.matricule} value={employee.matricule}>
                      {employee.noms}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noms-salary">Noms</Label>
              <Input id="noms-salary" value={selectedEmployee?.noms || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-date-salary">Date de l'application du changement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-salary">Salaire Actuel</Label>
              <Input id="current-salary" value={selectedEmployee ? formatCurrency(selectedEmployee.salaire) : ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-salary">Nouveau Salaire</Label>
              <Input id="new-salary" placeholder="Nouveau Salaire" value={newSalary} onChange={e => setNewSalary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-salary">Motif du Changement</Label>
              <Input id="reason-salary" placeholder="Motif du Changement" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleApplyChange}>Appliquer le Changement</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des Changements de Salaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOMS</TableHead>
                  <TableHead>ANCIENNE VALEUR</TableHead>
                  <TableHead>NOUVELLE VALEUR</TableHead>
                  <TableHead>MOTIF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.salaryHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.matricule}</TableCell>
                    <TableCell>{item.noms}</TableCell>
                    <TableCell>{formatCurrency(item.ancienneValeur)}</TableCell>
                    <TableCell>{formatCurrency(item.nouvelleValeur)}</TableCell>
                    <TableCell>{item.motif}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunctionChangeContent() {
  useStore();

  const [selectedMatricule, setSelectedMatricule] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [newFunction, setNewFunction] = React.useState('');
  const [reason, setReason] = React.useState('');

  const selectedEmployee = store.employees.find(e => e.matricule === selectedMatricule);
  
  const resetFields = () => {
    setSelectedMatricule(undefined);
    setDate(new Date());
    setNewFunction('');
    setReason('');
  }

  const handleApplyChange = () => {
    if (!selectedEmployee || !newFunction || !reason || !date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newChange: FunctionChange = {
      date: format(date, 'dd/MM/yyyy'),
      matricule: selectedEmployee.matricule,
      noms: selectedEmployee.noms,
      ancienneValeur: selectedEmployee.poste,
      nouvelleValeur: newFunction,
      motif: reason,
    };
    store.functionHistory.unshift(newChange);

    const employeeToUpdate = store.employees.find(emp => emp.matricule === selectedEmployee.matricule);
    if (employeeToUpdate) {
        employeeToUpdate.poste = newFunction;
    }

    notify();
    resetFields();
  };

  return (
    <div className="space-y-8 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            <span>Changement de Fonction</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">Appliquer un Changement</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee-select-function">Sélectionner Employé</Label>
              <Select value={selectedMatricule} onValueChange={setSelectedMatricule}>
                <SelectTrigger id="employee-select-function">
                  <SelectValue placeholder="Choisir un employé" />
                </SelectTrigger>
                <SelectContent>
                  {store.employees.map(employee => (
                    <SelectItem key={employee.matricule} value={employee.matricule}>
                      {employee.noms}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noms-function">Noms</Label>
              <Input id="noms-function" value={selectedEmployee?.noms || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-date-function">Date de l'application du changement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-function">Fonction Actuelle</Label>
              <Input id="current-function" value={selectedEmployee?.poste || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-function">Nouvelle Fonction</Label>
              <Input id="new-function" placeholder="Nouvelle Fonction" value={newFunction} onChange={e => setNewFunction(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-function">Motif du Changement</Label>
              <Input id="reason-function" placeholder="Motif du Changement" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleApplyChange}>Appliquer le Changement</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des Changements de Fonction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOMS</TableHead>
                  <TableHead>ANCIENNE VALEUR</TableHead>
                  <TableHead>NOUVELLE VALEUR</TableHead>
                  <TableHead>MOTIF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.functionHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.matricule}</TableCell>
                    <TableCell>{item.noms}</TableCell>
                    <TableCell>{item.ancienneValeur}</TableCell>
                    <TableCell>{item.nouvelleValeur}</TableCell>
                    <TableCell>{item.motif}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContractChangeContent() {
  useStore();

  const [selectedMatricule, setSelectedMatricule] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [newContractType, setNewContractType] = React.useState<string | undefined>();
  const [reason, setReason] = React.useState('');

  const selectedEmployee = store.employees.find(e => e.matricule === selectedMatricule);
  
  const resetFields = () => {
    setSelectedMatricule(undefined);
    setDate(new Date());
    setNewContractType(undefined);
    setReason('');
  }

  const handleApplyChange = () => {
    if (!selectedEmployee || !newContractType || !reason || !date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newChange: ContractChange = {
      date: format(date, 'dd/MM/yyyy'),
      matricule: selectedEmployee.matricule,
      noms: selectedEmployee.noms,
      ancienneValeur: selectedEmployee.typeContrat,
      nouvelleValeur: newContractType,
      motif: reason,
    };
    
    store.contractHistory.unshift(newChange);

    const employeeToUpdate = store.employees.find(emp => emp.matricule === selectedEmployee.matricule);
    if(employeeToUpdate) {
        employeeToUpdate.typeContrat = newContractType;
    }

    notify();
    resetFields();
  };

  return (
    <div className="space-y-8 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span>Changement de Contrat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">Appliquer un Changement</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee-select-contract">Sélectionner Employé</Label>
              <Select value={selectedMatricule} onValueChange={setSelectedMatricule}>
                <SelectTrigger id="employee-select-contract">
                  <SelectValue placeholder="Choisir un employé" />
                </SelectTrigger>
                <SelectContent>
                  {store.employees.map(employee => (
                    <SelectItem key={employee.matricule} value={employee.matricule}>
                      {employee.noms}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noms-contract">Noms</Label>
              <Input id="noms-contract" value={selectedEmployee?.noms || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-date-contract">Date de l'application du changement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-contract">Type de Contrat Actuel</Label>
              <Input id="current-contract" value={selectedEmployee?.typeContrat || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-contract-type">Nouveau Type de Contrat</Label>
              <Select value={newContractType} onValueChange={setNewContractType}>
                <SelectTrigger id="new-contract-type">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="Stage">Stage</SelectItem>
                  <SelectItem value="Alternance">Alternance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-contract">Motif du Changement</Label>
              <Input id="reason-contract" placeholder="Motif du Changement" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleApplyChange}>Appliquer le Changement</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des Changements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOMS</TableHead>
                  <TableHead>ANCIENNE VALEUR</TableHead>
                  <TableHead>NOUVELLE VALEUR</TableHead>
                  <TableHead>MOTIF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.contractHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.matricule}</TableCell>
                    <TableCell>{item.noms}</TableCell>
                    <TableCell>{item.ancienneValeur}</TableCell>
                    <TableCell>{item.nouvelleValeur}</TableCell>
                    <TableCell>{item.motif}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DepartmentChangeContent() {
  useStore();

  const [selectedMatricule, setSelectedMatricule] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [newDepartment, setNewDepartment] = React.useState<string | undefined>();
  const [reason, setReason] = React.useState('');

  const selectedEmployee = store.employees.find(e => e.matricule === selectedMatricule);
  
  const resetFields = () => {
    setSelectedMatricule(undefined);
    setDate(new Date());
    setNewDepartment(undefined);
    setReason('');
  }

  const handleApplyChange = () => {
    if (!selectedEmployee || !newDepartment || !reason || !date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newChange: DepartmentChange = {
      date: format(date, 'dd/MM/yyyy'),
      matricule: selectedEmployee.matricule,
      noms: selectedEmployee.noms,
      ancienneValeur: selectedEmployee.departement,
      nouvelleValeur: newDepartment,
      motif: reason,
    };
    store.departmentHistory.unshift(newChange);

    const employeeToUpdate = store.employees.find(emp => emp.matricule === selectedEmployee.matricule);
    if (employeeToUpdate) {
        employeeToUpdate.departement = newDepartment;
    }

    notify();
    resetFields();
  };

  return (
    <div className="space-y-8 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            <span>Changement de Département</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">Appliquer un Changement</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee-select-department">Sélectionner Employé</Label>
              <Select value={selectedMatricule} onValueChange={setSelectedMatricule}>
                <SelectTrigger id="employee-select-department">
                  <SelectValue placeholder="Choisir un employé" />
                </SelectTrigger>
                <SelectContent>
                  {store.employees.map(employee => (
                    <SelectItem key={employee.matricule} value={employee.matricule}>
                      {employee.noms}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noms-department">Noms</Label>
              <Input id="noms-department" value={selectedEmployee?.noms || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-date-department">Date de l'application du changement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-department">Département Actuel</Label>
              <Input id="current-department" value={selectedEmployee?.departement || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-department">Nouveau Département</Label>
               <Select value={newDepartment} onValueChange={setNewDepartment}>
                <SelectTrigger id="new-department">
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {store.departments.map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-department">Motif du Changement</Label>
              <Input id="reason-department" placeholder="Motif du Changement" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleApplyChange}>Appliquer le Changement</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des Changements de Département</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOMS</TableHead>
                  <TableHead>ANCIENNE VALEUR</TableHead>
                  <TableHead>NOUVELLE VALEUR</TableHead>
                  <TableHead>MOTIF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.departmentHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.matricule}</TableCell>
                    <TableCell>{item.noms}</TableCell>
                    <TableCell>{item.ancienneValeur}</TableCell>
                    <TableCell>{item.nouvelleValeur}</TableCell>
                    <TableCell>{item.motif}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EntityChangeContent() {
  useStore();

  const [selectedMatricule, setSelectedMatricule] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [newEntity, setNewEntity] = React.useState<string | undefined>();
  const [reason, setReason] = React.useState('');

  const selectedEmployee = store.employees.find(e => e.matricule === selectedMatricule);
  
  const resetFields = () => {
    setSelectedMatricule(undefined);
    setDate(new Date());
    setNewEntity(undefined);
    setReason('');
  }

  const handleApplyChange = () => {
    if (!selectedEmployee || !newEntity || !reason || !date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newChange: EntityChange = {
      date: format(date, 'dd/MM/yyyy'),
      matricule: selectedEmployee.matricule,
      noms: selectedEmployee.noms,
      ancienneValeur: selectedEmployee.entite,
      nouvelleValeur: newEntity,
      motif: reason,
    };
    store.entityHistory.unshift(newChange);

    const employeeToUpdate = store.employees.find(emp => emp.matricule === selectedEmployee.matricule);
    if (employeeToUpdate) {
        employeeToUpdate.entite = newEntity;
    }

    notify();
    resetFields();
  };

  return (
    <div className="space-y-8 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-6 w-6" />
            <span>Changement d'Entité</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">Appliquer un Changement</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee-select-entity">Sélectionner Employé</Label>
              <Select value={selectedMatricule} onValueChange={setSelectedMatricule}>
                <SelectTrigger id="employee-select-entity">
                  <SelectValue placeholder="Choisir un employé" />
                </SelectTrigger>
                <SelectContent>
                  {store.employees.map(employee => (
                    <SelectItem key={employee.matricule} value={employee.matricule}>
                      {employee.noms}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noms-entity">Noms</Label>
              <Input id="noms-entity" value={selectedEmployee?.noms || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-date-entity">Date de l'application du changement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-entity">Entité Actuelle</Label>
              <Input id="current-entity" value={selectedEmployee?.entite || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-entity">Nouvelle Entité</Label>
              <Select value={newEntity} onValueChange={setNewEntity}>
                <SelectTrigger id="new-entity">
                  <SelectValue placeholder="Sélectionner une entité" />
                </SelectTrigger>
                <SelectContent>
                  {store.entities.map(ent => (
                    <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-entity">Motif du Changement</Label>
              <Input id="reason-entity" placeholder="Motif du Changement" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleApplyChange}>Appliquer le Changement</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des Changements d'Entité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOMS</TableHead>
                  <TableHead>ANCIENNE VALEUR</TableHead>
                  <TableHead>NOUVELLE VALEUR</TableHead>
                  <TableHead>MOTIF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.entityHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.matricule}</TableCell>
                    <TableCell>{item.noms}</TableCell>
                    <TableCell>{item.ancienneValeur}</TableCell>
                    <TableCell>{item.nouvelleValeur}</TableCell>
                    <TableCell>{item.motif}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkLocationChangeContent() {
  useStore();

  const [selectedMatricule, setSelectedMatricule] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [newWorkLocation, setNewWorkLocation] = React.useState<string | undefined>();
  const [reason, setReason] = React.useState('');
  const [droitPrimeEloignement, setDroitPrimeEloignement] = React.useState(false);
  const [pourcentagePrime, setPourcentagePrime] = React.useState<string>('');
  const [dureeAffectationMois, setDureeAffectationMois] = React.useState<string>('');

  const selectedEmployee = store.employees.find(e => e.matricule === selectedMatricule);
  
  const resetFields = () => {
    setSelectedMatricule(undefined);
    setDate(new Date());
    setNewWorkLocation(undefined);
    setReason('');
    setDroitPrimeEloignement(false);
    setPourcentagePrime('');
    setDureeAffectationMois('');
  }

  const handleApplyChange = () => {
    if (!selectedEmployee || !newWorkLocation || !reason || !date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newChange: WorkLocationChange = {
      date: format(date, 'dd/MM/yyyy'),
      matricule: selectedEmployee.matricule,
      noms: selectedEmployee.noms,
      ancienneValeur: selectedEmployee.lieuTravail,
      nouvelleValeur: newWorkLocation,
      motif: reason,
      droitPrimeEloignement,
      pourcentagePrime: droitPrimeEloignement ? parseFloat(pourcentagePrime) : undefined,
      dureeAffectationMois: dureeAffectationMois ? parseInt(dureeAffectationMois) : undefined,
    };
    store.workLocationHistory.unshift(newChange);

    const employeeToUpdate = store.employees.find(emp => emp.matricule === selectedEmployee.matricule);
    if (employeeToUpdate) {
        employeeToUpdate.lieuTravail = newWorkLocation;
    }

    notify();
    resetFields();
  };

  return (
    <div className="space-y-8 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            <span>Changement de Lieu de Travail</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">Appliquer un Changement</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee-select-work-location">Sélectionner Employé</Label>
              <Select value={selectedMatricule} onValueChange={setSelectedMatricule}>
                <SelectTrigger id="employee-select-work-location">
                  <SelectValue placeholder="Choisir un employé" />
                </SelectTrigger>
                <SelectContent>
                  {store.employees.map(employee => (
                    <SelectItem key={employee.matricule} value={employee.matricule}>
                      {employee.noms}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noms-work-location">Noms</Label>
              <Input id="noms-work-location" value={selectedEmployee?.noms || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-date-work-location">Date de l'application du changement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-work-location">Lieu de Travail Actuel</Label>
              <Input id="current-work-location" value={selectedEmployee?.lieuTravail || ''} className="bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-work-location">Nouveau Lieu de Travail</Label>
               <Select value={newWorkLocation} onValueChange={setNewWorkLocation}>
                <SelectTrigger id="new-work-location">
                  <SelectValue placeholder="Sélectionner un lieu de travail" />
                </SelectTrigger>
                <SelectContent>
                  {store.workLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-work-location">Motif du Changement</Label>
              <Input id="reason-work-location" placeholder="Motif du Changement" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2 pt-8 col-span-1">
              <Checkbox id="droit-prime" checked={droitPrimeEloignement} onCheckedChange={(checked) => setDroitPrimeEloignement(checked as boolean)} />
              <Label htmlFor="droit-prime" className="cursor-pointer">Droit à la prime d'éloignement</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pourcentage-prime">Pourcentage Prime (%)</Label>
              <Input id="pourcentage-prime" type="number" placeholder="ex: 10" value={pourcentagePrime} onChange={e => setPourcentagePrime(e.target.value)} disabled={!droitPrimeEloignement} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duree-affectation">Durée Affectation (mois)</Label>
              <Input id="duree-affectation" type="number" placeholder="ex: 12" value={dureeAffectationMois} onChange={e => setDureeAffectationMois(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleApplyChange}>Appliquer le Changement</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des Changements de Lieu de Travail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOMS</TableHead>
                  <TableHead>ANCIENNE VALEUR</TableHead>
                  <TableHead>NOUVELLE VALEUR</TableHead>
                  <TableHead>PRIME</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>DURÉE (Mois)</TableHead>
                  <TableHead>MOTIF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.workLocationHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.matricule}</TableCell>
                    <TableCell>{item.noms}</TableCell>
                    <TableCell>{item.ancienneValeur}</TableCell>
                    <TableCell>{item.nouvelleValeur}</TableCell>
                    <TableCell>{item.droitPrimeEloignement ? 'Oui' : 'Non'}</TableCell>
                    <TableCell>{item.pourcentagePrime ?? 'N/A'}</TableCell>
                    <TableCell>{item.dureeAffectationMois ?? 'N/A'}</TableCell>
                    <TableCell>{item.motif}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


type GlobalHistoryItem = (SalaryChange | FunctionChange | ContractChange | DepartmentChange | EntityChange | WorkLocationChange) & { type: string };

function GlobalHistoryContent() {
  useStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' $US';
  }

  const formatValue = (value: string | number, type: string) => {
    if (type === 'Changement de Salaire' && typeof value === 'number') {
      return formatCurrency(value);
    }
    return value;
  };

  const allHistory: GlobalHistoryItem[] = [
      ...store.salaryHistory.map(item => ({ ...item, type: 'Changement de Salaire' })),
      ...store.functionHistory.map(item => ({ ...item, type: 'Changement de Fonction' })),
      ...store.contractHistory.map(item => ({ ...item, type: 'Changement de Contrat' })),
      ...store.departmentHistory.map(item => ({ ...item, type: 'Changement de Département' })),
      ...store.entityHistory.map(item => ({ ...item, type: 'Changement d\'Entité' })),
      ...store.workLocationHistory.map(item => ({ ...item, type: 'Changement de Lieu de Travail' })),
  ].sort((a, b) => {
      try {
        const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateB - dateA;
      } catch (e) {
        return 0;
      }
  });

  const handleExport = () => {
    if (allHistory.length === 0) return;

    const dataToExport = allHistory.map(item => {
      const baseData = {
        "DATE": item.date,
        "MATRICULE": item.matricule,
        "NOMS": item.noms,
        "TYPE DE MOUVEMENT": item.type,
        "ANCIENNE VALEUR": item.ancienneValeur,
        "NOUVELLE VALEUR": item.nouvelleValeur,
        "MOTIF": item.motif,
        "PRIME D'ÉLOIGNEMENT": '',
        "POURCENTAGE PRIME (%)": '',
        "DURÉE AFFECTATION (MOIS)": '',
      };

      if (item.type === 'Changement de Lieu de Travail') {
        const locItem = item as WorkLocationChange;
        baseData["PRIME D'ÉLOIGNEMENT"] = locItem.droitPrimeEloignement ? 'Oui' : 'Non';
        baseData["POURCENTAGE PRIME (%)"] = locItem.pourcentagePrime?.toString() ?? '';
        baseData["DURÉE AFFECTATION (MOIS)"] = locItem.dureeAffectationMois?.toString() ?? '';
      }

      return baseData;
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'historique_global_mouvements.csv');
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <div className='flex-1'>
                <CardTitle>Historique Global des Mouvements</CardTitle>
                <CardDescription className="mt-2">
                    Exporter l'historique complet de tous les mouvements du personnel au format CSV, compatible avec Excel.
                </CardDescription>
            </div>
          <Button onClick={handleExport} disabled={allHistory.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Exporter en Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DATE</TableHead>
                <TableHead>MATRICULE</TableHead>
                <TableHead>NOMS</TableHead>
                <TableHead>TYPE DE MOUVEMENT</TableHead>
                <TableHead>ANCIENNE VALEUR</TableHead>
                <TableHead>NOUVELLE VALEUR</TableHead>
                <TableHead>MOTIF</TableHead>
                <TableHead>DÉTAILS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allHistory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.matricule}</TableCell>
                  <TableCell>{item.noms}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{formatValue(item.ancienneValeur, item.type)}</TableCell>
                  <TableCell>{formatValue(item.nouvelleValeur, item.type)}</TableCell>
                  <TableCell>{item.motif}</TableCell>
                  <TableCell>
                    {item.type === 'Changement de Lieu de Travail' && (
                        <div className="text-xs">
                           {(item as WorkLocationChange).droitPrimeEloignement && (
                            <div>Prime: Oui ({(item as WorkLocationChange).pourcentagePrime}%)</div>
                           )}
                           {(item as WorkLocationChange).dureeAffectationMois && (
                            <div>Durée: {(item as WorkLocationChange).dureeAffectationMois} mois</div>
                           )}
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


export default function MouvementPageContainer() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="historique" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="salaire">
            <Landmark className="mr-2 h-4 w-4" />
            Salaire
          </TabsTrigger>
          <TabsTrigger value="fonction">
            <Briefcase className="mr-2 h-4 w-4" />
            Fonction
          </TabsTrigger>
           <TabsTrigger value="departement">
            <Building className="mr-2 h-4 w-4" />
            Département
          </TabsTrigger>
          <TabsTrigger value="entite">
            <Network className="mr-2 h-4 w-4" />
            Entité
          </TabsTrigger>
          <TabsTrigger value="lieu-travail">
            <MapPin className="mr-2 h-4 w-4" />
            Lieu de Travail
          </TabsTrigger>
          <TabsTrigger value="contrat">
            <FileText className="mr-2 h-4 w-4" />
            Contrat
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History className="mr-2 h-4 w-4" />
            Historique Global
          </TabsTrigger>
        </TabsList>
        <TabsContent value="salaire">
          <SalaryChangeContent />
        </TabsContent>
        <TabsContent value="fonction">
          <FunctionChangeContent />
        </TabsContent>
         <TabsContent value="departement">
          <DepartmentChangeContent />
        </TabsContent>
        <TabsContent value="entite">
          <EntityChangeContent />
        </TabsContent>
        <TabsContent value="lieu-travail">
          <WorkLocationChangeContent />
        </TabsContent>
        <TabsContent value="contrat">
          <ContractChangeContent />
        </TabsContent>
        <TabsContent value="historique">
          <GlobalHistoryContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
