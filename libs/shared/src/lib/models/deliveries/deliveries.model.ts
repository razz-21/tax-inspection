import { z } from 'zod';

export const TRUCK_TYPES = ['10 Wheelers', '8 Wheelers', '6 Wheelers'] as const;
export const truckTypeSchema = z.enum(TRUCK_TYPES);
export type TruckType = z.infer<typeof truckTypeSchema>;

export const MATERIAL_TYPES = [
  'Sand',
  'Gravel',
  'Stones',
  'Filling Materials',
] as const;
export const materialTypeSchema = z.enum(MATERIAL_TYPES);
export type MaterialType = z.infer<typeof materialTypeSchema>;

export const MATERIAL_UNITS = ['Cubic Meter - m³'] as const;
export const materialUnitSchema = z.enum(MATERIAL_UNITS);
export type MaterialUnit = z.infer<typeof materialUnitSchema>;

/** Hauler moving the load. */
export const haulerSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  contact_number: z.string().default(''),
});
export type Hauler = z.infer<typeof haulerSchema>;

/** Driver + vehicle on the trip. */
export const truckSchema = z.object({
  drivers_name: z.string().min(1),
  license_number: z.string().min(1),
  plate_number: z.string().min(1),
  truck_type: truckTypeSchema,
});
export type Truck = z.infer<typeof truckSchema>;

/** What is being delivered. */
export const materialsSchema = z.object({
  source_of_material: z.string().min(1),
  material_type: materialTypeSchema,
  unit: materialUnitSchema,
});
export type Materials = z.infer<typeof materialsSchema>;

/** Full delivery record. `id` is a UUID (maps to Mongo `_id`). */
export const deliverySchema = z.object({
  id: z.uuid(),
  haulers: haulerSchema,
  truck: truckSchema,
  materials: materialsSchema,
  address: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  place_of_deliveries: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  receipt_number: z.string().min(1),
  remarks: z.string().default(''),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Delivery = z.infer<typeof deliverySchema>;
