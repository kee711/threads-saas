import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ThreadsSearch() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast({
        description: '검색어를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/threads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '검색 중 오류가 발생했습니다.');
      }

      toast({
        description: `${data.count}개의 게시물이 저장되었습니다.`,
      });

    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold text-center">
        Threads 게시물 검색
      </h2>
      <div className="flex gap-2">
        <Input
          placeholder="검색어를 입력하세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="text-sm text-gray-500 text-center">
        * 검색된 게시물은 자동으로 데이터베이스에 저장됩니다.
      </p>
    </div>
  );
} 