import {
  CognitoUserPool,
  CognitoUser,
  ICognitoUserPoolData,
  ICognitoUserData,
  AuthenticationDetails,
  IAuthenticationDetailsData,
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

  public forgotPassword = (email: string): Promise<string> => {
    return new Promise<any>((resolve, reject) => {
      try {
        const userPool = new CognitoUserPool(this.poolData);

        const userData: ICognitoUserData = {
          Username: email,
          Pool: userPool,
        };
        const user = new CognitoUser(userData);
        user.forgotPassword({
          onSuccess(data) {
            resolve(data);
          },
          onFailure(err) {
            reject(err);
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  };
  public confirmPassword = (
    code: string,
    email: string,
    newPassword: string,
  ): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      try {
        const userPool = new CognitoUserPool(this.poolData);
        const userData: ICognitoUserData = {
          Username: email,
          Pool: userPool,
        };
        const user = new CognitoUser(userData);
        user.confirmPassword(code, newPassword, {
          onSuccess(data) {
            resolve(data);
          },
          onFailure(err) {
            reject(err);
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  };
  public login = (login: string, password: string): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      try {
        const userPool = new CognitoUserPool(this.poolData);
        const userData: ICognitoUserData = {
          Username: login,
          Pool: userPool,
        };
        const authenticationDate: IAuthenticationDetailsData = {
          Username: login,
          Password: password,
        };
        const authenticationDetails = new AuthenticationDetails(
          authenticationDate,
        );
        const user = new CognitoUser(userData);
        user.authenticateUser(authenticationDetails, {
          onFailure(err) {
            reject(err);
          },
          onSuccess(session) {
            const accessToken = session.getAccessToken().getJwtToken();
            const refreshToken = session.getRefreshToken().getToken();
            resolve({
              email: login,
              token: accessToken,
              refreshToken,
            });
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  };
}
