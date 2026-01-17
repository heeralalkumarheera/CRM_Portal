// Pagination helper
export const getPagination = (page, limit) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    page: currentPage,
    limit: itemsPerPage,
    skip
  };
};

// Build query filter
export const buildQueryFilter = (filters) => {
  const query = {};

  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      query[key] = filters[key];
    }
  });

  return query;
};

// Build search query
export const buildSearchQuery = (searchFields, searchTerm) => {
  if (!searchTerm || searchFields.length === 0) {
    return {};
  }

  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};

// Build date range query
export const buildDateRangeQuery = (field, startDate, endDate) => {
  const query = {};

  if (startDate && endDate) {
    query[field] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    query[field] = { $gte: new Date(startDate) };
  } else if (endDate) {
    query[field] = { $lte: new Date(endDate) };
  }

  return query;
};

// Build sort query
export const buildSortQuery = (sortBy, sortOrder = 'desc') => {
  if (!sortBy) {
    return { createdAt: -1 }; // Default sort
  }

  return {
    [sortBy]: sortOrder === 'asc' ? 1 : -1
  };
};
