export interface IMCQPaper {
  _id: string;
  title: string;
}

export interface ListMCQPapersResponse {
  success: boolean;
  data: {
    papers: IMCQPaper[];
  };
}
