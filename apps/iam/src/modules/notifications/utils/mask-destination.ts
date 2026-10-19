/** a***@mail.com, +234******678 */
export function maskDestination(channel: 'email' | 'sms', value: string): string {
  if (channel === 'email') {
    const [local = '', domain = ''] = value.split('@');
    return `${local.slice(0, 1)}***@${domain}`;
  }
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(0, value.length - 7))}${value.slice(-3)}`;
}
