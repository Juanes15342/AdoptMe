function isCrudTestMode(request) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.CRUD_TEST_MODE === "1") return true;

  const header = typeof request?.headers?.get === "function"
    ? request.headers.get("x-crud-test-mode")
    : request?.headers?.["x-crud-test-mode"];

  return header === "1";
}

module.exports = { isCrudTestMode };
