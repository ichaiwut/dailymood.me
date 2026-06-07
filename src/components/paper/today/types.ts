export interface TodayEntry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  aiSource?: string;
  imageUrl?: string | null;
  location?: string | null;
  date: string;
  createdAt: string | number;
}

export interface MoodPickItem {
  id: string;
  label: string;
  labelTh: string | null;
  color: string;
  iconKey: string | null;
}
