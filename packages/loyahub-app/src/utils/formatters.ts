/**
 * Formata um endereço blockchain para exibição
 * @param address Endereço completo
 * @returns Endereço formatado (ex: 0x1234...5678)
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Formata um valor de moeda para exibição
 * @param value Valor a ser formatado
 * @returns Valor formatado com separadores de milhar e casa decimal
 */
export const formatCurrency = (value: number | string): string => {
  if (value === null || value === undefined) return 'N/A';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

/**
 * Formata nome de usuário a partir do email
 * @param email Email do usuário
 * @returns Nome formatado
 */
export const formatUsername = (email: string): string => {
  if (!email) return 'User';
  
  const [username] = email.split('@');
  return username
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}; 