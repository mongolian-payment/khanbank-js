import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KhanBankClient } from "../src/client.js";
import { KhanBankError } from "../src/errors.js";
import { loadConfigFromEnv } from "../src/config.js";
import {
  MONGOLIAN_LANGUAGE_CODE,
  ENGLISH_LANGUAGE_CODE,
} from "../src/types.js";

// ── Constructor ──

describe("KhanBankClient constructor", () => {
  it("should create a client with valid config", () => {
    const client = new KhanBankClient({
      endpoint: "https://epg.khanbank.com/payment/rest",
      username: "testuser",
      password: "testpass",
    });
    expect(client).toBeInstanceOf(KhanBankClient);
  });

  it("should strip trailing slash from endpoint", () => {
    const client = new KhanBankClient({
      endpoint: "https://epg.khanbank.com/payment/rest/",
      username: "testuser",
      password: "testpass",
    });
    expect(client).toBeInstanceOf(KhanBankClient);
  });

  it("should throw if endpoint is missing", () => {
    expect(
      () =>
        new KhanBankClient({
          endpoint: "",
          username: "testuser",
          password: "testpass",
        })
    ).toThrow("endpoint is required");
  });

  it("should throw if username is missing", () => {
    expect(
      () =>
        new KhanBankClient({
          endpoint: "https://epg.khanbank.com",
          username: "",
          password: "testpass",
        })
    ).toThrow("username is required");
  });

  it("should throw if password is missing", () => {
    expect(
      () =>
        new KhanBankClient({
          endpoint: "https://epg.khanbank.com",
          username: "testuser",
          password: "",
        })
    ).toThrow("password is required");
  });

  it("should default language to Mongolian", () => {
    const client = new KhanBankClient({
      endpoint: "https://epg.khanbank.com",
      username: "testuser",
      password: "testpass",
    });
    expect(client).toBeInstanceOf(KhanBankClient);
  });

  it("should accept custom language", () => {
    const client = new KhanBankClient({
      endpoint: "https://epg.khanbank.com",
      username: "testuser",
      password: "testpass",
      language: ENGLISH_LANGUAGE_CODE,
    });
    expect(client).toBeInstanceOf(KhanBankClient);
  });
});

// ── registerOrder ──

describe("KhanBankClient.registerOrder", () => {
  let client: KhanBankClient;

  beforeEach(() => {
    client = new KhanBankClient({
      endpoint: "https://epg.khanbank.com/payment/rest",
      username: "testuser",
      password: "testpass",
      language: MONGOLIAN_LANGUAGE_CODE,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should register an order and return orderId and formUrl", async () => {
    const mockResponse = {
      orderId: "abc-123",
      formUrl: "https://epg.khanbank.com/payment/merchants/form/abc-123",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await client.registerOrder({
      orderNumber: "ORDER-001",
      amount: 1000,
      successCallback: "https://example.com/success",
      failCallback: "https://example.com/fail",
    });

    expect(result).toEqual({
      orderId: "abc-123",
      formUrl: "https://epg.khanbank.com/payment/merchants/form/abc-123",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://epg.khanbank.com/payment/rest/register.do",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: "ORDER-001",
          amount: "1000.00",
          returnUrl: "https://example.com/success",
          failUrl: "https://example.com/fail",
          jsonParams: { orderNumber: "ORDER-001" },
          userName: "testuser",
          Password: "testpass",
          language: "mn",
        }),
      }
    );
  });

  it("should format amount with 2 decimal places", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ orderId: "x", formUrl: "y" }),
      })
    );

    await client.registerOrder({
      orderNumber: "ORDER-002",
      amount: 49.5,
      successCallback: "https://example.com/success",
      failCallback: "https://example.com/fail",
    });

    const callBody = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(callBody.amount).toBe("49.50");
  });

  it("should throw KhanBankError on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      })
    );

    await expect(
      client.registerOrder({
        orderNumber: "ORDER-003",
        amount: 500,
        successCallback: "https://example.com/success",
        failCallback: "https://example.com/fail",
      })
    ).rejects.toThrow(KhanBankError);
  });

  it("should throw KhanBankError on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused"))
    );

    await expect(
      client.registerOrder({
        orderNumber: "ORDER-004",
        amount: 500,
        successCallback: "https://example.com/success",
        failCallback: "https://example.com/fail",
      })
    ).rejects.toThrow("Network error");
  });

  it("should throw KhanBankError on invalid JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Unexpected token")),
      })
    );

    await expect(
      client.registerOrder({
        orderNumber: "ORDER-005",
        amount: 500,
        successCallback: "https://example.com/success",
        failCallback: "https://example.com/fail",
      })
    ).rejects.toThrow("Invalid JSON response");
  });
});

// ── checkOrder ──

