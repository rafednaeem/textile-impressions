export function getProductImage(product: {
  product_images?: { url: string; is_primary: boolean }[] | null
}): string | null {
  if (!product.product_images?.length) return null
  const primary = product.product_images.find((img) => img.is_primary)
  return primary?.url ?? product.product_images[0].url
}

export function getProductHoverImage(product: {
  product_images?: { url: string; is_primary: boolean }[] | null
}): string | null {
  if (!product.product_images || product.product_images.length < 2) return null
  return product.product_images[1]?.url ?? null
}
