import type {
  Context,
  Handler,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

import { test, describe, jest, expect } from '@jest/globals';

import ShallotAWS from '@shallot/aws';
import { ShallotAWSHttpCors } from '../src';

describe('CORS middleware', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: '',
    functionVersion: '',
    invokedFunctionArn: '',
    memoryLimitInMB: '',
    awsRequestId: '',
    logGroupName: '',
    logStreamName: '',
    getRemainingTimeInMillis: () => 0,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
  };

  const mockHandler: Handler<APIGatewayEvent, APIGatewayProxyResult> = async () => ({
    statusCode: 200,
    body: '',
  });

  test('Default usage', async () => {
    const wrappedHandler = ShallotAWS(mockHandler).use(ShallotAWSHttpCors());

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
    });
  });

  test('Cache-Control for OPTIONS method', async () => {
    const cacheControl = 'no-cache';
    const wrappedHandler = ShallotAWS(mockHandler).use(
      ShallotAWSHttpCors({
        cacheControl,
      })
    );

    const mockEvent = {
      httpMethod: 'OPTIONS',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
    });
  });

  test('Credentials', async () => {
    const wrappedHandler = ShallotAWS(mockHandler).use(
      ShallotAWSHttpCors({
        credentials: true,
      })
    );

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    });
  });

  test('Max-Age', async () => {
    const maxAge = '';
    const wrappedHandler = ShallotAWS(mockHandler).use(
      ShallotAWSHttpCors({
        maxAge: maxAge,
      })
    );

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': maxAge,
    });
  });

  test('Unaccepted origin', async () => {
    const allowedOrigin = 'https://www.other-website.com';
    const wrappedHandler = ShallotAWS(mockHandler).use(
      ShallotAWSHttpCors({
        allowedOrigins: [allowedOrigin],
      })
    );

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': allowedOrigin,
    });
  });

  test('Same origin', async () => {
    const allowedOrigin = 'https://www.other-website.com';
    const wrappedHandler = ShallotAWS(mockHandler).use(
      ShallotAWSHttpCors({
        allowedOrigins: [allowedOrigin],
      })
    );

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        origin: allowedOrigin,
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': allowedOrigin,
    });
  });

  test('No origins', async () => {
    const wrappedHandler = ShallotAWS(mockHandler).use(
      ShallotAWSHttpCors({
        allowedOrigins: [],
      })
    );

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({});
  });

  test('No method', async () => {
    const wrappedHandler = ShallotAWS(mockHandler).use(ShallotAWSHttpCors());

    const mockEvent = {
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).not.toBeDefined;
  });

  test('response undefined', async () => {
    const handlerNoRes = (): void => undefined;
    const wrappedHandler = ShallotAWS<APIGatewayEvent, APIGatewayProxyResult>(
      handlerNoRes
    ).use(ShallotAWSHttpCors());

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toBeDefined;
  });

  test('Predefined headers', async () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const handlerWithResHeaders = async () => ({
      body: '',
      statusCode: 200,
      headers: { 'X-Test': '' },
    });
    const wrappedHandler = ShallotAWS<APIGatewayEvent, APIGatewayProxyResult>(
      handlerWithResHeaders
    ).use(ShallotAWSHttpCors());

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toMatchObject((await handlerWithResHeaders()).headers);
  });
});
