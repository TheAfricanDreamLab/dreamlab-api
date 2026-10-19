export const channelFor = (identifier: string): 'email' | 'sms' => (identifier.includes('@') ? 'email' : 'sms');
