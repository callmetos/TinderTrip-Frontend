import { api } from './client.js';

// ปรับ path/โครง response ให้ตรงกับ Swagger จริงของคุณ
export async function getAuditLogs(limit = 20) {
  const res = await api.get('/v1/audit/logs', { params: { limit } });
  // ถ้า API ของคุณห่อใน envelope { success, data: { logs: [...] } }
  return res.data?.data?.logs ?? res.data;
}

export async function getAuditByEntityId(entityId) {
  const res = await api.get(`/audit/${entityId}`); // ตัวอย่าง endpoint จากฝั่ง backend ที่คุณเขียน
  return res.data;
}

export async function searchAudit(keyword) {
  const res = await api.post('/v1/audit/search', { keyword });
  return res.data?.data?.results ?? res.data;
}