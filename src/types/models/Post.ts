export type IPost = {
  id: string;
  date: string;
  userId: string;
  description: string;
  image: string;
  comments?: Array<string>;
  likes?: Array<string>;
};
