import type { DefaultResponseMessage } from "../types/DefaultResponseMessage";

type DefaultJsonMessage = {
  statusCode: number;
  headers: object;
  body: string;
};

export const formatDefaultResponse = (
  statusCode: number,
  message: string | undefined,
  response: Record<string, unknown>,
): DefaultJsonMessage => {
  const defaultMessage: DefaultResponseMessage = {
    error: message,
    message,
  };

  if (message && statusCode >= 200 && statusCode <= 399) {
    defaultMessage.message;
  } else if (message) {
    defaultMessage.error;
  }

  return {
    statusCode,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(response || defaultMessage),
  };
};
