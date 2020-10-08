const sleep = (ms: number): Promise<any> => {
  return new Promise((res) => setTimeout(res, ms));
};

export default sleep;
