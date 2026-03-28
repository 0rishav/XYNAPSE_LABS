export interface IIntroBlock {
  type:
    | "image"
    | "heading"
    | "paragraph"
    | "bullet_list"
    | "quote"
    | "code"
    | "video";
  data: {
    text?: string;         // Backend 'text' bhej raha hai (Heading, Paragraph, Quote ke liye)
    content?: string;      // Fallback for older data
    url?: string;          // Image/Video URL
    alt?: string;          // Image alt text
    items?: string[];      // Bullet list items
    language?: string;     // Code block language
    caption?: string;      // Image/Video caption
    level?: number;        // Heading level (2, 3)
    author?: string;       // Quote author
    order: number;         // Sorting order
  };
}

export interface ICourseIntro {
  _id: string;
  courseId: string;
  title: string;
  blocks: IIntroBlock[];
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGetCourseIntroResponse {
  success: boolean;
  message: string;
  data: ICourseIntro;
}