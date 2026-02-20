export interface Notification {
  id: string;
  type: "application" | "interview" | "status" | "tip" | "message";
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "status",
    title: "Application Status Update",
    description: "Your application for Senior Frontend Engineer at TechCorp has been shortlisted!",
    time: "2 hours ago",
    read: false,
    actionUrl: "/(jobseeker)/dashboard"
  },
  {
    id: "2",
    type: "interview",
    title: "Interview Scheduled",
    description: "Interview for Product Designer at Design Studio scheduled for Jan 5, 2:00 PM",
    time: "5 hours ago",
    read: false,
    actionUrl: "/(jobseeker)/dashboard"
  },
  {
    id: "3",
    type: "tip",
    title: "Career Tip",
    description: "Update your profile with your latest projects to attract more opportunities",
    time: "1 day ago",
    read: true,
    actionUrl: "/(jobseeker)/profile"
  },
  {
    id: "4",
    type: "application",
    title: "New Job Match",
    description: "3 new jobs matching your preferences are available",
    time: "1 day ago",
    read: true,
    actionUrl: "/(jobseeker)/swipe"
  },
  {
    id: "5",
    type: "message",
    title: "Message from TechCorp",
    description: "The hiring manager would like to know more about your React experience",
    time: "2 days ago",
    read: true,
    actionUrl: "/(jobseeker)/chat"
  },
  {
    id: "6",
    type: "status",
    title: "Application Submitted",
    description: "Your application for Backend Developer at DataSystems has been received",
    time: "3 days ago",
    read: true
  }
];
