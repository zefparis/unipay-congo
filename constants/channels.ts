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
    id: 'vodacash',
    name: 'Vodacash',
    color: '#E40613',
    status: 'pending',
    description: 'Vodacom DRC',
  },
  {
    id: 'orange-money',
    name: 'Orange Money',
    color: '#FF6900',
    status: 'pending',
    description: 'Orange DRC',
  },
  {
    id: 'airtel-money',
    name: 'Airtel Money',
    color: '#CC0000',
    status: 'pending',
    description: 'Airtel DRC',
  },
  {
    id: 'afrimoney',
    name: 'Afrimoney',
    color: '#0057A8',
    status: 'pending',
    description: 'Africell RDC',
    ussd: '*555#',
  },
];
