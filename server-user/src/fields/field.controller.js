import Field from './field.model.js';

// Obtener todos los campos con paginación y filtros
export const getFields = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive = true } = req.query;

    const filter = { isActive };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const fields = await Field.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(options.sort);

    const total = await Field.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: fields,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los campos',
      error: error.message,
    });
  }
};

// Obtener campo por ID
export const getFieldById = async (req, res) => {
  try {
    const { id } = req.params;

    const field = await Field.findById(id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Campo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: field,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el campo',
      error: error.message,
    });
  }
};
