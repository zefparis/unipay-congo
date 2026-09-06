export type ChannelStatus = 'active' | 'pending';

export interface Channel {
  id: string;
  name: string;
  color: string;
  status: ChannelStatus;
  description: string;
  ussd?: string;
}

export const channels: Channel[] = [
  {
    id: 'orange-money',
    name: 'Orange Money',
    color: '#FF6900',
    status: 'active',
    description: 'Orange DRC',
  },
  {
    id: 'airtel-money',
    name: 'Airtel Money',
    color: '#CC0000',
    status: 'active',
    description: 'Airtel DRC',
  },
  {
    id: 'afrimoney',
    name: 'Afrimoney',
    color: '#0057A8',
    status: 'active',
    description: 'Africell RDC',
    ussd: '*555#',
  },
];
