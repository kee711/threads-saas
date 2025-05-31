import { createClient } from "@/lib/supabase/client";

export async function uploadMediaFilesClient(
  files: File[],
  userId: string
): Promise<{ urls: string[], error: string | null }> {
  try {
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    for (const file of files) {
      // 파일명 생성
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${userId}/${timestamp}_${safeFileName}`;

      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error(`파일이 너무 큽니다: ${file.name}`);
        continue;
      }

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("파일 업로드 실패:", error);
        throw new Error(`업로드 실패: ${error.message}`);
      }

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    return { urls: uploadedUrls, error: null };
  } catch (error) {
    console.error("업로드 처리 중 오류:", error);
    return { urls: [], error: error instanceof Error ? error.message : "업로드 실패" };
  }
}

export async function deleteMediaFileClient(
  url: string,
  userId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();

    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    // URL에서 파일 경로 추출
    const urlParts = url.split("/");
    const bucketIndex = urlParts.findIndex(part => part === 'media');
    if (bucketIndex === -1) {
      throw new Error("잘못된 URL 형식입니다.");
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from("media")
      .remove([filePath]);

    if (error) {
      console.error("파일 삭제 실패:", error);
      throw new Error(`삭제 실패: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error("삭제 처리 중 오류:", error);
    return { error: error instanceof Error ? error.message : "삭제 실패" };
  }
} 