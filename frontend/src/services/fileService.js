import { request } from './api';

export const fileService = {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return await request('/files/upload/', {
      method: 'POST',
      body: formData,
    });
  },

  async getFiles(scope = 'all', search = '') {
    const params = new URLSearchParams();
    if (scope) params.append('scope', scope);
    if (search) params.append('search', search);

    return await request(`/files/?${params.toString()}`, {
      method: 'GET',
    });
  },

  async getFileDetail(id) {
    return await request(`/files/${id}/`, {
      method: 'GET',
    });
  },

  async downloadFile(id, originalFilename) {
    const blob = await request(`/files/${id}/download/`, {
      method: 'GET',
      isBlob: true,
    });

    // Trigger browser file save
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalFilename || 'downloaded_file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  },

  async shareFile(id, recipient, permission = 'DOWNLOAD') {
    return await request(`/files/${id}/share/`, {
      method: 'POST',
      body: JSON.stringify({ recipient, permission }),
    });
  },

  async revokeShare(id, username) {
    return await request(`/files/${id}/revoke-share/`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  async deleteFile(id) {
    return await request(`/files/${id}/`, {
      method: 'DELETE',
    });
  },
};
