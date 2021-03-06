import {executeRpcCall, getIsomorphicEnhancedResolver} from "@blitzjs/core"

global.fetch = jest.fn(() => Promise.resolve({json: () => ({result: null, error: null})}))

declare global {
  namespace NodeJS {
    interface Global {
      fetch: any
    }
  }
}

describe("RPC", () => {
  describe("HEAD", () => {
    it("warms the endpoint", async () => {
      expect.assertions(1)
      await executeRpcCall.warm("/api/endpoint")
      expect(global.fetch).toBeCalled()
    })
  })

  describe("POST", () => {
    it("makes the request", async () => {
      expect.assertions(2)
      const fetchMock = jest
        .spyOn(global, "fetch")
        .mockImplementationOnce(() => Promise.resolve())
        .mockImplementationOnce(() =>
          Promise.resolve({json: () => ({result: "result", error: null})}),
        )

      const resolverModule = {
        default: jest.fn(),
      }
      const rpcFn = getIsomorphicEnhancedResolver(
        resolverModule,
        "app/_resolvers/queries/getProduct",
        "testResolver",
        "query",
        "client",
      )

      try {
        const result = await rpcFn({paramOne: 1234})
        expect(result).toBe("result")
        expect(fetchMock).toBeCalled()
      } finally {
        fetchMock.mockRestore()
      }
    })

    it("handles errors", async () => {
      expect.assertions(1)
      const fetchMock = jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          json: () => ({result: null, error: {name: "Error", message: "something broke"}}),
        }),
      )

      const resolverModule = {
        default: jest.fn(),
      }
      const rpcFn = getIsomorphicEnhancedResolver(
        resolverModule,
        "app/_resolvers/queries/getProduct",
        "testResolver",
        "query",
        "client",
      )

      try {
        await expect(rpcFn({paramOne: 1234})).rejects.toThrowError(/something broke/)
      } finally {
        fetchMock.mockRestore()
      }
    })
  })
})
