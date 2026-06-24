export function isCrudTestMode(request) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.CRUD_TEST_MODE === "1") return true;
  const header = request?.headers?.get?.("x-crud-test-mode");
  return header === "1";
}
