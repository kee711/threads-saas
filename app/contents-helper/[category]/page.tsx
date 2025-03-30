import { ContentList } from '@/components/contents-helper/ContentList';
import { ContentCategory } from '@/components/contents-helper/types';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

const categoryTitles: Record<ContentCategory, string> = {
  viral: 'Viral Posts',
  news: 'News',
  drafts: 'My Drafts'
};

// URL 파라미터를 ContentCategory로 매핑
const mapUrlToCategory = (urlCategory: string): ContentCategory => {
  const categoryMap: Record<string, ContentCategory> = {
    'viral-posts': 'viral',
    'news': 'news',
    'drafts': 'drafts'
  };

  return categoryMap[urlCategory] || 'viral';
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const category = mapUrlToCategory(resolvedParams.category);
  const title = categoryTitles[category];

  return (
    <div className="container mx-auto p-4">
      <ContentList category={category} title={title} />
    </div>
  );
}

// 유효한 카테고리 경로 생성
export function generateStaticParams() {
  return [
    { category: 'viral-posts' },
    { category: 'news' },
    { category: 'drafts' }
  ];
} 