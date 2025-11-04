import { api } from './client.js';

/** Get user profile */
export async function getUserProfile() {
  const res = await api.get("/api/v1/users/profile");
  return res.data; 
}
/** Update user profile (send partial fields) */
export async function updateUserProfile(payload) {
  try {
    const res = await api.put("/api/v1/users/profile", payload);
    // บาง API ตอบ 204 No Content -> ไม่มี res.data
    return res.data ?? { ok: true, status: res.status };
  } catch (err) {
    // โยน error ที่อ่านง่ายกลับไปให้ UI
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Update profile failed";
    const e = new Error(message);
    e.status = err?.response?.status;
    e.response = err?.response;
    throw e;
  }
}

/** Delete user profile */
export async function deleteUserProfile() {
  const res = await api.delete("/api/v1/users/profile");
  return res.data; 
}

/** Get user setup status */
export async function getUserSetupStatus() {
  const res = await api.get("/api/v1/users/setup-status");
  return res.data; 
}




// export async function information(name, bio, selectedLanguage, date, gender, age, jobTitle, smoking, interests ) {
//   const res = await api.post('/api/v1/app/information', { 
//     name, 
//     bio, 
//     selectedLanguage, 
//     date, 
//     gender, 
//     age, 
//     jobTitle, 
//     smoking, 
//     interests
//   });
//   return res.data;
// }