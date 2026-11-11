"use client";

import { useMemo, useState, type FormEvent } from "react";
import { fullName } from "@/shared/lib/format";
import {
  dropEmptyFile,
  hasErrors,
  text,
  type Errors,
} from "@/shared/lib/forms";
import { useResource } from "@/shared/lib/use-resource";
import { Button } from "@/shared/ui/Button";
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
  getUsers,
  registerUser,
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
}: {
  user: AuthUser;
  isSelf: boolean;
  onClose: () => void;
  onSaved: (role: string) => void;
}) {
  const toast = useToast();
  const [role, setRole] = useState(user.role ?? "USER_ROLE");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateUserRole(user.id, role);
      toast.success("Rol actualizado correctamente");
      onSaved(updated?.role ?? role);
    } catch (err) {
      toast.error((err as Error).message || "Error al actualizar rol");
      setSaving(false);
    }
  };

  const rows: [string, string | undefined][] = [
    ["Usuario", user.username && `@${user.username}`],
    ["Correo", user.email],
    ["Teléfono", user.phone],
  ];

  return (
    <Modal
      open
      title={fullName(user) || user.username || "Usuario"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={() => void save()}
            loading={saving}
            disabled={isSelf || role === user.role}
          >
            Guardar rol
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar src={user.profilePicture} size={64} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink-soft">{label}</dt>
                <dd className="break-all text-ink">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <SelectField
          label="Rol"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(event) => setRole(event.target.value)}
          disabled={isSelf}
          hint={isSelf ? "No puedes cambiar tu propio rol" : undefined}
        />
      </div>
    </Modal>
  );
}

const validateUser = (form: FormData): Errors => {
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
  const password = String(form.get("password") ?? "");
  if (!password) errors.password = "La contraseña es obligatoria";
  else if (password.length < 8)
    errors.password = "Debe tener al menos 8 caracteres";
  if (!form.get("confirmPassword"))
    errors.confirmPassword = "Debe confirmar su contraseña";
  else if (form.get("confirmPassword") !== password)
    errors.confirmPassword = "Las contraseñas no coinciden";
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
        description="Administra usuarios, consulta su información y cambia su rol"
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
                      Ver detalle
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
          onSaved={(newRole) => {
            setData((list) =>
              list.map((user) =>
                user.id === selected.id ? { ...user, role: newRole } : user,
              ),
            );
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
