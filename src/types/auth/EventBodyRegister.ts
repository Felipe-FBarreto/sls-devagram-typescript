import { FileData } from "aws-multipart-parser/dist/models";

export type EventBodyRegister = {
  name: string;
  email: string;
  password: string;
  file: FileData;
};
