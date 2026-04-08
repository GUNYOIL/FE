export type AdminLoginRequest = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  access: string;
  refresh: string;
};

export type AdminExerciseCategory = "CHEST" | "BACK" | "LEGS" | "SHOULDERS" | "ARMS" | "ABS" | "CARDIO";

export type AdminExercise = {
  id: number;
  name: string;
  category: AdminExerciseCategory;
  category_display?: string;
  target_muscle?: string;
};

export type CreateExerciseRequest = {
  code: string;
  name: string;
  category: AdminExerciseCategory;
  target_muscle: string;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export type CreateAnnouncementRequest = {
  title: string;
  content: string;
};

export type InquiryStatus = string;

export type AdminInquiry = {
  id: number;
  user_email: string;
  reply_email: string;
  title: string;
  content: string;
  status: InquiryStatus;
  created_at: string;
};

export type UpdateInquiryStatusRequest = {
  status: string;
};
