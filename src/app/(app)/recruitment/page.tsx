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
import { PlusCircle, Search, MoreHorizontal, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';
import { store, notify, useStore, type OpenPosition } from '@/lib/store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function RecruitmentPage() {
  useStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingPosition, setEditingPosition] = React.useState<OpenPosition | null>(null);

  // --- Add Form State ---
  const addTitleRef = React.useRef<HTMLInputElement>(null);
  const addDescriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const addCostRef = React.useRef<HTMLInputElement>(null);
  const [addType, setAddType] = React.useState<'Remplacement' | 'Création'>();
  const [addOpeningDate, setAddOpeningDate] = React.useState<Date>();

  // --- Edit Form State ---
  const [editTitle, setEditTitle] = React.useState('');
  const [editType, setEditType] = React.useState<'Remplacement' | 'Création'>();
  const [editOpeningDate, setEditOpeningDate] = React.useState<Date>();
  const [editFilledDate, setEditFilledDate] = React.useState<Date | undefined>();
  const [editDescription, setEditDescription] = React.useState('');
  const [editStatus, setEditStatus] = React.useState<'Ouvert' | 'Pourvu' | 'Annulé'>();
  const [editCost, setEditCost] = React.useState<number | undefined>();

  const resetAddForm = () => {
    if (addTitleRef.current) addTitleRef.current.value = '';
    if (addDescriptionRef.current) addDescriptionRef.current.value = '';
    if (addCostRef.current) addCostRef.current.value = '';
    setAddType(undefined);
    setAddOpeningDate(undefined);
    setIsAddDialogOpen(false);
  };

  React.useEffect(() => {
    if (editingPosition) {
      setEditTitle(editingPosition.title);
      setEditType(editingPosition.type);
      try {
        setEditOpeningDate(new Date(editingPosition.openingDate.split('/').reverse().join('-')));
        setEditFilledDate(editingPosition.filledDate ? new Date(editingPosition.filledDate.split('/').reverse().join('-')) : undefined);
      } catch (e) {
        setEditOpeningDate(new Date());
        setEditFilledDate(undefined);
      }
      setEditDescription(editingPosition.description);
      setEditStatus(editingPosition.status);
      setEditCost(editingPosition.cost);
    }
  }, [editingPosition]);

  const handleAddPosition = (event: React.FormEvent) => {
    event.preventDefault();
    const title = addTitleRef.current?.value;
    const description = addDescriptionRef.current?.value;
    const cost = addCostRef.current?.value;

    if (!title || !addType || !addOpeningDate || !description) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newPosition: OpenPosition = {
      id: Date.now().toString(),
      title,
      type: addType,
      openingDate: format(addOpeningDate, 'dd/MM/yyyy'),
      description,
      status: 'Ouvert',
      cost: cost ? parseFloat(cost) : undefined,
    };

    store.openPositions.unshift(newPosition);
    notify();
    resetAddForm();
  };

  const handleUpdatePosition = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPosition || !editTitle || !editType || !editOpeningDate || !editStatus || !editDescription) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const updatedPosition: OpenPosition = {
      ...editingPosition,
      title: editTitle,
      type: editType,
      openingDate: format(editOpeningDate, 'dd/MM/yyyy'),
      filledDate: editFilledDate && editStatus === 'Pourvu' ? format(editFilledDate, 'dd/MM/yyyy') : undefined,
      description: editDescription,
      status: editStatus,
      cost: editCost,
    };

    store.openPositions = store.openPositions.map((p) =>
      p.id === editingPosition.id ? updatedPosition : p
    );
    notify();
    setEditingPosition(null);
  };
  
  const handleDeletePosition = (positionId: string) => {
    store.openPositions = store.openPositions.filter((p) => p.id !== positionId);
    notify();
  };

  const handleDeleteAllPositions = () => {
    store.openPositions = [];
    notify();
  };
  
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Ouvert':
        return 'secondary';
      case 'Pourvu':
        return 'default';
      case 'Annulé':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredPositions = store.openPositions.filter(
    (position) =>
      position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Recrutement</CardTitle>
              <CardDescription>
                Gérez les postes ouverts, à remplacer et pourvus.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un Poste
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleAddPosition}>
                    <DialogHeader>
                      <DialogTitle>Ajouter un nouveau poste</DialogTitle>
                      <DialogDescription>
                        Remplissez les informations ci-dessous pour créer un nouveau poste.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-title">Intitulé du Poste</Label>
                        <Input id="add-title" ref={addTitleRef} placeholder="p. ex. Développeur Frontend" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-type">Type de Poste</Label>
                        <Select value={addType} onValueChange={(v: 'Remplacement' | 'Création') => setAddType(v)} required>
                          <SelectTrigger id="add-type"><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Création">Création de poste</SelectItem>
                            <SelectItem value="Remplacement">Poste à remplacer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-description">Description du poste et tâches</Label>
                        <Textarea id="add-description" ref={addDescriptionRef} placeholder="Décrire les responsabilités et tâches..." required />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="add-cost">Coût de Recrutement ($US)</Label>
                        <Input id="add-cost" type="number" ref={addCostRef} placeholder="p. ex. 1500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-opening-date">Date de l'ouverture</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !addOpeningDate && 'text-muted-foreground')}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {addOpeningDate ? format(addOpeningDate, 'dd/MM/yyyy') : <span>Choisir une date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={addOpeningDate} onSelect={setAddOpeningDate} initialFocus /></PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="secondary" onClick={resetAddForm}>Annuler</Button>
                      <Button type="submit">Sauvegarder</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Tout supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Cela supprimera
                      définitivement tous les postes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllPositions}>
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="relative mt-4 w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par intitulé ou description..."
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
                  <TableHead>Intitulé du Poste</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date d'ouverture</TableHead>
                  <TableHead>Date pourvu</TableHead>
                  <TableHead>Coût ($US)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.title}</TableCell>
                    <TableCell>{position.type}</TableCell>
                    <TableCell>{position.openingDate}</TableCell>
                    <TableCell>{position.filledDate || 'N/A'}</TableCell>
                    <TableCell>{position.cost ? position.cost.toLocaleString('fr-FR') : 'N/A'}</TableCell>
                    <TableCell><Badge variant={getBadgeVariant(position.status) as any}>{position.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingPosition(position)}>Modifier</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible. Le poste sera définitivement supprimé.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePosition(position.id)}>Confirmer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      
      {/* Edit Dialog */}
      <Dialog open={!!editingPosition} onOpenChange={(isOpen) => !isOpen && setEditingPosition(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdatePosition}>
            <DialogHeader>
              <DialogTitle>Modifier le Poste</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Intitulé du Poste</Label>
                <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type de Poste</Label>
                <Select value={editType} onValueChange={(v: 'Remplacement' | 'Création') => setEditType(v)} required>
                  <SelectTrigger id="edit-type"><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Création">Création de poste</SelectItem>
                    <SelectItem value="Remplacement">Poste à remplacer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="edit-description">Description du poste et tâches</Label>
                  <Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cost">Coût de Recrutement ($US)</Label>
                <Input id="edit-cost" type="number" value={editCost ?? ''} onChange={(e) => setEditCost(e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="p. ex. 1500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-opening-date">Date de l'ouverture</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !editOpeningDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editOpeningDate ? format(editOpeningDate, 'dd/MM/yyyy') : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editOpeningDate} onSelect={setEditOpeningDate} initialFocus /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select value={editStatus} onValueChange={(v: 'Ouvert' | 'Pourvu' | 'Annulé') => setEditStatus(v)} required>
                    <SelectTrigger id="edit-status"><SelectValue placeholder="Sélectionner un statut" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ouvert">Ouvert</SelectItem>
                      <SelectItem value="Pourvu">Pourvu</SelectItem>
                      <SelectItem value="Annulé">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editStatus === 'Pourvu' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-filled-date">Date à pourvu</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !editFilledDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFilledDate ? format(editFilledDate, 'dd/MM/yyyy') : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editFilledDate} onSelect={setEditFilledDate} initialFocus /></PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setEditingPosition(null)}>Annuler</Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
