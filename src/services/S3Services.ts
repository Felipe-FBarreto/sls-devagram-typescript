import { FileData } from "aws-multipart-parser/dist/models";
import * as AWS from "aws-sdk";
import * as Uuid from "uuid";
import { imageAllowedExtensions } from "../contents/Regexes";

const S3 = new AWS.S3();

export class S3Service {
  public saveImageS3 = (
    bucket: string,
    type: string,
    file: FileData,
  ): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      try {
        const uuidImage = Uuid.v4();
        const extension = imageAllowedExtensions.exec(file.filename) || [""];
        const key = `${type}-${uuidImage}-${extension[0]}`;

        const config = {
          Bucket: bucket,
          Key: key,
          Body: file.filename,
        };
        S3.upload(config, (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(key);
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  public getImageUrl = (
    bucket: string,
    key: string,
  ): Promise<string | Error> => {
    return new Promise((resolve, reject) => {
      try {
        const params = { Bucket: bucket, Key: key };
        S3.getSignedUrl("getObject", params, (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
      } catch (err) {
        reject(err);
      }
    });
  };
}
