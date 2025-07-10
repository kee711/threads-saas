import { ContentList } from "@/components/contents-helper/ContentList";

export default function PostRadarPage() {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6">Post Radar</h1>
            <ContentList category="external" title="Post Radar" />
        </div>
    );
} 