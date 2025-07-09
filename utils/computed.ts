export function getProductName(product: any) {
  return product?.name;
}

export function getProductImage(product: any) {
  return product?.images[0]
}

export function getProductDescription(product: any) {
  return product?.description ?? ''
}

export function getProductPrice(product: any) {
  return parseInt(product?.unit_amount) / 100;
}
