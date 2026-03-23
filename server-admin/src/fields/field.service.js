import Field from './field.model.js';
import { cloudinary } from '../../middlewares/file-uploader.js';

export const fetchFields = async ({
  page = 1,
  limit = 10,
  isActive = true,
}) => {
  const filter = { isActive };
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const fields = await Field.find(filter)
    .limit(limitNumber * 1)
    .skip((pageNumber - 1) * limitNumber)
    .sort({ createdAt: -1 });

  const total = await Field.countDocuments(filter);

  return {
    fields,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      limit,
    },
  };
};

export const fetchFieldById = async (id) => {
  return Field.findById(id);
};

export const createFieldRecord = async ({ fieldData, file }) => {
  const data = { ...fieldData };

  if (file) {
    const extension = file.path.split('.').pop();
    const filename = file.filename;
    const relativePath = filename.substring(filename.indexOf('fields/'));

    data.photo = `${relativePath}.${extension}`;
  } else {
    data.photo = 'fields/kinal_sports_nyvxo5';
  }

  const field = new Field(data);
  await field.save();
  return field;
};

export const updateFieldRecord = async ({ id, updateData, file }) => {
  const data = { ...updateData };

  if (file) {
    const currentField = await Field.findById(id);

    if (currentField && currentField.photo) {
      const photoPath = currentField.photo;
      const photoWithoutExt = photoPath.substring(
        0,
        photoPath.lastIndexOf('.')
      );
      const publicId = `kinal_sports/${photoWithoutExt}`;

      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error(
          `Error al eliminar imagen anterior de Cloudinary: ${deleteError.message}`
        );
      }
    }

    const extension = file.path.split('.').pop();
    const filename = file.filename;
    const relativePath = filename.includes('fields/')
      ? filename.substring(filename.indexOf('fields/'))
      : filename;
    data.photo = `${relativePath}.${extension}`;
  }

  return Field.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const updateFieldStatus = async ({ id, isActive }) => {
  return Field.findByIdAndUpdate(id, { isActive }, { new: true });
};
