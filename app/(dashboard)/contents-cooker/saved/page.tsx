import { ContentList } from "@/components/contents-helper/ContentList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SavedPage() {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6">Saved</h1>

            <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-lg">
                {/* threads 콘텐츠 url 입력하면 draft에 추가하기*/}
                <div className="flex gap-2 items-center">
                    <div className="text-lg font-bold">Add by URL</div>
                    <p className="text-sm text-muted-foreground">
                        Add threads content by url.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Input id="url" placeholder="https://threads.net/..." />
                    <Button>Add by URL</Button>
                </div>

            </div>
            <ContentList category="saved" title="Saved" />
        </div>
    );
} 