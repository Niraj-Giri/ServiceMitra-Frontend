import { apiClient } from './client';

export interface UploadResponse {
  fileUrl: string;
}

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.fileUrl || (response.data as any).url; // Adjust based on actual backend format
};
