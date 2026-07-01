"use client";

import React from "react";
import { PageTransition } from "@/components/ui/Animate";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter Plan",
      price: "₹0",
      description: "Basic swing calculations and standard paper trading access",
      features: [
        "10 automated calculations per day",
        "NIFTY 50 screener limits",
        "Community support logs",
        "1 active portfolio tracker link",
      ],
      popular: false,
      cta: "Activate Free",
    },
    {
      name: "Pro Plan",
      price: "₹3,999",
      description: "Institutional quality ML ensembles and real-time AI mentor chat",
      features: [
        "Unlimited stock calculations",
        "High-frequency model predictions",
        "Priority AI trading advisor chat",
        "Up to 10 active portfolio integrations",
        "Custom email alerts & backtesting",
      ],
      popular: true,
      cta: "Unlock Pro Access",
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Dedicated computation resources and custom model weights",
      features: [
        "Dedicated API prediction endpoints",
        "Custom ensemble weights models",
        "24/7 designated account support",
        "Unlimited historical backtesting",
      ],
      popular: false,
      cta: "Contact Sales",
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-12 py-6 max-w-5xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="font-display text-text-primary leading-none">Venture-Backed Pricing</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Choose a plan that fits your trading capital. Scale your swing trading co-pilot indicators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`p-8 rounded-[20px] bg-card border flex flex-col justify-between relative hover:shadow-soft transition-all duration-200 ${
                plan.popular 
                  ? "border-accent bg-gradient-to-b from-card to-accent/5 shadow-md md:scale-105" 
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-1/2 translate-x-1/2 translate-y-[-50%] bg-accent text-white text-[10px] font-bold px-3.5 py-1 rounded-full flex items-center gap-1.5 border border-accent/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  RECOMMENDED
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-lg text-text-primary">{plan.name}</h3>
                  <p className="text-xs text-text-secondary mt-1">{plan.description}</p>
                </div>

                <div className="py-2">
                  <span className="text-3xl font-extrabold font-mono text-text-primary">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-xs text-text-secondary font-semibold">/month</span>}
                </div>

                <ul className="space-y-3 pt-3 border-t border-border/40 text-xs leading-relaxed text-text-secondary">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-text-primary/90">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {plan.popular ? (
                  <Button variant="ai" className="w-full">
                    {plan.cta}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full">
                    {plan.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
