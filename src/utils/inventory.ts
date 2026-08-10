export function calculateBaseQuantity(
  orderQuantity: number,
  orderUnit: string | null | undefined,
  product: {
    stockBaseUnit?: string | null;
    unitConversions?: { fromUnit: string; toUnit: string; conversionQty: number; active: boolean }[];
  }
): number {
  if (!orderUnit || !product.stockBaseUnit || !product.unitConversions) {
    return orderQuantity;
  }
  
  // If the order unit matches the base unit, no conversion needed
  if (orderUnit.toUpperCase() === product.stockBaseUnit.toUpperCase()) {
    return orderQuantity;
  }

  // Find an active conversion mapping from orderUnit to stockBaseUnit
  const conversion = product.unitConversions.find(c => 
    c.fromUnit.toUpperCase() === orderUnit.toUpperCase() && 
    c.toUnit.toUpperCase() === product.stockBaseUnit!.toUpperCase() && 
    c.active
  );

  if (conversion) {
    return orderQuantity * conversion.conversionQty;
  }

  // If no conversion is found, fallback to orderQuantity
  return orderQuantity;
}
