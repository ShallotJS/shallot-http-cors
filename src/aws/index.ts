/**
 * TypeScript + promises port of middy http-cors
 * https://github.com/middyjs/middy/tree/master/packages/http-cors
 */

import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { ShallotAWSMiddlewareWithOptions } from '@shallot/aws';

export interface TShallotHTTPCorsOptions extends Record<string, unknown> {
  /** Sets Access-Control-Allow-Headers */
  allowHeaders?: string;
  /** Sets Access-Control-Allow-Origins. Default ['*'] */
  allowedOrigins?: string[];
  /** Sets Access-Control-Allow-Credentials. Default false */
  credentials?: boolean;
  /** Sets Access-Control-Max-Age */
  maxAge?: string;
  /** Sets Cache-Control */
  cacheControl?: string;
}

const setHeaderIfNotExists = (
  response: APIGatewayProxyResult,
  header: string,
  value?: string | boolean | number
): void => {
  if (value != null && response.headers && response.headers[header] == null) {
    response.headers[header] = String(value);
  }
};

const parseAllowedOrigin = (event: APIGatewayEvent, allowedOrigins: string[]): string => {
  const inboundOrigin = event.headers['Origin'] ?? event.headers['origin'];

  if (inboundOrigin != null && allowedOrigins.includes(inboundOrigin)) {
    return inboundOrigin;
  } else if (allowedOrigins.includes('*')) {
    return '*';
  }

  return allowedOrigins[0];
};

/**
 * Shallot middleware that handles the setting of response CORS headers according
 * to the MSDN spec. https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 *
 * @param config optional object to pass config options
 */
const ShallotAWSHttpCors: ShallotAWSMiddlewareWithOptions<
  APIGatewayEvent,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  TShallotHTTPCorsOptions
> = (config) => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  finally: async (request) => {
    config = {
      allowedOrigins: ['*'],
      credentials: false,
      ...config,
    };

    if (request.event.httpMethod != null) {
      request.response = request.response ?? {};
      request.response.headers = request.response.headers ?? {};

      setHeaderIfNotExists(
        request.response,
        'Access-Control-Allow-Headers',
        config.allowHeaders
      );

      if (config.credentials === true) {
        setHeaderIfNotExists(request.response, 'Access-Control-Allow-Credentials', true);
      }

      setHeaderIfNotExists(request.response, 'Access-Control-Max-Age', config.maxAge);

      if (config.allowedOrigins && config.allowedOrigins.length > 0) {
        setHeaderIfNotExists(
          request.response,
          'Access-Control-Allow-Origin',
          parseAllowedOrigin(request.event, config.allowedOrigins)
        );
      }

      if (request.event.httpMethod === 'OPTIONS') {
        setHeaderIfNotExists(request.response, 'Cache-Control', config.cacheControl);
      }
    }
  },
});

export default ShallotAWSHttpCors;
