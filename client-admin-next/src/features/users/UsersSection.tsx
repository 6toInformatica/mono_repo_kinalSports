"use client";

import { useMemo, useState, type FormEvent } from "react";
import { fullName } from "@/shared/lib/format";
import {
  assignImageError,
  dropEmptyFile,
  hasErrors,
  text,
  type Errors,
} from "@/shared/lib/forms";
import { useResource } from "@/shared/lib/use-resource";
import { Button } from "@/shared/ui/Button";
import { useConfirm } from "@/shared/ui/confirm";
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { ImageField, SelectField, TextField } from "@/shared/ui/fields";
import { PlusIcon } from "@/shared/ui/icons";
import { Modal } from "@/shared/ui/Modal";
import {
  Avatar,
  FilterBar,
  Pagination,
  TD,
  TH,
  TableCard,
  paginate,
} from "@/shared/ui/table";
import { useToast } from "@/shared/ui/toast";
import {
  ROLES,
  ROLE_LABELS,
  deactivateUser,
  getUsers,
  registerUser,
  updateUser,
  updateUserRole,
  type AuthUser,
} from "./api";

const PAGE_SIZE = 8;
const ROLE_OPTIONS = ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role] ?? role,
}));

function UserDetail({
  user,
  isSelf,
  onClose,
  onSaved,
  onRemoved,
}: {
  user: AuthUser;
  isSelf: boolean;
  onClose: () => void;
  onSaved: (user: AuthUser) => void;
  onRemoved: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [role, setRole] = useState(user.role ?? "USER_ROLE");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = validateProfile(form);
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    try {
      const updated = await updateUser(user.id, {
        name: text(form, "name"),
        surname: text(form, "surname"),
        username: text(form, "username"),
        email: text(form, "email"),
        phone: text(form, "phone"),
      });
      if (!isSelf && role !== user.role) {
        const withRole = await updateUserRole(user.id, role);
        updated.role = withRole.role ?? role;
      }
      toast.success("Usuario actualizado");
      onSaved(updated);
    } catch (err) {
      toast.error((err as Error).message || "No se pudo actualizar el usuario");
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Desactivar usuario",
      message: `¿Desactivar a ${fullName(user) || user.username}? La cuenta deja de poder entrar, pero el registro se conserva.`,
      confirmLabel: "Desactivar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deactivateUser(user.id);
      toast.success("Usuario desactivado");
      onRemoved();
    } catch (err) {
      toast.error((err as Error).message || "No se pudo desactivar el usuario");
    }
  };

  return (
    <Modal
      open
      title={fullName(user) || user.username || "Usuario"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button
            variant="danger-outline"
            onClick={() => void remove()}
            disabled={isSelf}
          >
            Desactivar
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" form="user-detail-form" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="user-detail-form"
        noValidate
        onSubmit={(event) => void save(event)}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <Avatar src={user.profilePicture} size={64} />
        </div>
        <TextField
          label="Nombre"
          name="name"
          defaultValue={user.name}
          error={errors.name}
        />
        <TextField
          label="Apellido"
          name="surname"
          defaultValue={user.surname}
          error={errors.surname}
        />
        <TextField
          label="Usuario"
          name="username"
          defaultValue={user.username}
          error={errors.username}
        />
        <TextField
          label="Teléfono"
          name="phone"
          defaultValue={user.phone}
          error={errors.phone}
        />
        <TextField
          label="Correo"
          name="email"
          type="email"
          defaultValue={user.email}
          error={errors.email}
          className="sm:col-span-2"
        />
        <SelectField
          label="Rol"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(event) => setRole(event.target.value)}
          disabled={isSelf}
          hint={
            isSelf
              ? "No puedes cambiar tu propio rol ni desactivar tu cuenta"
              : undefined
          }
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}

const validateProfile = (form: FormData): Errors => {
  const errors: Errors = {};
  if (!text(form, "name")) errors.name = "El nombre es obligatorio";
  if (!text(form, "surname")) errors.surname = "El apellido es obligatorio";
  const username = text(form, "username");
  if (!username) errors.username = "El nombre de usuario es obligatorio";
  else if (username.length < 3)
    errors.username = "Debe tener al menos 3 caracteres";
  const phone = text(form, "phone");
  if (!phone) errors.phone = "El teléfono es obligatorio";
  else if (!/^[0-9]{8}$/.test(phone))
    errors.phone = "Debe ser un número de 8 dígitos";
  const email = text(form, "email");
  if (!email) errors.email = "El email es obligatorio";
  else if (!/^\S+@\S+\.\S+$/.test(email))
    errors.email = "Formato de email inválido";
  return errors;
};

const validateUser = (form: FormData): Errors => {
  const errors = validateProfile(form);
  const password = String(form.get("password") ?? "");
  if (!password) errors.password = "La contraseña es obligatoria";
  else if (password.length < 8)
    errors.password = "Debe tener al menos 8 caracteres";
  if (!form.get("confirmPassword"))
    errors.confirmPassword = "Debe confirmar su contraseña";
  else if (form.get("confirmPassword") !== password)
    errors.confirmPassword = "Las contraseñas no coinciden";
  assignImageError(errors, form, "profilePicture");
  return errors;
};

function CreateUser({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = validateUser(form);
    setErrors(found);
    if (hasErrors(found)) return;
    form.delete("confirmPassword");
    dropEmptyFile(form, "profilePicture");
    setSaving(true);
    try {
      await registerUser(form);
      toast.success("Usuario creado. Se envió correo de verificación.");
      onCreated();
    } catch (err) {
      toast.error((err as Error).message || "No se pudo crear el usuario");
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Nuevo usuario"
      description="Recibirá un correo para verificar su cuenta"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            Crear usuario
          </Button>
        </>
      }
    >
      <form
        id="user-form"
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <TextField label="Nombre" name="name" error={errors.name} />
        <TextField label="Apellido" name="surname" error={errors.surname} />
        <TextField
          label="Usuario"
          name="username"
          autoComplete="off"
          error={errors.username}
        />
        <TextField
          label="Teléfono"
          name="phone"
          inputMode="numeric"
          error={errors.phone}
        />
        <TextField
          label="Correo"
          name="email"
          type="email"
          error={errors.email}
          className="sm:col-span-2"
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          error={errors.password}
        />
        <TextField
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />
        <ImageField
          label="Foto de perfil"
          name="profilePicture"
          error={errors.profilePicture}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}

export function UsersSection({ currentUserId }: { currentUserId?: string }) {
  const {
    data: users,
    setData,
    loading,
    error,
    reload,
  } = useResource(getUsers, [] as AuthUser[]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuthUser | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        fullName(user).toLowerCase().includes(term) ||
        (user.username ?? "").toLowerCase().includes(term);
      const matchesRole = !role || (user.role ?? "").toUpperCase() === role;
      return matchesSearch && matchesRole;
    });
  }, [users, search, role]);

  const view = paginate(filtered, page, PAGE_SIZE);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Administra usuarios: edita sus datos, cambia su rol o desactiva la cuenta"
        action={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Nuevo usuario
          </Button>
        }
      />
      <FilterBar>
        <TextField
          label="Buscar"
          type="search"
          placeholder="Nombre o usuario"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="w-full sm:w-72"
        />
        <SelectField
          label="Rol"
          value={role}
          placeholder="Todos los roles"
          options={ROLE_OPTIONS}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
          className="w-full sm:w-52"
        />
      </FilterBar>
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading ? (
        <TableCard>
          <TableSkeleton columns={4} />
        </TableCard>
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          title="Sin usuarios"
          message="Ningún usuario coincide con los filtros."
        />
      ) : (
        <TableCard
          footer={
            <Pagination
              page={view.current}
              totalPages={view.totalPages}
              total={filtered.length}
              onChange={setPage}
            />
          }
        >
          <table className="w-full min-w-[640px]">
            <thead className="bg-surface">
              <tr>
                <th className={TH}>Usuario</th>
                <th className={TH}>Correo</th>
                <th className={TH}>Rol</th>
                <th className={`${TH} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {view.items.map((user) => (
                <tr key={user.id} className="border-t border-line">
                  <td className={TD}>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.profilePicture} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {fullName(user) || user.username}
                          {user.id === currentUserId && (
                            <span className="ml-2 text-xs font-normal text-ink-soft">
                              (tú)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-ink-soft">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`${TD} break-all`}>{user.email}</td>
                  <td className={TD}>
                    <Badge
                      tone={user.role === "ADMIN_ROLE" ? "info" : "neutral"}
                    >
                      {ROLE_LABELS[user.role ?? ""] ?? user.role}
                    </Badge>
                  </td>
                  <td className={`${TD} text-right`}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelected(user)}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
      {selected && (
        <UserDetail
          user={selected}
          isSelf={selected.id === currentUserId}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setData((list) =>
              list.map((user) =>
                user.id === selected.id ? { ...user, ...updated } : user,
              ),
            );
            setSelected(null);
          }}
          onRemoved={() => {
            setData((list) => list.filter((user) => user.id !== selected.id));
            setSelected(null);
          }}
        />
      )}
      {creating && (
        <CreateUser
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void reload({ silent: true });
          }}
        />
      )}
    </section>
  );
}
