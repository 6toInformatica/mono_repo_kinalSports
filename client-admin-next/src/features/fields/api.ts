import { api } from "@/shared/api/client";
import { fetchList } from "@/shared/api/collections";

export interface Field {
  _id: string;
  fieldName: string;
  fieldType: string;
  capacity: string;
  pricePerHour: number;
  description: string;
  photo?: string;
  isActive?: boolean;
}

export const getFields = () => fetchList<Field>("fields");

export const saveField = (form: FormData, id?: string) =>
  api<{ data: Field }>("admin", id ? `fields/${id}` : "fields", {
    method: id ? "PUT" : "POST",
    body: form,
  });

export const deactivateField = (id: string) =>
  api("admin", `fields/${id}/deactivate`, { method: "PUT" });
