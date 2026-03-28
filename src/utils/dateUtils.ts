import { differenceInDays, parseISO, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Project } from '../types';

export function getDaysRemaining(endDate: string): number {
  const end = parseISO(endDate);
  const today = startOfDay(new Date());
  return differenceInDays(end, today);
}

export function getDaysTotal(startDate: string, endDate: string): number {
  return differenceInDays(parseISO(endDate), parseISO(startDate));
}

export function getDaysElapsed(startDate: string): number {
  const start = parseISO(startDate);
  const today = startOfDay(new Date());
  return Math.max(0, differenceInDays(today, start));
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM yyyy', { locale: vi });
}

export function getStatusColor(status: Project['status']): string {
  switch (status) {
    case 'active': return '#10b981';
    case 'completed': return '#6366f1';
    case 'planning': return '#f59e0b';
    case 'paused': return '#ef4444';
    default: return '#6b7280';
  }
}

export function getStatusLabel(status: Project['status']): string {
  switch (status) {
    case 'active': return 'Đang chạy';
    case 'completed': return 'Hoàn thành';
    case 'planning': return 'Lên kế hoạch';
    case 'paused': return 'Tạm dừng';
    default: return status;
  }
}

export function getPriorityColor(priority: Project['priority']): string {
  switch (priority) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#06b6d4';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
}

export function getPriorityLabel(priority: Project['priority']): string {
  switch (priority) {
    case 'critical': return 'Khẩn cấp';
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return priority;
  }
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B₫`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}M₫`;
  }
  return `${amount.toLocaleString()}₫`;
}

export function isProjectOverdue(project: Project): boolean {
  const today = startOfDay(new Date());
  return isBefore(parseISO(project.endDate), today) && project.status !== 'completed';
}

export function getTimelinePosition(
  startDate: string,
  endDate: string,
  minDate: Date,
  totalDays: number
): { left: number; width: number } {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const startOffset = Math.max(0, differenceInDays(start, minDate));
  const duration = differenceInDays(end, start);
  return {
    left: (startOffset / totalDays) * 100,
    width: Math.max(2, (duration / totalDays) * 100),
  };
}
