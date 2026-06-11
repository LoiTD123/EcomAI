export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/media/')) {
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || '';
    return `${gatewayUrl}${url}`;
  }
  return url;
};
