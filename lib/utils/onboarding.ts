import { createClient } from '@/lib/supabase/client';

export async function checkOnboardingStatus(userId: string) {
  const supabase = createClient();

  try {
    // Check if user has completed onboarding
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('is_completed')
      .eq('user_id', userId)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      throw onboardingError;
    }

    // If no onboarding record exists or not completed, user needs onboarding
    const needsUserOnboarding = !onboardingData || !onboardingData.is_completed;

    // Check if user has any social accounts without profile description
    const { data: socialAccounts, error: socialError } = await supabase
      .from('social_accounts')
      .select('id, profile_description, onboarding_completed')
      .eq('owner', userId);

    if (socialError) {
      throw socialError;
    }

    const incompleteSocialAccount = socialAccounts?.find(
      account => !account.profile_description || !account.onboarding_completed
    );

    return {
      needsUserOnboarding,
      needsSocialOnboarding: !!incompleteSocialAccount,
      socialAccountId: incompleteSocialAccount?.id || null,
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // In case of error, assume no onboarding needed to prevent blocking user
    return {
      needsUserOnboarding: false,
      needsSocialOnboarding: false,
      socialAccountId: null,
    };
  }
}