import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FieldService } from './field.service.js';
import { FieldsController } from './fields.controller.js';
import { FIELD_MODEL, FieldSchema } from './schemas/field.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FIELD_MODEL, schema: FieldSchema }]),
  ],
  controllers: [FieldsController],
  providers: [FieldService],
})
export class FieldsModule {}
