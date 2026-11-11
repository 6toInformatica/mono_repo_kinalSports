"use client";

import { useState, type FormEvent } from "react";
import { CAPACITY_LABELS, fullName } from "@/shared/lib/format";
import {
  dropEmptyFile,
  hasErrors,
  text,
  type Errors,
} from "@/shared/lib/forms";
import { DEFAULT_LOGO, resolveImage } from "@/shared/lib/images";
import { useResource } from "@/shared/lib/use-resource";
import { Button } from "@/shared/ui/Button";
import { useConfirm } from "@/shared/ui/confirm";
import { EntityCard } from "@/shared/ui/EntityCard";
import {
  Badge,
  CardGridSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/shared/ui/feedback";
import { ImageField, SelectField, TextField } from "@/shared/ui/fields";
import { PlusIcon } from "@/shared/ui/icons";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/toast";
import { getUsers, type AuthUser } from "../users/api";
import { deactivateTeam, getTeams, saveTeam, type Team } from "./api";

const CATEGORIES = [
  { value: "FUTBOL_7", label: "Fútbol 7" },
  { value: "FUTBOL_11", label: "Fútbol 11" },
];

const userLabel = (user: AuthUser) =>
  `${fullName(user) || user.username} (@${user.username})`;

function TeamForm({
  team,
  users,
  onClose,
  onSaved,
}: {
  team: Team | null;
  users: AuthUser[];
  onClose: () => void;
  onSaved: (team: Team, created: boolean) => void;
}) {
  const toast = useToast();
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<string[]>(
    team?.namedMembers?.map((member) => member.name) ?? [],
  );
  const [newMember, setNewMember] = useState("");

  const addMember = () => {
    const name = newMember.trim();
    if (!name) return;
    setMembers((list) => [...list, name]);
    setNewMember("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (team) form.set("managerId", team.managerId); // el manager no cambia al editar
    const found: Errors = {};
    const name = text(form, "teamName");
    if (!name) found.teamName = "El nombre es obligatorio";
    else if (name.length < 3)
      found.teamName = "Debe tener al menos 3 caracteres";
    if (!text(form, "managerId")) found.managerId = "El manager es obligatorio";
    if (!text(form, "category")) found.category = "La categoría es obligatoria";
    setErrors(found);
    if (hasErrors(found)) return;

    if (members.length > 0) {
      form.set(
        "namedMembers",
        JSON.stringify(members.map((member) => ({ name: member }))),
      );
    }
    dropEmptyFile(form, "logo");
    setSaving(true);
    try {
      const { data } = await saveTeam(form, team?._id);
      toast.success(team ? "Equipo actualizado" : "Equipo creado");
      onSaved(data, !team);
    } catch (err) {
      toast.error((err as Error).message);
      setSaving(false);
    }
  };

  const manager = team
    ? users.find((user) => user.id === team.managerId)
    : undefined;

  return (
    <Modal
      open
      title={team ? "Editar equipo" : "Nuevo equipo"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="team-form" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="team-form"
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <TextField
          label="Nombre del equipo"
          name="teamName"
          defaultValue={team?.teamName}
          error={errors.teamName}
          className="sm:col-span-2"
        />
        {team ? (
          <TextField
            label="Manager"
            value={manager ? userLabel(manager) : team.managerId}
            disabled
            hint="El manager no se puede cambiar"
          />
        ) : (
          <SelectField
            label="Manager"
            name="managerId"
            defaultValue=""
            placeholder="Seleccione un usuario"
            options={users.map((user) => ({
              value: user.id,
              label: userLabel(user),
            }))}
            error={errors.managerId}
          />
        )}
        <SelectField
          label="Categoría"
          name="category"
          defaultValue={team?.category ?? ""}
          placeholder="Seleccione categoría"
          options={CATEGORIES}
          error={errors.category}
        />
        <div className="flex flex-col gap-2 sm:col-span-2">
          <div className="flex items-end gap-2">
            <TextField
              label="Integrantes por nombre"
              value={newMember}
              onChange={(event) => setNewMember(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addMember();
                }
              }}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addMember}>
              Agregar
            </Button>
          </div>
          {members.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {members.map((member, index) => (
                <li
                  key={`${member}-${index}`}
                  className="flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1 text-sm text-brand"
                >
                  {member}
                  <button
                    type="button"
                    aria-label={`Quitar a ${member}`}
                    onClick={() =>
                      setMembers((list) => list.filter((_, i) => i !== index))
                    }
                    className="flex size-7 items-center justify-center rounded-full hover:bg-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ImageField
          label="Logo"
          name="logo"
          currentUrl={resolveImage(team?.logo)}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}

const loadAll = async () => {
  const [teams, users] = await Promise.all([getTeams(), getUsers()]);
  return { teams, users };
};

export function TeamsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, setData, loading, error, reload } = useResource(loadAll, {
    teams: [] as Team[],
    users: [] as AuthUser[],
  });
  const [editing, setEditing] = useState<Team | null | undefined>(undefined);

  const setTeams = (update: (teams: Team[]) => Team[]) =>
    setData((current) => ({ ...current, teams: update(current.teams) }));

  const onDeactivate = async (team: Team) => {
    const ok = await confirm({
      title: "Desactivar equipo",
      message: `¿Desactivar ${team.teamName}?`,
      confirmLabel: "Desactivar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deactivateTeam(team._id);
      setTeams((list) => list.filter((item) => item._id !== team._id));
      toast.success("Equipo desactivado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Equipos"
        description="Equipos registrados, su manager e integrantes"
        action={
          <Button onClick={() => setEditing(null)}>
            <PlusIcon /> Nuevo equipo
          </Button>
        }
      />
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading ? (
        <CardGridSkeleton />
      ) : data.teams.length === 0 && !error ? (
        <EmptyState
          title="Sin equipos"
          message="Todavía no hay equipos registrados."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.teams.map((team) => {
            const manager = data.users.find(
              (user) => user.id === team.managerId,
            );
            const named = team.namedMembers?.length ?? 0;
            const total = (team.members?.length ?? 0) + named;
            return (
              <EntityCard
                key={team._id}
                image={resolveImage(team.logo)}
                imageFallback={DEFAULT_LOGO}
                title={team.teamName}
                badges={
                  <Badge>
                    {CAPACITY_LABELS[team.category] ?? team.category}
                  </Badge>
                }
                onEdit={() => setEditing(team)}
                onDeactivate={() => void onDeactivate(team)}
              >
                <p>
                  Manager:{" "}
                  {manager
                    ? fullName(manager) || manager.username
                    : `ID: ${team.managerId}`}
                </p>
                <p>
                  {total} miembros{named > 0 ? ` (${named} por nombre)` : ""}
                </p>
                {named > 0 && (
                  <p className="line-clamp-2">
                    Roster:{" "}
                    {team.namedMembers!.map((member) => member.name).join(", ")}
                  </p>
                )}
              </EntityCard>
            );
          })}
        </div>
      )}
      {editing !== undefined && (
        <TeamForm
          team={editing}
          users={data.users}
          onClose={() => setEditing(undefined)}
          onSaved={(saved, created) => {
            setTeams((list) =>
              created
                ? [saved, ...list]
                : list.map((item) => (item._id === saved._id ? saved : item)),
            );
            setEditing(undefined);
          }}
        />
      )}
    </section>
  );
}
