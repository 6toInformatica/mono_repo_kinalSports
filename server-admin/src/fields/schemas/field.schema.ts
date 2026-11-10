import { Schema, type InferSchemaType } from 'mongoose';

export const FIELD_MODEL = 'Field';
export const DEFAULT_FIELD_PHOTO = 'fields/kinal_sports_nyvxo5';

export const FieldSchema = new Schema(
  {
    fieldName: {
      type: String,
      required: [true, 'El nombre del campo es requerido'],
      trim: true,
      maxLength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    fieldType: {
      type: String,
      required: [true, 'El tipo de campo es requerido'],
      enum: {
        values: ['NATURAL', 'SINTETICA', 'CONCRETO'],
        message: 'Tipo de superficie no válida',
      },
    },
    capacity: {
      type: String,
      required: [true, 'La capacidad es requerida'],
      enum: {
        values: ['FUTBOL_5', 'FUTBOL_7', 'FUTBOL_11'],
        message: 'Capacidad no válida',
      },
    },
    pricePerHour: {
      type: Number,
      required: [true, 'El precio por hora es requerido'],
      min: [0, 'El precio debe ser mayor o igual a 0'],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    photo: { type: String, default: DEFAULT_FIELD_PHOTO },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

FieldSchema.index({ isActive: 1 });
FieldSchema.index({ fieldType: 1 });
FieldSchema.index({ isActive: 1, fieldType: 1 });

export type Field = InferSchemaType<typeof FieldSchema>;
