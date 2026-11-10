import { Schema, Types, type HydratedDocument } from 'mongoose';
import { FIELD_MODEL } from '../../fields/schemas/field.schema.js';

export const RESERVATION_MODEL = 'Reservation';

export const RESERVATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
] as const;

/** Estados que ocupan el horario de la cancha */
export const ACTIVE_RESERVATION_STATUSES: Reservation['status'][] = [
  'CONFIRMED',
  'PENDING',
];

export interface Reservation {
  userId: string;
  fieldId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: (typeof RESERVATION_STATUSES)[number];
  confirmation?: { confirmedAt?: Date; confirmedBy?: string };
  lastModifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationDocument = HydratedDocument<Reservation>;

// Mismo esquema que usa server-user (colección compartida)
export const ReservationSchema = new Schema<Reservation>(
  {
    userId: {
      type: String,
      required: [true, 'El ID del usuario es requerido'],
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: FIELD_MODEL,
      required: [true, 'El ID del campo es requerido'],
    },
    startTime: {
      type: Date,
      required: [true, 'La hora de inicio es requerida'],
    },
    endTime: {
      type: Date,
      required: [true, 'La hora de fin es requerida'],
    },
    status: {
      type: String,
      enum: { values: RESERVATION_STATUSES, message: 'Estado no válido' },
      default: 'PENDING',
    },
    confirmation: {
      confirmedAt: Date,
      confirmedBy: String,
    },
    lastModifiedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

ReservationSchema.index({ userId: 1 });
ReservationSchema.index({ fieldId: 1 });
ReservationSchema.index({ startTime: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ startTime: 1, fieldId: 1 });
ReservationSchema.index({ startTime: -1, status: 1 });

ReservationSchema.pre('save', function () {
  if (this.endTime <= this.startTime) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio');
  }
});
