
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Input } from '@/components/ui/input';
import { store, notify, useStore } from '@/lib/store';
import { Trash2 } from 'lucide-react';

export default function SettingsPage() {
  useStore();
  const [workWeekMode, setWorkWeekMode] = React.useState('monday-sunday');
  const [newDepartment, setNewDepartment] = React.useState('');
  const [newEntity, setNewEntity] = React.useState('');
  const [newWorkLocation, setNewWorkLocation] = React.useState('');

  const handleSaveSettings = () => {
    // In a real app, this would save to a database.
    console.log('Paramètres sauvegardés:', { workWeekMode });
    alert(`Mode de semaine de travail sauvegardé : ${workWeekMode}`);
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim() && !store.departments.includes(newDepartment.trim())) {
      store.departments.push(newDepartment.trim());
      store.departments.sort();
      notify();
      setNewDepartment('');
    } else {
        alert('Ce département existe déjà ou le champ est vide.');
    }
  };

  const handleDeleteDepartment = (department: string) => {
    store.departments = store.departments.filter(d => d !== department);
    notify();
  };
  
  const handleAddEntity = () => {
    if (newEntity.trim() && !store.entities.includes(newEntity.trim())) {
      store.entities.push(newEntity.trim());
      store.entities.sort();
      notify();
      setNewEntity('');
    } else {
        alert('Cette entité existe déjà ou le champ est vide.');
    }
  };

  const handleDeleteEntity = (entity: string) => {
    store.entities = store.entities.filter(e => e !== entity);
    notify();
  };
  
  const handleAddWorkLocation = () => {
    if (newWorkLocation.trim() && !store.workLocations.includes(newWorkLocation.trim())) {
      store.workLocations.push(newWorkLocation.trim());
      store.workLocations.sort();
      notify();
      setNewWorkLocation('');
    } else {
        alert('Ce lieu de travail existe déjà ou le champ est vide.');
    }
  };

  const handleDeleteWorkLocation = (location: string) => {
    store.workLocations = store.workLocations.filter(l => l !== location);
    notify();
  };


  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres Généraux</CardTitle>
          <CardDescription>
            Gérez les paramètres généraux de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="work-week-mode">
                Mode de Comptage de la Semaine de Travail
              </Label>
              <Select
                value={workWeekMode}
                onValueChange={setWorkWeekMode}
              >
                <SelectTrigger id="work-week-mode">
                  <SelectValue placeholder="Sélectionner un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday-sunday">Lundi - Dimanche</SelectItem>
                  <SelectItem value="sunday-saturday">
                    Dimanche - Samedi
                  </SelectItem>
                  <SelectItem value="saturday-friday">
                    Samedi - Vendredi
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveSettings}>Enregistrer</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Départements</CardTitle>
          <CardDescription>
            Ajouter, voir et supprimer les départements de l'entreprise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex space-x-2">
                <Input 
                    placeholder="Nouveau département"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                />
                <Button onClick={handleAddDepartment}>Ajouter</Button>
            </div>
            <div className="space-y-2 rounded-lg border p-2 h-48 overflow-y-auto">
                {store.departments.map(dep => (
                    <div key={dep} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                        <span>{dep}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteDepartment(dep)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des Entités</CardTitle>
          <CardDescription>
            Ajouter, voir et supprimer les entités de l'entreprise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex space-x-2">
                <Input 
                    placeholder="Nouvelle entité"
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEntity()}
                />
                <Button onClick={handleAddEntity}>Ajouter</Button>
            </div>
            <div className="space-y-2 rounded-lg border p-2 h-48 overflow-y-auto">
                {store.entities.map(ent => (
                    <div key={ent} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                        <span>{ent}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteEntity(ent)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Lieux de Travail</CardTitle>
          <CardDescription>
            Ajouter, voir et supprimer les lieux de travail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex space-x-2">
                <Input 
                    placeholder="Nouveau lieu de travail"
                    value={newWorkLocation}
                    onChange={(e) => setNewWorkLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWorkLocation()}
                />
                <Button onClick={handleAddWorkLocation}>Ajouter</Button>
            </div>
            <div className="space-y-2 rounded-lg border p-2 h-48 overflow-y-auto">
                {store.workLocations.map(loc => (
                    <div key={loc} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                        <span>{loc}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteWorkLocation(loc)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
