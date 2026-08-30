import api from "./api";

export const downloadFile = (blob: Blob, defaultFilename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const exportUsersToExcel = async (params: { q?: string; isSubscribed?: string }) => {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.isSubscribed) query.append("isSubscribed", params.isSubscribed);

  const res = await api.get(`/admin/export/users?${query.toString()}`, {
    responseType: "blob",
  });

  const filename = `foydalanuvchilar_${new Date().toISOString().slice(0, 10)}.xlsx`;
  downloadFile(res.data, filename);
};

export const exportPaymentsToExcel = async (params: { status?: string; dateFrom?: string; dateTo?: string }) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.append("status", params.status.toUpperCase());
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);

  const res = await api.get(`/admin/export/payments?${query.toString()}`, {
    responseType: "blob",
  });

  const filename = `tolovlar_${new Date().toISOString().slice(0, 10)}.xlsx`;
  downloadFile(res.data, filename);
};

export const exportReportToPdf = async () => {
  const res = await api.get("/admin/export/report", {
    responseType: "blob",
  });

  const filename = `nova_hisobot_${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadFile(res.data, filename);
};
