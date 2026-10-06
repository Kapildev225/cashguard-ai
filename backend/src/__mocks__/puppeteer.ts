const puppeteer = {
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from("mock-pdf")),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
};

export default puppeteer;