export type User = {
  name: string;
  email: string;
  cognitoId: string;
  avatar?: string;
  followers?: number;
  following?: number;
  post?: Array<string>;
};
