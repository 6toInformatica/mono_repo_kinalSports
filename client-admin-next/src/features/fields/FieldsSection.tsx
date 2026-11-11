"use client";

import { useState, type FormEvent } from "react";
import { CAPACITY_LABELS, FIELD_TYPE_LABELS } from "@/shared/lib/format";
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
import { deactivateField, getFields, saveField, type Field } from "./api";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const validate = (form: FormData): Errors => {
  const errors: Errors = {};
  const name = text(form, "fieldName");
  if (!name) errors.fieldName = "El nombre es obligatorio";
  else if (name.length < 3)
    errors.fieldName = "Debe tener al menos 3 caracteres";
  if (!text(form, "fieldType")) errors.fieldType = "El tipo es obligatorio";
  if (!text(form, "capacity")) errors.capacity = "La capacidad es obligatoria";
  const price = Number(text(form, "pricePerHour"));
  if (!text(form, "pricePerHour"))
    errors.pricePerHour = "El precio es obligatorio";
  else if (!(price > 0)) errors.pricePerHour = "Debe ser mayor a 0";
  if (!text(form, "description"))
    errors.description = "La descripción es obligatoria";
  return errors;
};

function FieldForm({
  field,
  onClose,
  onSaved,
}: {
  field: Field | null;
  onClose: () => void;
  onSaved: (field: Field, created: boolean) => void;
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
    dropEmptyFile(form, "image");
    setSaving(true);
    try {
      const { data } = await saveField(form, field?._id);
      toast.success(field ? "Cancha actualizada" : "Cancha creada");
      onSaved(data, !field);
    } catch (err) {
      toast.error((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={field ? "Editar cancha" : "Nueva cancha"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="field-form" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="field-form"
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <TextField
          label="Nombre"
          name="fieldName"
          defaultValue={field?.fieldName}
          error={errors.fieldName}
          className="sm:col-span-2"
        />
        <SelectField
          label="Tipo de superficie"
          name="fieldType"
          defaultValue={field?.fieldType ?? ""}
          placeholder="Seleccione un tipo"
          options={toOptions(FIELD_TYPE_LABELS)}
          error={errors.fieldType}
        />
        <SelectField
          label="Capacidad"
          name="capacity"
          defaultValue={field?.capacity ?? ""}
          placeholder="Seleccione capacidad"
          options={toOptions(CAPACITY_LABELS)}
          error={errors.capacity}
        />
        <TextField
          label="Precio por hora (Q)"
          name="pricePerHour"
          type="number"
          min={1}
          step="0.01"
          defaultValue={field?.pricePerHour}
          error={errors.pricePerHour}
        />
        <TextAreaField
          label="Descripción"
          name="description"
          defaultValue={field?.description}
          error={errors.description}
          className="sm:col-span-2"
        />
        <ImageField
          label="Foto"
          name="image"
          currentUrl={resolveImage(field?.photo)}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}

export function FieldsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: fields,
    setData,
    loading,
    error,
    reload,
  } = useResource(getFields, [] as Field[]);
  const [editing, setEditing] = useState<Field | null | undefined>(undefined);

  const onDeactivate = async (field: Field) => {
    const ok = await confirm({
      title: "Desactivar cancha",
      message: `¿Desactivar ${field.fieldName}? Ya no se podrá reservar.`,
      confirmLabel: "Desactivar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deactivateField(field._id);
      setData((list) => list.filter((item) => item._id !== field._id));
      toast.success("Cancha desactivada");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Canchas"
        description="Administra las canchas disponibles para reservar"
        action={
          <Button onClick={() => setEditing(null)}>
            <PlusIcon /> Nueva cancha
          </Button>
        }
      />
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading ? (
        <CardGridSkeleton />
      ) : fields.length === 0 && !error ? (
        <EmptyState
          title="Sin canchas"
          message="Crea la primera cancha para empezar a recibir reservas."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <EntityCard
              key={field._id}
              image={resolveImage(field.photo)}
              imageFallback={DEFAULT_LOGO}
              title={field.fieldName}
              badges={
                <>
                  <Badge>
                    {CAPACITY_LABELS[field.capacity] ?? field.capacity}
                  </Badge>
                  <Badge tone="neutral">
                    {FIELD_TYPE_LABELS[field.fieldType] ?? field.fieldType}
                  </Badge>
                </>
              }
              onEdit={() => setEditing(field)}
              onDeactivate={() => void onDeactivate(field)}
            >
              <p className="font-semibold text-ink">
                Q{Number(field.pricePerHour).toFixed(2)} / hora
              </p>
              <p className="line-clamp-2">{field.description}</p>
            </EntityCard>
          ))}
        </div>
      )}
      {editing !== undefined && (
        <FieldForm
          field={editing}
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
