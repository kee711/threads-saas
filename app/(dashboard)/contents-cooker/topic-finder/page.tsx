import { CookingPot } from 'lucide-react';
import Image from 'next/image';
import { TopicContainer } from '@/components/contents-helper/TopicContainer';
import { SaltAIGeneratorButton } from '@/components/contents-helper/SaltAIGeneratorButton';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';

import { getServerSession } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import { authOptions } from '@/lib/auth/authOptions'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function TopicFinderPage() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        redirect('/signin');
    }

    const userId = session.user.id // ✅ NextAuth 세션에서 user id 가져옴
    const supabase = await createClient()

    const { data: userData, error } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', userId)
        .single()

    if (error) throw error

    const userName = userData?.name || 'User';

    return (
        <div className="min-h-screen bg-[#F2F2F2]">
            <div className="container mx-auto p-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <CookingPot className="w-8 h-8" />
                    <h1 className="text-2xl font-semibold">Topic Finder</h1>
                </div>

                {/* Welcome Message */}
                <div className="flex items-center gap-6 bg-[#F6F6F6] rounded-lg p-6 mb-8">
                    <Image
                        src="/saltAIIcon.svg"
                        alt="Salt AI"
                        width={85}
                        height={85}
                        priority
                        className="flex-shrink-0"
                    />
                    <p className="text-lg leading-relaxed">
                        Hi {userName}! <br />
                        Which topic would you like to cook about?
                    </p>
                </div>

                {/* Topics Section */}
                <div>
                    <h2 className="text-lg font-medium mb-4">Topics</h2>
                    <div className="space-y-4">
                        <TopicContainer />
                        <SaltAIGeneratorButton />
                    </div>
                </div>


                {/* Text details input for topic */}
                <div className="flex flex-col gap-4">
                    <Input placeholder="Enter topic details" />
                    {/* Add button */}
                    <div className="flex justify-end">
                        <Button>Add</Button>
                    </div>
                </div>


            </div>
        </div>
    );
} 