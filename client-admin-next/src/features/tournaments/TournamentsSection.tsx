"use client";

import { useState, type FormEvent } from "react";
import { CAPACITY_LABELS, formatDate, toDateInput } from "@/shared/lib/format";
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
import {
  ImageField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/shared/ui/fields";
import { PlusIcon } from "@/shared/ui/icons";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/toast";
import {
  deactivateTournament,
  getTournaments,
  saveTournament,
  type Tournament,
} from "./api";

const CATEGORIES = [
  { value: "FUTBOL_7", label: "Fútbol 7" },
  { value: "FUTBOL_11", label: "Fútbol 11" },
];

const validate = (form: FormData): Errors => {
  const errors: Errors = {};
  const name = text(form, "tournamentsName");
  if (!name) errors.tournamentsName = "El nombre es obligatorio";
  else if (name.length < 3)
    errors.tournamentsName = "Debe tener al menos 3 caracteres";
  if (!text(form, "startDate"))
    errors.startDate = "La fecha de inicio es obligatoria";
  if (!text(form, "endDate")) errors.endDate = "La fecha de fin es obligatoria";
  if (!text(form, "category")) errors.category = "La categoría es obligatoria";
  if (!text(form, "description"))
    errors.description = "La descripción es obligatoria";
  return errors;
};

function TournamentForm({
  tournament,
  onClose,
  onSaved,
}: {
  tournament: Tournament | null;
  onClose: () => void;
  onSaved: (tournament: Tournament, created: boolean) => void;
}) {
  const toast = useToast();
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = validate(form);
    setErrors(found);
    if (hasErrors(found)) return;
    dropEmptyFile(form, "logo");
    setSaving(true);
    try {
      const { data } = await saveTournament(form, tournament?._id);
      toast.success(tournament ? "Torneo actualizado" : "Torneo creado");
      onSaved(data, !tournament);
    } catch (err) {
      toast.error((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={tournament ? "Editar torneo" : "Nuevo torneo"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="tournament-form" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="tournament-form"
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <TextField
          label="Nombre"
          name="tournamentsName"
          defaultValue={tournament?.tournamentsName}
          error={errors.tournamentsName}
          className="sm:col-span-2"
        />
        <TextField
          label="Fecha de inicio"
          name="startDate"
          type="date"
          defaultValue={toDateInput(tournament?.startDate)}
          error={errors.startDate}
        />
        <TextField
          label="Fecha de fin"
          name="endDate"
          type="date"
          defaultValue={toDateInput(tournament?.endDate)}
          error={errors.endDate}
        />
        <SelectField
          label="Categoría"
          name="category"
          defaultValue={tournament?.category ?? ""}
          placeholder="Seleccione una categoría"
          options={CATEGORIES}
          error={errors.category}
          className="sm:col-span-2"
        />
        <TextAreaField
          label="Descripción"
          name="description"
          defaultValue={tournament?.description}
          error={errors.description}
          className="sm:col-span-2"
        />
        <ImageField
          label="Logo"
          name="logo"
          currentUrl={resolveImage(tournament?.logo)}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}

export function TournamentsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: tournaments,
    setData,
    loading,
    error,
    reload,
  } = useResource(getTournaments, [] as Tournament[]);
  const [editing, setEditing] = useState<Tournament | null | undefined>(
    undefined,
  );

  const onDeactivate = async (tournament: Tournament) => {
    const ok = await confirm({
      title: "Desactivar torneo",
      message: `¿Desactivar ${tournament.tournamentsName}?`,
      confirmLabel: "Desactivar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deactivateTournament(tournament._id);
      setData((list) => list.filter((item) => item._id !== tournament._id));
      toast.success("Torneo desactivado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Torneos"
        description="Torneos, sus fechas y equipos inscritos"
        action={
          <Button onClick={() => setEditing(null)}>
            <PlusIcon /> Nuevo torneo
          </Button>
        }
      />
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading ? (
        <CardGridSkeleton />
      ) : tournaments.length === 0 && !error ? (
        <EmptyState
          title="Sin torneos"
          message="Crea un torneo para que los equipos se inscriban."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <EntityCard
              key={tournament._id}
              image={resolveImage(tournament.logo)}
              imageFallback={DEFAULT_LOGO}
              title={tournament.tournamentsName}
              badges={
                <>
                  <Badge>
                    {CAPACITY_LABELS[tournament.category] ??
                      tournament.category}
                  </Badge>
                  {tournament.status && (
                    <Badge tone="neutral">{tournament.status}</Badge>
                  )}
                </>
              }
              onEdit={() => setEditing(tournament)}
              onDeactivate={() => void onDeactivate(tournament)}
            >
              <p>
                {formatDate(tournament.startDate)} –{" "}
                {formatDate(tournament.endDate)}
              </p>
              <p>Equipos: {tournament.teams?.length ?? 0}</p>
              <p className="line-clamp-2">{tournament.description}</p>
            </EntityCard>
          ))}
        </div>
      )}
      {editing !== undefined && (
        <TournamentForm
          tournament={editing}
          onClose={() => setEditing(undefined)}
          onSaved={(saved, created) => {
            setData((list) =>
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
