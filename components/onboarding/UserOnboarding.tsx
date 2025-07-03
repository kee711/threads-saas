'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface UserOnboardingProps {
  onComplete: (responses: {
    step1: string | null;
    step2: string | null;
    step3: string | null;
  }) => void;
}

type Step = 1 | 2 | 3 | 4;

const step1Options = [
  'I want to grow my followers',
  'I want to build brand awareness',
  'I\'m promoting a product',
  'I\'m documenting my work',
];

const step2Options = [
  'I\'m doing it solo',
  'I\'m a marketer at a company',
  'I\'m working with a team',
  'I manage it as an agency',
  'I\'m just getting started',
];

const step3Options = [
  'I don\'t know where to start',
  'It\'s hard to stay consistent',
  'I\'m not getting much engagement',
  'I\'m running out of ideas',
];

export function UserOnboarding({ onComplete }: UserOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [responses, setResponses] = useState({
    step1: null as string | null,
    step2: null as string | null,
    step3: null as string | null,
  });
  const [customInput, setCustomInput] = useState('');

  const handleOptionSelect = (option: string) => {
    setResponses(prev => ({
      ...prev,
      [`step${currentStep}`]: option,
    }));
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setResponses(prev => ({
        ...prev,
        [`step${currentStep}`]: customInput.trim(),
      }));
      setCustomInput('');
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      // Step 4 is the connect Threads step
      onComplete(responses);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSkip = () => {
    setResponses(prev => ({
      ...prev,
      [`step${currentStep}`]: null,
    }));
    handleNext();
  };

  const getCurrentStepData = () => {
    switch (currentStep) {
      case 1:
        return {
          title: 'What inspired you to start creating content?',
          description: 'Tell us about your motivation for content creation',
          options: step1Options,
          current: responses.step1,
        };
      case 2:
        return {
          title: 'How are you currently working on your content?',
          description: 'Help us understand your current setup',
          options: step2Options,
          current: responses.step2,
        };
      case 3:
        return {
          title: 'What\'s the hardest part about creating content for you?',
          description: 'Let us know your biggest challenge',
          options: step3Options,
          current: responses.step3,
        };
      case 4:
        return {
          title: 'Connect your first Threads account to grow fast',
          description: 'Link your Threads account to start creating amazing content',
          options: [],
          current: null,
        };
    }
  };

  const stepData = getCurrentStepData();
  const isOptionSelected = stepData.current !== null;
  const canProceed = currentStep === 4 || isOptionSelected;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
          <span className="text-sm text-muted-foreground">{Math.round((currentStep / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{stepData.title}</h1>
          <p className="text-muted-foreground">{stepData.description}</p>
        </div>

        {currentStep < 4 ? (
          <>
            {/* Options */}
            <div className="space-y-3">
              {stepData.options.map((option, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-md ${stepData.current === option ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {stepData.current === option && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Custom option */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <span className="font-medium text-muted-foreground">Other (write your own)</span>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Tell us more..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        variant="outline"
                        onClick={handleCustomSubmit}
                        disabled={!customInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          /* Step 4 - Connect Threads account */
          <div className="text-center space-y-6 py-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.18c0-3.407.85-6.261 2.495-8.312C5.845 1.615 8.598.435 12.179.411c3.588.024 6.348 1.205 8.202 3.515 1.644 2.051 2.495 4.905 2.495 8.311 0 3.406-.85 6.26-2.495 8.311C18.533 22.795 15.773 23.976 12.186 24zM12.179 2.911c-2.612.018-4.729.853-5.933 2.348-1.292 1.606-1.947 3.956-1.947 6.989 0 3.033.655 5.383 1.947 6.989 1.204 1.495 3.321 2.33 5.933 2.348 2.618-.018 4.738-.853 5.943-2.348 1.293-1.606 1.948-3.956 1.948-6.989 0-3.033-.655-5.383-1.948-6.989C16.917 3.764 14.797 2.929 12.179 2.911z" />
                <path d="M12.186 19.873c-2.164 0-3.753-.672-4.723-1.998-.877-1.2-1.322-2.963-1.322-5.242 0-2.279.445-4.042 1.322-5.242.97-1.326 2.559-1.998 4.723-1.998s3.753.672 4.723 1.998c.877 1.2 1.322 2.963 1.322 5.242 0 2.279-.445 4.042-1.322 5.242C15.939 19.201 14.35 19.873 12.186 19.873zM12.186 7.393c-1.564 0-2.753.453-3.533 1.346-.704.806-1.061 2.067-1.061 3.744s.357 2.938 1.061 3.744c.78.893 1.969 1.346 3.533 1.346s2.753-.453 3.533-1.346c.704-.806 1.061-2.067 1.061-3.744s-.357-2.938-1.061-3.744C14.939 7.846 13.75 7.393 12.186 7.393z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready to connect Threads?</h3>
              <p className="text-muted-foreground">
                Connect your Threads account to start creating and scheduling amazing content
              </p>
            </div>
            <Button
              size="lg"
              className="px-8"
              onClick={() => window.location.href = '/api/threads/oauth'}
            >
              Connect Threads Account
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep < 4 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button
              onClick={currentStep === 4 ? () => window.location.href = '/contents-cooker/topic-finder' : handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              {currentStep === 4 ? 'Connect later' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}