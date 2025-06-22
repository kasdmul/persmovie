
'use client';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { notify, store, useStore, type User } from '@/lib/store';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import React from 'react';

export default function AdminPage() {
  useStore();
  const { currentUser } = store;

  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  // Add User State
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<User['role']>();
  const [newUserPassword, setNewUserPassword] = React.useState('');

  // Edit User State
  const [editForm, setEditForm] = React.useState({
    name: '',
    email: '',
    role: '' as User['role'],
    password: '',
  });

  React.useEffect(() => {
    if (editingUser) {
      setEditForm({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        password: '', // Don't pre-fill password
      });
    }
  }, [editingUser]);
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditRoleChange = (value: User['role']) => {
    setEditForm((prev) => ({ ...prev, role: value }));
  };

  const resetAddUserForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole(undefined);
    setNewUserPassword('');
    setIsAddUserOpen(false);
  };

  const handleAddUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUserName || !newUserEmail || !newUserRole || !newUserPassword) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    const newUser: User = {
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      password: newUserPassword,
    };
    store.users.push(newUser);
    notify();
    resetAddUserForm();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleDeleteUser = (email: string) => {
    const userToDelete = store.users.find(u => u.email === email);
    if (!userToDelete) return;

    const isLastSuperAdmin = userToDelete.role === 'superadmin' && store.users.filter(u => u.role === 'superadmin').length === 1;

    if (isLastSuperAdmin) {
        alert("Vous ne pouvez pas supprimer le dernier super administrateur. Utilisez 'Tout supprimer' pour réinitialiser l'application.");
        return;
    }

    store.users = store.users.filter((u) => u.email !== email);
    notify();
  };

  const handleDeleteAllUsers = () => {
    store.users = [];
    store.currentUser = null;
    notify();
  };

  const handleUpdateUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;

    if (
      currentUser?.role === 'admin' &&
      (editingUser.role === 'superadmin' || editingUser.role === 'admin')
    ) {
      alert("Vous n'avez pas la permission de modifier cet utilisateur.");
      return;
    }

    if (
      editForm.email !== editingUser.email &&
      store.users.some((user) => user.email === editForm.email)
    ) {
      alert('Cette adresse e-mail est déjà utilisée par un autre compte.');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      password: editForm.password ? editForm.password : editingUser.password,
    };

    store.users = store.users.map((u) =>
      u.email === editingUser.email ? updatedUser : u
    );

    if (currentUser && currentUser.email === editingUser.email) {
      store.currentUser = updatedUser;
    }

    notify();
    setEditingUser(null);
  };

  const displayedUsers =
    store.currentUser?.role === 'admin'
      ? store.users.filter((u) => u.role !== 'superadmin')
      : store.users;

  const canManage =
    currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Panneau Admin</CardTitle>
            <CardDescription>
              Gérez les utilisateurs et leurs permissions.
            </CardDescription>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Changer le mot de passe</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Changer le mot de passe</DialogTitle>
                    <DialogDescription>
                      Mettez à jour votre mot de passe ici. Cliquez sur
                      Enregistrer lorsque vous avez terminé.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="current-password" className="text-right">
                        Actuel
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        Nouveau
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Enregistrer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleAddUser}>
                    <DialogHeader>
                      <DialogTitle>Ajouter un Nouvel Utilisateur</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-user-name">Nom Utilisateur</Label>
                        <Input
                          id="new-user-name"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-email">Email</Label>
                        <Input
                          id="new-user-email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-role">Rôle</Label>
                        <Select
                          value={newUserRole}
                          onValueChange={(v) =>
                            setNewUserRole(v as User['role'])
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentUser?.role === 'superadmin' && (
                              <SelectItem value="superadmin">
                                Super Admin
                              </SelectItem>
                            )}
                            {currentUser?.role === 'superadmin' && (
                              <SelectItem value="admin">Admin</SelectItem>
                            )}
                            <SelectItem value="membre">Membre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-password">Mot de passe</Label>
                        <Input
                          id="new-user-password"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetAddUserForm}
                      >
                        Annuler
                      </Button>
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
                    <AlertDialogTitle>
                      Êtes-vous absolument sûr ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Cela supprimera
                      définitivement tous les utilisateurs. Vous devrez créer un nouveau compte super administrateur.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllUsers}>
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                {canManage && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedUsers.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={`https://placehold.co/40x40.png`}
                          alt="Avatar"
                          data-ai-hint="person"
                        />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role) as any}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {// Superadmin can edit anyone. Admin can only edit members.
                      (currentUser?.role === 'superadmin' ||
                        (currentUser?.role === 'admin' &&
                          user.role === 'membre')) &&
                        user.email !== currentUser?.email && (
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
                                onClick={() => setEditingUser(user)}
                              >
                                Modifier
                              </DropdownMenuItem>
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
                                      Cette action est irréversible.
                                      L'utilisateur sera définitivement supprimé.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Annuler
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteUser(user.email)
                                      }
                                    >
                                      Confirmer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog
        open={!!editingUser}
        onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Modifier l'Utilisateur</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations pour {editingUser?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom Utilisateur</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <Select
                  value={editForm.role}
                  onValueChange={handleEditRoleChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser?.role === 'superadmin' && (
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    )}
                    {currentUser?.role === 'superadmin' && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="membre">Membre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nouveau Mot de passe</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={editForm.password}
                  onChange={handleEditFormChange}
                  placeholder="Laisser vide pour ne pas changer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingUser(null)}
              >
                Annuler
              </Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
