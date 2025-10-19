export const formatDeliveryAddress = (address, options = {}) => {
  const { multiline = false } = options;
  if (!address) {
    return 'No address provided';
  }

  if (typeof address === 'string') {
    const trimmed = address.trim();
    return trimmed || 'No address provided';
  }

  const parts = [];
  const addPart = (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        parts.push(trimmed);
      }
    }
  };

  if (Array.isArray(address.lines)) {
    address.lines.forEach(addPart);
  }

  addPart(address.line1);
  addPart(address.line2);
  addPart(address.street);
  addPart(address.city);

  const stateOrRegion = [address.state, address.region]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim());
  if (stateOrRegion.length) {
    parts.push(stateOrRegion.join(' '));
  }

  addPart(address.zipCode || address.postalCode);
  addPart(address.country);

  if (typeof address.formatted === 'string' && address.formatted.trim()) {
    parts.push(address.formatted.trim());
  }

  if (typeof address.fullAddress === 'string' && address.fullAddress.trim()) {
    parts.push(address.fullAddress.trim());
  }

  if (!parts.length && address.description) {
    addPart(address.description);
  }

  const uniqueParts = parts.filter((value, index) => {
    return parts.indexOf(value) === index;
  });

  if (uniqueParts.length === 0) {
    return 'Address details unavailable';
  }

  const separator = multiline ? '\n' : ', ';
  return uniqueParts.join(separator);
};
