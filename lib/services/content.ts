import { ContentCategory, ContentItem } from '@/components/contents-helper/types';
import { createClient } from '@/lib/supabase/client';

export async function getContentsByCategory(category: ContentCategory): Promise<ContentItem[]> {
  console.log('Creating Supabase client...');
  const supabase = createClient();

  try {
    if (category === 'drafts') {
      console.log('Fetching drafts...');
      // 드래프트는 my_contents 테이블에서 publish_status로 필터링
      const { data, error } = await supabase
        .from('my_contents')
        .select('*')
        .eq('publish_status', 'draft')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching drafts:', error);
        throw new Error(`드래프트 조회 중 오류 발생: ${error.message}`);
      }

      return data || [];
    } else if (category === 'viral') {
      console.log('Fetching viral contents...');
      // viral은 external_contents 테이블에서 view_count가 높은 순으로 정렬
      const { data, error } = await supabase
        .from('external_contents')
        .select('*')
        .order('view_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching viral contents:', error);
        throw new Error(`바이럴 컨텐츠 조회 중 오류 발생: ${error.message}`);
      }

      console.log('Viral contents fetched:', data);
      return data || [];
    } else if (category === 'news') {
      console.log('Fetching news contents...');
      // news는 external_contents 테이블에서 최신순으로 정렬
      const { data, error } = await supabase
        .from('external_contents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching news contents:', error);
        throw new Error(`뉴스 컨텐츠 조회 중 오류 발생: ${error.message}`);
      }

      return data || [];
    }

    return [];
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
} 