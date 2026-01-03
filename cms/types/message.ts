export interface IMessage {
  id: number;
  key: string;
  content: string;
  sender: number;
  sender_name: string;
  receiver: number;
  receiver_name: string;
  created_date: string;
  created_id: number;
  updated_date: string; // ISO date string
  updated_id: number;
}