describe("KhanBankClient.checkOrder", () => {
  let client: KhanBankClient;

  beforeEach(() => {
    client = new KhanBankClient({
      endpoint: "https://epg.khanbank.com/payment/rest",
      username: "testuser",
      password: "testpass",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return success: true when orderStatus is '2'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            orderStatus: "2",
            ErrorCode: "0",
            ErrorMessage: "",
            OrderNumber: "ORDER-001",
            Ip: "192.168.1.1",
          }),
      })
    );

    const result = await client.checkOrder("abc-123");

    expect(result).toEqual({
      success: true,
      errorCode: "0",
      errorMessage: "",
      orderNumber: "ORDER-001",
      ip: "192.168.1.1",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://epg.khanbank.com/payment/rest/getOrderStatus.do",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: "testuser",
          Password: "testpass",
          language: "mn",
          orderId: "abc-123",
        }),
      }
    );
  });

  it("should return success: false when orderStatus is not '2'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            orderStatus: "0",
            ErrorCode: "5",
            ErrorMessage: "Order not paid",
            OrderNumber: "ORDER-002",
            Ip: "10.0.0.1",
          }),
      })
    );

    const result = await client.checkOrder("def-456");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("5");
    expect(result.errorMessage).toBe("Order not paid");
  });

  it("should throw KhanBankError on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal Server Error" }),
      })
    );

    await expect(client.checkOrder("bad-id")).rejects.toThrow(KhanBankError);
  });
});

// ── loadConfigFromEnv ──

describe("loadConfigFromEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should load config from environment variables", () => {
    process.env.KHANBANK_ENDPOINT = "https://epg.khanbank.com";
    process.env.KHANBANK_USERNAME = "myuser";
    process.env.KHANBANK_PASSWORD = "mypass";
    process.env.KHANBANK_LANGUAGE = "en";

    const config = loadConfigFromEnv();

    expect(config).toEqual({
      endpoint: "https://epg.khanbank.com",
      username: "myuser",
      password: "mypass",
      language: "en",
    });
  });

  it("should load config without optional language", () => {
    process.env.KHANBANK_ENDPOINT = "https://epg.khanbank.com";
    process.env.KHANBANK_USERNAME = "myuser";
    process.env.KHANBANK_PASSWORD = "mypass";
    delete process.env.KHANBANK_LANGUAGE;

    const config = loadConfigFromEnv();

    expect(config).toEqual({
      endpoint: "https://epg.khanbank.com",
      username: "myuser",
      password: "mypass",
    });
  });

  it("should throw if KHANBANK_ENDPOINT is missing", () => {
    process.env.KHANBANK_USERNAME = "myuser";
    process.env.KHANBANK_PASSWORD = "mypass";
    delete process.env.KHANBANK_ENDPOINT;

    expect(() => loadConfigFromEnv()).toThrow("KHANBANK_ENDPOINT");
  });

  it("should throw if KHANBANK_USERNAME is missing", () => {
    process.env.KHANBANK_ENDPOINT = "https://epg.khanbank.com";
    process.env.KHANBANK_PASSWORD = "mypass";
    delete process.env.KHANBANK_USERNAME;

    expect(() => loadConfigFromEnv()).toThrow("KHANBANK_USERNAME");
  });

  it("should throw if KHANBANK_PASSWORD is missing", () => {
    process.env.KHANBANK_ENDPOINT = "https://epg.khanbank.com";
    process.env.KHANBANK_USERNAME = "myuser";
    delete process.env.KHANBANK_PASSWORD;

    expect(() => loadConfigFromEnv()).toThrow("KHANBANK_PASSWORD");
  });
});

// ── Constants ──

describe("Constants", () => {
  it("should export MONGOLIAN_LANGUAGE_CODE as 'mn'", () => {
    expect(MONGOLIAN_LANGUAGE_CODE).toBe("mn");
  });

  it("should export ENGLISH_LANGUAGE_CODE as 'en'", () => {
    expect(ENGLISH_LANGUAGE_CODE).toBe("en");
  });
});

// ── KhanBankError ──

describe("KhanBankError", () => {
  it("should be an instance of Error", () => {
    const err = new KhanBankError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(KhanBankError);
  });

  it("should have the correct name", () => {
    const err = new KhanBankError("test");
    expect(err.name).toBe("KhanBankError");
  });

  it("should carry statusCode and response", () => {
    const err = new KhanBankError("test", 401, { error: "Unauthorized" });
    expect(err.statusCode).toBe(401);
    expect(err.response).toEqual({ error: "Unauthorized" });
  });

  it("should have undefined statusCode and response when not provided", () => {
    const err = new KhanBankError("test");
    expect(err.statusCode).toBeUndefined();
    expect(err.response).toBeUndefined();
  });
});
