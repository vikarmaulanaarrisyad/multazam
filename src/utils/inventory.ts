export function calculateBaseQuantity(
  orderQuantity: number,
  orderUnit: string | null | undefined,
  product: {
    stockBaseUnit?: string | null;
    purchaseUnit?: string | null;
    conversionQty?: number | null;
    unitConversions?: { fromUnit: string; toUnit: string; conversionQty: number; active: boolean }[];
  }
): number {
  if (!orderUnit || !product.stockBaseUnit) {
    return orderQuantity;
  }
  
  // If the order unit matches the base unit, no conversion needed
  if (orderUnit.toUpperCase() === product.stockBaseUnit.toUpperCase()) {
    return orderQuantity;
  }

  // Find an active conversion mapping from unitConversions table
  if (product.unitConversions) {
    const conversion = product.unitConversions.find(c => 
      c.fromUnit.toUpperCase() === orderUnit.toUpperCase() && 
      c.toUnit.toUpperCase() === product.stockBaseUnit!.toUpperCase() && 
      c.active
    );

    if (conversion) {
      return orderQuantity * conversion.conversionQty;
    }
  }

  // Fallback to product.purchaseUnit & product.conversionQty
  if (product.purchaseUnit && product.conversionQty && orderUnit.toUpperCase() === product.purchaseUnit.toUpperCase()) {
    return orderQuantity * product.conversionQty;
  }

  // If no conversion is found, fallback to orderQuantity
  return orderQuantity;
}

export function formatConvertedQuantity(
  quantityInBaseUnit: number,
  baseUnit: string,
  targetUnit: string,
  conversionQty: number
): string {
  if (conversionQty <= 1 || baseUnit.toUpperCase() === targetUnit.toUpperCase()) {
    return `${quantityInBaseUnit} ${baseUnit}`;
  }

  const isNegative = quantityInBaseUnit < 0;
  const absQuantity = Math.abs(quantityInBaseUnit);
  
  const majorQty = Math.floor(absQuantity / conversionQty);
  const remainderQty = Math.round(absQuantity % conversionQty);

  const sign = isNegative ? '-' : '';

  if (majorQty > 0) {
    if (remainderQty > 0) {
      return `${sign}${majorQty} ${targetUnit} ${remainderQty} ${baseUnit}`;
    } else {
      return `${sign}${majorQty} ${targetUnit}`;
    }
  }

  return `${sign}${absQuantity} ${baseUnit}`;
}
