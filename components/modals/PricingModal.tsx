'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Plan {
  id: string;
  plan_type: string;
  monthly_price: number | null;
  annual_price: number | null;
  credits: number | null;
  schedule_limit: number | null;
  account_limit: number | null;
}

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  currentUserPlan?: string;
}

export function PricingModal({ open, onClose, currentUserPlan = 'Free' }: PricingModalProps) {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('plan')
          .select('*')
          .order('monthly_price', { ascending: true, nullsFirst: true });

        if (error) {
          console.error('Error fetching plans:', error);
          return;
        }

        setPlans(data || []);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkIsNewUser = async () => {
      if (!session?.user?.id) return;

      try {
        const supabase = createClient();

        // Check user_profiles created_at (within 72 hours)
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .select('user_id, created_at')
          .eq('user_id', session.user.id)
          .single();

        if (userError || !userProfile) return;

        const createdAt = new Date(userProfile.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const isWithin72Hours = hoursDiff <= 72;

        // Check if user_plan exists
        const { data: userPlan, error: planError } = await supabase
          .from('user_plan')
          .select('user_id, purchase_type, plan_type')
          .eq('user_id', userProfile.user_id)
          .single();

        const hasNoPlan = planError !== null || !userPlan;

        // Check if user has already claimed free trial
        const hasClaimedFreeTrial = userPlan && userPlan.purchase_type === 'free' && userPlan.plan_type === 'Pro';

        // User is new if within 72 hours OR has no plan, BUT NOT if they already claimed free trial
        setIsNewUser((isWithin72Hours || hasNoPlan) && !hasClaimedFreeTrial);
      } catch (error) {
        console.error('Error checking new user status:', error);
      }
    };

    if (open) {
      fetchPlans();
      checkIsNewUser();
    }
  }, [open, session?.user?.id]);

  const createUserPlan = async (planData: {
    plan_type: string;
    remaining_credits: number | null;
    purchase_type: string;
    plan_expire_at: string | null;
    plan_started_at: string;
    plan_auto_renew: boolean;
    plan_first_started: string;
  }) => {
    if (!session?.user?.id) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const supabase = createClient();

      // Get user_id from user_profiles
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      if (userError || !userProfile) {
        toast.error('사용자 프로필을 찾을 수 없습니다.');
        return;
      }

      // Check if user_plan already exists
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_plan')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .single();

      if (existingPlan && !checkError) {
        // User plan already exists, don't overwrite
        return false;
      }

      // Insert new user_plan
      const { error: insertError } = await supabase
        .from('user_plan')
        .insert({
          user_id: userProfile.user_id,
          ...planData
        });

      if (insertError) {
        console.error('Error creating user plan:', insertError);
        toast.error('플랜 설정 중 오류가 발생했습니다.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating user plan:', error);
      toast.error('플랜 설정 중 오류가 발생했습니다.');
      return false;
    }
  };

  const updateUserPlanForFreeTrial = async () => {
    if (!session?.user?.id) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return false;
    }

    try {
      const supabase = createClient();

      // Get user_id from user_profiles
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      if (userError || !userProfile) {
        toast.error('사용자 프로필을 찾을 수 없습니다.');
        return false;
      }

      const now = new Date();
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Update existing plan for free trial
      const { error: updateError } = await supabase
        .from('user_plan')
        .update({
          plan_type: 'Pro',
          remaining_credits: null,
          purchase_type: 'free',
          plan_expire_at: oneMonthLater.toISOString(),
          plan_auto_renew: false
        })
        .eq('user_id', userProfile.user_id);

      if (updateError) {
        console.error('Error updating user plan:', updateError);
        toast.error('Error updating user plan.');
        return false;
      }

      // Also update user_profiles plan_type
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          plan_type: 'Pro'
        })
        .eq('user_id', userProfile.user_id);

      if (profileUpdateError) {
        console.error('Error updating user profile plan_type:', profileUpdateError);
        toast.error('Error updating user profile plan_type.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user plan:', error);
      toast.error('Error updating user plan.');
      return false;
    }
  };

  const handleClose = async () => {
    if (isNewUser) {
      // Create Free plan for new user
      const now = new Date().toISOString();
      await createUserPlan({
        plan_type: 'Free',
        remaining_credits: 10,
        purchase_type: 'free',
        plan_expire_at: null,
        plan_started_at: now,
        plan_auto_renew: false,
        plan_first_started: now
      });
    }
    onClose();
  };

  const handleSkipProBenefits = async () => {
    // Check if user already has a plan
    if (!session?.user?.id) {
      toast.error('User information not found.');
      return;
    }

    try {
      const supabase = createClient();

      // Get user_id from user_profiles
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      if (userError || !userProfile) {
        toast.error('User profile not found.');
        return;
      }

      // Check if user_plan already exists
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_plan')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .single();

      if (existingPlan && !checkError) {
        // User already has a plan, just close the dialog
        onClose();
        return;
      }

      // Create new Free plan
      const now = new Date().toISOString();
      const success = await createUserPlan({
        plan_type: 'Free',
        remaining_credits: 10,
        purchase_type: 'free',
        plan_expire_at: null,
        plan_started_at: now,
        plan_auto_renew: false,
        plan_first_started: now
      });

      // Also update user_profiles plan_type
      if (success) {
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .update({
            plan_type: 'Free'
          })
          .eq('user_id', userProfile.user_id);

        if (profileUpdateError) {
          console.error('Error updating user profile plan_type:', profileUpdateError);
        }
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error handling skip pro benefits:', error);
      onClose(); // Close dialog even if there's an error
    }
  };

  const handleClaimFreeMonth = async () => {
    if (!session?.user?.id) {
      toast.error('User information not found.');
      return;
    }

    try {
      const supabase = createClient();

      // Get user_id from user_profiles
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      if (userError || !userProfile) {
        toast.error('사용자 프로필을 찾을 수 없습니다.');
        return;
      }

      // Check if user_plan already exists
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_plan')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .single();

      let success = false;

      if (existingPlan && !checkError) {
        // Update existing plan for free trial
        success = await updateUserPlanForFreeTrial();
      } else {
        // Create new plan for free trial
        const now = new Date();
        const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        success = await createUserPlan({
          plan_type: 'Pro',
          remaining_credits: null,
          purchase_type: 'free',
          plan_expire_at: oneMonthLater.toISOString(),
          plan_started_at: now.toISOString(),
          plan_auto_renew: false,
          plan_first_started: now.toISOString()
        });

        // Also update user_profiles plan_type for new plan
        if (success) {
          const { error: profileUpdateError } = await supabase
            .from('user_profiles')
            .update({
              plan_type: 'Pro'
            })
            .eq('user_id', userProfile.user_id);

          if (profileUpdateError) {
            console.error('Error updating user profile plan_type:', profileUpdateError);
            toast.error('Error updating user profile plan_type.');
          }
        }
      }

      if (success) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error claiming free month:', error);
      toast.error('Error claiming free trial.');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const getPrice = (plan: Plan) => {
    if (isAnnual) {
      return plan.annual_price ? `$${plan.annual_price}` : '$0';
    }
    return plan.monthly_price ? `$${plan.monthly_price}` : '$0';
  };

  const getPeriod = () => {
    return isAnnual ? 'per year' : 'per month';
  };

  const getFeatures = (plan: Plan) => {
    const features = [];

    if (plan.plan_type === 'Free') {
      features.push(`${plan.credits || 0} AI credits per day`);
      features.push('Topic suggestions');
      features.push(`${plan.account_limit || 0} social account binding`);
      features.push(`${plan.schedule_limit || 0} auto scheduling`);
      features.push('Basic analytics');
    } else if (plan.plan_type === 'Pro') {
      features.push(plan.credits ? `${plan.credits} credits per month` : '<span class="font-bold bg-gradient-to-r from-violet-500 to-rose-300 bg-clip-text text-transparent" style="animation: gentlePulse 3s ease-in-out infinite;">Unlimited</span> AI credits');
      features.push('AI-powered content generation');
      features.push('<span class="font-bold bg-gradient-to-r from-violet-500 to-rose-300 bg-clip-text text-transparent" style="animation: gentlePulse 3s ease-in-out infinite;">Unlimited</span> auto scheduling');
      features.push(`${plan.account_limit || 0} social account binding`);
      features.push('Advanced analytics');
    } else if (plan.plan_type === 'Expert') {
      features.push('Everything in Pro');
      features.push('<span class="font-bold bg-gradient-to-r from-violet-500 to-rose-300 bg-clip-text text-transparent" style="animation: gentlePulse 3s ease-in-out infinite;">Unlimited</span> social account binding');
      features.push('Dedicated support');
    }

    return features;
  };

  const getBadge = (plan: Plan) => {
    if (plan.plan_type === 'Pro') return 'Most Popular';
    return null;
  };

  const getCTA = (plan: Plan) => {
    // Check if this is the user's current plan
    if (plan.plan_type === currentUserPlan) {
      return 'Current Plan';
    }

    if (isNewUser) {
      if (plan.plan_type === 'Free') return 'Skip Pro Benefits';
      if (plan.plan_type === 'Pro') return 'Claim Free Month';
    }

    // Define plan hierarchy for downgrade logic
    const planHierarchy = { 'Free': 1, 'Pro': 2, 'Expert': 3 };
    const currentPlanLevel = planHierarchy[currentUserPlan as keyof typeof planHierarchy] || 1;
    const targetPlanLevel = planHierarchy[plan.plan_type as keyof typeof planHierarchy] || 1;

    // If target plan is lower level than current plan, it's a downgrade
    if (targetPlanLevel < currentPlanLevel) {
      return `Downgrade to ${plan.plan_type}`;
    }

    // Otherwise it's an upgrade
    return `Upgrade to ${plan.plan_type}`;
  };

  const handlePlanAction = async (plan: Plan) => {
    // Don't allow action on current plan
    if (plan.plan_type === currentUserPlan) {
      return;
    }

    if (isNewUser) {
      if (plan.plan_type === 'Free') {
        await handleSkipProBenefits();
      } else if (plan.plan_type === 'Pro') {
        await handleClaimFreeMonth();
      }
    }
    // Handle other plan actions for existing users
  };

  const getDescription = (plan: Plan) => {
    if (plan.plan_type === 'Free') return 'Perfect for getting started';
    if (plan.plan_type === 'Pro') return 'For content creators and small businesses';
    if (plan.plan_type === 'Expert') return 'For contents experts and agencies';
    return '';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading plans...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes gentlePulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <DialogTitle className="text-3xl font-bold">Choose Your Plan</DialogTitle>
            </div>
            <DialogDescription className="text-lg text-center">
              Unlock the full potential of Salt AI and grow your social media engagement
            </DialogDescription>
          </DialogHeader>

          {/* 할인 뱃지 - 전체 컨테이너 위에 얹어진 느낌 */}
          <div className="flex justify-center -mb-3 relative z-10">
            <Badge className={`px-4 py-1 shadow-lg transition-all duration-200 ${isAnnual
              ? 'bg-gradient-to-r from-primary to-primary/80 text-white scale-105'
              : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
              }`}>
              Save up to 20%
            </Badge>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 py-4">
            <span className={`text-sm ${!isAnnual ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm ${isAnnual ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Annual
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 py-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${getBadge(plan) === 'Most Popular'
                  ? 'border-primary shadow-lg scale-105'
                  : ''
                  }`}
              >
                {getBadge(plan) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      {getBadge(plan)}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.plan_type}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {getPrice(plan)}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{getPeriod()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getDescription(plan)}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {getFeatures(plan).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: feature }}
                        />
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={getBadge(plan) === 'Most Popular' ? 'default' : 'outline'}
                    disabled={plan.plan_type === currentUserPlan || (isNewUser === false && plan.plan_type === 'Free')}
                    onClick={() => handlePlanAction(plan)}
                  >
                    {getCTA(plan)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={handleSuccessModalClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center space-y-4">
              <Sparkles className="mx-auto h-12 w-12 text-green-500" />
              <DialogTitle className="text-2xl font-bold text-center">Congratulations!</DialogTitle>
              <DialogDescription className="text-lg text-center">
                Your Pro Trial has started! Unleash Infinite Potential of Your Social Account!
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-4">
              <Button onClick={handleSuccessModalClose}>Get Started</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}