import {
  CognitoUserPool,
  CognitoUser,
  ICognitoUserPoolData,
  ICognitoUserData,
} from "amazon-cognito-identity-js";

export class CognitoServices {
  constructor(private userPoolId: string, private clintId: string) {}

  private poolData: ICognitoUserPoolData = {
    UserPoolId: this.userPoolId,
    ClientId: this.clintId,
  };
  public singUp = (email: string, password: string): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      try {
        const userPool = new CognitoUserPool(this.poolData);
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

  public confirmEmail = (code: string, email: string): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      try {
        const userPool = new CognitoUserPool(this.poolData);
        const userData: ICognitoUserData = {
          Username: email,
          Pool: userPool,
        };
        const user = new CognitoUser(userData);
        user.confirmRegistration(code, true, (err, result) => {
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
