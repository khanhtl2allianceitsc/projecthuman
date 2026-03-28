export type ProjectRoleType =
  | 'Lead'
  | 'PM'
  | 'Frontend Dev'
  | 'Backend Dev'
  | 'Designer'
  | 'QA'
  | 'DevOps'
  | 'Analyst'
  | 'Full Stack'
  | 'AI Developer';

export interface ProjectMember {
  memberId: string;
  projectRole: ProjectRoleType;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  color: string;
  email?: string;
  manMonth?: number;
  isAdmin?: boolean;
  // Images
  avatarUrl?: string;   // '/uploads/avatars/nguyen-van-a_m123_avatar.jpg'
  portraitUrl?: string; // '/uploads/portraits/nguyen-van-a_m123_portrait.jpg'
  // Audit trail
  createdByIp?: string;
  createdAt?: string;
  updatedByIp?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'planning' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  startDate: string;
  endDate: string;
  members: ProjectMember[];
  progress: number;
  budget: number;
  spent: number;
  tags: string[];
  // Volunteer Lead
  needLead?: boolean;
  volunteerDeadline?: string; // ISO date string
  // Audit trail
  createdByIp?: string;
  createdAt?: string;
  updatedByIp?: string;
  updatedAt?: string;
}

export interface DashboardData {
  members: Member[];
  projects: Project[];
}

export interface LeadVolunteer {
  id: number;
  projectId: string;
  memberId: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  createdAt: string;
  memberName: string;
  memberAvatar: string;
  memberColor: string;
  memberRole: string;
  projectName: string;
  projectColor: string;
}

// Helpers
export function getProjectLead(project: Project): ProjectMember | undefined {
  return project.members.find(m => m.projectRole === 'Lead');
}

export function getMemberIds(project: Project): string[] {
  return project.members.map(m => m.memberId);
}
