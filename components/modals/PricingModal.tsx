'use client';

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
import { Check, Sparkles } from 'lucide-react';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

export function PricingModal({ open, onClose }: PricingModalProps) {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '5 posts per month',
        'Basic content suggestions',
        '1 connected account',
        'Basic analytics',
      ],
      badge: null,
      cta: 'Current Plan',
      disabled: true,
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For content creators and small businesses',
      features: [
        'Unlimited posts',
        'AI-powered content generation',
        'Up to 3 connected accounts',
        'Advanced analytics',
        'Content scheduling',
        'Priority support',
      ],
      badge: 'Most Popular',
      cta: 'Upgrade to Pro',
      disabled: false,
    },
    {
      name: 'Enterprise',
      price: '$49',
      period: 'per month',
      description: 'For teams and agencies',
      features: [
        'Everything in Pro',
        'Unlimited connected accounts',
        'Team collaboration',
        'Custom content templates',
        'White-label options',
        'Dedicated support',
      ],
      badge: null,
      cta: 'Contact Sales',
      disabled: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <DialogTitle className="text-3xl font-bold">Choose Your Plan</DialogTitle>
          </div>
          <DialogDescription className="text-lg">
            Unlock the full potential of ViralChef and grow your social media presence
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 py-6">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative ${
                plan.badge === 'Most Popular' 
                  ? 'border-primary shadow-lg scale-105' 
                  : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full"
                  variant={plan.badge === 'Most Popular' ? 'default' : 'outline'}
                  disabled={plan.disabled}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4 pt-4 border-t">
          <h4 className="font-semibold">🎉 Welcome Bonus</h4>
          <p className="text-sm text-muted-foreground">
            Complete your onboarding and get your first month of Pro for free!
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
            <Button>
              Claim Free Month
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}