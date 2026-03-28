export type BlockType = 
  | "heading" 
  | "paragraph" 
  | "image" 
  | "divider" 
  | "bullet_list" 
  | "numbered_list" 
  | "quote" 
  | "code";

export interface IContentBlock {
  type: BlockType;
  order: number;
  data: {
    text?: string;
    level?: number;
    url?: string;
    caption?: string;
    items?: string[];
    language?: string;
    code?: string;
  };
}

export interface IContent {
  _id: string;
  courseId: string;
  chapterId: string;
  title: string;
  slug: string;
  blocks: IContentBlock[];
  accessType: "free" | "paid";
  isPreviewFree: boolean;
  isPublished: boolean;
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    noIndex: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IContentListResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    contents: IContent[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}