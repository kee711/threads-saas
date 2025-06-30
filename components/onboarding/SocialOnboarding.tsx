'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SocialOnboardingProps {
  socialAccountId: string;
  onComplete: (profileDescription: string) => void;
}

export function SocialOnboarding({ socialAccountId, onComplete }: SocialOnboardingProps) {
  const [profileDescription, setProfileDescription] = useState('');
  const [accountInfo, setAccountInfo] = useState<{
    username?: string;
    platform?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  // Load account information
  useEffect(() => {
    const loadAccountInfo = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('social_accounts')
          .select('username, platform, profile_description')
          .eq('id', socialAccountId)
          .single();

        if (error) throw error;

        if (data) {
          setAccountInfo({
            username: data.username,
            platform: data.platform,
          });
          // Pre-fill if there's existing description
          if (data.profile_description) {
            setProfileDescription(data.profile_description);
          }
        }
      } catch (error) {
        console.error('Error loading account info:', error);
        toast.error('계정 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadAccountInfo();
  }, [socialAccountId]);

  const handleSubmit = () => {
    onComplete(profileDescription);
  };

  const handleSkip = () => {
    onComplete('');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step 5 of 5</span>
          <span className="text-sm text-muted-foreground">100%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-full" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Tell us about your profile</h1>
          <p className="text-muted-foreground">
            Help us understand your {accountInfo.platform} account to create better content
          </p>
          {accountInfo.username && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Connected: @{accountInfo.username}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-description">
                  Tell us about your profile in detail
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Include information about:
                </p>
                <ul className="text-sm text-muted-foreground mb-4 space-y-1 ml-4">
                  <li>• What is your profile about?</li>
                  <li>• Who's your target audience?</li>
                  <li>• What is your unique point?</li>
                </ul>
                <Textarea
                  id="profile-description"
                  placeholder="Example: I'm a UI/UX designer with 5 years of experience helping startups create beautiful, user-friendly products. I share design tips, case studies, and insights about the design process. My target audience includes aspiring designers, product managers, and startup founders who want to improve their design thinking. My unique point is breaking down complex design concepts into simple, actionable advice."
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example card */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">💡 Example Description</h4>
            <p className="text-sm text-muted-foreground">
              "I'm a digital marketing specialist focused on helping small businesses grow their online presence. 
              I share practical tips about social media marketing, content creation, and customer engagement. 
              My audience includes small business owners, marketers, and entrepreneurs looking to build their brand online. 
              What makes me unique is my focus on budget-friendly strategies that deliver real results."
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>

          <Button 
            onClick={handleSubmit}
            disabled={!profileDescription.trim()}
            className="flex items-center gap-2"
          >
            Complete Setup
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}