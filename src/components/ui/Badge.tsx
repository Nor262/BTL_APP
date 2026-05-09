import React from 'react';
import { View, Text } from 'react-native';

type Status = 'available' | 'in_use' | 'broken' | 'pending' | 'approved' | 'rejected' | 'maintenance';

interface BadgeProps {
  status: Status | string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Sẵn sàng', color: '#34C759', bg: '#E8F9EE' },
  in_use: { label: 'Đang mượn', color: '#007AFF', bg: '#E5F1FF' },
  broken: { label: 'Đang hỏng', color: '#FF3B30', bg: '#FFEBEA' },
  pending: { label: 'Chờ duyệt', color: '#FF9500', bg: '#FFF4E5' },
  approved: { label: 'Đã duyệt', color: '#34C759', bg: '#E8F9EE' },
  active: { label: 'Đang mượn', color: '#007AFF', bg: '#E5F1FF' },
  rejected: { label: 'Từ chối', color: '#FF3B30', bg: '#FFEBEA' },
  maintenance: { label: 'Bảo trì', color: '#5856D6', bg: '#EEEEFF' },
  overdue: { label: 'Quá hạn', color: '#FF3B30', bg: '#FFEBEA' },
};

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { label: status, color: '#8E8E93', bg: '#F2F2F7' };

  return (
    <View 
      className="px-3 py-1 rounded-full items-center justify-center"
      style={{ backgroundColor: config.bg }}
    >
      <Text 
        className="text-xs font-bold"
        style={{ color: config.color }}
      >
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
}
