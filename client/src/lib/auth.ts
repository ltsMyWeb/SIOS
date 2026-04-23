import { apiRequest } from "@/lib/queryClient";

export async function loginTeacher(loginId: string, password: string) {
  return (await apiRequest("POST", "/api/teacher-console/login", { loginId, password })).json();
}

export async function loginPrincipal(password: string) {
  return (await apiRequest("POST", "/api/principal/login", { password })).json();
}

export async function logoutSession() {
  return (await apiRequest("POST", "/api/logout")).json();
}
