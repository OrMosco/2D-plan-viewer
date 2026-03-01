export interface LogEntry {
  id: number;
  timestamp: string;
  action: 'Zoom In' | 'Zoom Out' | 'Pan' | 'Reset' | 'AI Analysis';
  details: string;
}
