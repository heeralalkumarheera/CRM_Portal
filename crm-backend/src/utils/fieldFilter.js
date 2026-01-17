const privilegedRoles = new Set(['Super Admin', 'Admin', 'Accountant', 'Manager']);

export const filterClient = (doc, role) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (!privilegedRoles.has(role)) {
    delete obj.gstNumber;
    delete obj.panNumber;
    delete obj.creditLimit;
    // redact any attached sensitive docs metadata if desired
  }
  return obj;
};

export const filterClients = (docs, role) => {
  if (!Array.isArray(docs)) return docs;
  return docs.map((d) => filterClient(d, role));
};

// Lead filters: hide revenue/probability for non-privileged roles
export const filterLead = (doc, role) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (!privilegedRoles.has(role)) {
    delete obj.expectedRevenue;
    delete obj.probability;
  }
  return obj;
};

export const filterLeads = (docs, role) => {
  if (!Array.isArray(docs)) return docs;
  return docs.map((d) => filterLead(d, role));
};
