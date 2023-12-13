import {
  CognitoUserPool,
  ICognitoUserPoolData,
} from "amazon-cognito-identity-js";

export class CognitoServices {
  constructor(private userPoolId: string, private clintId: string) {}

  public singUp = (email: string, password: string): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      try {
        const poolData: ICognitoUserPoolData = {
          UserPoolId: this.userPoolId,
          ClientId: this.clintId,
        };

        const userPool = new CognitoUserPool(poolData);
        const attributeList = [];
        userPool.signUp(
          email,
          password,
          attributeList,
          attributeList,
          (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result);
          },
        );
      } catch (err) {
        reject(err);
      }
    });
  };
}
