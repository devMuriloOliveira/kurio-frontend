const weiPerEth = 10n ** 18n

export const estimatedNetworkFeeEth = '0.016'
export const launchDiscountEth = '0.00'

export function parseEthToWei(value: string): bigint {
  if (!/^\d+(?:\.\d{1,18})?$/.test(value)) {
    throw new RangeError('Preço em ETH inválido ou com mais de 18 casas decimais.')
  }
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * weiPerEth + BigInt(fraction.padEnd(18, '0'))
}

export function multiplyEth(priceEth: string, quantity: number): bigint {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new RangeError('Quantidade inválida.')
  return parseEthToWei(priceEth) * BigInt(quantity)
}

export function sumWei(values: bigint[]): bigint {
  return values.reduce((sum, value) => sum + value, 0n)
}

export function addWei(...values: bigint[]): bigint {
  return sumWei(values)
}

export function formatWeiAsEth(value: bigint): string {
  const sign = value < 0n ? '-' : ''
  const amount = value < 0n ? -value : value
  const whole = amount / weiPerEth
  const fraction = (amount % weiPerEth).toString().padStart(18, '0').replace(/0+$/, '').padEnd(2, '0')
  return `${sign}${whole}.${fraction}`
}
